import Navbar from "./components/Navbar";

const timelines = [
  { id: 1, title: "Nelson Mandela", tag: "Person", desc: "From Robben Island to the presidency of South Africa.", pos: 5, neg: 3, author: "community" },
  { id: 2, title: "The Internet", tag: "Event", desc: "From a Pentagon experiment to the world's nervous system.", pos: 6, neg: 3, author: "community" },
  { id: 3, title: "Japan", tag: "Country", desc: "Centuries of isolation, modernisation, and reinvention.", pos: 6, neg: 4, author: "community" },
  { id: 4, title: "Marie Curie", tag: "Person", desc: "Two Nobel Prizes and a life that redrew what science could be.", pos: 5, neg: 3, author: "community" },
  { id: 5, title: "Cockroach Janta Party", tag: "Movement", desc: "A courtroom remark that became India's biggest youth protest.", pos: 5, neg: 3, author: "you", isNew: true },
];

const categories = ["All", "Person", "Country", "Disaster", "Invention", "Sports", "Movement", "Politics", "Other"];

function TimelineCard({ t }: { t: typeof timelines[0] & { isNew?: boolean } }) {
  return (
    <a href={"/timeline/" + t.id} style={{ textDecoration: "none" }}>
      <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "12px 14px", cursor: "pointer" }}>
        <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298", marginBottom: "4px" }}>{t.tag}</div>
        <h3 style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginBottom: "4px", lineHeight: 1.3 }}>
          {t.title}
          {t.isNew && <span style={{ fontFamily: "Arial,sans-serif", fontSize: "8px", fontWeight: 700, background: "#FFF3CD", color: "#856404", padding: "2px 6px", borderRadius: "4px", marginLeft: "5px", verticalAlign: "middle" }}>New</span>}
        </h3>
        <p style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, marginBottom: "8px" }}>{t.desc}</p>
        <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#EDF7F1", color: "#1A7A4A" }}>▲ {t.pos} events</span>
          <span style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "#FDF0F0", color: "#B83232" }}>▼ {t.neg} events</span>
        </div>
        <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#aaa" }}>by {t.author}</div>
      </div>
    </a>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
  gap: "10px",
  marginBottom: "28px",
};

const sectionHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "Arial,sans-serif",
  fontSize: "10px",
  fontWeight: 700,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

export default function Home() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: "1px solid #DEDAD3", padding: "36px 24px 28px", textAlign: "center" }}>
        <p style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#2A5298", marginBottom: "10px" }}>The chronology of everything</p>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: "26px", fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "10px" }}>Every story has a timeline.</h1>
        <p style={{ fontFamily: "Arial,sans-serif", fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "20px", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>Browse timelines for people, places, events, inventions, disasters and more. Simple. Free. Forever.</p>

        {/* Search */}
        <div style={{ display: "flex", gap: "8px", maxWidth: "460px", margin: "0 auto 20px" }}>
          <input placeholder="Search any person, place, event…" style={{ flex: 1, fontFamily: "Arial,sans-serif", fontSize: "13px", padding: "10px 14px", border: "1px solid #DEDAD3", borderRadius: "4px", background: "#F5F4F0", color: "#1C1C1E", outline: "none" }} />
          <button style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", fontWeight: 600, padding: "10px 20px", borderRadius: "4px", background: "#2A5298", color: "#fff", border: "none", cursor: "pointer" }}>Search</button>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
          {categories.map((cat, i) => (
            <button key={cat} style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px", border: "1px solid #DEDAD3", background: i === 0 ? "#2A5298" : "#fff", color: i === 0 ? "#fff" : "#555", cursor: "pointer" }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 20px 40px", maxWidth: "960px", margin: "0 auto" }}>

        {/* Featured */}
        <div style={sectionHeadStyle}>
          <span style={sectionLabelStyle}>Featured Timelines</span>
          <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#2A5298", textDecoration: "none" }}>See all →</a>
        </div>
        <div style={gridStyle}>
          {timelines.slice(0, 4).map((t) => <TimelineCard key={t.id} t={t} />)}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#DEDAD3", marginBottom: "24px" }} />

        {/* Trending */}
        <div style={sectionHeadStyle}>
          <span style={sectionLabelStyle}>Trending This Week</span>
        </div>
        <div style={gridStyle}>
          {timelines.slice(4).map((t) => <TimelineCard key={t.id} t={t} />)}
          <div style={{ background: "#FAFAF8", border: "1px dashed #DEDAD3", borderRadius: "6px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "120px" }}>
            <div>
              <div style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#aaa", marginBottom: "6px" }}>More timelines coming soon</div>
              <div style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#bbb" }}>Login to create your own</div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}