import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import aiosmtplib
from email.message import EmailMessage
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys
import asyncio
logging.basicConfig(stream=sys.stdout, level=logging.INFO, force=True)
logging.info('Backend started and logging is working.')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://bulk-mail-shooter-n7gw.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace with your Gmail credentials or use environment variables
GMAIL_USER = os.getenv('GMAIL_USER', 'your_gmail@gmail.com')
GMAIL_PASS = os.getenv('GMAIL_PASS', 'your_app_password')

class EmailRequest(BaseModel):
    subject: str
    body: str
    recipients: List[EmailStr]

async def send_email(subject: str, body: str, recipient: str, attachment: Optional[bytes] = None, filename: Optional[str] = None):
    message = EmailMessage()
    message["From"] = GMAIL_USER
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body, subtype='html')
    if attachment and filename:
        message.add_attachment(attachment, maintype='application', subtype='pdf', filename=filename)
    try:
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=GMAIL_USER,
            password=GMAIL_PASS,
        )
        logging.info(f"Email sent to {recipient}")
    except Exception as e:
        logging.error(f"Failed to send to {recipient}: {e}")

async def send_bulk_emails_with_attachment(subject: str, body: str, recipients: List[str], attachment: Optional[bytes], filename: Optional[str]):
    for recipient in recipients:
        await send_email(subject, body, recipient, attachment, filename)
        await asyncio.sleep(5)

@app.post("/send-emails-with-attachment")
async def send_emails_with_attachment(
    background_tasks: BackgroundTasks,
    subject: str = Form(...),
    body: str = Form(...),
    recipients: str = Form(...),  # Comma-separated emails
    file: UploadFile = File(None)
):
    logging.info(f"Received request with attachment: subject={subject}, recipients={recipients}")
    recipients_list = [email.strip() for email in recipients.split(',') if email.strip()]
    if len(recipients_list) > 1000:
        raise HTTPException(status_code=400, detail="Recipient list exceeds 1000 emails.")
    attachment_bytes = await file.read() if file else None
    filename = file.filename if file else None
    background_tasks.add_task(
        send_bulk_emails_with_attachment,
        subject,
        body,
        recipients_list,
        attachment_bytes,
        filename
    )
    return {"message": f"Sending email to {len(recipients_list)} recipients with attachment."} 