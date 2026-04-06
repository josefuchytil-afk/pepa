"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_TASKS = [
  "Ranní hygiena",
  "Ranní cvičení a la Marťa",
  "Ranní posilování - kliky, dřepy, sedy-lehy",
  "Ranní prášky",
  "Večerní nehřešení",
];

const STORAGE_KEY = "pepa-checklist-v1";

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function createEmptyDay(tasks) {
  const checked = {};
  for (const task of tasks) {
    checked[task] = false;
  }

  return {
    date: getTodayKey(),
    checked,
  };
}

export default function Page() {
  const [tasks] = useState(DEFAULT_TASKS);
  const [dayData, setDayData] = useState(createEmptyDay(DEFAULT_TASKS));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const today = getTodayKey();

      if (!raw) {
        const empty = createEmptyDay(DEFAULT_TASKS);
        setDayData(empty);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
        return;
      }

      const parsed = JSON.parse(raw);

      if (!parsed || !parsed.date || parsed.date !== today) {
        const reset = createEmptyDay(DEFAULT_TASKS);
        setDayData(reset);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
        return;
      }

      const normalized = {
        date: today,
        checked: {},
      };

      for (const task of DEFAULT_TASKS) {
        normalized.checked[task] = !!(parsed.checked && parsed.checked[task]);
      }

      setDayData(normalized);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      const empty = createEmptyDay(DEFAULT_TASKS);
      setDayData(empty);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dayData));
  }, [dayData, mounted]);

  const doneCount = useMemo(() => {
    return Object.values(dayData.checked).filter(Boolean).length;
  }, [dayData]);

  const totalCount = tasks.length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  function toggleTask(task) {
    setDayData((prev) => ({
      ...prev,
      checked: {
        ...prev.checked,
        [task]: !prev.checked[task],
      },
    }));
  }

  function resetToday() {
    const empty = createEmptyDay(tasks);
    setDayData(empty);
  }

  if (!mounted) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h1 style={{ margin: 0, fontSize: "28px" }}>Můj checklist</h1>
            <p style={{ margin: "6px 0 0 0", color: "#64748b", fontSize: "14px" }}>
              {dayData.date}
            </p>
          </div>

          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              background: "#f8fafc",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              <span>Splněno</span>
              <strong>
                {doneCount} / {totalCount}
              </strong>
            </div>

            <div
              style={{
                width: "100%",
                height: "12px",
                background: "#e2e8f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: "#0f172a",
                  borderRadius: "999px",
                  transition: "width 0.2s ease",
                }}
              />
            </div>

            <div style={{ marginTop: "8px", fontSize: "14px", color: "#475569" }}>
              {percent} %
            </div>
          </div>

          <div>
            {tasks.map((task) => {
              const checked = !!dayData.checked[task];

              return (
                <button
                  key={task}
                  onClick={() => toggleTask(task)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    marginBottom: "10px",
                    borderRadius: "16px",
                    border: checked ? "1px solid #22c55e" : "1px solid #cbd5e1",
                    background: checked ? "#f0fdf4" : "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "14px",
                      fontWeight: "bold",
                      border: checked ? "1px solid #16a34a" : "1px solid #cbd5e1",
                      background: checked ? "#16a34a" : "#ffffff",
                      color: checked ? "#ffffff" : "transparent",
                    }}
                  >
                    ✓
                  </div>

                  <div
                    style={{
                      fontSize: "16px",
                      lineHeight: 1.35,
                      fontWeight: checked ? "600" : "400",
                      color: "#1e293b",
                    }}
                  >
                    {task}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={resetToday}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "14px",
              borderRadius: "16px",
              border: "none",
              background: "#0f172a",
              color: "#ffffff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reset dne
          </button>
        </div>
      </div>
    </main>
  );
}
