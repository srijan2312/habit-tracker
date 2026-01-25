

export async function sendResendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Habit Tracker <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  return await res.json();
}
