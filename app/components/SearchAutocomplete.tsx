'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchAutocomplete({ onSearch, placeholder = "Search any person, place, event…" }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async (q: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('timelines')
      .select('id, title, categories!timelines_category_id_fkey(name)')
      .ilike('title', `%${q}%`)
      .limit(5);
    setSuggestions(data || []);
    setShowDropdown(true);
    setLoading(false);
  };

  const handleSelect = (t: any) => {
    setQuery(t.title);
    setShowDropdown(false);
    window.location.href = '/timeline/' + t.id;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSearch(query);
  };

  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <strong style={{ color: '#1C1C1E' }}>{text.slice(index, index + query.length)}</strong>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            fontFamily: 'Arial,sans-serif',
            fontSize: '12px',
            padding: '8px 12px',
            border: '1px solid #DEDAD3',
            borderRadius: '4px',
            background: '#F5F4F0',
            color: '#1C1C1E',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            fontFamily: 'Arial,sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: '4px',
            background: '#E53E3E',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: '74px',
          background: '#fff',
          border: '1px solid #DEDAD3',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          zIndex: 100,
          marginTop: '2px',
          overflow: 'hidden',
        }}>
          {loading && (
            <div style={{ padding: '10px 14px', fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#aaa' }}>
              Searching...
            </div>
          )}
          {!loading && suggestions.length === 0 && query.length >= 2 && (
            <div style={{ padding: '10px 14px', fontFamily: 'Arial,sans-serif', fontSize: '12px', color: '#aaa' }}>
              No results for "{query}"
            </div>
          )}
          {!loading && suggestions.map((t: any) => (
            <div
              key={t.id}
              onClick={() => handleSelect(t)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid #F5F4F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F4F0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <span style={{ fontFamily: 'Georgia,serif', fontSize: '13px', color: '#555' }}>
                {highlightMatch(t.title, query)}
              </span>
              <span style={{ fontFamily: 'Arial,sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2A5298', flexShrink: 0 }}>
                {t.categories?.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}