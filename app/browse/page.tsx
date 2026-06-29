import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

const categories = ["All", "Person", "Country", "Disaster", "Invention", "War & Conflict", "Sports", "Politics", "Entertainment", "Movement", "Other"];

async function getTimelines() {
  const { data, error } = await supabase
    .from('timelines')
    .select(`*, categories(name)`)
    .order('views', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('timeline_id, side');
  if (error) { console.error(error); return []; }
  return data || [];
}

export default async function Browse() {
  const timelines = await getTimelines();
  const events = await getEvents();

  const getPos = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'positive').length;
  const getNeg = (id: number) => events.filter((e: any) => e.timeline_id === id && e.side === 'negative').length;

  return (
    <main>
      <Navbar />

      <div style={{ padding: "0 20px 40px", maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 0 16px", borderBottom: "1px solid #DEDAD3", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "20px", fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.02em" }}>Browse Timelines</h1>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#aaa" }}>Showing {timelines.length} timelines</span>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input placeholder="Search any person, place, event, year…" style={{ flex: 1, fontFamily: "Arial,sans-serif", fontSize: "13px", padding: "9px 14px", border: "1px solid #DEDAD3", borderRadius: "4px", background: "#fff", color: "#1C1C1E", outline: "none" }} />
          <button style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", fontWeight: 600, padding: "9px 18px", borderRadius: "4px", background: "#2A5298", color: "#fff", border: "none", cursor: "pointer" }}>Search</button>
        </div>

        {/* Category Filter */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "7px" }}>Category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.map((cat, i) => (
              <button key={cat} style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "4px 11px", borderRadius: "20px", border: "1px solid #DEDAD3", background: i === 0 ? "#2A5298" : "#fff", color: i === 0 ? "#fff" : "#555", cursor: "pointer" }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", marginTop: "14px" }}>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#aaa" }}>Sort by:</span>
          {["Most Viewed", "Recently Added", "A → Z"].map((s, i) => (
            <button key={s} style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "4px 11px", borderRadius: "4px", border: "1px solid #DEDAD3", background: i === 0 ? "#1C1C1E" : "#fff", color: i === 0 ? "#fff" : "#555", cursor: "pointer" }}>{s}</button>
          ))}
        </div>

        <div style={{ height: "1px", background: "#DEDAD3", marginBottom: "16px" }} />

        {/* Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "10px", marginBottom: "24px" }}>
          {timelines.map((t: any) => (
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
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          {["←", "1", "2", "3", "→"].map((p, i) => (
            <button key={p} style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 600, padding: "5px 11px", borderRadius: "4px", border: "1px solid #DEDAD3", background: i === 1 ? "#2A5298" : "#fff", color: i === 1 ? "#fff" : "#555", cursor: "pointer" }}>{p}</button>
          ))}
        </div>

      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb", marginTop: "8px" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}