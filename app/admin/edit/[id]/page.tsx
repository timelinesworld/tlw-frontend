'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categories = [
  "Person", "Country", "Disaster", "Invention", "War & Conflict",
  "Sports", "Politics & Leadership", "Entertainment", "Business & Economy",
  "Monument & Wonder", "Movement & Revolution", "Science & Discovery",
  "Nature & Environment", "Other"
];

export default function EditTimeline({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  const [adminCheck, setAdminCheck] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [secondaryCategory, setSecondaryCategory] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New event form
  const [newYear, setNewYear] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSide, setNewSide] = useState<'positive' | 'negative'>('positive');
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventDetails, setEventDetails] = useState<Record<number, string>>({});

  useEffect(() => {
    params.then(p => {
      setId(p.id);
      checkAdminAndLoad(p.id);
    });
  }, []);

  const checkAdminAndLoad = async (timelineId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAdminCheck(false); return; }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      setAdminCheck(false);
      return;
    }

    setAdminCheck(true);
    loadTimeline(timelineId);
  };

  const loadTimeline = async (timelineId: string) => {
    // Load timeline
    const { data: tl } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name)')
      .eq('id', timelineId)
      .single();

    if (tl) {
      setTitle(tl.title);
      setDescription(tl.description);
      setCategory(tl.categories?.name || '');

      // Load secondary category name
      if (tl.secondary_category_id) {
        const { data: secCat } = await supabase
          .from('categories')
          .select('name')
          .eq('id', tl.secondary_category_id)
          .single();
        setSecondaryCategory(secCat?.name || '');
      }
    }

    // Load events
    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('timeline_id', timelineId)
      .order('year', { ascending: true });

    setEvents(ev || []);
  };

  const handleSaveTimeline = async () => {
    setSaving(true);
    setMessage('');

    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single();

    if (!catData) { setMessage('Category not found.'); setSaving(false); return; }

    // Get secondary category id if selected
    let secondaryCatId = null;
    if (secondaryCategory) {
      const { data: secCatData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', secondaryCategory)
        .single();
      secondaryCatId = secCatData?.id || null;
    }

    const { error } = await supabase
      .from('timelines')
      .update({ title, description, category_id: catData.id, secondary_category_id: secondaryCatId })
      .eq('id', id);

    if (error) {
      setMessage('❌ Error: ' + error.message);
    } else {
      setMessage('✅ Timeline updated successfully!');
    }
    setSaving(false);
  };

  const handleAddEvent = async () => {
    if (!newYear.trim()) { setMessage('Please enter a year.'); return; }
    if (!newDesc.trim()) { setMessage('Please enter a description.'); return; }

    setAddingEvent(true);

    const { error } = await supabase
      .from('events')
      .insert([{
        timeline_id: Number(id),
        year: newYear,
        title: newTitle,
        description: newDesc,
        side: newSide,
      }]);

    if (error) {
      setMessage('❌ Error adding event: ' + error.message);
    } else {
      setMessage('✅ Event added!');
      setNewYear('');
      setNewTitle('');
      setNewDesc('');
      setNewSide('positive');
      loadTimeline(id);
    }
    setAddingEvent(false);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', eventId);
    loadTimeline(id);
  };

  const handleUpdateEvent = async (eventId: number, field: string, value: any) => {
    if (field === 'details') {
      const parsed = value ? JSON.parse(value) : null;
      await supabase.from('events').update({ details: parsed }).eq('id', eventId);
    } else {
      await supabase.from('events').update({ [field]: value }).eq('id', eventId);
    }
    loadTimeline(id);
  };

  if (adminCheck === null) {
    return <div style={{ padding: '40px', fontFamily: 'Arial,sans-serif', textAlign: 'center', color: '#888' }}>Loading...</div>;
  }

  if (!adminCheck) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial,sans-serif', textAlign: 'center' }}>
        <h2 style={{ color: '#B83232' }}>Access Denied</h2>
        <a href="/login" style={{ color: '#2A5298' }}>Login</a>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontFamily: 'Arial,sans-serif',
    fontSize: '13px',
    padding: '9px 12px',
    border: '1px solid #DEDAD3',
    borderRadius: '4px',
    background: '#F5F4F0',
    color: '#1C1C1E',
    outline: 'none',
    marginBottom: '12px',
  };

  return (
    <main style={{ background: '#F5F4F0', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #DEDAD3', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: 700 }}>
            <span style={{ color: '#1A7A4A' }}>Time</span>
            <span style={{ color: '#B83232' }}>lines</span>
            <span style={{ color: '#1C1C1E' }}> World</span>
          </span>
        </a>
        <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#2A5298', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Edit Timeline</span>
        <a href="/admin" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#555', textDecoration: 'none' }}>← Admin Panel</a>
      </nav>

      <div style={{ padding: '24px 20px 40px', maxWidth: '860px', margin: '0 auto' }}>

        {/* Edit Timeline Details */}
        <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '20px' }}>Timeline Details</h2>

          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />

          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Primary Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              <option value="">Select primary category…</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Secondary Category (optional)</label>
            <select value={secondaryCategory} onChange={e => setSecondaryCategory(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {categories.filter(c => c !== category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

          {message && (
            <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: message.startsWith('✅') ? '#1A7A4A' : '#B83232', marginBottom: '12px' }}>{message}</div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSaveTimeline} disabled={saving} style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px 24px', borderRadius: '4px', background: saving ? '#aaa' : '#2A5298', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <a href={'/timeline/' + id} style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px 24px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none', background: '#fff' }}>
              View Timeline
            </a>
          </div>
        </div>

        {/* Events List */}
        <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '16px' }}>Events ({events.length})</h2>

          {events.map((ev: any) => (
            <div key={ev.id} style={{ border: `1px solid ${ev.side === 'positive' ? '#C8E8D5' : '#F0D4D4'}`, borderRadius: '6px', padding: '12px 14px', marginBottom: '10px', background: ev.side === 'positive' ? '#EDF7F1' : '#FDF0F0' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>

                {/* Year */}
                <input
                  defaultValue={ev.year}
                  onBlur={e => handleUpdateEvent(ev.id, 'year', e.target.value)}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 700, padding: '4px 8px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#fff', width: '100px', color: ev.side === 'positive' ? '#1A7A4A' : '#B83232' }}
                  placeholder="Year"
                />

                {/* Side */}
                <select
                  defaultValue={ev.side}
                  onChange={e => handleUpdateEvent(ev.id, 'side', e.target.value)}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '4px 8px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#fff' }}
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>

                {/* Delete */}
                <button onClick={() => handleDeleteEvent(ev.id)} style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', border: '1px solid #F0D4D4', color: '#B83232', background: '#fff', cursor: 'pointer', marginLeft: 'auto' }}>
                  Delete
                </button>
              </div>

              {/* Title */}
              <input
                defaultValue={ev.title}
                onBlur={e => handleUpdateEvent(ev.id, 'title', e.target.value)}
                placeholder="Event title (optional)"
                style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 700, padding: '6px 8px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#fff', marginBottom: '6px', outline: 'none' }}
              />

              {/* Description */}
              <textarea
                defaultValue={ev.description}
                onBlur={e => handleUpdateEvent(ev.id, 'description', e.target.value)}
                placeholder="Event description"
                rows={2}
                style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '6px 8px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#fff', resize: 'vertical', outline: 'none', marginBottom: '6px' }}
              />

              {/* Details — optional structured lines */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '10px', fontWeight: 700, color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Details (optional — one line per entry)
                </div>
                <textarea
                  value={eventDetails[ev.id] !== undefined ? eventDetails[ev.id] : (ev.details ? ev.details.join('\n') : '')}
                  onChange={e => setEventDetails(prev => ({ ...prev, [ev.id]: e.target.value }))}
                  placeholder={"Host Country: Uruguay\nParticipating Countries: 13\nFinal: Uruguay vs Argentina\nDate: 30 Jul 1930"}
                  rows={3}
                  style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '11px', padding: '6px 8px', border: '1px solid #C8E8D5', borderRadius: '4px', background: '#F9FEF9', resize: 'vertical', outline: 'none', marginBottom: '4px' }}
                />
                <button
                  onClick={async () => {
                    const raw = eventDetails[ev.id] !== undefined ? eventDetails[ev.id] : (ev.details ? ev.details.join('\n') : '');
                    const lines = raw
                      .split('\n')
                      .map((l: string) => l.trim())
                      .filter((l: string) => l.length > 0);

                    const { error } = await supabase
                      .from('events')
                      .update({ details: lines.length > 0 ? lines : null })
                      .eq('id', ev.id);

                    if (error) {
                      setMessage('❌ Error: ' + error.message);
                    } else {
                      setMessage('✅ Details saved!');
                      loadTimeline(id);
                    }
                  }}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: '10px', fontWeight: 600, padding: '4px 12px', borderRadius: '4px', border: '1px solid #C8E8D5', background: '#EDF7F1', color: '#1A7A4A', cursor: 'pointer' }}
                >
                  Save Details
                </button>
                <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '10px', color: '#aaa', marginLeft: '8px' }}>
                  If filled — replaces description on timeline.
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Event */}
        <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '16px' }}>Add New Event</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Year *</label>
              <input value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="e.g. 1947" style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
            <div>
              <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Side *</label>
              <select value={newSide} onChange={e => setNewSide(e.target.value as 'positive' | 'negative')} style={{ ...inputStyle, marginBottom: 0 }}>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>

          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Event Title (optional)</label>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Short title for this event" style={inputStyle} />

          <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Description *</label>
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What happened?" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />

          <button onClick={handleAddEvent} disabled={addingEvent} style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px 24px', borderRadius: '4px', background: addingEvent ? '#aaa' : '#1A7A4A', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {addingEvent ? 'Adding...' : '+ Add Event'}
          </button>
        </div>

      </div>
    </main>
  );
}