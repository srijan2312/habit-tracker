import { sendResetEmail } from './sendgrid.js';
import { sendResendEmail } from './resend.js';

export async function sendEmail({ to, subject, html }) {
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    return sendResetEmail({ to, subject, html });
  }

  if (process.env.RESEND_API_KEY) {
    return sendResendEmail({ to, subject, html });
  }

  throw new Error('No email provider configured. Set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL or RESEND_API_KEY.');
}
