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
  const [stats, setStats] = useState({
    totalTimelines: 0,
    totalEvents: 0,
    totalViews: 0,
    totalUsers: 0,
    mostViewed: null as any,
    recentlyAdded: null as any,
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [secondaryCategory, setSecondaryCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Update mode state
  const [updateMode, setUpdateMode] = useState(false);
  const [updateTimeline, setUpdateTimeline] = useState<any>(null);
  const [updateEvents, setUpdateEvents] = useState<any[]>([]);
  const [updatePreview, setUpdatePreview] = useState<any[]>([]);
  const [updateSkipped, setUpdateSkipped] = useState(0);
  const [updateConfirming, setUpdateConfirming] = useState(false);
  const [existingTimelineFound, setExistingTimelineFound] = useState(false);
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResults, setBulkResults] = useState<string[]>([]);

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
      .select('*, categories!timelines_category_id_fkey(name)')
      .order('created_at', { ascending: false });
    setTimelines(data || []);
    loadStats(data || []);
  };

  const loadStats = async (tlData: any[]) => {
    // Total events
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    // Total users
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total views
    const totalViews = tlData.reduce((sum, t) => sum + (t.views || 0), 0);

    // Most viewed
    const mostViewed = tlData.reduce((max, t) => (!max || t.views > max.views) ? t : max, null);

    // Recently added
    const recentlyAdded = tlData.length > 0 ? tlData[0] : null;

    setStats({
      totalTimelines: tlData.length,
      totalEvents: eventCount || 0,
      totalViews,
      totalUsers: userCount || 0,
      mostViewed,
      recentlyAdded,
    });
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
      .insert([{ title, description, category_id: catData.id, secondary_category_id: secondaryCatId, views: 0 }]);

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('✅ Timeline created successfully!');
      setTitle('');
      setDescription('');
      setCategory('');
      setSecondaryCategory('');
      loadTimelines();
    }
    setSaving(false);
  };

    const handleToggleFlag = async (id: number, field: string, currentValue: boolean) => {
    await supabase
      .from('timelines')
      .update({ [field]: !currentValue })
      .eq('id', id);
    loadTimelines();
  };
  const handleDeleteTimeline = async (id: number) => {
    if (!confirm('Are you sure you want to delete this timeline?')) return;
    await supabase.from('timelines').delete().eq('id', id);
    loadTimelines();
  };
