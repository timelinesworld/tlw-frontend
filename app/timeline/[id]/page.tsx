import Navbar from "../../components/Navbar";

const timelines: Record<number, {
  title: string;
  tag: string;
  desc: string;
  author: string;
  date: string;
  events: { year: string; title: string; desc: string; side: "pos" | "neg" }[];
}> = {
  1: {
    title: "Nelson Mandela",
    tag: "Person",
    desc: "From Robben Island to the presidency — the arc of South Africa's moral compass.",
    author: "community",
    date: "12 June 2026",
    events: [
      { year: "1918", title: "Born in Mvezo", desc: "Born in Mvezo, Transkei, South Africa.", side: "pos" },
      { year: "1944", title: "Co-founds ANC Youth League", desc: "Galvanising a new generation of activists.", side: "pos" },
      { year: "1956", title: "Charged with treason", desc: "Alongside 155 activists; acquitted five years later.", side: "neg" },
      { year: "1964", title: "Life imprisonment", desc: "Sentenced at Rivonia Trial. 27 years on Robben Island.", side: "neg" },
      { year: "1990", title: "Released from prison", desc: "After 27 years; emerges without bitterness.", side: "pos" },
      { year: "1993", title: "Nobel Peace Prize", desc: "Awarded jointly with F.W. de Klerk.", side: "pos" },
      { year: "1994", title: "First Black President", desc: "Elected in South Africa's first fully democratic election.", side: "pos" },
      { year: "2013", title: "Passes away", desc: "Dies peacefully in Johannesburg, aged 95.", side: "neg" },
    ],
  },
  2: {
    title: "The Internet",
    tag: "Event",
    desc: "From a Pentagon experiment to the world's nervous system.",
    author: "community",
    date: "12 June 2026",
    events: [
      { year: "1969", title: "ARPANET first message", desc: "First message sent between UCLA and Stanford.", side: "pos" },
      { year: "1971", title: "Email invented", desc: "Ray Tomlinson sends the first email; @ symbol chosen.", side: "pos" },
      { year: "1988", title: "First internet worm", desc: "Morris Worm infects thousands of machines.", side: "neg" },
      { year: "1991", title: "World Wide Web", desc: "Tim Berners-Lee publishes the first website.", side: "pos" },
      { year: "1998", title: "Google launches", desc: "Information becomes universally searchable.", side: "pos" },
      { year: "2001", title: "Dot-com bubble bursts", desc: "Hundreds of billions in value erased overnight.", side: "neg" },
      { year: "2007", title: "iPhone launched", desc: "The internet goes into every pocket.", side: "pos" },
      { year: "2023", title: "AI era begins", desc: "Generative AI democratises content creation.", side: "pos" },
    ],
  },
  3: {
    title: "Japan",
    tag: "Country",
    desc: "Centuries of isolation, modernisation, catastrophe, and quiet reinvention.",
    author: "community",
    date: "12 June 2026",
    events: [
      { year: "710", title: "Nara established", desc: "Japan's first permanent capital; Buddhism flourishes.", side: "pos" },
      { year: "1603", title: "Tokugawa era begins", desc: "250 years of peace and cultural refinement.", side: "pos" },
      { year: "1868", title: "Meiji Restoration", desc: "Rapid modernisation catapults Japan into the industrial age.", side: "pos" },
      { year: "1923", title: "Great Kantō Earthquake", desc: "Kills over 100,000; Tokyo devastated.", side: "neg" },
      { year: "1945", title: "WWII ends in defeat", desc: "Atomic bombings of Hiroshima and Nagasaki; Japan surrenders.", side: "neg" },
      { year: "1964", title: "Tokyo Olympics", desc: "Bullet train launches; Japan showcases its recovery.", side: "pos" },
      { year: "1991", title: "Bubble economy collapses", desc: "Lost Decade of economic stagnation begins.", side: "neg" },
      { year: "2011", title: "Tōhoku earthquake", desc: "Tsunami triggers Fukushima nuclear disaster.", side: "neg" },
    ],
  },
  4: {
    title: "Marie Curie",
    tag: "Person",
    desc: "Two Nobel Prizes, two elements, and a life that redrew what science could be.",
    author: "community",
    date: "12 June 2026",
    events: [
      { year: "1867", title: "Born in Warsaw", desc: "Born Maria Skłodowska in Warsaw, then under Russian rule.", side: "pos" },
      { year: "1891", title: "Moves to Paris", desc: "Earns degrees in physics and mathematics from the Sorbonne.", side: "pos" },
      { year: "1898", title: "Discovers polonium and radium", desc: "Alongside husband Pierre Curie.", side: "pos" },
      { year: "1903", title: "First Nobel Prize", desc: "First woman to win a Nobel Prize — in Physics.", side: "pos" },
      { year: "1906", title: "Pierre dies", desc: "Pierre killed by a horse-drawn cart; she is devastated.", side: "neg" },
      { year: "1911", title: "Second Nobel Prize", desc: "Wins Nobel in Chemistry — only person to win in two sciences.", side: "pos" },
      { year: "1934", title: "Passes away", desc: "Dies of aplastic anaemia caused by radiation exposure.", side: "neg" },
    ],
  },
  5: {
    title: "Cockroach Janta Party",
    tag: "Movement",
    desc: "A courtroom remark that became India's biggest youth protest movement.",
    author: "you",
    date: "15 June 2026",
    events: [
      { year: "15 May 2026", title: "CJI's remark", desc: "Chief Justice's 'cockroach' remark triggers outrage.", side: "neg" },
      { year: "16 May 2026", title: "Social media outrage", desc: "Hashtags trend nationwide within hours.", side: "pos" },
      { year: "17 May 2026", title: "CJP launched online", desc: "Abhijeet Dipke launches the satirical Cockroach Janta Party.", side: "pos" },
      { year: "18 May 2026", title: "First Manifesto", desc: "CJP publishes its first manifesto.", side: "pos" },
      { year: "21 May 2026", title: "X account withheld", desc: "CJP's account withheld in India following government action.", side: "neg" },
      { year: "23 May 2026", title: "Website goes offline", desc: "Dipke responds: 'Cockroaches never die'.", side: "neg" },
      { year: "25 May 2026", title: "CJI clarifies", desc: "CJI clarifies comments were not aimed at unemployed youth.", side: "pos" },
      { year: "06 Jun 2026", title: "First protest", desc: "CJP holds its first ever on-ground protest in Delhi.", side: "pos" },
    ],
  },
};

