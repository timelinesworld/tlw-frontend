'use client';
import SpeedDial from './SpeedDial';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNewPopup, setShowNewPopup] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: userData } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single();
        if (userData?.role === 'admin') setIsAdmin(true);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleNewTimeline = () => {
    if (!user) {
      setShowNewPopup('guest' as any);
    } else if (isAdmin) {
      window.location.href = '/admin';
    } else {
      setShowNewPopup('user' as any);
    }
  };

  return (
    <>
      <nav style={{
        background: '#0B1120',
        height: '48px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        width: '100%',
      }}>
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          height: '100%',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left — Home + Brand */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <span style={{ fontSize: '14px' }}>🏠</span>
            <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', letterSpacing: '0.01em' }}>
              <span style={{ color: '#E53E3E', fontWeight: 700 }}>Time</span>
              <span style={{ color: '#fff', fontWeight: 400 }}>Lines</span>
              <span style={{ color: '#2D8A5E', fontWeight: 700 }}>World</span>
              <span style={{ color: '#aaa', fontWeight: 400, fontSize: '12px' }}>.com</span>
            </span>
          </a>

          {/* Centre — About */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="/about" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#ccc', textDecoration: 'none', letterSpacing: '0.04em' }}>About</a>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            

            {user ? (
              <>
                {isAdmin && <span style={{ fontSize: '14px' }}>👑</span>}
                <a href="/favourites" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#ccc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Favourites
                </a>
                <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#ccc' }}>
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email}
                </span>
                {isAdmin && (
                  <a href="/admin" style={{ fontFamily: 'Arial,sans-serif', fontSize: '10px', fontWeight: 600, padding: '5px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none' }}>Admin</a>
                )}
                <button
                  onClick={handleLogout}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: '10px', fontWeight: 600, padding: '5px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', background: 'transparent', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#ccc', textDecoration: 'none' }}>Login</a>
            )}
          </div>
        </div>
      </nav>

      {/* Guest Popup */}
      {showNewPopup === 'guest' as any && (
        <div onClick={() => setShowNewPopup(false as any)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '28px', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Login to Continue</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px' }}>Please login to create a new timeline.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', textDecoration: 'none' }}>Login</a>
              <a href="/register" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none' }}>Register</a>
            </div>
            <button onClick={() => setShowNewPopup(false as any)} style={{ marginTop: '14px', fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* User Popup */}
      {showNewPopup === 'user' as any && (
        <div onClick={() => setShowNewPopup(false as any)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '28px', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Coming Soon</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px' }}>This feature is not available right now.</p>
            <button onClick={() => setShowNewPopup(false as any)} style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    

    <SpeedDial />
    </>
  );
}