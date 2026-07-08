'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from "./components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categories = ["All", "Person", "Country", "Disaster", "Invention", "Sports", "Movement", "Politics & Leadership", "Other"];

export default function Home() {
  const [timelines, setTimelines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: tl } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name)')
      .order('views', { ascending: false });

    const { data: ev } = await supabase
      .from('events')
      .select('timeline_id, side');

    setTimelines(tl || []);
    setEvents(ev || []);
    setLoading(false);
  };

  const getPos = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'positive').length;
  const getNeg = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'negative').length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = '/browse?q=' + encodeURIComponent(search.trim());
    } else {
      window.location.href = '/browse';
    }
  };

  const featured = timelines.slice(0, 4);
  const trending = timelines.slice(4, 6);

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #DEDAD3", padding: "36px 24px 28px", textAlign: "center" }}>
        <p style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2A5298", marginBottom: "10px" }}>The chronology of everything</p>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: "26px", fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "10px" }}>Every story has a timeline.</h1>
        <p style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "20px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
          Browse timelines for people, places, events, inventions, disasters and more. Simple. Free. Forever.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", maxWidth: "460px", margin: "0 auto 20px" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search any person, place, event…"
            style={{ flex: 1, fontFamily: "Arial,sans-serif", fontSize: "13px", padding: "10px 14px", border: "1px solid #DEDAD3", borderRadius: "4px", background: "#F5F4F0", color: "#1C1C1E", outline: "none" }}
          />
          <button type="submit" style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", fontWeight: 600, padding: "10px 20px", borderRadius: "4px", background: "#2A5298", color: "#fff", border: "none", cursor: "pointer" }}>Search</button>
        </form>

        {/* Categories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
          {categories.map((cat, i) => (
            <button
              key={cat}
              onClick={() => window.location.href = cat === 'All' ? '/browse' : '/browse?cat=' + encodeURIComponent(cat)}
              style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px", border: "1px solid #DEDAD3", background: i === 0 ? "#2A5298" : "#fff", color: i === 0 ? "#fff" : "#555", cursor: "pointer" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 20px 40px", maxWidth: "960px", margin: "0 auto" }}>

        {/* Featured */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>Featured Timelines</span>
          <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#2A5298", textDecoration: "none" }}>See all →</a>
        </div>

        {loading ? (
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#888", padding: "20px", textAlign: "center" }}>Loading...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px", marginBottom: "28px" }}>
            {featured.map((t: any) => (
              <a key={t.id} href={"/timeline/" + t.id} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298", marginBottom: "4px" }}>{t.categories?.name}</div>
                  <h3 style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "4px", lineHeight: 1.3 }}>{t.title}</h3>
                  <p style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, marginBottom: "8px" }}>{t.description}</p>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#EDF7F1", color: "#1A7A4A" }}>▲ {getPos(t.id)} events</span>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#FDF0F0", color: "#B83232" }}>▼ {getNeg(t.id)} events</span>
                  </div>
                  <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#aaa" }}>by community</div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div style={{ height: "1px", background: "#DEDAD3", marginBottom: "24px" }} />

        {/* Trending */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>Trending This Week</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
          {trending.map((t: any) => (
            <a key={t.id} href={"/timeline/" + t.id} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298", marginBottom: "4px" }}>{t.categories?.name}</div>
                <h3 style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "4px" }}>{t.title}</h3>
                <p style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, marginBottom: "8px" }}>{t.description}</p>
                <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#EDF7F1", color: "#1A7A4A" }}>▲ {getPos(t.id)} events</span>
                  <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#FDF0F0", color: "#B83232" }}>▼ {getNeg(t.id)} events</span>
                </div>
                <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#aaa" }}>by community · {t.views?.toLocaleString()} views</div>
              </div>
            </a>
          ))}
          <div style={{ background: "#FAFAF8", border: "1px dashed #DEDAD3", borderRadius: "6px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "120px" }}>
            <div>
              <div style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>More timelines coming soon</div>
              <div style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#bbb" }}>Login to create your own</div>
            </div>
          </div>
        </div>

      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}