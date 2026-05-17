import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OneBetterGraph from "./OneBetterGraph";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList
} from "recharts";
import { getCategoryData } from "./CategoryConfig";
import Heatmap from "./Heatmap";
import ConsistencyHeatmap from "./ConsistencyHeatmap";
import { apiUrl } from "./api";
import CreateRoutineModal from "./CreateRoutineModal";

import "./Dashboard.css";

// ─── Constants outside component (never recreated) ───────────────────────────

const stateCopy = {
  RISING: { label: "Rising", headline: "Your rhythm is building." },
  STEADY: { label: "Steady", headline: "You are holding the line." },
  RESET:  { label: "Reset",  headline: "Today is still recoverable." }
};

// ─── Pure helpers outside component (never recreated) ────────────────────────

function formatDelta(delta) {
  if (delta > 0) return `+${Math.round(delta)}% vs yesterday`;
  if (delta < 0) return `${Math.round(delta)}% vs yesterday`;
  return "Flat vs yesterday";
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function getMomentumIndicator(state, delta) {
  if (state === "RISING") return { arrow: "↗", label: delta >= 0 ? "High momentum" : "Momentum holding", className: "dashboard-arrow-up" };
  if (state === "RESET")  return { arrow: "↘", label: "Low momentum", className: "dashboard-arrow-down" };
  return { arrow: "→", label: "Balanced momentum", className: "dashboard-arrow-neutral" };
}

function getCategoryStatusStyle(percent) {
  if (percent >= 100) return { backgroundColor: "rgba(34, 197, 94, 0.1)", borderColor: "rgba(34, 197, 94, 0.28)", color: "#166534" };
  if (percent > 0)    return { backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.28)", color: "#b45309" };
  return { backgroundColor: "rgba(255, 255, 255, 0.48)", borderColor: "rgba(45, 36, 24, 0.1)", color: "#6b7280" };
}

function getCompletionValue(habit) {
  return Math.max(Number(habit.remaining_value) || Number(habit.effective_target_value) || Number(habit.target_value) || 1, 1);
}

function getFocusProgress(habit) {
  const completed = Number(habit.completed_today_value) || 0;
  const target = Math.max(Number(habit.effective_target_value) || Number(habit.target_value) || 1, 1);
  const percent = Math.min(Math.round((completed / target) * 100), 100);
  const unit = habit.target_type === "duration" ? "mins" : "done";
  return { percent, text: `${completed} / ${target} ${unit} completed` };
}

function getSessionProgress(habit) {
  const total = Number(habit.total_sessions) || Number(habit.target_value) || 1;
  const completed = Math.min(Number(habit.completed_today_value) || 0, total);
  const remaining = Math.max(total - completed, 0);
  const percent = Math.min(Math.round((completed / total) * 100), 100);
  return { total, completed, remaining, percent };
}

function getHabitTimeBlock(habit) {
  return habit.time_block || "default";
}

function getRoutineFilterId(routineId) {
  return `routine-${routineId}`;
}

// ─── Custom bar label (stable reference, outside component) ──────────────────

const renderCustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  let text = "Focus Here ⚠️";
  let fill = "#f59e0b";
  if (value >= 90) { text = "On Track ✅"; fill = "#22c55e"; }
  else if (value >= 60) { text = "Keep Going"; fill = "#22c55e"; }
  const yPos = Math.max(y - 10, 15);
  return (
    <text x={x + width / 2} y={yPos} fill={fill} textAnchor="middle" fontSize={11} fontWeight={700}>
      {text}
    </text>
  );
};

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch(path, headers) {
  const res = await fetch(apiUrl(path), { headers });
  return { res, data: res.ok ? await res.json() : null };
}

// ─── Component ────────────────────────────────────────────────────────────────

