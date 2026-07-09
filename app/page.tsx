'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import TimelineCard from './components/TimelineCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categories = ["All", "Person", "Country", "Disaster", "Invention", "Sports", "Movement", "Politics & Leadership", "Other"];

export default function Home() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<any[]>([]);
  const [adminsPick, setAdminsPick] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Featured — top 8 by views
    const { data: featuredData } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .order('views', { ascending: false })
      .limit(8);

    // Recently Added — latest 4
    const { data: recentData } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(4);

    // Admin's Pick
    const { data: picksData } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .eq('is_admins_pick', true)
      .limit(4);

    // Live Timelines
    const { data: liveData } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .eq('is_live', true);

    // All events for counts
    const { data: evData } = await supabase
      .from('events')
      .select('timeline_id, side');

    setFeatured(featuredData || []);
    setRecentlyAdded(recentData || []);
    setAdminsPick(picksData || []);
    setLive(liveData || []);
    setEvents(evData || []);
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

  const sectionHead = (label: string, link: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <a href={link} style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 600, padding: '3px 12px', borderRadius: '20px', border: '1px solid #DEDAD3', background: '#fff', color: '#555', textDecoration: 'none' }}>Discover more →</a>
    </div>
  );

  const grid8: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '0',
  };

  const grid4: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  };

  const divider = (
    <div style={{ height: '1px', background: '#DEDAD3', margin: '20px 0 16px' }} />
  );

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid #DEDAD3', padding: '28px 20px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A5298', marginBottom: '8px' }}>The chronology of everything</p>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Every story has a timeline.</h1>
        <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#555', marginBottom: '16px' }}>Browse timelines for people, places, events, inventions, disasters and more.</p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px', maxWidth: '400px', margin: '0 auto 14px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search any person, place, event…"
            style={{ flex: 1, fontFamily: 'Arial,sans-serif', fontSize: '12px', padding: '8px 12px', border: '1px solid #DEDAD3', borderRadius: '4px', background: '#F5F4F0', color: '#1C1C1E', outline: 'none' }}
          />
          <button type="submit" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', fontWeight: 600, padding: '8px 16px', borderRadius: '4px', background: '#2A5298', color: '#fff', border: 'none', cursor: 'pointer' }}>Search</button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
          {categories.map((cat, i) => (
            <button
              key={cat}
              onClick={() => window.location.href = cat === 'All' ? '/browse' : '/browse?cat=' + encodeURIComponent(cat)}
              style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', border: '1px solid #DEDAD3', background: i === 0 ? '#2A5298' : '#fff', color: i === 0 ? '#fff' : '#555', cursor: 'pointer' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 16px 32px', maxWidth: '900px', margin: '0 auto' }}>

        {loading ? (
          <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', color: '#888', textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <>
            {/* Section 1 — Featured Timelines */}
            {sectionHead('Featured Timelines', '/browse')}
            <div style={{ ...grid8, gridTemplateRows: 'repeat(2, 1fr)', marginBottom: '8px' }}>
              {featured.map((t: any) => (
                <TimelineCard key={t.id} t={t} posCount={getPos(t.id)} negCount={getNeg(t.id)} />
              ))}
            </div>

            {divider}

            {/* Section 2 — Recently Added */}
            {sectionHead('Recently Added', '/browse')}
            <div style={grid4}>
              {recentlyAdded.map((t: any) => (
                <TimelineCard key={t.id} t={t} posCount={getPos(t.id)} negCount={getNeg(t.id)} />
              ))}
            </div>

            {/* Section 3 — Admin's Pick */}
            {adminsPick.length > 0 && (
              <>
                {divider}
                {sectionHead("Admin's Pick", '/browse')}
                <div style={grid4}>
                  {adminsPick.map((t: any) => (
                    <TimelineCard key={t.id} t={t} posCount={getPos(t.id)} negCount={getNeg(t.id)} />
                  ))}
                </div>
              </>
            )}

            {/* Section 4 — Live Timelines */}
            {live.length > 0 && (
              <>
                {divider}
                {sectionHead('Live Timelines', '/browse')}
                <div style={grid4}>
                  {live.map((t: any) => (
                    <TimelineCard key={t.id} t={t} posCount={getPos(t.id)} negCount={getNeg(t.id)} />
                  ))}
                </div>
              </>
            )}

          </>
        )}

      </div>

      <footer style={{ background: '#fff', borderTop: '1px solid #DEDAD3', textAlign: 'center', padding: '12px', fontFamily: 'Arial,sans-serif', fontSize: '9px', color: '#bbb', marginTop: '16px' }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}