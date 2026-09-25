'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();
  const [loginToken, setLoginToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginToken: loginToken.trim() }),
    });
    if (response.ok) {
      router.push('/');
      return;
    }
    const body = await response.json().catch(() => null);
    setError(body?.error ?? `Login failed (${response.status})`);
    setSubmitting(false);
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
      <h1 style={{ margin: 0 }}>SimpleMod</h1>
      <p style={{ maxWidth: 420, textAlign: 'center', color: 'var(--text-muted)' }}>
        If you&apos;re logged into the forum on this host, no login is needed — go to the queue.
        Otherwise paste a <code>loginToken</code> cookie value from a logged-in forum session.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          value={loginToken}
          onChange={event => setLoginToken(event.target.value)}
          placeholder="loginToken"
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, width: 280 }}
        />
        <button type="submit" disabled={submitting || !loginToken.trim()} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer' }}>
          Log in
        </button>
      </form>
      {error && <div style={{ color: 'var(--reject)' }}>{error}</div>}
    </main>
  );
};

export default LoginPage;
