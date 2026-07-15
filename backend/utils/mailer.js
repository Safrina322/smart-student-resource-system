import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

const smtpConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export const sendRequestStatusEmail = async ({
  to,
  studentName,
  courseTitle,
  status,
  resourceType,
  adminComment,
}) => {
  if (!to) return;

  if (!smtpConfigured || !transporter) {
    console.warn("⚠️ Email skipped: SMTP not configured.");
    return;
  }

  const normalizedStatus = status === "approved" ? "Approved" : "Rejected";
  const subject = `SmartStudent: Your resource request was ${normalizedStatus}`;
  const greetingName = studentName || "Student";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">Hi ${greetingName},</h2>
      <p>Your resource request for <strong>${courseTitle || "a course"}</strong> has been <strong>${normalizedStatus}</strong>.</p>
      <p><strong>Resource Type:</strong> ${resourceType || "N/A"}</p>
      ${adminComment ? `<p><strong>Admin Note:</strong> ${adminComment}</p>` : ""}
      <p style="margin-top: 20px;">Thanks,<br/>SmartStudent Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject,
    html,
  });
};

export const isSmtpReady = () => smtpConfigured && Boolean(transporter);

export const sendAdminReportEmail = async ({
  to,
  frequency,
  rangeDays,
  csvContent,
  fileName,
}) => {
  if (!to) {
    throw new Error("Report email recipient is required");
  }

  if (!smtpConfigured || !transporter) {
    throw new Error("SMTP is not configured for scheduled reports");
  }

  const readableFrequency = frequency === "weekly" ? "Weekly" : "Daily";
  const subject = `SmartStudent ${readableFrequency} Analytics Report (${rangeDays}d)`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">SmartStudent Admin Report</h2>
      <p>Your ${readableFrequency.toLowerCase()} analytics report is attached as CSV.</p>
      <p><strong>Range:</strong> Last ${rangeDays} days</p>
      <p style="margin-top: 20px;">Regards,<br/>SmartStudent Platform</p>
    </div>
  `;

  await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject,
    html,
    attachments: [
      {
        filename: fileName,
        content: csvContent,
        contentType: "text/csv",
      },
    ],
  });
};
