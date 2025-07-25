# Email-shooter

A simple Email Marketing tool built with FastAPI (Python) for the backend and React (Vite) for the frontend. Send bulk emails (up to 1000 at a time) with a delay between each send, using your Gmail account.

---

## Features
- Send a draft email to up to 1000 recipients
- Upload recipients via CSV/Excel or paste manually
- 5-second delay between each email to avoid Gmail rate limits
- Modern React frontend

---

## Prerequisites
- Python 3.8+
- Node.js & npm
- A Gmail account with [App Password](https://support.google.com/accounts/answer/185833?hl=en) (2FA required)

---

## Backend Setup (FastAPI)

1. **Clone the repository and navigate to the project root:**
   ```bash
   cd Email-shooter
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   # Activate it:
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Gmail credentials:**
   - Create a `.env` file in the project root with:
     ```env
     GMAIL_USER=your_gmail@gmail.com
     GMAIL_PASS=your_16_char_app_password
     ```
   - Or set them as environment variables before running the backend.

5. **Run the backend server:**
   ```bash
   uvicorn main:app --reload
   # Or for production:
   uvicorn main:app
   ```
   - The API will be available at [http://localhost:8000](http://localhost:8000)
   - API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run the frontend development server:**
   ```bash
   npm run dev
   ```
   - The app will be available at [http://localhost:5173](http://localhost:5173)

---

## Usage
1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Fill in the subject, body, and recipient emails (paste or upload CSV/Excel).
3. Click "Send Email". The backend will send emails one by one with a 5-second delay.
4. Check backend logs for delivery status.

---

## Notes
- Use a Gmail App Password, not your regular password.
- Gmail may enforce sending limits. For higher volume, consider a transactional email service (SendGrid, Mailgun, etc).
- For production, update CORS and environment settings as needed.

---

## License
MIT 