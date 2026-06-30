'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

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