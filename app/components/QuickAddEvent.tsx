'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  timelineId: number;
  onAdded: () => void;
}

export default function QuickAddEvent({ timelineId, onAdded }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [side, setSide] = useState<'positive' | 'negative'>('positive');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (userData?.role === 'admin') setIsAdmin(true);
    };
    checkAdmin();
  }, []);

  const handleSave = async () => {
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
      setMessage('Error saving event.');
    } else {
      setMessage('✅ Event added!');
      setYear('');
      setTitle('');
      setDescription('');
      setSide('positive');
      onAdded();
      setTimeout(() => {
        setShowForm(false);
        setMessage('');
      }, 1000);
    }
    setSaving(false);
  };

  if (!isAdmin) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          fontFamily: 'Arial,sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          padding: '10px 18px',
          borderRadius: '24px',
          background: '#1A7A4A',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
        Add Event
      </button>

      {/* Popup Form */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '380px',
              margin: '0 20px',
            }}
          >
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '16px', fontWeight: 700, color: '#1C1C1E', marginBottom: '16px' }}>
              + Add Event
            </h3>

            {/* Year */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Year *</label>
              <input
                value={year}
                onChange={e => setYear(e.target.value)}
                placeholder="e.g. 1994 or 15 Aug 1947"
                style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', outline: 'none' }}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Title <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short event title"
                style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', outline: 'none' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened?"
                rows={3}
                style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Side */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '4px' }}>Side *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSide('positive')}
                  style={{ flex: 1, fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '7px', borderRadius: '4px', border: `1px solid ${side === 'positive' ? '#1A7A4A' : '#DEDAD3'}`, background: side === 'positive' ? '#EDF7F1' : '#fff', color: side === 'positive' ? '#1A7A4A' : '#888', cursor: 'pointer' }}
                >
                  ▲ Positive
                </button>
                <button
                  onClick={() => setSide('negative')}
                  style={{ flex: 1, fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '7px', borderRadius: '4px', border: `1px solid ${side === 'negative' ? '#B83232' : '#DEDAD3'}`, background: side === 'negative' ? '#FDF0F0' : '#fff', color: side === 'negative' ? '#B83232' : '#888', cursor: 'pointer' }}
                >
                  ▼ Negative
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: message.includes('✅') ? '#1A7A4A' : '#B83232', marginBottom: '12px' }}>
                {message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); setMessage(''); }}
                style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '4px', border: '1px solid #DEDAD3', background: '#fff', color: '#555', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '4px', border: 'none', background: saving ? '#aaa' : '#1A7A4A', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : 'Add Event'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}