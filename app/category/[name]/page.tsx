'use client';
import { useIsMobile } from '../../lib/useIsMobile';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../../components/Navbar';
import TimelineCard from '../../components/TimelineCard';

const isMobile = useIsMobile();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categoryDescriptions: Record<string, string> = {
  'Person': 'Timelines about remarkable people who shaped history.',
  'Country': 'Timelines tracing the history of nations and civilisations.',
  'Disaster': 'Timelines of natural and man-made disasters.',
  'Invention': 'Timelines of inventions and innovations that changed the world.',
  'War & Conflict': 'Timelines of wars, battles and conflicts throughout history.',
  'Sports': 'Timelines of sporting events, tournaments and athletes.',
  'Politics & Leadership': 'Timelines of political movements and leaders.',
  'Entertainment': 'Timelines of film, music, art and culture.',
  'Business & Economy': 'Timelines of companies, industries and economic events.',
  'Monument & Wonder': 'Timelines of architectural and natural wonders.',
  'Movement & Revolution': 'Timelines of social movements and revolutions.',
  'Science & Discovery': 'Timelines of scientific breakthroughs and discoveries.',
  'Nature & Environment': 'Timelines of nature, ecology and environmental events.',
  'Other': 'Timelines that defy easy categorisation.',
};

export default function CategoryPage() {
  const [name, setName] = useState('');
  const [timelines, setTimelines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const rawName = pathParts[pathParts.length - 1];
    const decodedName = decodeURIComponent(rawName);
    setName(decodedName);
    loadData(decodedName);
  }, []);

  const loadData = async (categoryName: string) => {
    setLoading(true);

    // Get category id
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryName)
      .single();

    if (!catData) {
      setLoading(false);
      return;
    }

    // Get timelines where primary OR secondary category matches
    const { data: primary } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .eq('category_id', catData.id)
      .order('views', { ascending: false });

    const { data: secondary } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .eq('secondary_category_id', catData.id)
      .order('views', { ascending: false });

    // Merge and deduplicate
    const primaryIds = (primary || []).map((t: any) => t.id);
    const uniqueSecondary = (secondary || []).filter((t: any) => !primaryIds.includes(t.id));
    const all = [...(primary || []), ...uniqueSecondary];

    // Get events for counts
    const ids = all.map((t: any) => t.id);
    if (ids.length > 0) {
      const { data: evData } = await supabase
        .from('events')
        .select('timeline_id, side')
        .in('timeline_id', ids);
      setEvents(evData || []);
    }

    setTimelines(all);
    setLoading(false);
  };

  const getPos = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'positive').length;
  const getNeg = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'negative').length;

  const displayName = decodeURIComponent(name);
  const description = categoryDescriptions[displayName] || 'Timelines in this category.';

  return (
    <main>
      <Navbar />

      <div style={{ padding: '0 20px 40px', maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #DEDAD3', marginBottom: '24px' }}>
          <a href="/browse" style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#2A5298', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>← All timelines</a>
          <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2A5298', marginBottom: '6px' }}>Category</div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '22px', fontWeight: 700, color: '#1C1C1E', marginBottom: '6px' }}>{displayName}</h1>
          <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '6px' }}>{description}</p>
          <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa' }}>
            {loading ? '' : `${timelines.length} timeline${timelines.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '60px 20px' }}>
            Loading...
          </div>
        )}

        {/* Empty */}
        {!loading && timelines.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '13px', color: '#888' }}>No timelines in this category yet.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && timelines.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
            {timelines.map((t: any) => (
              <TimelineCard key={t.id} t={t} posCount={getPos(t.id)} negCount={getNeg(t.id)} />
            ))}
          </div>
        )}

      </div>

      <footer style={{ background: '#fff', borderTop: '1px solid #DEDAD3', textAlign: 'center', padding: '14px', fontFamily: 'Arial,sans-serif', fontSize: '10px', color: '#bbb', marginTop: '8px' }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}