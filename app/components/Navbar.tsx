'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
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
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          letterSpacing: '-0.02em',
        }}>
          <span style={{ color: '#1A7A4A' }}>Time</span>
          <span style={{ color: '#B83232' }}>lines</span>
          <span style={{ color: '#1C1C1E' }}> World</span>
        </span>
      </a>

      {/* Links */}
      <div style={{
        display: 'flex',
        gap: '18px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        alignItems: 'center',
      }}>
        <a href="/browse" style={{ color: '#555555', textDecoration: 'none' }}>Browse</a>
        <a href="/about" style={{ color: '#555555', textDecoration: 'none' }}>About</a>
      </div>

      {/* Right side — Login or User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!loading && (
          <>
            {user ? (
              <>
                {/* Logged in */}
                <span style={{
                  fontFamily: 'Arial,sans-serif',
                  fontSize: '11px',
                  color: '#555',
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    fontFamily: 'Arial,sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '5px 14px',
                    borderRadius: '4px',
                    border: '1px solid #DEDAD3',
                    color: '#555',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Not logged in */}
                <a href="/register" style={{
                  fontFamily: 'Arial,sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '5px 14px',
                  borderRadius: '4px',
                  border: '1px solid #DEDAD3',
                  color: '#555',
                  background: '#ffffff',
                  textDecoration: 'none',
                }}>
                  Register
                </a>
                <a href="/login" style={{
                  fontFamily: 'Arial,sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '5px 14px',
                  borderRadius: '4px',
                  border: '1px solid #2A5298',
                  color: '#2A5298',
                  background: '#ffffff',
                  textDecoration: 'none',
                }}>
                  Login
                </a>
              </>
            )}
          </>
        )}
      </div>

    </nav>
  );
}