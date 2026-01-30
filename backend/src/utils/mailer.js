
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;

// Send feedback email utility
export async function sendFeedbackEmail({ name, email, message }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.FEEDBACK_RECEIVER || process.env.EMAIL_USER,
    subject: `New Feedback from Habitly User`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    html: `<h3>New Feedback from Habitly User</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Message:</b><br/>${message}</p>`
  };
  await transporter.sendMail(mailOptions);
}