function Dashboard() {
  const [data,             setData]             = useState(null);
  const [habits,           setHabits]           = useState([]);
  const [routines,         setRoutines]         = useState([]);
  const [recentCompleted,  setRecentCompleted]  = useState([]);
  const [heatmapData,      setHeatmapData]      = useState([]);
  const [message,          setMessage]          = useState("");
  const [submittingHabitId,setSubmittingHabitId]= useState(null);
  const [focusFilter,      setFocusFilter]      = useState("all");
  const [focusView,        setFocusView]        = useState("all");
  const [isFirstVisit,     setIsFirstVisit]     = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);

  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const name     = localStorage.getItem("name") || "";

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => { if (!token) navigate("/login"); }, [token, navigate]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = useCallback((isExpired = false) => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    if (isExpired) sessionStorage.setItem("session_expired", "true");
    navigate("/login");
  }, [navigate]);

  // ── Message auto-clear ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(""), 2200);
    return () => window.clearTimeout(t);
  }, [message]);

  // ── Headers memo (stable while token unchanged) ─────────────────────────────
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ── Reusable refresh helpers ────────────────────────────────────────────────
  const refreshHabitsAndDashboard = useCallback(async () => {
    const [{ res: hRes, data: hData }, { res: dRes, data: dData }] = await Promise.all([
      apiFetch("/dashboard/my-habits", headers),
      apiFetch("/dashboard/",          headers)
    ]);
    if (hRes.status === 401 || dRes.status === 401) { handleLogout(true); return; }
    if (hData) setHabits(hData);
    if (dData) setData(dData);
  }, [headers, handleLogout]);

  const refreshAll = useCallback(async () => {

    const { res, data } = await apiFetch("/dashboard/full", headers);

    if (res.status === 401) {
      handleLogout(true);
      return;
    }

    if (!data) return;

    setHabits(data.habits || []);
    setData(data.dashboard || null);
    setHeatmapData(data.heatmap || []);
    setRecentCompleted(data.recent_completed || []);
    setRoutines(data.routines || []);

  }, [headers, handleLogout]);

  // ── Initial load ─────────────────────────────────────────────────────────────
