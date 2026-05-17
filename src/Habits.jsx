import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Habits.css";
import "./Auth.css";
import CreateRoutineModal from "./CreateRoutineModal";
import CreateHabitModal from "./CreateHabitModal";
import FocusSessionModal from "./FocusSessionModal";
import { getCategoryData } from "./CategoryConfig";
import { apiUrl } from "./api";

const TIME_BLOCK_FILTERS = [
  { id: "all", label: "All" },
  { id: "morning", label: "Morning" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

function getQuickValues(habit) {
  if (habit.target_type === "duration") {
    return [10, 15, 30].filter((value, index, array) => value > 0 && array.indexOf(value) === index);
  }
  const target = Number(habit.target_value) || 1;
  const values = [1, Math.min(3, target), Math.min(5, target)];
  return values.filter((value, index, array) => value > 0 && array.indexOf(value) === index);
}

function formatQuickLabel(habit, value) {
  return habit.target_type === "duration" ? `+${value} min` : `+${value}`;
}

function getHabitCategoryLabel(habit) {
  return habit.category?.trim() || "Uncategorized";
}

function formatScheduleTime(scheduledTime) {
  if (!scheduledTime) return "Anytime";
  return new Date(`1970-01-01T${scheduledTime}`).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function getHabitPoints(habit) {
  return Number(habit.points) || 10;
}

function normalizeHabits(habits) {
  const seen = new Map();
  habits.forEach((habit) => { if (habit?.id != null) seen.set(habit.id, habit); });
  return Array.from(seen.values());
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

/* ── Small reusable icon components ── */
function IconPencil() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
      <path d="m15 5 4 4"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 2l4 4-4 4"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <path d="M7 22l-4-4 4-4"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}
function getProgressPercent(habit) {
  if (habit.is_session) {
    return getSessionProgress(habit).percent;
  }

  return Number(habit.progress_percent) || 0;
}

function applyHabitProgress(habit, value) {
  const completedValue = (Number(habit.completed_today_value) || 0) + Number(value);
  const target = Math.max(
    Number(habit.effective_target_value) || Number(habit.target_value) || 1,
    1
  );
  const progressPercent = Math.min(Math.round((completedValue / target) * 100), 100);
  const remainingValue = Math.max(target - completedValue, 0);

  return {
    ...habit,
    completed_today_value: completedValue,
    progress_percent: progressPercent,
    remaining_value: remainingValue,
    completed_today: progressPercent >= 100,
  };
}
/* ── Habit card ── */
function HabitCard({ habit, submittingHabitId, customValues, onEdit, onDelete, onQuick, onCustomChange, onCustomSubmit, onFocus, onCategoryClick }) {
  const sessionProgress = getSessionProgress(habit);
  const catData = getCategoryData(getHabitCategoryLabel(habit));
  const isSubmitting = submittingHabitId === habit.id;
 

  return (
    <article className="hcard">
      {/* Top row: title + actions */}
      <div className="hcard-top">
        <div className="hcard-title-wrap">
          <h4 className="hcard-title">{habit.title}</h4>
          <button
            className="hcard-cat-tag"
            style={{ background: `${catData.color}18`, color: catData.color, borderColor: `${catData.color}35` }}
            onClick={() => onCategoryClick(getHabitCategoryLabel(habit))}
          >
            {getHabitCategoryLabel(habit)}
          </button>
        </div>
        <div className="hcard-actions">
          <button className="hcard-btn hcard-btn--edit" onClick={() => onEdit(habit)} title="Edit">
            <IconPencil />
          </button>
          <button className="hcard-btn hcard-btn--delete" onClick={() => onDelete(habit.id)} title="Delete">
            <IconTrash />
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <p className="hcard-sub">
        {habit.is_session
          ? `${habit.total_sessions} sessions · ${habit.focus_time} min focus · ${habit.break_time} min break`
          : `${habit.target_type === "duration" ? "Minutes" : "Count"} target: ${habit.target_value}`}
      </p>

      {/* Meta chips */}
      <div className="hcard-meta">
        <span className="hcard-chip hcard-chip--points"><IconZap /> {getHabitPoints(habit)} pts</span>
        {!habit.is_session && (
          <>
            <span className="hcard-chip"><IconClock /> {formatScheduleTime(habit.scheduled_time)}</span>
            <span className="hcard-chip"><IconRepeat /> {habit.repeat}</span>
            {habit.repeat === "custom" && habit.days?.length > 0 && (
              <span className="hcard-chip">{habit.days.join(", ")}</span>
            )}
          </>
        )}
        {habit.is_session && <span className="hcard-chip">Session habit</span>}
      </div>

      {/* Progress */}
      <div className="hcard-progress">
        <div className="hcard-progress-info">
          {habit.is_session ? (
            <>
              <span className="hcard-progress-pct">{sessionProgress.percent}%</span>
              <span className="hcard-progress-detail">{sessionProgress.completed}/{sessionProgress.total} sessions · {sessionProgress.remaining} left</span>
            </>
          ) : (
            <>
              <span className="hcard-progress-pct">{habit.progress_percent}%</span>
              <span className="hcard-progress-detail">
                {habit.remaining_value}{habit.target_type === "duration" ? " min" : ""} remaining
              </span>
            </>
          )}
        </div>
        <div className="hcard-track" aria-hidden="true">
          <div
            className="hcard-fill"
            style={{ width: `${habit.is_session ? sessionProgress.percent : habit.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="hcard-footer">
        {habit.is_session ? (
          <button className="hcard-focus-btn" onClick={() => onFocus(habit)}>
            Start Focus Session
          </button>
        ) : (
          <>
            <div className="hcard-quick">
              {getQuickValues(habit).map((v) => (
                <button
                  key={v}
                  className="hcard-quick-btn"
                  onClick={() => onQuick(habit, v)}
                  disabled={isSubmitting}
                >
                  {formatQuickLabel(habit, v)}
                </button>
              ))}
            </div>
            <div className="hcard-custom">
              <input
                type="number"
                min="1"
                value={customValues[habit.id] || ""}
                onChange={(e) => onCustomChange(habit.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCustomSubmit(habit)}
                placeholder={habit.target_type === "duration" ? "Custom min" : "Custom value"}
                className="hcard-input"
              />
              <button
                className="hcard-add-btn"
                onClick={() => onCustomSubmit(habit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "…" : "Add"}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

/* ── Completed habit row ── */
function DoneItem({ habit, onEdit, onDelete, onCategoryClick }) {
  return (
    <div className="done-item">
      <div className="done-item-left">
        <span className="done-check"><IconCheck /></span>
        <div className="done-copy">
          <strong>{habit.title}</strong>
          <span>
            {habit.is_session
              ? `All ${habit.total_sessions} sessions`
              : `${habit.completed_today_value}${habit.target_type === "duration" ? " min" : ""}`}
            {" · "}
            <span className="done-pts">{getHabitPoints(habit)} pts</span>
          </span>
        </div>
      </div>
      <div className="done-item-right">
        <button
          className="hcard-cat-tag"
          style={{ background: `${getCategoryData(getHabitCategoryLabel(habit)).color}18`, color: getCategoryData(getHabitCategoryLabel(habit)).color, borderColor: `${getCategoryData(getHabitCategoryLabel(habit)).color}35` }}
          onClick={() => onCategoryClick(getHabitCategoryLabel(habit))}
        >
          {getHabitCategoryLabel(habit)}
        </button>
        <button className="hcard-btn hcard-btn--edit" onClick={() => onEdit(habit)} title="Edit"><IconPencil /></button>
        <button className="hcard-btn hcard-btn--delete" onClick={() => onDelete(habit.id)} title="Delete"><IconTrash /></button>
      </div>
    </div>
  );
}

/* ── Main component ── */
function Habit() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const sectionRef = useRef(null);
  
  const initialTab = location.state?.tab === "completed" ? "completed" : "active";
  const [currentTab, setCurrentTab] = useState(initialTab);
  
  const [habits, setHabits] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_habits_data");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [routines, setRoutines] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_routines_data");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_habits_data");
      return !cached;
    } catch {
      return true;
    }
  });
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [customValues, setCustomValues] = useState({});
  const [submittingHabitId, setSubmittingHabitId] = useState(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [focusHabit, setFocusHabit] = useState(null);
  const [viewMode, setViewMode] = useState(location.state?.viewMode === "routine" ? "routine" : "all");
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [routineTimeFilter, setRoutineTimeFilter] = useState("all");
  const [prefillRoutineId, setPrefillRoutineId] = useState(null);
  const [prefillTimeBlock, setPrefillTimeBlock] = useState("default");

  const showTemporaryMessage = useCallback((nextMessage) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2500);
  }, []);

  const handleLogout = useCallback((isExpired = false) => {
    localStorage.removeItem("token");
    if (isExpired) {
      sessionStorage.setItem("session_expired", "true");
    }
    navigate("/login");
  }, [navigate]);
  const fetchRoutines = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/routines"), { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to fetch routines");
      const data = await res.json();
      setRoutines(data);
      localStorage.setItem("cached_routines_data", JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
  }, [handleLogout, token]);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/habits"), { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Failed to load habits");
      const data = normalizeHabits(await res.json());
      setHabits(data);
      localStorage.setItem("cached_habits_data", JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setMessage("Failed to load habits");
    }
  }, [handleLogout, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function loadData() {
      const cached = localStorage.getItem("cached_habits_data");
      if (!cached) setIsLoading(true);
      try {
        await Promise.all([fetchHabits(), fetchRoutines()]);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [token, fetchHabits, fetchRoutines]);
  useEffect(() => { setCurrentTab(initialTab); }, [initialTab]);
  useEffect(() => {
    if (location.state?.viewMode === "routine") {
      setViewMode("routine");
    }
  }, [location.state]);

  useEffect(() => {
    const handleMutation = () => {
      fetchHabits();
      fetchRoutines();
    };
    window.addEventListener("habit-mutate", handleMutation);
    return () => window.removeEventListener("habit-mutate", handleMutation);
  }, [fetchHabits, fetchRoutines]);

  const activeHabits = useMemo(() => habits.filter((h) => h.is_due_today && !h.completed_today), [habits]);
  const completedHabits = useMemo(() => habits.filter((h) => h.is_due_today && h.completed_today), [habits]);
  const currentHabits = useMemo(() => currentTab === "active" ? activeHabits : completedHabits, [activeHabits, completedHabits, currentTab]);
  const categories = useMemo(() => ["All", ...new Set(currentHabits.map(getHabitCategoryLabel))], [currentHabits]);

  const filterByCategory = useCallback((list) =>
    selectedCategory === "All" ? list : list.filter((h) => getHabitCategoryLabel(h)?.toLowerCase().trim() === selectedCategory.toLowerCase().trim()),
    [selectedCategory]
  );

  const filteredActive = filterByCategory(activeHabits);
  const filteredCompleted = filterByCategory(completedHabits);
  const visibleHabits = currentTab === "active" ? filteredActive : filteredCompleted;

  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory("All");
  }, [categories, selectedCategory]);

  const jumpToSection = useCallback(() => {
    window.requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const handleTabChange = (tab) => { setCurrentTab(tab); jumpToSection(); };
  const handleSelectCategory = (cat, tab = currentTab) => { setSelectedCategory(cat); setCurrentTab(tab); jumpToSection(); };

  const handleAddHabit = (habitData) => {
    // 1. Immediately close the modal to make it feel extremely responsive!
    setShowModal(false);
    setPrefillRoutineId(null);
    setPrefillTimeBlock("default");
    showTemporaryMessage("Habit added!");

    // 2. Build a temporary optimistic habit object
    const optimisticHabit = {
      id: `temp-${Date.now()}`,
      title: habitData.title,
      category: habitData.category,
      target_type: habitData.target_type,
      target_value: habitData.target_value,
      time_block: habitData.time_block,
      routine_id: habitData.routine_id,
      points: habitData.points || 10,
      repeat: habitData.repeat,
      days: habitData.days,
      scheduled_time: habitData.scheduled_time,
      is_session: habitData.is_session,
      focus_time: habitData.focus_time,
      break_time: habitData.break_time,
      total_sessions: habitData.total_sessions,
      // Default progress fields so it renders correctly
      completed_today: false,
      remaining_value: habitData.target_value,
      is_due_today: true,
      current_streak: 0,
      history: []
    };

    // 3. Update the habits list in state and cache immediately!
    setHabits((prev) => {
      const next = [optimisticHabit, ...prev];
      localStorage.setItem("cached_habits_data", JSON.stringify(next));
      return next;
    });

    // 4. Send the background POST request to the server
    fetch(apiUrl("/habits"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(habitData) })
      .then((r) => { 
        if (r.status === 401) { handleLogout(); return null; } 
        if (!r.ok) throw new Error("Could not add habit"); 
        return r.json(); 
      })
      .then((actualHabit) => {
        if (!actualHabit) return;
        // Replace the temporary optimistic habit with the real one from the server
        setHabits((prev) => {
          const next = prev.map((h) => h.id === optimisticHabit.id ? actualHabit : h);
          localStorage.setItem("cached_habits_data", JSON.stringify(next));
          return next;
        });
        window.dispatchEvent(new Event("habit-mutate"));
      })
      .catch((e) => { 
        console.error(e); 
        // Rollback the optimistic update on failure
        setHabits((prev) => {
          const next = prev.filter((h) => h.id !== optimisticHabit.id);
          localStorage.setItem("cached_habits_data", JSON.stringify(next));
          return next;
        });
        setMessage("Could not add habit: " + e.message); 
      });
  };

  const deleteHabit = (id) => {
    // 1. Save original state for potential rollback
    const originalHabits = [...habits];

    // 2. Immediately filter out the habit from state & cache in less than 1ms
    setHabits((p) => {
      const next = p.filter((h) => h.id !== id);
      localStorage.setItem("cached_habits_data", JSON.stringify(next));
      return next;
    });

    showTemporaryMessage("Habit deleted");
    window.dispatchEvent(new Event("habit-mutate"));

    // 3. Make delete call in background
    fetch(apiUrl(`/habits/${id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) { handleLogout(); return null; }
        if (!r.ok) throw new Error("Delete failed");
        
        // Background refresh to guarantee sync correctness
        fetchHabits();
      })
      .catch((e) => {
        console.error(e);
        // Rollback on failure
        setHabits(originalHabits);
        localStorage.setItem("cached_habits_data", JSON.stringify(originalHabits));
        showTemporaryMessage("Error deleting habit");
      });
  };

  const deleteRoutine = (routineId, routineName) => {
    if (!window.confirm(`Delete "${routineName}" and all its habits? This cannot be undone.`)) return;

    // Save states for potential rollback
    const originalRoutines = [...routines];
    const originalHabits = [...habits];

    // Optimistically update local states & caches immediately
    setRoutines((prev) => {
      const next = prev.filter((r) => r.id !== routineId);
      localStorage.setItem("cached_routines_data", JSON.stringify(next));
      return next;
    });

    setHabits((prev) => {
      const next = prev.filter((h) => Number(h.routine_id) !== Number(routineId));
      localStorage.setItem("cached_habits_data", JSON.stringify(next));
      return next;
    });

    showTemporaryMessage(`"${routineName}" routine deleted`);
    window.dispatchEvent(new Event("habit-mutate"));

    fetch(apiUrl(`/routines/${routineId}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) { handleLogout(); return null; }
        if (!r.ok) throw new Error("Delete failed");
        
        // Background refresh to guarantee database sync
        fetchRoutines();
        fetchHabits();
      })
      .catch((e) => {
        console.error(e);
        // Rollback on failure
        setRoutines(originalRoutines);
        setHabits(originalHabits);
        localStorage.setItem("cached_routines_data", JSON.stringify(originalRoutines));
        localStorage.setItem("cached_habits_data", JSON.stringify(originalHabits));
        showTemporaryMessage("Error deleting routine");
      });
  };

  const handleEditHabit = (habit) => { setPrefillRoutineId(null); setEditingHabit(habit); setShowModal(true); };

  const handleUpdateHabit = (habitData) => {
    if (!editingHabit || isAddingHabit) return;
    setIsAddingHabit(true);
    fetch(apiUrl(`/habits/${editingHabit.id}`), { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(habitData) })
      .then((r) => { if (r.status === 401) { handleLogout(); return null; } if (!r.ok) throw new Error("Could not update habit"); return r.json(); })
      .then((h) => {
        if (!h) return;
        setEditingHabit(null);
        setShowModal(false);
        showTemporaryMessage("Habit updated!");
        window.dispatchEvent(new Event("habit-mutate"));
        return fetchHabits();
      })
      .catch((e) => { console.error(e); setMessage(e.message || "Error updating habit"); })
      .finally(() => setIsAddingHabit(false));
  };

  const categorySummary = useMemo(() => {
    const todayHabits = [...activeHabits, ...completedHabits];
    const grouped = new Map();
    todayHabits.forEach((habit) => {
      const category = getHabitCategoryLabel(habit);
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(habit);
    });

    return Array.from(grouped.entries())
      .map(([category, items]) => {
        const avgPercent = Math.round(items.reduce((sum, h) => sum + getProgressPercent(h), 0) / Math.max(items.length, 1));
        const done = items.filter((h) => h.completed_today).length;
        return { category, avgPercent, done, total: items.length };
      })
      .sort((a, b) => b.avgPercent - a.avgPercent)
      .slice(0, 4);
  }, [activeHabits, completedHabits]);
  const submitProgress = (habit, value) => {
    const parsed = Number(value);
    if (!parsed || parsed < 0) { setMessage("Enter a valid progress value"); return; }
    const originalHabits = habits;
    setSubmittingHabitId(habit.id);
    setHabits((prev) => {
      const next = prev.map((item) => item.id === habit.id ? applyHabitProgress(item, parsed) : item);
      localStorage.setItem("cached_habits_data", JSON.stringify(next));
      return next;
    });
    setCustomValues((p) => ({ ...p, [habit.id]: "" }));
    showTemporaryMessage(`${habit.title} +${parsed}${habit.target_type === "duration" ? " min" : ""}`);

    fetch(apiUrl("/logs"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ habit_id: habit.id, value_completed: parsed }) })
      .then((r) => { if (r.status === 401) { handleLogout(); return null; } if (!r.ok) throw new Error("Failed to update habit"); return r.json(); })
      .then((result) => {
        if (!result) return;
        window.dispatchEvent(new Event("habit-mutate"));
        return fetchHabits();
      })
      .catch((e) => {
        console.error(e);
        setHabits(originalHabits);
        localStorage.setItem("cached_habits_data", JSON.stringify(originalHabits));
        setMessage(e.message || "Could not update progress");
      })
      .finally(() => setSubmittingHabitId(null));
  };

  const handleCustomValueChange = (habitId, value) => setCustomValues((p) => ({ ...p, [habitId]: value }));
  const handleCustomSubmit = (habit) => submitProgress(habit, customValues[habit.id]);

  const totalToday = activeHabits.length + completedHabits.length;
  const doneToday = completedHabits.length;
  const overallPct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;
    const defaultHabits = visibleHabits.filter(
    (habit) => !habit.routine_id && habit.time_block === "default"
  );

  const morningHabits = visibleHabits.filter(
    (habit) => !habit.routine_id && habit.time_block === "morning"
  );

  const eveningHabits = visibleHabits.filter(
    (habit) => !habit.routine_id && habit.time_block === "evening"
  );

  const nightHabits = visibleHabits.filter(
    (habit) => !habit.routine_id && habit.time_block === "night"
  );
  const routineSections = routines.map((routine) => ({
    ...routine,
    habits: visibleHabits.filter((habit) => Number(habit.routine_id) === Number(routine.id))
  }));
  const routineCardData = useMemo(() => routines
    .map((routine) => {
      const allRoutineHabits = habits.filter((habit) => Number(habit.routine_id) === Number(routine.id));
      const routineHabits = visibleHabits.filter((habit) => Number(habit.routine_id) === Number(routine.id));
      const filteredHabits = routineTimeFilter === "all"
        ? routineHabits
        : routineHabits.filter((habit) => getHabitTimeBlock(habit) === routineTimeFilter);

      return {
        ...routine,
        habits: filteredHabits,
        total: filteredHabits.length,
        allTotal: allRoutineHabits.length,
      };
    })
    .filter((routine) => routineTimeFilter === "all" || routine.total > 0),
  [habits, routines, routineTimeFilter, visibleHabits]);
  useEffect(() => {
    if (viewMode !== "routine") return;
    if (routineCardData.length === 0) {
      if (selectedRoutineId) setSelectedRoutineId("");
      return;
    }
    const selectedStillVisible = routineCardData.some((routine) => String(routine.id) === String(selectedRoutineId));
    if (!selectedStillVisible) {
      setSelectedRoutineId(String(routineCardData[0].id));
    }
  }, [routineCardData, selectedRoutineId, viewMode]);
  const openHabitModalForRoutine = (routineId = null, timeBlock = "default") => {
    setEditingHabit(null);
    setPrefillRoutineId(routineId);
    if (routineId) {
      const existingRoutineHabit = habits.find((habit) => Number(habit.routine_id) === Number(routineId));
      setPrefillTimeBlock(existingRoutineHabit?.time_block || (routineTimeFilter === "all" ? "default" : routineTimeFilter) || "default");
    } else {
      setPrefillTimeBlock(timeBlock);
    }
    setShowModal(true);
  };
  if (isLoading) {
    return (
      <div className="habits-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="auth-spinner" style={{ margin: "0 auto 16px auto", width: "28px", height: "28px", borderTopColor: "#fbbf24" }} />
          <p style={{ color: "#9ca3af", fontStyle: "italic" }}>Gathering your active habits...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="habits-shell">
      <div className="habits-frame">

        {/* ── Page header ── */}
        <header className="habits-header">
          <div className="habits-header-left">
            <h1 className="habits-title">My Habits</h1>
            <p className="habits-subtitle">Build momentum one rep at a time.</p>
          </div>
          <div className="habits-header-right">
            <div className="habits-today-badge">
              <span className="habits-today-pct">{overallPct}%</span>
              <span className="habits-today-label">{doneToday}/{totalToday} done today</span>
            </div>
            <button className="habits-nav-button" onClick={() => navigate("/dashboard")}>Dashboard</button>
          </div>
        </header>

        {/* ── Toast message ── */}
        {message && (
          <div className="habits-toast" role="status">{message}</div>
        )}
        {categorySummary.length > 0 && (
          <section className="habits-summary-grid">
            {categorySummary.map((item) => {
              const meta = getCategoryData(item.category);
              return (
                <article key={item.category} className="habits-summary-card">
                  <div className="habits-summary-ring" style={{
                                                  "--ring-color": meta.color,
                                                  "--ring-percent": `${item.avgPercent}%`
                                                }}>
                    <span>{item.avgPercent}%</span>
                  </div>
                  <div className="habits-summary-copy">
                    <strong>{item.category}</strong>
                    <span>{item.done}/{item.total} done</span>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        {/* ── New habit button ── */}
        <div className="habits-new-wrap">
          <button className="habits-new-btn" onClick={() => openHabitModalForRoutine(null, "default")}>
            <IconPlus /> New Habit
          </button>
        </div>

        {/* ── Modal ── */}
        {showModal && (
          <CreateHabitModal
            onClose={() => { setShowModal(false); setEditingHabit(null); setPrefillRoutineId(null); setPrefillTimeBlock("default"); }}
            onAddHabit={handleAddHabit}
            onEditHabit={handleUpdateHabit}
            initialHabit={editingHabit}
            routines={routines}
            initialRoutineId={prefillRoutineId}
            initialTimeBlock={prefillTimeBlock}
          />
        )}
        {showRoutineModal && (
          <CreateRoutineModal
            token={token}
            onClose={() => setShowRoutineModal(false)}
            onCreated={(created) => {
              if (created?.routine?.id) {
                setSelectedRoutineId(String(created.routine.id));
              }
              showTemporaryMessage("Routine created!");
              fetchRoutines();
              fetchHabits();
              setShowRoutineModal(false);
            }}
          />
        )}
        <div className="view-switcher">

          <button
            className={viewMode === "all" ? "active" : ""}
            onClick={() => setViewMode("all")}
          >
            All
          </button>

          <button
            className={viewMode === "routine" ? "active" : ""}
            onClick={() => setViewMode("routine")}
          >
            Routines
          </button>

        </div>
        {/* ── Main section ── */}
        <section ref={sectionRef} className="habits-section">

          {/* Tab + count header */}
          <div className="habits-section-top">
            <div className="habits-tabs">
              <button
                className={`habits-tab${currentTab === "active" ? " is-active" : ""}`}
                onClick={() => handleTabChange("active")}
              >
                Active
                <span className="habits-tab-count">{activeHabits.length}</span>
              </button>
              <button
                className={`habits-tab${currentTab === "completed" ? " is-active" : ""}`}
                onClick={() => handleTabChange("completed")}
              >
                Completed
                <span className="habits-tab-count">{completedHabits.length}</span>
              </button>
            </div>
            <span className="habits-section-meta">
              {currentTab === "active"
                ? `${filteredActive.length} left today`
                : `${filteredCompleted.length} done`}
            </span>
          </div>

          {/* Category filters */}
          {categories.length > 1 && (
            <div className="habits-cats">
              {categories.map((cat) => {
                const catData = cat === "All" ? { color: "#6b7280" } : getCategoryData(cat);
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    className={`habits-cat-pill${isSelected ? " is-active" : ""}`}
                    style={isSelected ? { background: catData.color, color: "#fff", borderColor: catData.color } : {}}
                    onClick={() => handleSelectCategory(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

        {/* Active habits grid */}
        {currentTab === "active" && (
          visibleHabits.length === 0 && viewMode !== "routine" ? (
            <div className="habits-empty">
              <div className="habits-empty-icon">✓</div>
              <p>
                {selectedCategory === "All"
                  ? "All caught up for today!"
                  : `Nothing active in ${selectedCategory}.`}
              </p>
            </div>
          ) : (

            <>
            
              {viewMode === "all" && (
                <>

                  {defaultHabits.length > 0 && (
                    <>
                      <h2 className="routine-title">Default</h2>

                      <div className="habit-card-grid">
                        {defaultHabits.map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            submittingHabitId={submittingHabitId}
                            customValues={customValues}
                            onEdit={handleEditHabit}
                            onDelete={deleteHabit}
                            onQuick={submitProgress}
                            onCustomChange={handleCustomValueChange}
                            onCustomSubmit={handleCustomSubmit}
                            onFocus={setFocusHabit}
                            onCategoryClick={(cat) =>
                              handleSelectCategory(cat, "active")
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {morningHabits.length > 0 && (
                    <>
                      <h2 className="routine-title">🌅 Morning Routine</h2>

                      <div className="habit-card-grid">
                        {morningHabits.map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            submittingHabitId={submittingHabitId}
                            customValues={customValues}
                            onEdit={handleEditHabit}
                            onDelete={deleteHabit}
                            onQuick={submitProgress}
                            onCustomChange={handleCustomValueChange}
                            onCustomSubmit={handleCustomSubmit}
                            onFocus={setFocusHabit}
                            onCategoryClick={(cat) =>
                              handleSelectCategory(cat, "active")
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {eveningHabits.length > 0 && (
                    <>
                      <h2 className="routine-title">🌆 Evening Routine</h2>

                      <div className="habit-card-grid">
                        {eveningHabits.map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            submittingHabitId={submittingHabitId}
                            customValues={customValues}
                            onEdit={handleEditHabit}
                            onDelete={deleteHabit}
                            onQuick={submitProgress}
                            onCustomChange={handleCustomValueChange}
                            onCustomSubmit={handleCustomSubmit}
                            onFocus={setFocusHabit}
                            onCategoryClick={(cat) =>
                              handleSelectCategory(cat, "active")
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {nightHabits.length > 0 && (
                    <>
                      <h2 className="routine-title">🌙 Night Routine</h2>

                      <div className="habit-card-grid">
                        {nightHabits.map((habit) => (
                          <HabitCard
                            key={habit.id}
                            habit={habit}
                            submittingHabitId={submittingHabitId}
                            customValues={customValues}
                            onEdit={handleEditHabit}
                            onDelete={deleteHabit}
                            onQuick={submitProgress}
                            onCustomChange={handleCustomValueChange}
                            onCustomSubmit={handleCustomSubmit}
                            onFocus={setFocusHabit}
                            onCategoryClick={(cat) =>
                              handleSelectCategory(cat, "active")
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {routineSections.some((routine) => routine.habits.length > 0) && (
                    <>
                      <h2 className="routine-title">Routines</h2>
                      <div className="routine-grid">
                        {routineSections.filter((routine) => routine.habits.length > 0).map((routine) => (
                          <div key={routine.id} className="routine-card-wrapper">
                            <button
                              type="button"
                              className="routine-card routine-card-button"
                              onClick={() => navigate(`/routines/${routine.id}`, { state: { from: "habits" } })}
                            >
                              <h3 className="routine-card-title">
                                {routine.emoji} {routine.name}
                              </h3>
                              <span>{routine.habits.length} {routine.habits.length === 1 ? "habit" : "habits"}</span>
                            </button>
                            <button
                              className="routine-delete-btn"
                              type="button"
                              onClick={(e) => { e.stopPropagation(); deleteRoutine(routine.id, routine.name); }}
                              title={`Delete ${routine.name} routine`}
                              aria-label={`Delete ${routine.name} routine`}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                </>
              )}

              {viewMode === "routine" && (
                <div className="routine-view">

                  <button
                  className="create-routine-btn"
                  onClick={() => setShowRoutineModal(true)}
                >
                  + Create Routine
                </button>

                  <div className="routine-filter-row" aria-label="Routine time filter">
                    {TIME_BLOCK_FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`routine-filter-pill ${routineTimeFilter === filter.id ? "is-active" : ""}`}
                        onClick={() => setRoutineTimeFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="routine-grid">
                    {routineCardData.map((routine) => (
                      <div key={routine.id} className="routine-card-wrapper">
                        <button
                          className={`routine-card routine-card-button ${String(selectedRoutineId) === String(routine.id) ? "is-selected" : ""}`}
                          onClick={() => {
                            setSelectedRoutineId(String(routine.id));
                            navigate(`/routines/${routine.id}`, { state: { from: "habits" } });
                          }}
                        >
                          <h3 className="routine-card-title">
                            {routine.emoji} {routine.name}
                          </h3>
                          <span>
                            {routine.total} active / {routine.allTotal} {routine.allTotal === 1 ? "habit" : "habits"}
                          </span>
                        </button>
                        <button
                          className="routine-delete-btn"
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteRoutine(routine.id, routine.name); }}
                          title={`Delete ${routine.name} routine`}
                          aria-label={`Delete ${routine.name} routine`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    ))}

                  </div>

                </div>
              )}

            </>

          )
        )}
          {/* Completed list */}
          {currentTab === "completed" && (
            visibleHabits.length === 0 ? (
              <div className="habits-empty">
                <div className="habits-empty-icon">○</div>
                <p>{selectedCategory === "All" ? "Nothing completed yet. First win is next." : `Nothing completed yet in ${selectedCategory}.`}</p>
              </div>
            ) : (
              <div className="habits-done-list">
                {visibleHabits.map((habit) => (
                  <DoneItem
                    key={habit.id}
                    habit={habit}
                    onEdit={handleEditHabit}
                    onDelete={deleteHabit}
                    onCategoryClick={(cat) => handleSelectCategory(cat, "completed")}
                  />
                ))}
              </div>
            )
          )}
        </section>
      </div>

      {focusHabit && (
        <FocusSessionModal
          habit={focusHabit}
          onClose={() => setFocusHabit(null)}
          onSessionComplete={() => fetchHabits()}
        />
      )}

    </div>
  );
}

export default Habit;
