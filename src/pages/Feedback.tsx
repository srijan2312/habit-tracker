import React, { useState } from 'react';

const Feedback: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-zinc-900 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border rounded"
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Your Feedback"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Sending...' : 'Submit'}
        </button>
        {status === 'success' && <p className="text-green-600">Thank you for your feedback!</p>}
        {status === 'error' && <p className="text-red-600">Something went wrong. Please try again.</p>}
      </form>
    </div>
  );
};

export default Feedback;
