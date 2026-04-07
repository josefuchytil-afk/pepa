"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_TASKS = [
  "Ranní hygiena",
  "Ranní cvičení a la Marťa",
  "Ranní posilování - kliky, dřepy, sedy-lehy",
  "Ranní prášky",
  "Večerní nehřešení",
];

const STORAGE_KEY = "pepa-checklist-v2";
const BRAND = "#00ABBD";
const BRAND_LIGHT = "#e6f8fb";
const BRAND_DARK = "#0b7285";

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateString) {
  const d = new Date(dateString + "T00:00:00");
  return d.toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function createEmptyChecked(tasks) {
  const checked = {};
  for (const task of tasks) checked[task] = false;
  return checked;
}

function normalizeDayData(dayData, tasks) {
  const checked = {};
  for (const task of tasks) {
    checked[task] = !!(dayData && dayData[task]);
  }
  return checked;
}

function getMotivation(doneCount, totalCount) {
  if (totalCount === 0) return "Začni jednou věcí. Stačí.";
  if (doneCount === 0) return "Začni jednou věcí. Stačí.";
  if (doneCount === 1) return "První krok je hotový. Jen pokračuj.";
  if (doneCount === 2) return "Už se do toho dostáváš.";
  if (doneCount === 3) return "Jsi v rytmu. Nezastavuj.";
  if (doneCount < totalCount) return "Dneska to dáš celé.";
  return "Hotovo. Dej si double-pašáka!";
}

function getBarColor(percent) {
  if (percent < 40) return "#dc2626";
  if (percent < 70) return "#f59e0b";
  if (percent < 100) return "#2563eb";
  return BRAND;
}

function getMotivationBoxStyle(percent) {
  if (percent < 40) {
    return { bg: "#eaf2fb", icon: "🌱" };
  }
  if (percent < 70) {
    return { bg: "#eef6ea", icon: "🚶" };
  }
  if (percent < 100) {
    return { bg: "#fff4dd", icon: "🔥" };
  }
  return { bg: BRAND_LIGHT, icon: "✅" };
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [history, setHistory] = useState({});
  const [newTask, setNewTask] = useState("");
  const [showMantra, setShowMantra] = useState(false);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        const initial = {
          tasks: DEFAULT_TASKS,
          history: {
            [getTodayKey()]: createEmptyChecked(DEFAULT_TASKS),
          },
        };
        setTasks(initial.tasks);
        setHistory(initial.history);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return;
      }

      const parsed = JSON.parse(raw);
      const parsedTasks =
        Array.isArray(parsed.tasks) && parsed.tasks.length > 0
          ? parsed.tasks
          : DEFAULT_TASKS;

      const parsedHistory =
        parsed.history && typeof parsed.history === "object" ? parsed.history : {};

      const normalizedHistory = {};
      for (const dateKey of Object.keys(parsedHistory)) {
        normalizedHistory[dateKey] = normalizeDayData(parsedHistory[dateKey], parsedTasks);
      }

      if (!normalizedHistory[getTodayKey()]) {
        normalizedHistory[getTodayKey()] = createEmptyChecked(parsedTasks);
      }

      setTasks(parsedTasks);
      setHistory(normalizedHistory);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tasks: parsedTasks,
          history: normalizedHistory,
        })
      );
    } catch (e) {
      const fallback = {
        tasks: DEFAULT_TASKS,
        history: {
          [getTodayKey()]: createEmptyChecked(DEFAULT_TASKS),
        },
      };
      setTasks(fallback.tasks);
      setHistory(fallback.history);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks,
        history,
      })
    );
  }, [tasks, history, mounted]);

  useEffect(() => {
    if (!mounted) return;

    setHistory((prev) => {
      if (prev[selectedDate]) return prev;
      return {
        ...prev,
        [selectedDate]: createEmptyChecked(tasks),
      };
    });
  }, [selectedDate, tasks, mounted]);

  const selectedDayChecked = useMemo(() => {
    return history[selectedDate] || createEmptyChecked(tasks);
  }, [history, selectedDate, tasks]);

  const doneCount = useMemo(() => {
    return Object.values(selectedDayChecked).filter(Boolean).length;
  }, [selectedDayChecked]);

  const totalCount = tasks.length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const motivationStyle = getMotivationBoxStyle(percent);

  function updateSelectedDay(nextChecked) {
    setHistory((prev) => ({
      ...prev,
      [selectedDate]: nextChecked,
    }));
  }

  function toggleTask(task) {
    updateSelectedDay({
      ...selectedDayChecked,
      [task]: !selectedDayChecked[task],
    });
  }

  function resetDay() {
    updateSelectedDay(createEmptyChecked(tasks));
  }

  function addTask() {
    const trimmed = newTask.trim();
    if (!trimmed) return;
    if (tasks.includes(trimmed)) {
      setNewTask("");
      return;
    }

    const nextTasks = [...tasks, trimmed];
    const nextHistory = {};

    for (const dateKey of Object.keys(history)) {
      nextHistory[dateKey] = {
        ...normalizeDayData(history[dateKey], tasks),
        [trimmed]: false,
      };
    }

    if (!nextHistory[selectedDate]) {
      nextHistory[selectedDate] = createEmptyChecked(nextTasks);
    }

    setTasks(nextTasks);
    setHistory(nextHistory);
    setNewTask("");
  }

  function removeTask(taskToRemove) {
    const nextTasks = tasks.filter((task) => task !== taskToRemove);
    const nextHistory = {};

    for (const dateKey of Object.keys(history)) {
      const nextChecked = {};
      for (const task of nextTasks) {
        nextChecked[task] = !!history[dateKey]?.[task];
      }
      nextHistory[dateKey] = nextChecked;
    }

    setTasks(nextTasks);
    setHistory(nextHistory);
  }

  function getLast7Days() {
    const days = [];
    const base = new Date(getTodayKey() + "T00:00:00");

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;

      const checked = history[key] || createEmptyChecked(tasks);
      const done = Object.values(checked).filter(Boolean).length;
      const total = tasks.length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);

      days.push({
        key,
        label: formatDateLabel(key),
        done,
        total,
        pct,
      });
    }

    return days;
  }

  const last7Days = useMemo(() => getLast7Days(), [history, tasks]);

  if (!mounted) return null;

  return (
    <>
      <style jsx>{`
        .page-grid {
          display: grid;
          grid-template-columns: 2fr 1.05fr;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 980px) {
          .page-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "#edf2f7",
          padding: "14px",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          className="page-grid"
          style={{
            maxWidth: "1380px",
            margin: "0 auto",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #d1d5db",
                borderRadius: "24px",
                padding: "18px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <button
                    onClick={() => setShowMantra((prev) => !prev)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      margin: 0,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    title="Mantra"
                  >
                    <div
                      style={{
                        fontSize: "21px",
                        fontWeight: 800,
                        lineHeight: 1.25,
                        color: "#0f172a",
                      }}
                    >
                      Tady a teď. V pravdě. V míru se sebou.
                    </div>
                  </button>

                  {showMantra && (
                    <div
                      style={{
                        marginTop: "14px",
                        background: BRAND,
                        border: `1px solid ${BRAND}`,
                        borderRadius: "18px",
                        padding: "16px",
                        lineHeight: 1.6,
                        color: "#ffffff",
                        fontSize: "15px",
                      }}
                    >
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                          Tady a teď
                        </div>
                        <div>Všímám si těla, dechu, prostoru kolem sebe.</div>
                        <div>
                          Nedělám víc věcí najednou jen proto, abych utekl od
                          přítomnosti.
                        </div>
                      </div>

                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                          V pravdě
                        </div>
                        <div>
                          Nelžu (si) o tom, jak se cítím a co skutečně potřebuju.
                        </div>
                        <div>
                          Říkám (si) věci tak, jak jsou, ne jak „by měly být“.
                        </div>
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                          V míru se sebou
                        </div>
                        <div>Nepotřebuju se hodnotit, srovnávat ani opravovat.</div>
                        <div>Přijímám se i s chybami a nedokonalostí.</div>
                        <div>
                          Dovoluju si být takový, jaký jsem právě teď.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      fontSize: "16px",
                    }}
                  />
                  <button
                    onClick={resetDay}
                    style={{
                      padding: "12px 18px",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Reset dne
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "22px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>Vybraný den</div>
                    <div style={{ fontSize: "18px", fontWeight: 800 }}>
                      {formatDateLabel(selectedDate)}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "#64748b" }}>Splněno</div>
                    <div style={{ fontSize: "18px", fontWeight: 800 }}>
                      {doneCount} / {totalCount}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b" }}>
                      Postup: {percent} %
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "11px",
                    background: "#dbe4ee",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background: getBarColor(percent),
                      borderRadius: "999px",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    background: motivationStyle.bg,
                    borderRadius: "22px",
                    padding: "18px 16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "34px", marginBottom: "8px" }}>
                    {motivationStyle.icon}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800 }}>
                    {getMotivation(doneCount, totalCount)}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {tasks.map((task) => {
                  const checked = !!selectedDayChecked[task];
                  const isMartaTask = task.includes("Marťa");

                  return (
                    <div
                      key={task}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: "14px",
                        alignItems: "center",
                        background: checked ? BRAND_LIGHT : "#f8fafc",
                        border: checked
                          ? `1px solid ${BRAND}`
                          : "1px solid #d1d5db",
                        borderRadius: "22px",
                        padding: "14px 16px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <button
                        onClick={() => toggleTask(task)}
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "6px",
                          border: checked
                            ? `1.5px solid ${BRAND}`
                            : "1.5px solid #8b8b8b",
                          background: checked ? BRAND : "#fff",
                          color: checked ? "#fff" : "transparent",
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: "16px",
                          lineHeight: 1,
                        }}
                        title="Zaškrtnout"
                      >
                        ✓
                      </button>

                      <div
                        onClick={() => {
                          if (isMartaTask) {
                            setShowImage(true);
                          } else {
                            toggleTask(task);
                          }
                        }}
                        style={{
                          fontSize: "17px",
                          fontWeight: checked ? 800 : 700,
                          cursor: "pointer",
                          userSelect: "none",
                          color: checked ? BRAND_DARK : "#0f172a",
                        }}
                        title={isMartaTask ? "Zobrazit cvičení" : "Zaškrtnout"}
                      >
                        {task}
                      </div>

                      <button
                        onClick={() => removeTask(task)}
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "14px",
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: "18px",
                        }}
                        title="Smazat položku"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ minWidth: 0, display: "grid", gap: "16px" }}>
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #d1d5db",
                borderRadius: "24px",
                padding: "18px",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>
                Přidat položku
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTask();
                  }}
                  placeholder="Např. Pití, cvičení"
                  style={{
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid #cbd5e1",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={addTask}
                  style={{
                    padding: "0 18px",
                    borderRadius: "14px",
                    border: "none",
                    background: BRAND,
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Přidat
                </button>
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #d1d5db",
                borderRadius: "24px",
                padding: "18px",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>
                Posledních 7 dní
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {last7Days.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDate(day.key)}
                    style={{
                      textAlign: "left",
                      background: "#fff",
                      border:
                        selectedDate === day.key
                          ? `2px solid ${BRAND}`
                          : "1px solid #d1d5db",
                      borderRadius: "18px",
                      padding: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px" }}>
                      {formatDateLabel(day.key)}
                    </div>
                    <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                      {day.done} / {day.total} splněno
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: "#e2e8f0",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${day.pct}%`,
                          height: "100%",
                          background:
                            day.pct === 100
                              ? BRAND
                              : day.pct > 0
                              ? "#94a3b8"
                              : "#cbd5e1",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #d1d5db",
                borderRadius: "24px",
                padding: "18px",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>
                Jak to funguje
              </div>

              <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.65 }}>
                ✓ Každý den se ukládá zvlášť.<br />
                ✓ Data zůstávají uložená v tomto zařízení.<br />
                ✓ Položky můžeš přidat nebo smazat.<br />
                ✓ Na mobilu se pravý sloupec přesune pod úkoly.<br />
                ✓ Zaškrtnuté položky mají tyrkysovou barvu.<br />
                ✓ U Marťi klik na text otevře obrázek.<br />
                ✓ Zaškrtnutí Marťi děláš přes checkbox vlevo.<br />
                ✓ Nahoře máš svou mantru a její legendu.
              </div>
            </div>
          </div>
        </div>

        {showImage && (
          <div
            onClick={() => setShowImage(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.82)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <img
                src="/marta.jpg"
                alt="Cvičení a la Marťa"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  borderRadius: "14px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                  background: "#fff",
                }}
              />
              <div
                style={{
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Klikni kamkoli pro zavření
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
