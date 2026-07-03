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

export default function AdminPage() {
  const [adminCheck, setAdminCheck] = useState<boolean | null>(null);
  const [timelines, setTimelines] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'timelines' | 'create' | 'import'>('timelines');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAdminCheck(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      console.log('User data:', data, 'Error:', error);

      if (!data || data.role !== 'admin') {
        setAdminCheck(false);
      } else {
        setAdminCheck(true);
        loadTimelines();
      }
    };

    checkAdmin();
  }, []);

  const loadTimelines = async () => {
    const { data } = await supabase
      .from('timelines')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    setTimelines(data || []);
  };

  const handleCreateTimeline = async () => {
    if (!title.trim()) { setMessage('Please enter a title.'); return; }
    if (!description.trim()) { setMessage('Please enter a description.'); return; }
    if (!category) { setMessage('Please select a category.'); return; }

    setSaving(true);
    setMessage('');

    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category)
      .single();

    if (!catData) { setMessage('Category not found.'); setSaving(false); return; }

    const { error } = await supabase
      .from('timelines')
      .insert([{ title, description, category_id: catData.id, views: 0 }]);

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✅ Timeline created successfully!');
      setTitle('');
      setDescription('');
      setCategory('');
      loadTimelines();
    }
    setSaving(false);
  };

  const handleDeleteTimeline = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timeline?')) return;
    await supabase.from('timelines').delete().eq('id', id);
    loadTimelines();
  };

  const handleJsonImport = async () => {
    setImportMessage('');
    setImporting(true);

    try {
      const parsed = JSON.parse(jsonInput);

      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', parsed.category)
        .single();

      if (!catData) {
        setImportMessage('❌ Category not found: ' + parsed.category);
        setImporting(false);
        return;
      }

      const { data: tlData, error: tlError } = await supabase
        .from('timelines')
        .insert([{
          title: parsed.title,
          description: parsed.description,
          category_id: catData.id,
          views: 0
        }])
        .select()
        .single();

      if (tlError) {
        setImportMessage('❌ Error creating timeline: ' + tlError.message);
        setImporting(false);
        return;
      }

      const events = parsed.events.map((ev: any) => ({
        timeline_id: tlData.id,
        year: ev.year,
        title: ev.title,
        description: ev.description,
        side: ev.side,
      }));

      const { error: evError } = await supabase.from('events').insert(events);

      if (evError) {
        setImportMessage('❌ Error adding events: ' + evError.message);
      } else {
        setImportMessage(`✅ Successfully imported "${parsed.title}" with ${events.length} events!`);
        setJsonInput('');
        loadTimelines();
      }

    } catch (err) {
      setImportMessage('❌ Invalid JSON format. Please check and try again.');
    }

    setImporting(false);
  };

  if (adminCheck === null) {
    return <div style={{ padding: '40px', fontFamily: 'Arial,sans-serif', textAlign: 'center', color: '#888' }}>Checking access...</div>;
  }

  if (!adminCheck) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial,sans-serif', textAlign: 'center' }}>
        <h2 style={{ color: '#B83232', marginBottom: '10px' }}>Access Denied</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>You do not have permission to access this page.</p>
        <a href="/login" style={{ color: '#2A5298', display: 'block', marginBottom: '8px' }}>Login</a>
        <a href="/" style={{ color: '#2A5298' }}>← Back to Home</a>
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'Arial,sans-serif',
    fontSize: '12px',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '4px',
    border: active ? 'none' : '1px solid #DEDAD3',
    background: active ? '#2A5298' : '#fff',
    color: active ? '#fff' : '#555',
    cursor: 'pointer',
  });

  return (
    <main style={{ background: '#F5F4F0', minHeight: '100vh' }}>

      <nav style={{ background: '#fff', borderBottom: '1px solid #DEDAD3', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Georgia,serif', fontSize: '15px', fontWeight: 700 }}>
            <span style={{ color: '#1A7A4A' }}>Time</span>
            <span style={{ color: '#B83232' }}>lines</span>
            <span style={{ color: '#1C1C1E' }}> World</span>
          </span>
        </a>
        <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#2A5298', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</span>
        <a href="/" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#555', textDecoration: 'none' }}>← Back to site</a>
      </nav>

      <div style={{ padding: '24px 20px 40px', maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#1C1C1E', marginBottom: '4px' }}>Admin Panel</h1>
          <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888' }}>{timelines.length} timelines in database</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={tabStyle(activeTab === 'timelines')} onClick={() => setActiveTab('timelines')}>All Timelines</button>
          <button style={tabStyle(activeTab === 'create')} onClick={() => setActiveTab('create')}>+ Create Timeline</button>
          <button style={tabStyle(activeTab === 'import')} onClick={() => setActiveTab('import')}>↓ JSON Import</button>
        </div>

        {activeTab === 'timelines' && (
          <div>
            {timelines.length === 0 && (
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', color: '#888', padding: '20px', textAlign: 'center' }}>No timelines yet.</div>
            )}
            {timelines.map((t: any) => (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '6px', padding: '14px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#2A5298', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{t.categories?.name}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '3px' }}>{t.title}</div>
                  <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#888' }}>{t.description}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <a href={'/timeline/' + t.id} style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none' }}>View</a>
                  <a href={'/admin/edit/' + t.id} style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '4px', border: '1px solid #2A5298', color: '#2A5298', textDecoration: 'none' }}>Edit</a>
                  <button onClick={() => handleDeleteTimeline(t.id)} style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '4px', border: '1px solid #F0D4D4', color: '#B83232', background: '#FDF0F0', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '20px' }}>Create New Timeline</h2>
            <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mahatma Gandhi" style={inputStyle} />
            <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="One sentence description…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <label style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {message && (
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: message.startsWith('✅') ? '#1A7A4A' : '#B83232', marginBottom: '12px' }}>{message}</div>
            )}
            <button onClick={handleCreateTimeline} disabled={saving} style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px 24px', borderRadius: '4px', background: saving ? '#aaa' : '#2A5298', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Creating...' : 'Create Timeline'}
            </button>
          </div>
        )}

        {activeTab === 'import' && (
          <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '24px' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>JSON Import</h2>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px' }}>Import a timeline from a JSON file or paste JSON directly.</p>

            {/* Option 1 — File Upload */}
            <div style={{ background: '#F5F4F0', border: '1px solid #DEDAD3', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Option 1 — Upload JSON File</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept=".json"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const content = ev.target?.result as string;
                      setJsonInput(content);
                      setImportMessage('✅ File loaded — click Import Timeline to proceed.');
                    };
                    reader.readAsText(file);
                  }}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#555' }}
                />
              </div>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#DEDAD3' }} />
              <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#DEDAD3' }} />
            </div>

            {/* Option 2 — Paste JSON */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Option 2 — Paste JSON</div>
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='{ "title": "...", "description": "...", "category": "Person", "events": [...] }'
                rows={12}
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', marginBottom: '0' }}
              />
            </div>

            {/* Message */}
            {importMessage && (
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: importMessage.startsWith('✅') ? '#1A7A4A' : '#B83232', marginBottom: '12px', padding: '10px', background: importMessage.startsWith('✅') ? '#EDF7F1' : '#FDF0F0', borderRadius: '4px' }}>{importMessage}</div>
            )}

            {/* Preview — show title if JSON is loaded */}
            {jsonInput && (() => {
              try {
                const p = JSON.parse(jsonInput);
                return (
                  <div style={{ background: '#EDF7F1', border: '1px solid #C8E8D5', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#1A7A4A' }}>
                    Ready to import: <strong>{p.title}</strong> · {p.events?.length || 0} events · Category: {p.category}
                  </div>
                );
              } catch { return null; }
            })()}

            {/* Import Button */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleJsonImport}
                disabled={importing || !jsonInput.trim()}
                style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px 24px', borderRadius: '4px', background: importing || !jsonInput.trim() ? '#aaa' : '#1A7A4A', color: '#fff', border: 'none', cursor: importing || !jsonInput.trim() ? 'not-allowed' : 'pointer' }}
              >
                {importing ? 'Importing...' : 'Import Timeline'}
              </button>
              {jsonInput && (
                <button
                  onClick={() => { setJsonInput(''); setImportMessage(''); }}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '10px 16px', borderRadius: '4px', border: '1px solid #DEDAD3', background: '#fff', color: '#555', cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}