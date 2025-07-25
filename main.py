import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
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
    allow_origins=["http://localhost:5173"],
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

async def send_email(subject: str, body: str, recipient: str):
    message = EmailMessage()
    message["From"] = GMAIL_USER
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body, subtype='html')
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

async def send_bulk_emails(subject: str, body: str, recipients: List[str]):
    for recipient in recipients:
        await send_email(subject, body, recipient)
        await asyncio.sleep(5)

@app.post("/send-emails")
async def send_emails(request: EmailRequest, background_tasks: BackgroundTasks):
    logging.info(f"Received request: {request}")
    if len(request.recipients) > 1000:
        raise HTTPException(status_code=400, detail="Recipient list exceeds 1000 emails.")
    background_tasks.add_task(send_bulk_emails, request.subject, request.body, request.recipients)
    return {"message": f"Sending email to {len(request.recipients)} recipients."} 