'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../../components/Navbar';
import ShareButtons from '../../components/ShareButtons';
import FavouriteHeart from '../../components/FavouriteHeart';
import { linkifyText, parseBold } from '../../lib/linkify';
import SpeedDial from '../../components/SpeedDial';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [t, setT] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [allTimelines, setAllTimelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [oldestFirst, setOldestFirst] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editYear, setEditYear] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSide, setEditSide] = useState<'positive' | 'negative'>('positive');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const timelineId = pathParts[pathParts.length - 1];
    console.log('isAdmin check:', isAdmin);
    console.log('Timeline ID from URL:', timelineId);
    setId(timelineId);
    loadAll(timelineId);
  }, []);

  const loadAll = async (timelineId: string) => {
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    // Load user preference + admin check
    if (session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('timeline_order, role')
        .eq('id', session.user.id)
        .single();
      
      if (userData?.timeline_order === 'oldest') setOldestFirst(true);
      if (userData?.role === 'admin') setIsAdmin(true);
    }

    // Load timeline
    const { data: tl, error: tlError } = await supabase
      .from('timelines')
      .select('*')
      .eq('id', timelineId)
      .single();

    
    // Load primary category
    if (tl?.category_id) {
      const { data: cat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', tl.category_id)
        .single();
      if (cat) tl.categories = cat;
    }

    // Load secondary category
    if (tl?.secondary_category_id) {
      const { data: secCat } = await supabase
        .from('categories')
        .select('name')
        .eq('id', tl.secondary_category_id)
        .single();
      if (secCat) tl.secondary_category = secCat;
    }
    
    
    
    setT(tl);

    // Load events
    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('timeline_id', timelineId);

    const sorted = (ev || []).sort((a: any, b: any) => {
      const dateA = new Date(a.year);
      const dateB = new Date(b.year);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) return dateA.getTime() - dateB.getTime();
      return 0;
    });

    setEvents(sorted);

    // Related timelines — match primary OR secondary category first
    if (tl) {
      const { data: samePrimary } = await supabase
        .from('timelines')
        .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
        .eq('category_id', tl.category_id)
        .neq('id', timelineId)
        .limit(3);

      const existingIds = (samePrimary || []).map((t: any) => t.id);
      existingIds.push(Number(timelineId));

      let relatedList = [...(samePrimary || [])];

      if (relatedList.length < 3 && tl.secondary_category_id) {
        const { data: secMatch } = await supabase
          .from('timelines')
          .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
          .eq('category_id', tl.secondary_category_id)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .limit(3 - relatedList.length);

        relatedList = [...relatedList, ...(secMatch || [])];
        existingIds.push(...(secMatch || []).map((t: any) => t.id));
      }

      if (relatedList.length < 3) {
        const { data: others } = await supabase
          .from('timelines')
          .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
          .not('id', 'in', `(${existingIds.join(',')})`)
          .order('views', { ascending: false })
          .limit(3 - relatedList.length);

        relatedList = [...relatedList, ...(others || [])];
      }

      setRelated(relatedList);
    }

    // Load all timeline titles for hyperlinking
    const { data: allTl } = await supabase
      .from('timelines')
      .select('id, title')
      .neq('id', timelineId);
    setAllTimelines(allTl || []);

    // Increment views
    await supabase.rpc('increment_views', { timeline_id: Number(timelineId) });

    setLoading(false);
  };
