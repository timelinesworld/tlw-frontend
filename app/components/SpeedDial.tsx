'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  timelineId?: number;
  onEventAdded?: () => void;
}

export default function SpeedDial({ timelineId, onEventAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTimelinePage, setIsTimelinePage] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState<'positive' | 'negative'>('positive');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTimelinePage(window.location.pathname.startsWith('/timeline/'));

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (data?.role === 'admin') setIsAdmin(true);
      }
    };
    init();

    // Close on outside click
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNewTimeline = () => {
    setOpen(false);
    if (!user) setShowGuestPopup(true);
    else if (isAdmin) window.location.href = '/admin';
    else setShowUserPopup(true);
  };

  const handleSaveEvent = async () => {
    if (!year.trim() || !description.trim()) {
      setMessage('Year and description are required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('events')
      .insert([{
        timeline_id: timelineId,
        year: year.trim(),
        title: title.trim() || null,
        description: description.trim(),
        side,
      }]);

    if (error) {
      setMessage('❌ Error saving event.');
    } else {
      setMessage('✅ Event added!');
      setYear(''); setTitle(''); setDescription(''); setSide('positive');
      if (onEventAdded) onEventAdded();
      setTimeout(() => { setShowEventForm(false); setMessage(''); }, 1000);
    }
    setSaving(false);
  };

  return (
    <>
      <div ref={ref} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>

        {/* Pop-up buttons */}
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

            {/* + New Timeline — always shown */}
            <button
              onClick={handleNewTimeline}
              style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '8px 16px', borderRadius: '20px', background: '#2A5298', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>+</span> New Timeline
            </button>

            {/* + New Event — only on timeline page for admin */}
            {isTimelinePage && isAdmin && (
              <button
                onClick={() => { setOpen(false); setShowEventForm(true); }}
                style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '8px 16px', borderRadius: '20px', background: '#1A7A4A', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>+</span> New Event
              </button>
            )}

          </div>
        )}

        {/* Main + button */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#1A7A4A',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            fontWeight: 300,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </button>

      </div>

      {/* Guest Popup */}
      {showGuestPopup && (
        <div onClick={() => setShowGuestPopup(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '28px', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Login to Continue</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px' }}>Please login to create a new timeline.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', textDecoration: 'none' }}>Login</a>
              <a href="/register" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none' }}>Register</a>
            </div>
            <button onClick={() => setShowGuestPopup(false)} style={{ marginTop: '14px', fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* User Popup */}
      {showUserPopup && (
        <div onClick={() => setShowUserPopup(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '28px', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Coming Soon</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px' }}>This feature is not available right now.</p>
            <button onClick={() => setShowUserPopup(false)} style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', border: 'none', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {/* Add Event Form */}
      {showEventForm && (
        <div onClick={() => setShowEventForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '380px', margin: '0 20px' }}>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '16px' }}>+ New Event</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Year *</label>
              <input value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 1994 or 15 Aug 1947" style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Title <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Short event title" style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What happened?" rows={3} style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Side *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSide('positive')} style={{ flex: 1, fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '7px', borderRadius: '4px', border: `1px solid ${side === 'positive' ? '#1A7A4A' : '#DEDAD3'}`, background: side === 'positive' ? '#EDF7F1' : '#fff', color: side === 'positive' ? '#1A7A4A' : '#888', cursor: 'pointer' }}>▲ Positive</button>
                <button onClick={() => setSide('negative')} style={{ flex: 1, fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '7px', borderRadius: '4px', border: `1px solid ${side === 'negative' ? '#B83232' : '#DEDAD3'}`, background: side === 'negative' ? '#FDF0F0' : '#fff', color: side === 'negative' ? '#B83232' : '#888', cursor: 'pointer' }}>▼ Negative</button>
              </div>
            </div>
            {message && <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: message.includes('✅') ? '#1A7A4A' : '#B83232', marginBottom: '12px' }}>{message}</div>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEventForm(false); setMessage(''); }} style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '4px', border: '1px solid #DEDAD3', background: '#fff', color: '#555', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEvent} disabled={saving} style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '4px', border: 'none', background: saving ? '#aaa' : '#1A7A4A', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Add Event'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}