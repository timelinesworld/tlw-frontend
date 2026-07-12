'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TimelineCardProps {
  t: any;
  posCount: number;
  negCount: number;
}

export default function TimelineCard({ t, posCount, negCount }: TimelineCardProps) {
  const [isFavourite, setIsFavourite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from('favourites')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('timeline_id', t.id)
          .maybeSingle();
        setIsFavourite(!!data);
      }
    };
    init();
  }, [t.id]);

  const handleHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowPopup(true);
      return;
    }

    if (isFavourite) {
      await supabase
        .from('favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('timeline_id', t.id);
      setIsFavourite(false);
    } else {
      await supabase
        .from('favourites')
        .insert([{ user_id: user.id, timeline_id: t.id }]);
      setIsFavourite(true);
    }
  };

  return (
    <>
      <div onClick={() => window.location.href = '/timeline/' + t.id} style={{ textDecoration: 'none', display: 'block', height: '100%', cursor: 'pointer' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #DEDAD3',
          borderRadius: '6px',
          padding: '10px 12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '130px',
          position: 'relative',
          boxSizing: 'border-box',
        }}>

          {/* Top row — category + icons */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div>
              <a href={'/category/' + encodeURIComponent(t.categories?.name)} onClick={e => e.stopPropagation()} style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2A5298', textDecoration: 'none' }}>{t.categories?.name}</a>
              {t.secondary_category?.name && (
                <>
                  <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', color: '#2A5298', opacity: 0.4, margin: '0 4px' }}>|</span>
                  <a href={'/category/' + encodeURIComponent(t.secondary_category?.name)} onClick={e => e.stopPropagation()} style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2A5298', textDecoration: 'none' }}>{t.secondary_category?.name}</a>
                </>
              )}
            </div>

            {/* Icons — star and/or heart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
              {t.is_admins_pick && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5A623" stroke="#F5A623" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
              <button onClick={handleHeart} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}>
                {isFavourite ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DEDAD3" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Title */}
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '11px', fontWeight: 700, color: '#1C1C1E', marginBottom: '3px', lineHeight: 1.3 }}>
            {t.title}
          </div>

          {/* Description */}
          <div style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', color: '#555', lineHeight: 1.4, marginBottom: '6px', flex: 1 }}>
            {t.description}
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: t.is_live ? '4px' : '0' }}>
            <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '20px', background: '#EDF7F1', color: '#1A7A4A' }}>▲ {posCount} events</span>
            <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '20px', background: '#FDF0F0', color: '#B83232' }}>▼ {negCount} events</span>
            <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '20px', background: '#F5F5F5', color: '#888', border: '1px solid #ddd' }}>{t.views?.toLocaleString()} views</span>
          </div>

          {/* LIVE badge */}
          {t.is_live && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF2020', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '8px', fontWeight: 700, color: '#FF2020', letterSpacing: '0.05em' }}>ACTIVE</span>
            </div>
          )}

        </div>
      </div>

      {/* Guest popup */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '8px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }}
          >
            <div style={{ marginBottom: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'Georgia,serif', fontSize: '18px', fontWeight: 700, color: '#1C1C1E', marginBottom: '8px' }}>Save to Favourites</h3>
            <p style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#888', marginBottom: '20px', lineHeight: 1.6 }}>Please login to save timelines to your favourites.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', textDecoration: 'none' }}>Login</a>
              <a href="/register" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none' }}>Register</a>
            </div>
            <button onClick={() => setShowPopup(false)} style={{ marginTop: '16px', fontFamily: 'Arial,sans-serif', fontSize: '11px', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}