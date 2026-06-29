import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

async function getTimeline(id: number) {
  const { data, error } = await supabase
    .from('timelines')
    .select(`*, categories(name)`)
    .eq('id', id)
    .single();
  if (error) { console.error(error); return null; }
  return data;
}

async function getEvents(id: number) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('timeline_id', id)
    .order('year', { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

async function getRelated(id: number) {
  const { data, error } = await supabase
    .from('timelines')
    .select(`*, categories(name)`)
    .neq('id', id)
    .limit(3);
  if (error) { console.error(error); return []; }
  return data || [];
}

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTimeline(Number(id));
  if (!t) return <div style={{ padding: "40px", fontFamily: "Arial,sans-serif" }}>Timeline not found.</div>;

  const events = await getEvents(Number(id));
  const related = await getRelated(Number(id));

  const posCount = events.filter((e: any) => e.side === 'positive').length;
  const negCount = events.filter((e: any) => e.side === 'negative').length;
  const reversed = [...events].reverse();

  return (
    <main>
      <Navbar />

      <div style={{ padding: "0 24px 40px", maxWidth: "780px", margin: "0 auto" }}>

        {/* Back */}
        <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#2A5298", textDecoration: "none", padding: "14px 0 10px", display: "block" }}>← All timelines</a>

        {/* Header Card */}
        <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "8px", padding: "18px 20px", marginBottom: "24px" }}>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298", marginBottom: "6px" }}>{t.categories?.name}</div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "22px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px", lineHeight: 1.2 }}>{t.title}</h1>
          <p style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "10px" }}>{t.description}</p>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#aaa", marginBottom: "12px" }}>
            {events.length} events · {posCount} ▲ · {negCount} ▼ · by community
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {["Share", "WhatsApp", "Copy link"].map(btn => (
              <button key={btn} style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 600, padding: "5px 12px", borderRadius: "4px", border: "1px solid #DEDAD3", background: "#fff", color: "#555", cursor: "pointer" }}>{btn}</button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>

          {/* Central axis */}
          <div style={{ position: "absolute", left: "50%", top: 0, width: "2px", background: "#C8C4BC", transform: "translateX(-50%)", bottom: "42px", zIndex: 0 }} />

          {/* Events */}
          {reversed.map((ev: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", width: "100%", position: "relative", marginBottom: "28px", minHeight: "85px", zIndex: 1 }}>

              {/* LEFT HALF */}
              <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "12px" }}>
                {ev.side === "negative" && (
                  <div style={{ background: "#FDF0F0", border: "1px solid #F0D4D4", borderRadius: "10px", padding: "14px 16px", textAlign: "right", maxWidth: "240px" }}>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "5px" }}>{ev.title}</span>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, display: "block" }}>{ev.description}</span>
                  </div>
                )}
                {ev.side === "negative" && <div style={{ height: "1px", background: "#F0D4D4", width: "20px", flexShrink: 0 }} />}
              </div>

              {/* DOT on axis */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "16px", height: "16px", borderRadius: "50%", background: ev.side === "positive" ? "#1A7A4A" : "#B83232", boxShadow: ev.side === "positive" ? "0 0 0 3px #F5F4F0, 0 0 0 4.5px #1A7A4A" : "0 0 0 3px #F5F4F0, 0 0 0 4.5px #B83232", zIndex: 3 }} />

              {/* DATE */}
              {ev.side === "negative" && (
                <div style={{ position: "absolute", left: "calc(50% + 13px)", top: "50%", transform: "translateY(-50%)", fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 700, color: "#666", whiteSpace: "nowrap", zIndex: 2, paddingLeft: "4px" }}>{ev.year}</div>
              )}
              {ev.side === "positive" && (
                <div style={{ position: "absolute", right: "calc(50% + 13px)", top: "50%", transform: "translateY(-50%)", fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 700, color: "#666", whiteSpace: "nowrap", zIndex: 2, paddingRight: "4px" }}>{ev.year}</div>
              )}

              {/* RIGHT HALF */}
              <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: "12px" }}>
                {ev.side === "positive" && <div style={{ height: "1px", background: "#C8E8D5", width: "20px", flexShrink: 0 }} />}
                {ev.side === "positive" && (
                  <div style={{ background: "#EDF7F1", border: "1px solid #C8E8D5", borderRadius: "10px", padding: "14px 16px", textAlign: "left", maxWidth: "240px" }}>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "5px" }}>{ev.title}</span>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, display: "block" }}>{ev.description}</span>
                  </div>
                )}
              </div>

            </div>
          ))}

          {/* Origin dot */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 2, paddingBottom: "20px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#1C1C1E", boxShadow: "0 0 0 4px #F5F4F0, 0 0 0 6px #1C1C1E" }} />
            <div style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", marginTop: "14px", whiteSpace: "nowrap" }}>{t.title}</div>
          </div>

        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ paddingTop: "24px" }}>
            <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Related Timelines</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {related.map((r: any) => (
                <a key={r.id} href={"/timeline/" + r.id} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "10px 12px", cursor: "pointer" }}>
                    <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, color: "#2A5298", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>{r.categories?.name}</div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: "12px", fontWeight: 700, color: "#1C1C1E" }}>{r.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb", marginTop: "24px" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}