'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import { useIsMobile } from '../lib/useIsMobile';
import SearchAutocomplete from '../components/SearchAutocomplete';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categories = ["All", "Person", "Country", "Disaster", "Invention", "War & Conflict", "Sports", "Politics & Leadership", "Entertainment", "Business & Economy", "Monument & Wonder", "Movement & Revolution", "Science & Discovery", "Nature & Environment", "Other"];

export default function Browse() {
  const [timelines, setTimelines] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const cat = params.get('cat') || 'All';

    if (q) setSearch(q);
    if (cat !== 'All') setActiveCategory(cat);

    if (q || cat !== 'All') {
      setTimeout(() => applyFilters(q, cat, 'Most Viewed'), 100);
    }
  }, [timelines]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Most Viewed');
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: tl } = await supabase
      .from('timelines')
      .select('*, categories!timelines_category_id_fkey(name), secondary_category:categories!timelines_secondary_category_id_fkey(name)')
      .order('views', { ascending: false });

    const { data: ev } = await supabase
      .from('events')
      .select('timeline_id, side');

    setTimelines(tl || []);
    setFiltered(tl || []);
    setEvents(ev || []);
    setLoading(false);
  };

  const getPos = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'positive').length;
  const getNeg = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'negative').length;

  const handleSearch = () => {
    applyFilters(search, activeCategory, sortBy);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    applyFilters(search, cat, sortBy);
  };

  const handleSort = (sort: string) => {
    setSortBy(sort);
    applyFilters(search, activeCategory, sort);
  };

  const applyFilters = async (searchTerm: string, category: string, sort: string) => {
    let results = [...timelines];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.categories?.name?.toLowerCase().includes(q)
      );
    }

    // Category filter — check primary AND secondary category
    if (category !== 'All') {
      results = results.filter(t =>
        t.categories?.name === category ||
        t.secondary_category?.name === category
      );
    }

    // Sort
    if (sort === 'Most Viewed') {
      results.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'Recently Added') {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'A → Z') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFiltered(results);

     // Track failed searches — 0 results + min 2 chars
    if (results.length === 0 && searchTerm.trim().length >= 2) {
      await supabase.rpc('upsert_failed_search', { search_query: searchTerm.trim().toLowerCase() });
    }
  };

  const handleClear = () => {
    setSearch('');
    setActiveCategory('All');
    setSortBy('Most Viewed');
    setFiltered(timelines);
  };

  return (
    <main>
      <Navbar />

      <div style={{ padding: "0 20px 40px", maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 0 16px", borderBottom: "1px solid #DEDAD3", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "20px", fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.02em" }}>Browse Timelines</h1>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#aaa" }}>
            {loading ? 'Loading...' : `Showing ${filtered.length} of ${timelines.length} timelines`}
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
          <SearchAutocomplete
            onSearch={q => {
              setSearch(q);
              applyFilters(q, activeCategory, sortBy);
            }}
            placeholder="Search any person, place, event, year…"
          />
          {search && (
            <button onClick={handleClear} style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", fontWeight: 600, padding: "9px 14px", borderRadius: "4px", background: "#fff", color: "#555", border: "1px solid #DEDAD3", cursor: "pointer", whiteSpace: "nowrap" }}>Clear</button>
          )}
        </div>

        {/* Category Filter */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "7px" }}>Category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "4px 11px", borderRadius: "20px", border: "1px solid #DEDAD3", background: activeCategory === cat ? "#2A5298" : "#fff", color: activeCategory === cat ? "#fff" : "#555", cursor: "pointer" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", marginTop: "14px" }}>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#aaa" }}>Sort by:</span>
          {["Most Viewed", "Recently Added", "A → Z"].map(s => (
            <button
              key={s}
              onClick={() => handleSort(s)}
              style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "4px 11px", borderRadius: "4px", border: "1px solid #DEDAD3", background: sortBy === s ? "#1C1C1E" : "#fff", color: sortBy === s ? "#fff" : "#555", cursor: "pointer" }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ height: "1px", background: "#DEDAD3", marginBottom: "16px" }} />

        {/* Results */}
        {loading ? (
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#888", textAlign: "center", padding: "40px" }}>Loading timelines...</div>
        ) : filtered.length === 0 ? (
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#888", textAlign: "center", padding: "40px" }}>
            No timelines found for "<strong>{search}</strong>"
            <br /><br />
            <button onClick={handleClear} style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#2A5298", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear search</button>
          </div>
        ) : (
          <div className="grid-cols-2 md:grid-cols-4 grid gap-2 mb-6">
            {filtered.map((t: any) => (
              <a key={t.id} href={"/timeline/" + t.id} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "12px 14px", cursor: "pointer", height: "100%" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298" }}>{t.categories?.name}</span>
                  {t.secondary_category?.name && (
                    <>
                      <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", color: "#2A5298", opacity: 0.4 }}>|</span>
                      <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298" }}>{t.secondary_category?.name}</span>
                    </>
                  )}
                </div>
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
          </div>
        )}

      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb", marginTop: "8px" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}