import sgMail from '@sendgrid/mail';

export async function sendResetEmail({ to, subject, html }) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Set here, not at the top
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL, // Must be a verified sender or domain
    subject,
    html,
  };
  await sgMail.send(msg);
}