const handleUpdateMode = async (parsed: any) => {
    const { data: matchedTimeline } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name)')
      .ilike('title', parsed.timeline_title)
      .maybeSingle();

    setUpdateEvents(parsed.events || []);
    setUpdateMode(true);

    if (matchedTimeline) {
      setUpdateTimeline(matchedTimeline);
      await previewUpdateEvents(matchedTimeline.id, parsed.events || []);
    } else {
      setUpdateTimeline(null);
      setImportMessage('⚠️ No timeline found matching "' + parsed.timeline_title + '". Please select from dropdown.');
    }
  };

  const previewUpdateEvents = async (timelineId: number, events: any[]) => {
    const newEvents: any[] = [];
    let skipped = 0;

    for (const ev of events) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('timeline_id', timelineId)
        .eq('year', ev.year)
        .eq('title', ev.title || '')
        .maybeSingle();

      if (existing) {
        skipped++;
      } else {
        newEvents.push(ev);
      }
    }

    setUpdatePreview(newEvents);
    setUpdateSkipped(skipped);
  };

  const handleUpdateTimeline = async () => {
    if (!updateTimeline || updatePreview.length === 0) return;
    setUpdateConfirming(true);

    const events = updatePreview.map((ev: any) => ({
      timeline_id: updateTimeline.id,
      year: ev.year,
      title: ev.title || null,
      description: ev.description,
      side: ev.side,
      details: ev.details || null,
    }));

    const { error } = await supabase.from('events').insert(events);

    if (error) {
      setImportMessage('❌ Error adding events: ' + error.message);
    } else {
      setImportMessage(`✅ Successfully added ${updatePreview.length} new events to "${updateTimeline.title}"!`);
      setUpdateMode(false);
      setUpdatePreview([]);
      setUpdateTimeline(null);
      setJsonInput('');
      loadTimelines();
    }
    setUpdateConfirming(false);
  };
  const handleJsonImport = async () => {
    setImportMessage('');
    setImporting(true);
    setUpdateMode(false);
    setUpdatePreview([]);
    setUpdateSkipped(0);

    try {
      const parsed = JSON.parse(jsonInput);

      // Detect UPDATE mode — has timeline_title + events but no title/category
      if (parsed.timeline_title && parsed.events && !parsed.title && !parsed.category) {
        await handleUpdateMode(parsed);
        setImporting(false);
        return;
      }

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

      let secCatId = null;
      if (parsed.secondary_category) {
        const { data: secCat } = await supabase
          .from('categories')
          .select('id')
          .eq('name', parsed.secondary_category)
          .single();
        secCatId = secCat?.id || null;
      }

      // Priority 49 — Duplicate check
      const { data: existing } = await supabase
        .from('timelines')
        .select('id')
        .eq('title', parsed.title)
        .maybeSingle();

      if (existing) {
        setImportMessage('❌ Timeline "' + parsed.title + '" already exists. Use Check for Updates instead.');
        setImporting(false);
        return;
      }

      const { data: tlData, error: tlError } = await supabase
        .from('timelines')
        .insert([{
          title: parsed.title,
          description: parsed.description,
          category_id: catData.id,
          secondary_category_id: secCatId,
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
        details: ev.details || null,
      }));

      const { error: evError } = await supabase.from('events').insert(events);

      if (evError) {
        // Priority 50 — Atomic import — rollback timeline
        await supabase.from('timelines').delete().eq('id', tlData.id);
        setImportMessage('❌ Import failed — ' + evError.message + '. No changes saved.');
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
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#1C1C1E', marginBottom: '16px' }}>Admin Panel</h1>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>

            <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Timelines</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: 700, color: '#1C1C1E' }}>{stats.totalTimelines}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Events</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: 700, color: '#1C1C1E' }}>{stats.totalEvents}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Total Views</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: 700, color: '#1C1C1E' }}>{stats.totalViews.toLocaleString()}</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Users</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '28px', fontWeight: 700, color: '#1C1C1E' }}>{stats.totalUsers}</div>
            </div>

          </div>

          {/* Most Viewed + Recently Added */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>

            {stats.mostViewed && (
              <div style={{ background: '#EDF7F1', border: '1px solid #C8E8D5', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Most Viewed</div>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '2px' }}>{stats.mostViewed.title}</div>
                <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#1A7A4A' }}>{stats.mostViewed.views?.toLocaleString()} views</div>
              </div>
            )}

            {stats.recentlyAdded && (
              <div style={{ background: '#F5F4F0', border: '1px solid #DEDAD3', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Recently Added</div>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '2px' }}>{stats.recentlyAdded.title}</div>
                <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#888' }}>{stats.recentlyAdded['categories!timelines_category_id_fkey']?.name}</div>
              </div>
            )}

          </div>

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
                  <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#2A5298', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{t['categories!timelines_category_id_fkey']?.name}</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '3px' }}>{t.title}</div>
                  <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#888' }}>{t.description}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Admin's Pick toggle */}
                  <button
                    onClick={() => handleToggleFlag(t.id, 'is_admins_pick', t.is_admins_pick)}
                    title={t.is_admins_pick ? "Remove from Admin's Pick" : "Add to Admin's Pick"}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '16px' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={t.is_admins_pick ? '#F5A623' : 'none'} stroke={t.is_admins_pick ? '#F5A623' : '#ccc'} strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>

                  {/* Live toggle */}
                  <button
                    onClick={() => handleToggleFlag(t.id, 'is_live', t.is_live)}
                    title={t.is_live ? 'Mark as not Live' : 'Mark as Live'}
                    style={{ fontFamily: 'Arial,sans-serif', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', border: `1px solid ${t.is_live ? '#FF2020' : '#DEDAD3'}`, color: t.is_live ? '#FF2020' : '#aaa', background: t.is_live ? '#FFF0F0' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.is_live ? '#FF2020' : '#ccc' }} />
                    {t.is_live ? 'ACTIVE' : 'Live'}
                  </button>

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
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      const content = ev.target?.result as string;
                      setJsonInput(content);
                      setExistingTimelineFound(false);
                      setParsedJson(null);
                      setUpdateMode(false);
                      setImportMessage('');

                      try {
                        const parsed = JSON.parse(content);
                        setParsedJson(parsed);

                        if (parsed.title) {
                          // Check if timeline already exists
                          const { data: existing } = await supabase
                            .from('timelines')
                            .select('id, title')
                            .eq('title', parsed.title)
                            .maybeSingle();

                          if (existing) {
                            setExistingTimelineFound(true);
                            setImportMessage('⚠️ "' + parsed.title + '" already exists. Click "Check for Updates" to find new events.');
                          } else {
                            setImportMessage('✅ Ready to import: ' + parsed.title + ' · ' + (parsed.events?.length || 0) + ' events · Category: ' + parsed.category);
                          }
                        } else if (parsed.timeline_title) {
                          setExistingTimelineFound(true);
                          setImportMessage('⚠️ Update mode detected for "' + parsed.timeline_title + '". Click "Check for Updates".');
                        }
                      } catch {
                        setImportMessage('❌ Invalid JSON file.');
                      }
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
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: importMessage.startsWith('✅') ? '#1A7A4A' : importMessage.startsWith('⚠️') ? '#B87A00' : '#B83232', marginBottom: '12px', padding: '10px', background: importMessage.startsWith('✅') ? '#EDF7F1' : importMessage.startsWith('⚠️') ? '#FFFBE6' : '#FDF0F0', borderRadius: '4px' }}>{importMessage}</div>
            )}

            {/* Update Mode Preview */}
            {updateMode && (
              <div style={{ background: '#FFFBE6', border: '1px solid #FFD700', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', marginBottom: '6px' }}>Update timeline:</div>
                  <select
                    value={updateTimeline?.id || ''}
                    onChange={async e => {
                      const selected = timelines.find((t: any) => t.id === Number(e.target.value));
                      setUpdateTimeline(selected || null);
                      if (selected) await previewUpdateEvents(selected.id, updateEvents);
                    }}
                    style={{ width: '100%', fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '7px 10px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#fff', outline: 'none', marginBottom: '8px' }}
                  >
                    <option value="">Select timeline...</option>
                    {timelines.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {updateTimeline && (
                  <>
                    <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#555', marginBottom: '8px' }}>
                      <strong>{updatePreview.length} new events</strong> to add
                      {updateSkipped > 0 && <span style={{ color: '#aaa' }}> · {updateSkipped} duplicate{updateSkipped > 1 ? 's' : ''} skipped</span>}
                    </div>

                    {updatePreview.length > 0 ? (
                      <div style={{ marginBottom: '12px' }}>
                        {updatePreview.map((ev: any, i: number) => (
                          <div key={i} style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#555', padding: '4px 0', borderBottom: '1px solid #F0ECC0', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#aaa', flexShrink: 0 }}>{ev.year}</span>
                            <span>{ev.title || ev.description}</span>
                            <span style={{ marginLeft: 'auto', color: ev.side === 'positive' ? '#1A7A4A' : '#B83232', flexShrink: 0 }}>{ev.side === 'positive' ? '▲' : '▼'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa', marginBottom: '12px' }}>No new events to add — all events already exist.</div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setUpdateMode(false); setUpdatePreview([]); setUpdateTimeline(null); setImportMessage(''); }}
                        style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '7px 16px', borderRadius: '4px', border: '1px solid #DEDAD3', background: '#fff', color: '#555', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      {updatePreview.length > 0 && (
                        <button
                          onClick={handleUpdateTimeline}
                          disabled={updateConfirming}
                          style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '7px 16px', borderRadius: '4px', border: 'none', background: updateConfirming ? '#aaa' : '#1A7A4A', color: '#fff', cursor: updateConfirming ? 'not-allowed' : 'pointer' }}
                        >
                          {updateConfirming ? 'Adding...' : `Add ${updatePreview.length} Events`}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
              <button
                onClick={async () => {
                  if (existingTimelineFound && parsedJson) {
                    await handleUpdateMode({
                      timeline_title: parsedJson.title || parsedJson.timeline_title,
                      events: parsedJson.events || [],
                    });
                  } else {
                    handleJsonImport();
                  }
                }}
                disabled={importing || !jsonInput.trim()}
                style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', fontWeight: 600, padding: '10px 24px', borderRadius: '4px', background: importing || !jsonInput.trim() ? '#aaa' : existingTimelineFound ? '#2A5298' : '#1A7A4A', color: '#fff', border: 'none', cursor: importing || !jsonInput.trim() ? 'not-allowed' : 'pointer' }}
              >
                {importing ? 'Checking...' : existingTimelineFound ? 'Check for Updates' : 'Import Timeline'}
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

            {/* Bulk Import Section */}
            <div style={{ borderTop: '1px solid #DEDAD3', paddingTop: '20px' }}>
              <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '14px', fontWeight: 700, color: '#1C1C1E', marginBottom: '6px' }}>Bulk Import</div>
              <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '12px' }}>Select multiple JSON files at once — each file must contain one timeline. All will be imported automatically.</p>

              <input
                type="file"
                accept=".json"
                multiple
                onChange={async e => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;

                  setBulkImporting(true);
                  setBulkResults([]);

                  const results: string[] = [];

                  for (const file of files) {
                    try {
                      const content = await file.text();
                      const parsed = JSON.parse(content);

                      // Get category
                      const { data: catData } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('name', parsed.category)
                        .single();

                      if (!catData) {
                        results.push(`❌ ${file.name} — Category not found: ${parsed.category}`);
                        continue;
                      }

                      // Insert timeline
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
                        results.push(`❌ ${file.name} — Error: ${tlError.message}`);
                        continue;
                      }

                      // Insert events
                      const events = parsed.events.map((ev: any) => ({
                        timeline_id: tlData.id,
                        year: ev.year,
                        title: ev.title,
                        description: ev.description,
                        side: ev.side,
                        details: ev.details || null,
                      }));

                      const { error: evError } = await supabase
                        .from('events')
                        .insert(events);

                      if (evError) {
                        results.push(`❌ ${file.name} — Events error: ${evError.message}`);
                      } else {
                        results.push(`✅ ${parsed.title} — ${events.length} events imported`);
                      }

                    } catch (err) {
                      results.push(`❌ ${file.name} — Invalid JSON format`);
                    }
                  }

                  setBulkResults(results);
                  setBulkImporting(false);
                  loadTimelines();
                  e.target.value = '';
                }}
                style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#555', marginBottom: '12px' }}
              />

              {bulkImporting && (
                <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#2A5298', marginBottom: '10px' }}>⏳ Importing... please wait</div>
              )}

              {bulkResults.length > 0 && (
                <div style={{ background: '#F5F4F0', border: '1px solid #DEDAD3', borderRadius: '6px', padding: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                  <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 700, color: '#555', marginBottom: '8px' }}>
                    Import Results — {bulkResults.filter(r => r.startsWith('✅')).length} succeeded · {bulkResults.filter(r => r.startsWith('❌')).length} failed
                  </div>
                  {bulkResults.map((r, i) => (
                    <div key={i} style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: r.startsWith('✅') ? '#1A7A4A' : '#B83232', marginBottom: '4px' }}>{r}</div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}