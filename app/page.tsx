'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import TimelineCard from './components/TimelineCard';
import { useIsMobile } from './lib/useIsMobile';
import SearchAutocomplete from './components/SearchAutocomplete';

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
  const isMobile = useIsMobile();

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
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: isMobile ? '6px' : '8px',
    marginBottom: '0',
  };

  const grid4: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: isMobile ? '6px' : '8px',
  };

  const divider = (
    <div style={{ height: '1px', background: '#DEDAD3', margin: '20px 0 16px' }} />
  );

  return (
    <main>
      <Navbar />

      {/* Hero Banner */}
      <div style={{ background: '#0B1120', width: '100%' }}>
        <div style={{ maxWidth: isMobile ? '100%' : '960px', margin: '0 auto', position: 'relative', height: isMobile ? 'auto' : '299px', overflow: 'hidden' }}>
          <img
            src={isMobile ? '/tlw_hero_mobile.png' : '/tlw_hero_desktop.png'}
            alt="Timelines World — The Chronology of Everything"
            style={{ width: '100%', height: isMobile ? 'auto' : '100%', objectFit: isMobile ? 'contain' : 'cover', objectPosition: 'center', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: isMobile ? '0 16px 16px' : '0 20px 20px' }}>
            <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '440px', marginBottom: '10px' }}>
              <SearchAutocomplete
                onSearch={q => {
                  if (q.trim()) window.location.href = '/browse?q=' + encodeURIComponent(q.trim());
                  else window.location.href = '/browse';
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', maxWidth: isMobile ? '100%' : '600px' }}>
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => window.location.href = cat === 'All' ? '/browse' : '/category/' + encodeURIComponent(cat)}
                  style={{ fontFamily: 'Arial,sans-serif', fontSize: isMobile ? '8px' : '9px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)', background: i === 0 ? '#E53E3E' : 'rgba(0,0,0,0.35)', color: '#fff', cursor: 'pointer' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
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