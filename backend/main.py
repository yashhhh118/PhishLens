import re

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


# ---------------------------------------------------------------------------
# Gmail request model
# ---------------------------------------------------------------------------
class GmailRequest(BaseModel):
    access_token: str
    max_results: int = 20


# ---------------------------------------------------------------------------
# Gmail routes
# ---------------------------------------------------------------------------
@app.post("/gmail/fetch")
def gmail_fetch(request: GmailRequest):
    """
    Fetch emails from the user's Gmail inbox.

    Body fields:
        access_token (str) — Google OAuth access token
        max_results  (int) — number of emails to fetch (20, 50, or 100)
    """
    try:
        from gmail.gmail_fetcher import fetch_emails

        emails = fetch_emails(
            access_token=request.access_token,
            max_results=request.max_results,
        )
        return {"emails": emails}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/gmail/scan")
def gmail_scan(request: GmailRequest):
    """
    Fetch emails and run phishing analysis on each one.

    Body fields:
        access_token (str) — Google OAuth access token
        max_results  (int) — number of emails to fetch (20, 50, or 100)

    Returns a list where each item contains the original email data
    plus the analysis result under the key "analysis".
    """
    try:
        from gmail.gmail_fetcher import fetch_emails

        emails = fetch_emails(
            access_token=request.access_token,
            max_results=request.max_results,
        )

        results = []
        for email in emails:
            sender_domain = _extract_sender_domain(email.get("sender", ""))
            analysis = analyze(
                text=email.get("body", ""),
                sender_domain=sender_domain,
                attachments=email.get("attachments", []),
            )
            results.append({**email, "analysis": analysis})

        return {"results": results}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def _extract_sender_domain(sender: str) -> Optional[str]:
    """
    Extract the domain from a sender string.
    Example: "John Doe <john@gmail.com>" → "gmail.com"
             "john@gmail.com"             → "gmail.com"
    """
    if not sender:
        return None
    match = re.search(r"[\w.+-]+@([\w.-]+)", sender)
    return match.group(1) if match else None