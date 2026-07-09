'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import FavouriteHeart from '../components/FavouriteHeart';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FavouritesPage() {
  const [timelines, setTimelines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setUser(session.user);
      loadFavourites(session.user.id);
    };
    init();
  }, []);

  const loadFavourites = async (userId: string) => {
    setLoading(true);

    const { data: favs } = await supabase
      .from('favourites')
      .select('timeline_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!favs || favs.length === 0) {
      setTimelines([]);
      setLoading(false);
      return;
    }

    const ids = favs.map((f: any) => f.timeline_id);

    const { data: tls } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .in('id', ids);

    const { data: evs } = await supabase
      .from('events')
      .select('timeline_id, side')
      .in('timeline_id', ids);

    // Sort timelines in same order as favourites
    const sorted = ids
      .map((id: number) => tls?.find((t: any) => t.id === id))
      .filter(Boolean);

    setTimelines(sorted);
    setEvents(evs || []);
    setLoading(false);
  };

  const removeFavourite = async (timelineId: number) => {
    await supabase
      .from('favourites')
      .delete()
      .eq('user_id', user.id)
      .eq('timeline_id', timelineId);

    setTimelines(prev => prev.filter((t: any) => t.id !== timelineId));
  };

  const getPos = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'positive').length;
  const getNeg = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'negative').length;

  return (
    <main>
      <Navbar />

      <div style={{ padding: "0 20px 40px", maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 0 16px", borderBottom: "1px solid #DEDAD3", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: "20px", fontWeight: 700, color: "#1C1C1E", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              My Favourites
            </h1>
            <p style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#aaa" }}>
              {loading ? '' : `${timelines.length} saved timeline${timelines.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#2A5298", textDecoration: "none" }}>
            Browse more →
          </a>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#aaa", textAlign: "center", padding: "60px 20px" }}>
            Loading your favourites...
          </div>
        )}

        {/* Empty state */}
        {!loading && timelines.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: "18px", fontWeight: 700, color: "#1C1C1E", marginBottom: "8px" }}>
              No favourites yet
            </h2>
            <p style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#888", marginBottom: "20px" }}>
              Click the ♡ heart on any timeline to save it here.
            </p>
            <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", fontWeight: 600, padding: "10px 24px", borderRadius: "4px", background: "#2A5298", color: "#fff", textDecoration: "none" }}>
              Browse Timelines
            </a>
          </div>
        )}

        {/* Favourites Grid */}
        {!loading && timelines.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px" }}>
            {timelines.map((t: any) => (
              <div key={t.id} style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "12px 14px", position: "relative" }}>

                {/* Favourite heart — uses same component as timeline page */}
                <div style={{ position: "absolute", top: "8px", right: "8px" }}>
                  <FavouriteHeart timelineId={t.id} />
                </div>

                <a href={"/timeline/" + t.id} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", paddingRight: "24px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298" }}>{t.categories?.name}</span>
                    {t.secondary_category?.name && (
                      <>
                        <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", color: "#2A5298", opacity: 0.4 }}>|</span>
                        <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298" }}>{t.secondary_category?.name}</span>
                      </>
                    )}
                  </div>
                  <h3 style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "4px", paddingRight: "24px" }}>
                    {t.title}
                  </h3>
                  <p style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, marginBottom: "8px" }}>
                    {t.description}
                  </p>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#EDF7F1", color: "#1A7A4A" }}>▲ {getPos(t.id)} events</span>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#FDF0F0", color: "#B83232" }}>▼ {getNeg(t.id)} events</span>
                  </div>
                  <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#aaa" }}>
                    {t.views?.toLocaleString()} views
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}

      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb", marginTop: "8px" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}