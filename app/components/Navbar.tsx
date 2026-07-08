'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<'guest' | 'user' | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (data?.role === 'admin') setIsAdmin(true);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCreateTimeline = () => {
    if (!user) {
      setPopup('guest');
    } else if (!isAdmin) {
      setPopup('user');
    } else {
      window.location.href = '/admin';
    }
  };

  return (
    <>
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #DEDAD3',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>

        {/* Brand */}
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
            <span style={{ color: '#1A7A4A' }}>Time</span>
            <span style={{ color: '#B83232' }}>lines</span>
            <span style={{ color: '#1C1C1E' }}> World</span>
          </span>
        </a>

        {/* Links */}
        <div style={{ display: 'flex', gap: '18px', fontFamily: 'Arial, sans-serif', fontSize: '12px', alignItems: 'center' }}>
          <a href="/browse" style={{ color: '#555555', textDecoration: 'none' }}>Browse</a>
          <a href="/about" style={{ color: '#555555', textDecoration: 'none' }}>About</a>
          {/* Create Timeline Button */}
          <button
            onClick={handleCreateTimeline}
            style={{
              fontFamily: 'Arial,sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: '4px',
              border: '1px solid #1A7A4A',
              color: '#1A7A4A',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            + New Timeline
          </button>
        </div>

        {/* Right — Login or User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!loading && (
            <>
              {user ? (
                <>
                  <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#555', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <a href="/favourites" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    Favourites
                  </a>
                  {isAdmin && (
                    <a href="/admin" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '4px', border: '1px solid #2A5298', color: '#2A5298', textDecoration: 'none' }}>
                      Admin
                    </a>
                  )}
                  <button onClick={handleLogout} style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', background: '#ffffff', cursor: 'pointer' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="/register" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', background: '#ffffff', textDecoration: 'none' }}>
                    Register
                  </a>
                  <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: '4px', border: '1px solid #2A5298', color: '#2A5298', background: '#ffffff', textDecoration: 'none' }}>
                    Login
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </nav>

      {/* POPUP — Guest */}
      {popup === 'guest' && (
        <div
          onClick={() => setPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '8px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }}
          >
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>👋</div>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Please login to continue</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>Create an account or login to access this feature.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', textDecoration: 'none' }}>Login</a>
              <a href="/register" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none' }}>Register</a>
            </div>
            <button onClick={() => setPopup(null)} style={{ marginTop: '16px', fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* POPUP — Registered User */}
      {popup === 'user' && (
        <div
          onClick={() => setPopup(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '8px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }}
          >
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🚧</div>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Coming Soon</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>This feature is not available right now. We are working on it and will announce when it is ready.</p>
            <button onClick={() => setPopup(null)} style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 24px', borderRadius: '4px', background: '#2A5298', color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}