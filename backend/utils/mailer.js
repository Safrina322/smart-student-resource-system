import nodemailer from "nodemailer";
import logger from "./logger.js";

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
    logger.warn("Email skipped: SMTP not configured.");
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

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

export const sendVerificationEmail = async ({ to, name, token }) => {
  if (!to) return;

  if (!smtpConfigured || !transporter) {
    logger.warn("Email skipped: SMTP not configured.");
    return;
  }

  const verifyUrl = `${frontendUrl()}/verify-email/${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">Hi ${name || "there"},</h2>
      <p>Thanks for signing up for SmartStudent. Confirm your email address to activate your account:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Verify Email
        </a>
      </p>
      <p>Or paste this link into your browser: ${verifyUrl}</p>
      <p style="margin-top: 20px;">Thanks,<br/>SmartStudent Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: "Verify your SmartStudent email address",
    html,
  });
};

export const sendPasswordResetEmail = async ({ to, name, token }) => {
  if (!to) return;

  if (!smtpConfigured || !transporter) {
    logger.warn("Email skipped: SMTP not configured.");
    return;
  }

  const resetUrl = `${frontendUrl()}/reset-password/${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">Hi ${name || "there"},</h2>
      <p>We received a request to reset your SmartStudent password. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p>Or paste this link into your browser: ${resetUrl}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p style="margin-top: 20px;">Thanks,<br/>SmartStudent Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to,
    subject: "Reset your SmartStudent password",
    html,
  });
};

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