const related = [
  { id: 2, tag: "Event", title: "The Internet" },
  { id: 3, tag: "Country", title: "Japan" },
  { id: 4, tag: "Person", title: "Marie Curie" },
];

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = timelines[Number(id)];
  if (!t) return <div style={{ padding: "40px", fontFamily: "Arial,sans-serif" }}>Timeline not found.</div>;

  const posCount = t.events.filter(e => e.side === "pos").length;
  const negCount = t.events.filter(e => e.side === "neg").length;
  const reversed = [...t.events].reverse();

  return (
    <main>
      <Navbar />

      <div style={{ padding: "0 24px 40px", maxWidth: "780px", margin: "0 auto" }}>

        {/* Back */}
        <a href="/browse" style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#2A5298", textDecoration: "none", padding: "14px 0 10px", display: "block" }}>← All timelines</a>

        {/* Header Card */}
        <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "8px", padding: "18px 20px", marginBottom: "24px" }}>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2A5298", marginBottom: "6px" }}>{t.tag}</div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "22px", fontWeight: 700, color: "#1C1C1E", marginBottom: "6px", lineHeight: 1.2 }}>{t.title}</h1>
          <p style={{ fontFamily: "Arial,sans-serif", fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "10px" }}>{t.desc}</p>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#aaa", marginBottom: "12px" }}>
            {t.events.length} events · {posCount} ▲ · {negCount} ▼ · by {t.author} · added {t.date}
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

          {/* Events — newest top, oldest bottom */}
          {reversed.map((ev, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", width: "100%", position: "relative", marginBottom: "28px", minHeight: "85px", zIndex: 1 }}>

              {/* LEFT HALF */}
              <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "12px" }}>
                {ev.side === "neg" && (
                  <div style={{ background: "#FDF0F0", border: "1px solid #F0D4D4", borderRadius: "10px", padding: "14px 16px", textAlign: "right", maxWidth: "240px" }}>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "5px" }}>{ev.title}</span>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, display: "block" }}>{ev.desc}</span>
                  </div>
                )}
                {ev.side === "neg" && <div style={{ height: "1px", background: "#F0D4D4", width: "20px", flexShrink: 0 }} />}
              </div>

              {/* DOT on axis */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "16px", height: "16px", borderRadius: "50%", background: ev.side === "pos" ? "#1A7A4A" : "#B83232", boxShadow: ev.side === "pos" ? "0 0 0 3px #F5F4F0, 0 0 0 4.5px #1A7A4A" : "0 0 0 3px #F5F4F0, 0 0 0 4.5px #B83232", zIndex: 3 }} />

              {/* DATE — opposite side of card */}
              {ev.side === "neg" && (
                <div style={{ position: "absolute", left: "calc(50% + 13px)", top: "50%", transform: "translateY(-50%)", fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 700, color: "#666", whiteSpace: "nowrap", zIndex: 2, paddingLeft: "4px" }}>{ev.year}</div>
              )}
              {ev.side === "pos" && (
                <div style={{ position: "absolute", right: "calc(50% + 13px)", top: "50%", transform: "translateY(-50%)", fontFamily: "Arial,sans-serif", fontSize: "11px", fontWeight: 700, color: "#666", whiteSpace: "nowrap", zIndex: 2, paddingRight: "4px" }}>{ev.year}</div>
              )}

              {/* RIGHT HALF */}
              <div style={{ width: "50%", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: "12px" }}>
                {ev.side === "pos" && <div style={{ height: "1px", background: "#C8E8D5", width: "20px", flexShrink: 0 }} />}
                {ev.side === "pos" && (
                  <div style={{ background: "#EDF7F1", border: "1px solid #C8E8D5", borderRadius: "10px", padding: "14px 16px", textAlign: "left", maxWidth: "240px" }}>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", fontWeight: 700, color: "#1C1C1E", display: "block", marginBottom: "5px" }}>{ev.title}</span>
                    <span style={{ fontFamily: "Arial,sans-serif", fontSize: "11px", color: "#555", lineHeight: 1.5, display: "block" }}>{ev.desc}</span>
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
        <div style={{ paddingTop: "24px" }}>
          <div style={{ fontFamily: "Arial,sans-serif", fontSize: "10px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Related Timelines</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {related.filter(r => r.id !== Number(id)).slice(0, 3).map(r => (
              <a key={r.id} href={"/timeline/" + r.id} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "1px solid #DEDAD3", borderRadius: "6px", padding: "10px 12px", cursor: "pointer" }}>
                  <div style={{ fontFamily: "Arial,sans-serif", fontSize: "9px", fontWeight: 700, color: "#2A5298", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>{r.tag}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: "12px", fontWeight: 700, color: "#1C1C1E" }}>{r.title}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: "1px solid #DEDAD3", textAlign: "center", padding: "14px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#bbb", marginTop: "24px" }}>
        Timelines World · open knowledge · simple · free · forever
      </footer>
    </main>
  );
}