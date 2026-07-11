'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FavouriteHeart({ timelineId }: { timelineId: number }) {
  const [isFavourite, setIsFavourite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Check if already favourited
        const { data } = await supabase
          .from('favourites')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('timeline_id', timelineId)
          .maybeSingle();

        setIsFavourite(!!data);
      }
      setLoading(false);
    };

    init();
  }, [timelineId]);

  const handleClick = async () => {
    if (!user) {
      setShowPopup(true);
      return;
    }

    if (isFavourite) {
      // Remove from favourites
      await supabase
        .from('favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('timeline_id', timelineId);
      setIsFavourite(false);
    } else {
      // Add to favourites
      await supabase
        .from('favourites')
        .insert([{ user_id: user.id, timeline_id: timelineId }]);
      setIsFavourite(true);
    }
  };

  if (loading) return null;

  return (
    <>
      {/* Heart Button */}
      <button
        onClick={handleClick}
        title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s',
        }}
      >
        {isFavourite ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF2020" stroke="#FF2020" strokeWidth="2" style={{ transition: 'all 0.2s' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="2" style={{ transition: 'all 0.2s' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        )}
      </button>

      {/* Popup — Guest not logged in */}
      {showPopup && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '32px',
              maxWidth: '360px',
              width: '90%',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>❤️</div>
            <h3 style={{
              fontFamily: 'Georgia,serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1C1C1E',
              marginBottom: '8px',
            }}>
              Save to Favourites
            </h3>
            <p style={{
              fontFamily: 'Arial,sans-serif',
              fontSize: '12px',
              color: '#888',
              marginBottom: '20px',
              lineHeight: 1.6,
            }}>
              Please login to save timelines to your favourites. Your favourites are saved across all your devices.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              
                <a href="/login" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', background: '#2A5298', color: '#fff', textDecoration: 'none' }}>Login</a>
              
                <a href="/register" style={{ fontFamily: 'Arial,sans-serif', fontSize: '12px', fontWeight: 600, padding: '8px 20px', borderRadius: '4px', border: '1px solid #DEDAD3', color: '#555', textDecoration: 'none' }}>Register</a>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                marginTop: '16px',
                fontFamily: 'Arial,sans-serif',
                fontSize: '11px',
                color: '#aaa',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}