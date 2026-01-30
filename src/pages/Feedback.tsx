import React, { useState } from 'react';

const Feedback: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [showModal, setShowModal] = useState(false);

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
        setShowModal(true);
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg p-8 rounded-xl shadow-lg border border-border bg-card">
        <h2 className="text-3xl font-bold mb-6 text-center text-foreground">Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            className="w-full p-3 rounded-lg bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary transition"
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="off"
          />
          <input
            className="w-full p-3 rounded-lg bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary transition"
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="off"
          />
          <textarea
            className="w-full p-3 rounded-lg bg-input text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-y transition"
            placeholder="Your Feedback"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition disabled:opacity-60"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? 'Sending...' : 'Submit'}
          </button>
          {status === 'error' && <p className="text-red-500 text-center">Something went wrong. Please try again.</p>}
        </form>
      </div>
      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-card border border-border rounded-xl p-8 shadow-xl flex flex-col items-center">
            <span className="text-4xl mb-2">🎉</span>
            <h3 className="text-2xl font-bold text-green-500 mb-2">Thank you for your feedback!</h3>
            <p className="text-muted-foreground mb-4 text-center">We appreciate your input and will use it to improve Habitly.</p>
            <button
              className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
