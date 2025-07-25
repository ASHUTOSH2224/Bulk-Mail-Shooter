import { useState } from 'react';
import type { ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

function extractEmailsFromText(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map(e => e.trim())
    .filter(e => e);
}

function dedupeEmails(emails: string[]): string[] {
  return Array.from(new Set(emails.map(e => e.toLowerCase())));
}

function App() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');
  const [fileEmails, setFileEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      let emails: string[] = [];
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = data as string;
        // Try to extract emails from all columns
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const cells = line.split(/,|;/);
          for (const cell of cells) {
            const email = cell.trim();
            if (email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
              emails.push(email);
            }
          }
        }
      } else {
        // Parse Excel
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        for (const row of json) {
          for (const cell of row) {
            if (typeof cell === 'string' && cell.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
              emails.push(cell.trim());
            }
          }
        }
      }
      setFileEmails(dedupeEmails(emails));
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setPdfFile(null);
      if (file) setError('Only PDF files are allowed for attachment.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    // Merge emails from textarea and file, dedupe
    const emails = dedupeEmails([
      ...extractEmailsFromText(recipients),
      ...fileEmails,
    ]);
    if (emails.length === 0) {
      setError('Please enter or upload at least one recipient email.');
      setLoading(false);
      return;
    }
    if (emails.length > 1000) {
      setError('Recipient list exceeds 1000 emails.');
      setLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('recipients', emails.join(','));
      if (pdfFile) {
        formData.append('file', pdfFile);
      }
      const res = await fetch('https://bulk-mail-shooter.onrender.com/send-emails-with-attachment', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Emails are being sent!');
        setSubject('');
        setBody('');
        setRecipients('');
        setFileEmails([]);
        setPdfFile(null);
      } else {
        setError(data.detail || 'Failed to send emails.');
      }
    } catch (err) {
      setError('Network error. Could not reach backend.');
    } finally {
      setLoading(false);
    }
  };

  const totalEmails = dedupeEmails([
    ...extractEmailsFromText(recipients),
    ...fileEmails,
  ]).length;

  return (
    <div className="container">
      <h1>Email Shooter</h1>
      <form onSubmit={handleSubmit} className="email-form" encType="multipart/form-data">
        <div className="form-section">
          <label htmlFor="subject-input">
            <span className="field-label">Subject</span>
            <span className="field-helper">Enter the subject line for your email campaign.</span>
            <input
              id="subject-input"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              placeholder="e.g. Welcome to our newsletter!"
            />
          </label>
        </div>
        <div className="form-section">
          <label htmlFor="body-input">
            <span className="field-label">Email Body</span>
            <span className="field-helper">Write your email content here. HTML is allowed.</span>
            <textarea
              id="body-input"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={8}
              required
              placeholder="e.g. <h1>Hello!</h1> <p>Thank you for joining us.</p>"
            />
          </label>
        </div>
        <div className="form-section">
          <label htmlFor="recipients-input">
            <span className="field-label">Recipients (Manual Entry)</span>
            <span className="field-helper">Paste or type up to 1000 emails, separated by comma, semicolon, or new line.</span>
            <textarea
              id="recipients-input"
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              rows={6}
              placeholder={"email1@example.com, email2@example.com\nemail3@example.com"}
            />
          </label>
        </div>
        <div className="form-section">
          <label htmlFor="file-input">
            <span className="field-label">Or Upload Recipients (CSV or Excel)</span>
            <span className="field-helper">Upload a file containing email addresses. We'll extract all valid emails from the file.</span>
            <input
              id="file-input"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
            />
          </label>
        </div>
        <div className="form-section">
          <label htmlFor="pdf-attachment-input">
            <span className="field-label">PDF Attachment (optional)</span>
            <span className="field-helper">Attach a PDF file to include in your email.</span>
            <input
              id="pdf-attachment-input"
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
            />
            {pdfFile && <span style={{ fontSize: '0.95rem', color: '#555' }}>Selected: {pdfFile.name}</span>}
          </label>
        </div>
        <div style={{ fontSize: '0.95rem', color: '#555', marginBottom: '0.5rem' }}>
          <b>Total unique recipients:</b> {totalEmails}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
      </form>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default App;
