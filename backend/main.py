import os
import requests
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from PyPDF2 import PdfReader
from tempfile import NamedTemporaryFile
from dotenv import load_dotenv
from typing import Optional
from supabase import create_client, Client

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()
HUGGINGFACE_API_KEY = os.environ.get("HUGGINGFACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
HF_HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "message": "Backend is healthy."}

class AnalysisRequest(BaseModel):
    text: Optional[str] = None
    file_url: Optional[str] = None
    doc_id: str

def call_hf_summarization(text):
    text = text[:2048]
    try:
        response = requests.post(
            HF_API_URL,
            headers=HF_HEADERS,
            json={"inputs": text},
            timeout=30
        )
        if response.status_code != 200:
            logger.error(f"Hugging Face API error: {response.text}")
            raise HTTPException(status_code=502, detail=f"Hugging Face API error: {response.text}")
        result = response.json()
        if isinstance(result, list) and 'summary_text' in result[0]:
            return result[0]['summary_text']
        elif isinstance(result, dict) and 'error' in result:
            logger.error(f"Hugging Face API error: {result['error']}")
            raise HTTPException(status_code=502, detail=f"Hugging Face API error: {result['error']}")
        else:
            logger.error(f"Unexpected Hugging Face API response: {result}")
            raise HTTPException(status_code=502, detail="Unexpected Hugging Face API response")
    except Exception as e:
        logger.error(f"Exception in call_hf_summarization: {e}")
        raise HTTPException(status_code=502, detail=f"Hugging Face API call failed: {str(e)}")

def extract_pdf_text(file: UploadFile):
    try:
        reader = PdfReader(file.file)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")

def highlight_risks(text):
    risks = []
    explanations = {}
    risk_keywords = {
        "arbitration": "You may be waiving your right to sue in court.",
        "liability": "Limits the company's responsibility for damages.",
        "refund": "Refunds may be limited or unavailable.",
        "termination": "Your account/service can be ended at any time.",
        "data": "Your data may be shared or sold.",
        "indemnify": "You may be responsible for legal costs."
    }
    for keyword, explanation in risk_keywords.items():
        if keyword in text.lower():
            risks.append({"text": keyword, "type": "critical"})
            explanations[keyword] = explanation
    return risks, explanations

@app.post("/analyze")
async def analyze(text: str = Form(None), file: UploadFile = File(None), doc_id: str = Form(...)):
    if not text and not file:
        logger.error("No input provided to /analyze")
        raise HTTPException(status_code=400, detail="No input provided")
    if file:
        if file.content_type not in ["application/pdf", "text/plain"]:
            logger.error(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")
        if file.content_type == "application/pdf":
            text = extract_pdf_text(file)
        else:
            text = (await file.read()).decode("utf-8")
    if not text or len(text.strip()) < 20:
        logger.error("Input text too short for /analyze")
        raise HTTPException(status_code=400, detail="Input text too short")
    try:
        summary = call_hf_summarization(text)
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        raise HTTPException(status_code=502, detail=f"Summarization failed: {str(e)}")
    risks, explanations = highlight_risks(text)
    # Persist results in Supabase
    try:
        update = supabase.table("documents").update({
            "original_text": text,
            "simplified_text": summary,
            "explanations": explanations,
            "risks": risks
        }).eq("id", doc_id).execute()
        if update.get("status_code", 200) >= 400:
            logger.error(f"Failed to update document in Supabase: {update}")
            raise Exception(str(update))
    except Exception as e:
        logger.error(f"Failed to update document in Supabase: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update document in Supabase: {str(e)}")
    return {
        "original_text": text,
        "summary": summary,
        "explanations": explanations,
        "highlights": risks,
        "doc_id": doc_id
    }

@app.get("/export/{doc_id}.{format}")
async def export(doc_id: str, format: str):
    # Fetch real analysis result from Supabase
    try:
        res = supabase.table("documents").select("simplified_text,explanations").eq("id", doc_id).single().execute()
        if res.get("status_code", 200) >= 400 or not res.data:
            logger.error(f"Could not fetch analysis for export: {res}")
            raise Exception(str(res))
        summary = res.data.get("simplified_text", "")
        explanations = res.data.get("explanations", {})
    except Exception as e:
        logger.error(f"Could not fetch analysis for export: {e}")
        raise HTTPException(status_code=404, detail=f"Could not fetch analysis for export: {str(e)}")
    if format == "txt":
        with NamedTemporaryFile(delete=False, suffix=".txt") as tmp:
            tmp.write(f"Summary:\n{summary}\n\nExplanations:\n".encode())
            for k, v in explanations.items():
                tmp.write(f"- {k}: {v}\n".encode())
            tmp.flush()
            return FileResponse(tmp.name, filename=f"analysis_{doc_id}.txt")
    elif format == "pdf":
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            c = canvas.Canvas(tmp.name, pagesize=letter)
            c.drawString(100, 750, f"Summary: {summary[:100]}...")
            y = 730
            c.drawString(100, y, "Explanations:")
            y -= 20
            for k, v in explanations.items():
                c.drawString(110, y, f"- {k}: {v}")
                y -= 20
                if y < 100:
                    c.showPage()
                    y = 750
            c.save()
            return FileResponse(tmp.name, filename=f"analysis_{doc_id}.pdf")
    else:
        logger.error(f"Invalid export format: {format}")
        raise HTTPException(status_code=400, detail="Invalid format") 