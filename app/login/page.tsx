'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    window.location.href = '/';
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://www.timelinesworld.com',
      },
    });
    if (error) setError(error.message);
  };

  return (
    <main style={{ background: '#F5F4F0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '36px 32px', width: '100%', maxWidth: '400px', margin: '0 20px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: 700 }}>
              <span style={{ color: '#1A7A4A' }}>Time</span>
              <span style={{ color: '#B83232' }}>lines</span>
              <span style={{ color: '#1C1C1E' }}> World</span>
            </span>
          </a>
          <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginTop: '6px' }}>Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FDF0F0', border: '1px solid #F0D4D4', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#B83232' }}>
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px', borderRadius: '4px', background: '#fff', color: '#1C1C1E', border: '1px solid #DEDAD3', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#DEDAD3' }} />
          <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#DEDAD3' }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '13px', padding: '9px 12px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#F5F4F0', color: '#1C1C1E', outline: 'none' }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your password"
            style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '13px', padding: '9px 12px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#F5F4F0', color: '#1C1C1E', outline: 'none' }}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px', borderRadius: '4px', background: loading ? '#aaa' : '#2A5298', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '16px' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {/* Divider */}
        <div style={{ height: '1px', background: '#DEDAD3', marginBottom: '16px' }} />

        {/* Register link */}
        <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', textAlign: 'center' }}>
          Don't have an account?{' '}
          <a href="/register" style={{ color: '#2A5298', fontWeight: 600, textDecoration: 'none' }}>Register</a>
        </p>

      </div>
    </main>
  );
}