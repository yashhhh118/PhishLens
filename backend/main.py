from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

from phishing_detector.risk_calculator import analyze

app = FastAPI(title="PhishLens API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend on localhost:3000 to reach this backend
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------
class TextScanRequest(BaseModel):
    text: str
    sender_domain: Optional[str] = None
    attachments: Optional[List[str]] = None


class UrlScanRequest(BaseModel):
    url: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "PhishLens backend is running"}


@app.post("/scan/text")
def scan_text(request: TextScanRequest):
    """
    Scan a text message (email body, SMS, etc.) for phishing signals.

    Body fields:
        text (str)                  — the message content to analyse
        sender_domain (str|null)    — optional sender domain for SPF/DMARC checks
        attachments (list[str]|null)— optional list of attachment filenames
    """
    try:
        result = analyze(
            text=request.text,
            sender_domain=request.sender_domain,
            attachments=request.attachments,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/scan/url")
def scan_url(request: UrlScanRequest):
    """
    Scan a single URL for phishing signals.

    Body fields:
        url (str) — the URL to analyse
    """
    try:
        result = analyze(text=request.url)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))