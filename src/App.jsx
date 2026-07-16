import { useState, useEffect } from "react";

const SUBJECT_COLORS = [
  "#E8A33D", "#4C9A8C", "#C97BB5", "#6B9BD1", "#D1725F", "#8FB86B",
];
const STORAGE_KEY = "deadline-tracker-tasks";

function colorForSubject(subject, map) {
  if (!map[subject]) {
    const used = Object.values(map);
    const next =
      SUBJECT_COLORS.find((c) => !used.includes(c)) ||
      SUBJECT_COLORS[used.length % SUBJECT_COLORS.length];
    map[subject] = next;
  }
  return map[subject];
}

function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.round((due - now) / 86400000);
}

function urgencyColor(days) {
  if (days < 0) return "#5A5F6B";
  if (days <= 1) return "#D1725F";
  if (days <= 3) return "#E8A33D";
  if (days <= 7) return "#D6C25A";
  return "#4C9A8C";
}

function urgencyLabel(days) {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `${days}d`;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [subjectColors, setSubjectColors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setTasks(parsed);
        const map = {};
        parsed.forEach((t) => colorForSubject(t.subject, map));
        setSubjectColors(map);
      }
    } catch (e) {
      // no saved data yet, or storage unavailable
    }
  }, []);

  function persist(next) {
    setTasks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // storage full or unavailable — list still works for this session
    }
  }

  function addTask(e) {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !date) return;
    const map = { ...subjectColors };
    colorForSubject(subject.trim(), map);
    setSubjectColors(map);
    const next = [
      ...tasks,
      { id: Date.now().toString(), name: name.trim(), subject: subject.trim(), date },
    ];
    persist(next);
    setName("");
    setSubject("");
    setDate("");
    setShowForm(false);
  }

  function removeTask(id) {
    persist(tasks.filter((t) => t.id !== id));
  }

  const sorted = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#14171F",
        color: "#EDEEF2",
        fontFamily: "'Georgia', 'Iowan Old Style', serif",
        padding: "32px 20px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        .dt-add-btn:focus-visible, .dt-remove:focus-visible, .dt-submit:focus-visible {
          outline: 2px solid #4C9A8C;
          outline-offset: 2px;
        }
        .dt-row:hover .dt-remove { opacity: 1; }
        body { background: #14171F; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: 12,
              letterSpacing: "0.12em",
              color: "#5A5F6B",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            everything due, one list
          </div>
          <h1 style={{ fontSize: 30, margin: 0, fontWeight: 400, letterSpacing: "-0.01em" }}>
            What's due
          </h1>
        </div>

        {sorted.length === 0 && !showForm && (
          <div
            style={{
              border: "1px solid #2A2F3A",
              borderRadius: 8,
              padding: "28px 20px",
              color: "#8B90A0",
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            Nothing on the list yet. Add the small stuff too — quizzes and discussion
            posts belong here just as much as major assignments.
          </div>
        )}

        {sorted.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {sorted.map((t) => {
              const days = daysUntil(t.date);
              const uColor = urgencyColor(days);
              const sColor = subjectColors[t.subject] || "#5A5F6B";
              return (
                <div
                  className="dt-row"
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 4px",
                    borderBottom: "1px solid #22262F",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: uColor,
                      width: 62,
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    {urgencyLabel(days)}
                  </div>
                  <div
                    style={{
                      width: 4,
                      alignSelf: "stretch",
                      background: sColor,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, color: "#EDEEF2", lineHeight: 1.3 }}>
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 12,
                        color: sColor,
                        marginTop: 3,
                      }}
                    >
                      {t.subject}
                    </div>
                  </div>
                  <button
                    className="dt-remove"
                    onClick={() => removeTask(t.id)}
                    aria-label={`Remove ${t.name}`}
                    style={{
                      opacity: 0,
                      transition: "opacity 0.15s",
                      background: "none",
                      border: "none",
                      color: "#5A5F6B",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: "4px 8px",
                      fontFamily: "inherit",
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showForm ? (
          <form
            onSubmit={addTask}
            style={{
              border: "1px solid #2A2F3A",
              borderRadius: 8,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name (e.g. Discussion post — Week 4)"
              style={inputStyle}
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (e.g. BIO201)"
              style={inputStyle}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="submit" className="dt-submit" style={primaryBtnStyle}>
                Add
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={secondaryBtnStyle}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="dt-add-btn"
            onClick={() => setShowForm(true)}
            style={{ ...secondaryBtnStyle, width: "100%", padding: "12px 0", fontSize: 15 }}
          >
            + Add something due
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#1C2029",
  border: "1px solid #2A2F3A",
  borderRadius: 6,
  padding: "10px 12px",
  color: "#EDEEF2",
  fontSize: 14,
  fontFamily: "'Georgia', serif",
  outline: "none",
};

const primaryBtnStyle = {
  background: "#4C9A8C",
  border: "none",
  borderRadius: 6,
  padding: "10px 18px",
  color: "#0F1116",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtnStyle = {
  background: "none",
  border: "1px solid #2A2F3A",
  borderRadius: 6,
  padding: "10px 18px",
  color: "#8B90A0",
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
};