const handleEditSave = async (eventId: number) => {
    setEditSaving(true);
    await supabase
      .from('events')
      .update({
        year: editYear,
        title: editTitle || null,
        description: editDesc,
        side: editSide,
      })
      .eq('id', eventId);
    setEditingEventId(null);
    setEditSaving(false);
    loadAll(id);
  };

  const startEdit = (ev: any) => {
    setEditingEventId(ev.id);
    setEditYear(ev.year);
    setEditTitle(ev.title || '');
    setEditDesc(ev.description);
    setEditSide(ev.side);
  };
  const handleToggle = async () => {
    const newOrder = oldestFirst ? 'newest' : 'oldest';
    setOldestFirst(!oldestFirst);

    // Save preference if logged in
    if (user) {
      await supabase
        .from('users')
        .update({ timeline_order: newOrder })
        .eq('id', user.id);
    }
  };

  if (loading) return (
    <main>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'Arial,sans-serif', textAlign: 'center', color: '#888' }}>Loading...</div>
    </main>
  );

  if (!t) return (
    <main>
      <Navbar />
      <div style={{ padding: '40px', fontFamily: 'Arial,sans-serif', textAlign: 'center' }}>Timeline not found.</div>
    </main>
  );

  const posCount = events.filter(e => e.side === 'positive').length;
  const negCount = events.filter(e => e.side === 'negative').length;
  const displayEvents = oldestFirst ? [...events] : [...events].reverse();

  return (
    <main>
      <Navbar />

      <div style={{ padding: "0 24px 40px", maxWidth: "780px", margin: "0 auto" }}>

        {/* Back */}
        <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#2A5298", textDecoration: "none", padding: "14px 0 10px", display: "block" }}>← All timelines</a>

        {/* Header Card */}
        <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "8px", padding: "18px 20px", marginBottom: "24px", position: "relative" }}>
          <div style={{ position: "absolute", top: "16px", right: "16px" }}>
            <FavouriteHeart timelineId={Number(id)} />
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298" }}>{t.categories?.name}</span>
            {t.secondary_category?.name && (
              <>
                <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", color: "#2A5298", opacity: 0.4 }}>|</span>
                <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298" }}>{t['secondary_category']?.name}</span>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", paddingRight: "32px" }}>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: "22px", fontWeight: 700, color: "#1C1C1E", lineHeight: 1.2, margin: 0 }}>{t.title}</h1>
            {t.is_admins_pick && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#F5A623" stroke="#F5A623" strokeWidth="1.5" style={{ flexShrink: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            )}
          </div>
          <p style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "10px" }}>{t.description}</p>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#aaa", marginBottom: "12px" }}>
            {events.length} events · {posCount} ▲ · {negCount} ▼ · by community
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShareButtons title={t.title} id={id} />
              {t.is_live && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF2020", flexShrink: 0 }} />
                  <span style={{ fontFamily: "Arial,sans-serif", fontSize: "14px", fontWeight: 400, color: "#FF2020", letterSpacing: "0.05em" }}>ACTIVE</span>
                </div>
              )}
            </div>
            <div style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}>
              {t.views?.toLocaleString()} views
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px", marginTop: "-18px" }}>
          <button
            onClick={handleToggle}
            style={{
              fontFamily: "Arial,sans-serif",
              fontSize: "11px",
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: "4px",
              border: "1px solid #DEDAD3",
              background: "#fff",
              color: "#555",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {oldestFirst ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '7px solid #1C1C1E',
                }} />
                Oldest first
              </>
            ) : (
              <>
                <span style={{
                  display: 'inline-block',
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '7px solid #1C1C1E',
                }} />
                Newest first
              </>
            )}
          </button>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "50%", top: oldestFirst ? "52px" : "0", width: "2px", background: "#C8C4BC", transform: "translateX(-50%)", bottom: oldestFirst ? "0" : "42px", zIndex: 0 }} />

          {/* Origin dot at TOP when oldest first */}
          {oldestFirst && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2, paddingBottom: "6px" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "10px", whiteSpace: "nowrap" }}>{t.title}</div>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#1C1C1E", boxShadow: "0 0 0 4px #F5F4F0, 0 0 0 6px #1C1C1E" }} />
            </div>
          )}

          {/* Events */}
          {displayEvents.map((ev: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", width: "100%", position: "relative", marginBottom: "28px", minHeight: "85px", zIndex: 1 }}>

              {/* LEFT HALF */}
              <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "12px" }}>
                {ev.side === "negative" && (editingEventId === ev.id ? (
                  <div style={{ background: "#FDF0F0", border: "1px solid #F0D4D4", borderRadius: "10px", padding: "14px 16px", maxWidth: "260px" }}>
                    <input value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Year" style={{ width: "100%", fontFamily: "Arial,sans-serif", fontSize: "11px", padding: "5px 8px", border: "1px solid #F0D4D4", borderRadius: "4px", marginBottom: "6px", outline: "none" }} />
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title (optional)" style={{ width: "100%", fontFamily: "Arial,sans-serif", fontSize: "11px", padding: "5px 8px", border: "1px solid #F0D4D4", borderRadius: "4px", marginBottom: "6px", outline: "none" }} />
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" rows={3} style={{ width: "100%", fontFamily: "Arial,sans-serif", fontSize: "11px", padding: "5px 8px", border: "1px solid #F0D4D4", borderRadius: "4px", marginBottom: "6px", outline: "none", resize: "vertical" }} />
                    <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                      <button onClick={() => setEditSide('positive')} style={{ flex: 1, fontSize: "10px", padding: "4px", borderRadius: "4px", border: `1px solid ${editSide === 'positive' ? '#1A7A4A' : '#ddd'}`, background: editSide === 'positive' ? '#EDF7F1' : '#fff', color: editSide === 'positive' ? '#1A7A4A' : '#888', cursor: "pointer" }}>▲ Positive</button>
                      <button onClick={() => setEditSide('negative')} style={{ flex: 1, fontSize: "10px", padding: "4px", borderRadius: "4px", border: `1px solid ${editSide === 'negative' ? '#B83232' : '#ddd'}`, background: editSide === 'negative' ? '#FDF0F0' : '#fff', color: editSide === 'negative' ? '#B83232' : '#888', cursor: "pointer" }}>▼ Negative</button>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => setEditingEventId(null)} style={{ flex: 1, fontSize: "10px", padding: "5px", borderRadius: "4px", border: "1px solid #ddd", background: "#fff", color: "#555", cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => handleEditSave(ev.id)} disabled={editSaving} style={{ flex: 1, fontSize: "10px", padding: "5px", borderRadius: "4px", border: "none", background: editSaving ? "#aaa" : "#B83232", color: "#fff", cursor: "pointer" }}>{editSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ background: "#FDF0F0", border: "1px solid #F0D4D4", borderRadius: "10px", padding: "14px 16px", textAlign: "right", maxWidth: "260px", position: "relative", cursor: "default" }}
                    onMouseEnter={e => { e.currentTarget.querySelectorAll('.hover-btn').forEach((b: any) => b.style.opacity = '1'); }}
                    onMouseLeave={e => { e.currentTarget.querySelectorAll('.hover-btn').forEach((b: any) => b.style.opacity = '0'); }}
                  >
                    <button className="hover-btn" title="Copy" onClick={() => { const text = `${ev.year}${ev.title ? ' — ' + ev.title : ''}\n${ev.details ? ev.details.join('\n') : ev.description}`; navigator.clipboard.writeText(text); const btn = document.activeElement as HTMLElement; if (btn) btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>'; setTimeout(() => { if (btn) btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B83232" strokeWidth="1.5" strokeOpacity="0.6"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'; }, 2000); }} style={{ position: "absolute", top: "8px", left: "8px", background: "none", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.2s", padding: "2px", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B83232" strokeWidth="1.5" strokeOpacity="0.6"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    {isAdmin && (<button className="hover-btn" title="Edit" onClick={() => startEdit(ev)} style={{ position: "absolute", top: "8px", left: "30px", background: "none", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.2s", padding: "2px", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B83232" strokeWidth="1.5" strokeOpacity="0.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>)}
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "5px" }}>{ev.title}</span>
                    {ev.details && ev.details.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {ev.details.map((d: string, di: number) => (<div key={di} style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5 }}>{parseBold(d)}</div>))}
                      </div>
                    ) : (
                      <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, display: "block" }}>{linkifyText(ev.description, allTimelines)}</span>
                    )}
                  </div>
                ))}
                {ev.side === "negative" && <div style={{ height: "1px", background: "#F0D4D4", width: "20px", flexShrink: 0 }} />}
              </div>

              {/* DOT */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "16px", height: "16px", borderRadius: "50%", background: ev.side === "positive" ? "#1A7A4A" : "#B83232", boxShadow: ev.side === "positive" ? "0 0 0 3px #F5F4F0, 0 0 0 4.5px #1A7A4A" : "0 0 0 3px #F5F4F0, 0 0 0 4.5px #B83232", zIndex: 3 }} />

              {/* DATE */}
              {ev.side === "negative" && (
                <div style={{ position: "absolute", left: "calc(50% + 13px)", top: "50%", transform: "translateY(-50%)", fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 700, color: "#666", whiteSpace: "nowrap", zIndex: 2, paddingLeft: "4px" }}>{ev.year}</div>
              )}
              {ev.side === "positive" && (
                <div style={{ position: "absolute", right: "calc(50% + 13px)", top: "50%", transform: "translateY(-50%)", fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 700, color: "#666", whiteSpace: "nowrap", zIndex: 2, paddingRight: "4px" }}>{ev.year}</div>
              )}

              {/* RIGHT HALF */}
              <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: "12px" }}>
                {ev.side === "positive" && <div style={{ height: "1px", background: "#C8E8D5", width: "20px", flexShrink: 0 }} />}
                {ev.side === "positive" && (editingEventId === ev.id ? (
                  <div style={{ background: "#EDF7F1", border: "1px solid #C8E8D5", borderRadius: "10px", padding: "14px 16px", maxWidth: "260px" }}>
                    <input value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Year" style={{ width: "100%", fontFamily: "Arial,sans-serif", fontSize: "11px", padding: "5px 8px", border: "1px solid #C8E8D5", borderRadius: "4px", marginBottom: "6px", outline: "none" }} />
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title (optional)" style={{ width: "100%", fontFamily: "Arial,sans-serif", fontSize: "11px", padding: "5px 8px", border: "1px solid #C8E8D5", borderRadius: "4px", marginBottom: "6px", outline: "none" }} />
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" rows={3} style={{ width: "100%", fontFamily: "Arial,sans-serif", fontSize: "11px", padding: "5px 8px", border: "1px solid #C8E8D5", borderRadius: "4px", marginBottom: "6px", outline: "none", resize: "vertical" }} />
                    <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                      <button onClick={() => setEditSide('positive')} style={{ flex: 1, fontSize: "10px", padding: "4px", borderRadius: "4px", border: `1px solid ${editSide === 'positive' ? '#1A7A4A' : '#ddd'}`, background: editSide === 'positive' ? '#EDF7F1' : '#fff', color: editSide === 'positive' ? '#1A7A4A' : '#888', cursor: "pointer" }}>▲ Positive</button>
                      <button onClick={() => setEditSide('negative')} style={{ flex: 1, fontSize: "10px", padding: "4px", borderRadius: "4px", border: `1px solid ${editSide === 'negative' ? '#B83232' : '#ddd'}`, background: editSide === 'negative' ? '#FDF0F0' : '#fff', color: editSide === 'negative' ? '#B83232' : '#888', cursor: "pointer" }}>▼ Negative</button>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => setEditingEventId(null)} style={{ flex: 1, fontSize: "10px", padding: "5px", borderRadius: "4px", border: "1px solid #ddd", background: "#fff", color: "#555", cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => handleEditSave(ev.id)} disabled={editSaving} style={{ flex: 1, fontSize: "10px", padding: "5px", borderRadius: "4px", border: "none", background: editSaving ? "#aaa" : "#1A7A4A", color: "#fff", cursor: "pointer" }}>{editSaving ? 'Saving...' : 'Save'}</button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ background: "#EDF7F1", border: "1px solid #C8E8D5", borderRadius: "10px", padding: "14px 16px", textAlign: "left", maxWidth: "260px", position: "relative", cursor: "default" }}
                    onMouseEnter={e => { e.currentTarget.querySelectorAll('.hover-btn').forEach((b: any) => b.style.opacity = '1'); }}
                    onMouseLeave={e => { e.currentTarget.querySelectorAll('.hover-btn').forEach((b: any) => b.style.opacity = '0'); }}
                  >
                    <button className="hover-btn" title="Copy" onClick={() => { const text = `${ev.year}${ev.title ? ' — ' + ev.title : ''}\n${ev.details ? ev.details.join('\n') : ev.description}`; navigator.clipboard.writeText(text); const btn = document.activeElement as HTMLElement; if (btn) btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>'; setTimeout(() => { if (btn) btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="1.5" strokeOpacity="0.6"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'; }, 2000); }} style={{ position: "absolute", top: "8px", right: "30px", background: "none", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.2s", padding: "2px", display: "flex", alignItems: "center" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="1.5" strokeOpacity="0.6"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    {isAdmin && (<button className="hover-btn" title="Edit" onClick={() => startEdit(ev)} style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", opacity: 0, transition: "opacity 0.2s", padding: "2px", display: "flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="1.5" strokeOpacity="0.6"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>)}
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "5px" }}>{ev.title}</span>
                    {ev.details && ev.details.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {ev.details.map((d: string, di: number) => (<div key={di} style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5 }}>{parseBold(d)}</div>))}
                      </div>
                    ) : (
                      <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, display: "block" }}>{linkifyText(ev.description, allTimelines)}</span>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ))}

          {/* Origin dot at BOTTOM when newest first */}
          {!oldestFirst && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2, paddingBottom: "20px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#1C1C1E", boxShadow: "0 0 0 4px #F5F4F0, 0 0 0 6px #1C1C1E" }} />
              <div style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginTop: "14px", whiteSpace: "nowrap" }}>{t.title}</div>
            </div>
          )}

        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ paddingTop: "24px" }}>
            <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Related Timelines</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {related.map((r: any) => (
                <a key={r.id} href={"/timeline/" + r.id} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "10px 12px", cursor: "pointer" }}>
                    <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, color: "#2A5298", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>{r.categories?.name}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "12px", fontWeight: 700, color: "#1C1C1E" }}>{r.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb", marginTop: "24px" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    <SpeedDial timelineId={Number(id)} onEventAdded={() => loadAll(id)} />

    </main>
  );
}