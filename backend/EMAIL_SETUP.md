# Email Notifications Setup (Approve / Reject)

This project now sends email to the student when an admin approves or rejects a resource request.

## 1) Install backend dependencies

From project root:

```bash
npm --prefix backend install
```

## 2) Add SMTP env variables in backend/.env

Add these values:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=SmartStudent <your-email@gmail.com>
```

Notes:
- For Gmail, use an App Password (not your main account password).
- Port 465 works too (secure mode).

## 3) Restart backend

```bash
npm --prefix backend start
```

## 4) Test flow

1. Login as student and create a request.
2. Login as admin and approve or reject it.
3. Student email should receive a status mail.

## Troubleshooting

- If SMTP is not configured, backend logs: `Email skipped: SMTP not configured.`
- If request has no linked user, no recipient email is available.
- Ensure students are logged in when submitting requests (backend stores `user_id`).