useEffect(() => {

  if (!token) return;

  let cancelled = false;

  async function load() {

    try {

      const { res, data } = await apiFetch("/dashboard/full", headers);

      if (cancelled) return;

      if (res.status === 401) {
        handleLogout(true);
        return;
      }

      if (!data) return;

      setHabits(data.habits || []);
      setData(data.dashboard || null);
      setHeatmapData(data.heatmap || []);
      setRecentCompleted(data.recent_completed || []);
      setRoutines(data.routines || []);

    } catch (err) {

      console.error("Failed to load dashboard:", err);

    }
  }

  load();

  return () => {
    cancelled = true;
  };

}, [token, headers, handleLogout]);

  // ── First-visit flag ─────────────────────────────────────────────────────────
  useEffect(() => {
    const key = "visited_dashboard_global";
    if (!localStorage.getItem(key)) {
      setIsFirstVisit(true);
      localStorage.setItem(key, "true");
    }
  }, []);

  // ── Memoised derived data ────────────────────────────────────────────────────

  const categoryData = useMemo(() =>
    (data?.categories ?? []).map(c => ({
      name: c.name,
      percent: c.percent,
      fill: getCategoryData(c.name).color
    })), [data]);

  const activeHabits = useMemo(() =>
    habits.filter(h => h.is_due_today && !h.completed_today), [habits]);

  const standaloneActiveHabits = useMemo(() =>
    activeHabits.filter(h => !h.routine_id), [activeHabits]);

  const timeBlockSummary = useMemo(() => [
    { id: "morning", label: "Morning", icon: "☀️", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", count: activeHabits.filter(h => getHabitTimeBlock(h) === "morning").length },
    { id: "evening", label: "Evening", icon: "🌆", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", count: activeHabits.filter(h => getHabitTimeBlock(h) === "evening").length },
    { id: "night",   label: "Night",   icon: "🌙", gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", count: activeHabits.filter(h => getHabitTimeBlock(h) === "night").length },
    { id: "default", label: "Constant",icon: "🔄", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)", count: activeHabits.filter(h => getHabitTimeBlock(h) === "default").length }
  ], [activeHabits]);

  const routineTabs = useMemo(() =>
    routines
      .map(r => ({
        id: getRoutineFilterId(r.id),
        routineId: r.id,
        label: r.name,
        icon: r.emoji,
        count: activeHabits.filter(h => Number(h.routine_id) === Number(r.id)).length
      }))
      .filter(t => t.count > 0),
    [routines, activeHabits]);

  const focusTabs = useMemo(() =>
    [{ id: "all", label: "All", count: activeHabits.length }, ...timeBlockSummary, ...routineTabs]
      .filter(t => t.id === "all" || t.count > 0),
    [activeHabits.length, timeBlockSummary, routineTabs]);

  const visibleFocusHabits = useMemo(() => {
    if (focusFilter === "all") return standaloneActiveHabits;
    if (focusFilter.startsWith("routine-")) return [];
    return standaloneActiveHabits.filter(h => getHabitTimeBlock(h) === focusFilter);
  }, [focusFilter, standaloneActiveHabits]);

  const routineCards = useMemo(() =>
    routines
      .map(routine => {
        const routineHabits = activeHabits.filter(h => Number(h.routine_id) === Number(routine.id));
        const visibleRoutineHabits = focusFilter === "all"
          ? routineHabits
          : routineHabits.filter(h => getHabitTimeBlock(h) === focusFilter);
        const completed = visibleRoutineHabits.filter(h => h.completed_today).length;
        const total = visibleRoutineHabits.length;
        return { ...routine, total, completed, progress: total > 0 ? Math.round((completed / total) * 100) : 0, habits: visibleRoutineHabits };
      })
      .filter(r => r.total > 0),
    [routines, activeHabits, focusFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCompleteHabit = useCallback(async (habit) => {
    try {
      setSubmittingHabitId(habit.id);
      const res = await fetch(apiUrl("/logs"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ habit_id: habit.id, value_completed: getCompletionValue(habit) })
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to complete habit");

      // Only re-fetch the two endpoints that change after a log
      const [{ res: hRes, data: hData }, { res: dRes, data: dData }, { res: hmRes, data: hmData }] = await Promise.all([
        apiFetch("/dashboard/my-habits",    headers),
        apiFetch("/dashboard/",             headers),
        apiFetch("/dashboard/heatmap/",     headers)
      ]);
      if (hRes.status === 401 || dRes.status === 401) { handleLogout(); return; }
      if (hData)  setHabits(hData);
      if (dData)  setData(dData);
      if (hmData) setHeatmapData(hmData);
      setMessage(`${habit.title} completed! +${habit.points || 10} Points 🎉`);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to complete habit");
    } finally {
      setSubmittingHabitId(null);
    }
  }, [token, headers, handleLogout]);

  const deleteRoutine = useCallback(async (routineId, routineName) => {
    if (!window.confirm(`Delete "${routineName}" and all its habits? This cannot be undone.`)) return;
    try {
      const res = await fetch(apiUrl(`/routines/${routineId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Delete failed");
      setMessage(`"${routineName}" routine deleted`);
      await refreshHabitsAndDashboard();
      const { res: rRes, data: rData } = await apiFetch("/routines", headers);
      if (rData) setRoutines(rData);
    } catch (err) {
      console.error(err);
      setMessage("Error deleting routine");
    }
  }, [token, headers, handleLogout, refreshHabitsAndDashboard]);

  const handleFilterToggle = useCallback((blockId) => {
    setFocusFilter(prev => prev === blockId ? "all" : blockId);
    setFocusView("all");
  }, []);

  const clearFilter    = useCallback(() => setFocusFilter("all"), []);
  const goHabits       = useCallback(() => navigate("/habits"), [navigate]);
  const goRoutinePage  = useCallback((id) => navigate(`/routines/${id}`, { state: { from: "dashboard" } }), [navigate]);
  const goCategory     = useCallback((name) => navigate(`/category-routine/${encodeURIComponent(name)}`), [navigate]);
  const goRoutinePlanner = useCallback(() => navigate("/habits", { state: { viewMode: "routine" } }), [navigate]);

  // ── Loading / error states ───────────────────────────────────────────────────

  if (!data) {
    return (
      <div className="dashboard-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", opacity: 0.7 }}>
          <h2 style={{ color: "#9ca3af", fontWeight: 500 }}>Organizing your space...</h2>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>Pulling today's progress & momentum</p>
        </div>
      </div>
    );
  }

  // ── Derived display values (cheap, no memo needed) ───────────────────────────

  const momentum          = data.momentum;
  const tone              = stateCopy[momentum.state] || stateCopy.STEADY;
  const momentumIndicator = getMomentumIndicator(momentum.state, momentum.delta);
  const todayProgress     = clampPercent(data.today_progress);
  const momentumScore     = clampPercent(momentum.score);
  const averageScore      = clampPercent(momentum.window_average);
  const completedRatio    = data.total_habits ? `${data.completed_today} / ${data.total_habits}` : "0 / 0";
  const pendingHabits     = activeHabits.length;
  const todayLabel        = new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });
  const displayName       = name || "there";
  const greetingTitle     = isFirstVisit ? `Start your journey, ${displayName}` : `Welcome back, ${displayName}`;
  const greetingCopy      = isFirstVisit ? "Your dashboard is ready. Start with one small win today." : "Pick up your rhythm and keep the day moving.";
  const streakLabel       = data.streak > 0 ? `${data.streak} day streak` : "Start your streak today";

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard-shell">
      <div className="dashboard-frame">
        <div className="dashboard-topbar">
          <div className="dashboard-title-block">
            <p className="dashboard-date">{todayLabel}</p>
          </div>
          <div className="dashboard-actions">
            <button className="dashboard-button dashboard-button-primary" onClick={goHabits}>Go to habits</button>
            <button className="dashboard-button dashboard-button-secondary" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <h1>{isFirstVisit ? `Start your journey, ${name} 🔥` : `Welcome back, ${name} 👋`}</h1>
        <h2>{data.streak > 0 ? `🔥 ${data.streak} day streak` : "🔥 Start your streak today!"}</h2>

        <section className="dashboard-welcome-row">
          <div className="dashboard-welcome-card">
            <span className="dashboard-stat-label">{isFirstVisit ? "First dashboard visit" : "Today"}</span>
            <h1>{greetingTitle}</h1>
            <p>{greetingCopy}</p>
          </div>
          <div className="dashboard-streak-card">
            <span className="dashboard-streak-icon">🔥</span>
            <div>
              <span className="dashboard-stat-label">Streak</span>
              <strong>{streakLabel}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-points-hero">
          <div>
            <span className="dashboard-stat-label">Points today</span>
            <h2>{data.today_points ?? 0} / {data.total_points ?? 0}</h2>
          </div>
          <p>Completed habits add their reward points here.</p>
        </section>

        <section className="dashboard-active-row">
          <aside className="dashboard-panel dashboard-active-card">
            <div className="dashboard-focus-now-head">
              <div>
                <span className="dashboard-stat-label">Focus Now</span>
                <h2>What's your plan for today?</h2>
              </div>
              <div className="dashboard-focus-head-actions">
                <button className="dashboard-routine-button" type="button" onClick={goRoutinePlanner}>View Routine Planner</button>
              </div>
            </div>

            <div className="dashboard-timeblock-grid" aria-label="Time block summary">
              {timeBlockSummary.map((block) => (
                <button
                  key={block.id}
                  className={`dashboard-timeblock-card ${focusFilter === block.id ? "is-active" : ""}`}
                  type="button"
                  onClick={() => handleFilterToggle(block.id)}
                >
                  <div className="dashboard-timeblock-icon" style={{ background: block.gradient }}>
                    <span>{block.icon}</span>
                  </div>
                  <div className="dashboard-timeblock-info">
                    <strong>{block.label}</strong>
                    <span className="dashboard-timeblock-count">{block.count}</span>
                  </div>
                  <small className="dashboard-timeblock-label">{block.count === 1 ? "habit" : "habits"}</small>
                </button>
              ))}
            </div>

            <div className="dashboard-focus-view-switch">
              <button className={`dashboard-view-btn ${focusView === "all"      ? "active" : ""}`} onClick={() => setFocusView("all")}>✨ All</button>
              <button className={`dashboard-view-btn ${focusView === "habits"   ? "active" : ""}`} onClick={() => setFocusView("habits")}>✨ Habits</button>
              <button className={`dashboard-view-btn ${focusView === "routines" ? "active" : ""}`} onClick={() => setFocusView("routines")}>🪄 Routines</button>
            </div>

            {focusFilter !== "all" && (
              <div className="dashboard-focus-filter-bar">
                <span>Showing: <strong>{timeBlockSummary.find(b => b.id === focusFilter)?.label || "All"}</strong></span>
                <button className="dashboard-filter-clear" onClick={clearFilter}>✕ Clear filter</button>
              </div>
            )}

            {/* ── All view ── */}
            {focusView === "all" && (visibleFocusHabits.length > 0 || routineCards.length > 0) && (
              <div className="dashboard-focus-strip dashboard-focus-strip-mixed" aria-label="Active habits and routines">
                {visibleFocusHabits.map((habit) => {
                  const progress = getFocusProgress(habit);
                  const sessionProgress = getSessionProgress(habit);
                  return (
                    <article key={habit.id} className="dashboard-focus-card" onClick={goHabits} style={{ cursor: "pointer" }}>
                      <div className="dashboard-focus-card-top">
                        <span>{habit.category?.trim() || "Uncategorized"}</span>
                        <h3>{habit.title}</h3>
                      </div>
                      <p className="dashboard-focus-progress-text">{progress.text}</p>
                      <div className="dashboard-focus-progress-track" aria-hidden="true">
                        <div className="dashboard-focus-progress-fill" style={{ width: `${progress.percent}%` }} />
                      </div>
                      <p className="dashboard-focus-copy">{sessionProgress.remaining > 0 ? `${sessionProgress.remaining} left today` : "Almost complete 🔥"}</p>
                      <button
                        className="dashboard-focus-complete"
                        onClick={(e) => { e.stopPropagation(); handleCompleteHabit(habit); }}
                        disabled={submittingHabitId === habit.id}
                        type="button"
                      >
                        {submittingHabitId === habit.id ? "Saving..." : "Complete"}
                      </button>
                    </article>
                  );
                })}
                {routineCards.map((routine) => (
                  <div key={routine.id} className="dashboard-routine-card-wrapper">
                    <article className="dashboard-routine-card dashboard-routine-card-compact" onClick={() => goRoutinePage(routine.id)}>
                      <div className="drc-header">
                        <div className="drc-emoji-badge">{routine.emoji}</div>
                        <div className="drc-header-info">
                          <h3 className="drc-name">{routine.name}</h3>
                          <span className="drc-habit-count">{routine.total} {routine.total === 1 ? "habit" : "habits"}</span>
                        </div>
                      </div>
                      <div className="drc-stats-row">
                        <span className="drc-stat-chip drc-stat-done"><span className="drc-stat-icon">✓</span>{routine.completed}/{routine.total}</span>
                        <span className="drc-stat-chip drc-stat-pct">{routine.progress}%</span>
                      </div>
                      <div className="drc-progress-section">
                        <div className="drc-progress-track">
                          <div className="drc-progress-fill" style={{ width: `${routine.progress}%` }} />
                        </div>
                      </div>
                      <div className="drc-footer"><span className="drc-open-label">Open routine</span><span className="drc-arrow">→</span></div>
                    </article>
                    <button className="dashboard-routine-delete-btn" type="button" onClick={(e) => { e.stopPropagation(); deleteRoutine(routine.id, routine.name); }} title={`Delete ${routine.name}`} aria-label={`Delete ${routine.name}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Habits-only view ── */}
            {focusView === "habits" && (
              visibleFocusHabits.length === 0
                ? <p className="dashboard-empty-copy">No active habits left today. Your dashboard is clear.</p>
                : (
                  <div className="dashboard-focus-strip" aria-label="Active habits">
                    {visibleFocusHabits.map((habit) => {
                      const progress = getFocusProgress(habit);
                      const sessionProgress = getSessionProgress(habit);
                      return (
                        <article key={habit.id} className="dashboard-focus-card" onClick={goHabits} style={{ cursor: "pointer" }}>
                          <div className="dashboard-focus-card-top">
                            <span>{habit.category?.trim() || "Uncategorized"}</span>
                            <h3>{habit.title}</h3>
                          </div>
                          <p className="dashboard-focus-progress-text">{progress.text}</p>
                          <div className="dashboard-focus-progress-track" aria-hidden="true">
                            <div className="dashboard-focus-progress-fill" style={{ width: `${progress.percent}%` }} />
                          </div>
                          <p className="dashboard-focus-copy">{sessionProgress.remaining > 0 ? `${sessionProgress.remaining} left today` : "Almost complete 🔥"}</p>
                          <button
                            className="dashboard-focus-complete"
                            onClick={(e) => { e.stopPropagation(); handleCompleteHabit(habit); }}
                            disabled={submittingHabitId === habit.id}
                            type="button"
                          >
                            {submittingHabitId === habit.id ? "Saving..." : "Complete"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )
            )}

            {/* ── Routines-only view ── */}
            {focusView === "routines" && (
              <div className="dashboard-routines-grid">
                {routineCards.map((routine) => (
                  <div key={routine.id} className="dashboard-routine-card-wrapper">
                    <article className="dashboard-routine-card" onClick={() => goRoutinePage(routine.id)}>
                      <div className="drc-header">
                        <div className="drc-emoji-badge drc-emoji-badge--large">{routine.emoji}</div>
                        <div className="drc-header-info">
                          <h3 className="drc-name">{routine.name}</h3>
                          <span className="drc-habit-count">{routine.total} {routine.total === 1 ? "habit" : "habits"}</span>
                        </div>
                      </div>
                      <div className="drc-stats-row">
                        <span className="drc-stat-chip drc-stat-done"><span className="drc-stat-icon">✓</span>{routine.completed}/{routine.total} done</span>
                        <span className="drc-stat-chip drc-stat-pct">{routine.progress}%</span>
                      </div>
                      <div className="drc-progress-section">
                        <div className="drc-progress-track">
                          <div className="drc-progress-fill" style={{ width: `${routine.progress}%` }} />
                        </div>
                      </div>
                      <div className="drc-footer"><span className="drc-open-label">Open routine</span><span className="drc-arrow">→</span></div>
                    </article>
                    <button className="dashboard-routine-delete-btn" type="button" onClick={(e) => { e.stopPropagation(); deleteRoutine(routine.id, routine.name); }} title={`Delete ${routine.name}`} aria-label={`Delete ${routine.name}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                ))}
                <button className="dashboard-routine-card dashboard-routine-card-add" type="button" onClick={() => setShowRoutineModal(true)}>
                  <div className="drc-header">
                    <div className="drc-emoji-badge drc-emoji-badge--add">+</div>
                    <div className="drc-header-info">
                      <h3 className="drc-name">Add Routine</h3>
                      <span className="drc-habit-count">Create a new routine</span>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </aside>
        </section>

        <section className="dashboard-insight-grid" id="insights">
          <article className="dashboard-panel dashboard-category-card">
            <div className="dashboard-card-head">
              <div>
                <span className="dashboard-stat-label">By area</span>
                <h3>Category Progress</h3>
              </div>
              <strong>{Math.round(todayProgress)}%</strong>
            </div>
            <div className="dashboard-category-chart">
              <ResponsiveContainer>
                <BarChart data={categoryData} margin={{ top: 18, right: 8, left: 4, bottom: 2 }} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4b5563" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1f2937" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#374151" strokeOpacity={0.24} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`} onClick={() => goCategory(payload.value)} style={{ cursor: "pointer" }}>
                          <text x={0} y={0} dy={16} textAnchor="middle" fill="#1f2937" fontSize={13} fontWeight={700}>{payload.value}</text>
                        </g>
                      );
                    }}
                    height={50}
                  />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 700 }} tickFormatter={(v) => `${v}`} width={34} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "12px", color: "#f9fafb", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", padding: "12px 16px" }}
                    itemStyle={{ color: "#a5b4fc", fontWeight: "600" }}
                    formatter={(v) => [`${v}%`, "Completed"]}
                  />
                  <Bar dataKey="percent" radius={[6, 6, 0, 0]} barSize={38} maxBarSize={54} minPointSize={8}
                    activeBar={{ cursor: "pointer", stroke: "#1f2937", strokeWidth: 1.5, fillOpacity: 0.9 }}
                    onClick={(d) => { if (d?.payload?.name) goCategory(d.payload.name); }}
                    style={{ cursor: "pointer" }}
                  >
                    <LabelList dataKey="percent" content={renderCustomBarLabel} />
                    {categoryData.map((entry, i) => {
                      let fill = "#f59e0b";
                      if (entry.percent >= 90) fill = "#166534";
                      else if (entry.percent >= 60) fill = "#22c55e";
                      return <Cell key={`cell-${i}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="dashboard-category-summary">
              {categoryData.map((category) => {
                const statusStyle = getCategoryStatusStyle(category.percent);
                return (
                  <button key={category.name} className="dashboard-category-chip" onClick={() => goCategory(category.name)}
                    style={{ backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor }} type="button"
                  >
                    <span>{category.name}</span>
                    <strong style={{ color: statusStyle.color }}>{Math.round(category.percent)}%</strong>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="dashboard-panel dashboard-momentum-card" id="momentum">
            <div className="dashboard-momentum-head">
              <span className={`dashboard-label dashboard-label-${momentum.state.toLowerCase()}`}>{tone.label} momentum</span>
              <div className={`dashboard-momentum-arrow ${momentumIndicator.className}`}><span>{momentumIndicator.arrow}</span></div>
            </div>
            <div className="dashboard-momentum-main">
              <div>
                <h2 className="dashboard-headline">Momentum</h2>
                <p className="dashboard-copy">{tone.headline}</p>
              </div>
              <div className="dashboard-score-block">
                <span className="dashboard-stat-label">Momentum score</span>
                <p className="dashboard-score-value">{Math.round(momentumScore)}%</p>
                <p className={`dashboard-score-status ${momentumIndicator.className}`}>{momentumIndicator.label}</p>
              </div>
            </div>
            <div className="dashboard-track" aria-hidden="true">
              <div className="dashboard-fill dashboard-fill-momentum" style={{ width: `${momentumScore}%` }} />
            </div>
            <div className="dashboard-momentum-footer">
              <p className="dashboard-copy">{momentum.message}</p>
              <div className="dashboard-momentum-stats">
                <div><span className="dashboard-stat-label">Trend</span><strong>{formatDelta(momentum.delta)}</strong></div>
                <div><span className="dashboard-stat-label">3-day average</span><strong>{Math.round(averageScore)}%</strong></div>
              </div>
            </div>
          </article>
        </section>

        <OneBetterGraph />
        <ConsistencyHeatmap data={heatmapData} />

        {message && <p className="dashboard-message">{message}</p>}

        <section className="dashboard-panel dashboard-progress-hero">
          <div className="dashboard-progress-hero-head">
            <div>
              <span className="dashboard-stat-label">Today&apos;s progress</span>
              <h2 className="dashboard-progress-hero-title">{Math.round(todayProgress)}% complete</h2>
            </div>
            <strong className="dashboard-progress-ratio">{completedRatio}</strong>
          </div>
          <div className="dashboard-track dashboard-track-large" aria-hidden="true">
            <div className="dashboard-fill" style={{ width: `${todayProgress}%` }} />
          </div>
          <div className="dashboard-progress-summary">
            <div className="dashboard-progress-pill"><span>Completed</span><strong>{data.completed_today}</strong></div>
            <div className="dashboard-progress-pill"><span>Active today</span><strong>{activeHabits.length}</strong></div>
            <div className="dashboard-progress-pill"><span>Momentum</span><strong>{tone.label}</strong></div>
          </div>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-panel dashboard-stat-card">
            <span className="dashboard-stat-label">Today</span>
            <p className="dashboard-stat-value">{Math.round(todayProgress)}%</p>
            <p className="dashboard-stat-note">Average progress across scheduled habits</p>
          </article>
          <article className="dashboard-panel dashboard-stat-card">
            <span className="dashboard-stat-label">Completed</span>
            <p className="dashboard-stat-value">{completedRatio}</p>
            <p className="dashboard-stat-note">Habits fully finished today</p>
          </article>
          <article className="dashboard-panel dashboard-stat-card">
            <span className="dashboard-stat-label">3-day average</span>
            <p className="dashboard-stat-value">{Math.round(averageScore)}%</p>
            <p className="dashboard-stat-note">Broader signal, less daily noise</p>
          </article>
          <article className="dashboard-panel dashboard-stat-card">
            <span className="dashboard-stat-label">Trend</span>
            <p className={`dashboard-stat-value ${momentum.delta >= 0 ? "dashboard-stat-positive" : "dashboard-stat-negative"}`}>
              {momentumIndicator.arrow} {momentum.delta >= 0 ? "+" : ""}{Math.round(momentum.delta)}%
            </p>
            <p className="dashboard-stat-note">Change from yesterday</p>
          </article>
        </section>

        <section className="dashboard-bottom">
          <article className="dashboard-panel dashboard-readout-card">
            <div className="dashboard-readout-head">
              <div>
                <span className="dashboard-stat-label">Readout</span>
                <h3 className="dashboard-readout-title">Today first, momentum second</h3>
              </div>
              <button className="dashboard-button dashboard-button-secondary dashboard-button-small" onClick={goHabits}>Active habits</button>
            </div>
            <div className="dashboard-detail-list">
              <div className="dashboard-detail-item"><span>Today vs yesterday</span><strong>{formatDelta(momentum.delta)}</strong></div>
              <div className="dashboard-detail-item"><span>Pending habits</span><strong>{pendingHabits}</strong></div>
              <div className="dashboard-detail-item"><span>Yesterday&apos;s progress</span><strong>{Math.round(clampPercent(momentum.yesterday))}%</strong></div>
              <div className="dashboard-detail-item"><span>Next action</span><strong>{activeHabits.length > 0 ? "Finish one active habit" : "Review habits"}</strong></div>
            </div>
          </article>
        </section>
      </div>

      {showRoutineModal && (
        <CreateRoutineModal
          token={token}
          onClose={() => setShowRoutineModal(false)}
          onCreated={async () => {
            setShowRoutineModal(false);
            setMessage("Routine created! 🎉");
            await refreshAll();
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;