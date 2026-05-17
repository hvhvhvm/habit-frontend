import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { apiUrl } from "./api";

import "./CategoryRoutinePage.css";

function getCompletionValue(habit) {
  return Math.max(
    Number(habit.remaining_value) ||
      Number(habit.target_value) ||
      1,
    1
  );
}

function completeHabitLocally(habit) {
  const target = Math.max(Number(habit.effective_target_value) || Number(habit.target_value) || 1, 1);
  return {
    ...habit,
    completed_today: true,
    completed_today_value: target,
    progress_percent: 100,
    remaining_value: 0,
  };
}

export default function RoutineDetailPage() {
  const { routineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const openedFromDashboard = location.state?.from === "dashboard";
  const backLabel = openedFromDashboard ? "Dashboard" : "Habits";
  const backPath = openedFromDashboard ? "/dashboard" : "/habits";
  const backState = openedFromDashboard ? undefined : { viewMode: "routine" };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [subHabitDrafts, setSubHabitDrafts] = useState({});
  const [isAddingSubHabit, setIsAddingSubHabit] = useState(null);
  const [actionError, setActionError] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [habitTitle, setHabitTitle] = useState("");
  const addHabitInputRef = useRef(null);

  const fetchRoutineData = useCallback(async () => {
    try {
      setError("");
      const res = await fetch(apiUrl(`/routines/${routineId}`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load routine data");
      
      const payload = await res.json();
      setData(payload);
      return payload;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [routineId, navigate, token]);

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchRoutineData();
  }, [fetchRoutineData, navigate, token]);

  const handleBack = () => {
    navigate(backPath, backState ? { state: backState } : undefined);
  };

  const handleAddHabit = async (event) => {
    event.preventDefault();
    const title = habitTitle.trim();
    if (!title || isAddingHabit) return;

    try {
      setActionError("");
      setIsAddingHabit(true);
      const res = await fetch(apiUrl("/habits"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          target_type: "count",
          target_value: 1,
          category: "Productivity",
          time_block: data?.habits?.[0]?.time_block || "default",
          routine_id: Number(routineId),
          points: 10,
          repeat: "daily",
          days: [],
          is_session: false,
          focus_time: null,
          break_time: null,
          total_sessions: null,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Could not add habit");

      setHabitTitle("");
      window.dispatchEvent(new Event("habit-mutate"));
      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Could not add habit to this routine.");
    } finally {
      setIsAddingHabit(false);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Delete this habit?")) return;

    try {
      setActionError("");
      const res = await fetch(apiUrl(`/habits/${habitId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Could not delete habit");

      window.dispatchEvent(new Event("habit-mutate"));
      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      setActionError("Could not delete this habit. Please try again.");
    }
  };

  const handleComplete = async (habit) => {
    if (habit.completed_today || isSubmitting) return;
    const originalData = data;

    try {
      setActionError("");
      setIsSubmitting(habit.id);
      setData((prev) => prev ? {
        ...prev,
        habits: prev.habits.map((item) => item.id === habit.id ? completeHabitLocally(item) : item),
      } : prev);
      const res = await fetch(apiUrl("/logs"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          habit_id: habit.id,
          value_completed: getCompletionValue(habit)
        })
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to complete habit");

      // Refresh page and compute feedback from fresh values
      window.dispatchEvent(new Event("habit-mutate"));
      const refreshed = await fetchRoutineData();
      const activeHabitsHere = refreshed?.habits?.filter((h) => h.is_due_today) || [];
      const completedCount = activeHabitsHere.filter((h) => h.completed_today).length;

      if (completedCount >= activeHabitsHere.length) {
        setFeedbackMessage("Routine complete 🎉");
      } else {
        const messages = ["Great job 🔥", "Keep it up 💪", "Nicely done ⚡"];
        setFeedbackMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
      setTimeout(() => setFeedbackMessage(""), 3500);

    } catch (err) {
      console.error(err);
      setData(originalData);
      setActionError("Could not complete this habit. Please try again.");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleAddSubHabit = async (e, habitId) => {
    e.preventDefault();
    const title = (subHabitDrafts[habitId] || "").trim();
    if (!title) return;

    try {
      setActionError("");
      setIsAddingSubHabit(habitId);
      const res = await fetch(apiUrl(`/habits/${habitId}/subhabits`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (!res.ok) throw new Error("Failed to add sub-habit");

      setSubHabitDrafts((prev) => ({ ...prev, [habitId]: "" }));
      window.dispatchEvent(new Event("habit-mutate"));
      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      setActionError("Could not add sub-habit. Please try again.");
    } finally {
      setIsAddingSubHabit(null);
    }
  };

  const handleToggleSubHabit = async (subHabitId) => {
    try {
      setActionError("");
      const res = await fetch(apiUrl(`/subhabits/${subHabitId}/toggle`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to toggle sub-habit");

      window.dispatchEvent(new Event("habit-mutate"));

      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      setActionError("Could not update sub-habit. Please try again.");
    }
  };

  const handleDeleteSubHabit = async (subHabitId) => {
    if (!window.confirm("Delete this sub-habit?")) return;

    try {
      setActionError("");
      const res = await fetch(apiUrl(`/subhabits/${subHabitId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete sub-habit");

      window.dispatchEvent(new Event("habit-mutate"));

      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      setActionError("Could not delete sub-habit. Please try again.");
    }
  };

  if (loading) {
    
    return (
      <div className="routine-page-shell">
        <div className="routine-state-card">
          <h2>
            Loading your routine...
          </h2>
          <p className="routine-state-copy">Just a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="routine-page-shell">
        <div className="routine-container">
          <p>Error: {error}</p>
          <button className="routine-back-btn" onClick={handleBack}>Back to {backLabel}</button>
        </div>
      </div>
    );
  }

  
  const activeHabits = data?.habits?.filter(h => h.is_due_today) || [];
  const activeCompleted = activeHabits.filter(h => h.completed_today).length;
  const firstUncompletedIndex = activeHabits.findIndex(h => !h.completed_today);

  return (
    <div className="routine-page-shell">
      <div className="routine-container">
        
        <header className="routine-header">
          <div>
            <h1 className="routine-brand">

                {data?.routine?.emoji}
                {" "}
                {data?.routine?.name}

            </h1>
            {feedbackMessage && (
              <p className="routine-feedback-msg">{feedbackMessage}</p>
            )}
          </div>
          <div className="routine-header-actions">
            <button className="routine-back-btn" onClick={handleBack}>
              &larr; {backLabel}
            </button>
          </div>
        </header>

        <section className="routine-stats-card">
          <div className="routine-stat-item">
            <span className="routine-stat-label">7-Day Consistency</span>
            <span className="routine-stat-value">{Math.round(data?.consistency || 0)}%</span>
          </div>
          <div className="routine-stat-item" style={{ textAlign: "right" }}>
            <span className="routine-stat-label">Today's Progress</span>
            <span className="routine-stat-value">{activeHabits.length > 0 ? `${activeCompleted}/${activeHabits.length}` : "0"}</span>
          </div>
        </section>
        {actionError && <p className="routine-action-error">{actionError}</p>}

        {activeHabits.length === 0 ? (
          <div className="routine-empty">
            <p>
            No active habits in this routine today.
            </p>
          </div>
        ) : (
          <div className="routine-timeline">
            {activeHabits.map((habit, index) => {
              const isCompleted = habit.completed_today;
              const isActive = index === firstUncompletedIndex;
              const isExpanded = expandedHabitId === habit.id;
              
              return (
                <div 
                  key={habit.id} 
                  className={`routine-node-container ${isActive ? 'is-active-node' : ''} ${isExpanded ? 'is-expanded' : ''}`} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="routine-line" />
                  
                  <div className="routine-checkbox-col">
                    <div 
                      className={`routine-checkbox ${isCompleted ? 'completed' : ''}`}
                      onClick={() => handleComplete(habit)}
                    >
                      <span className="routine-check-icon">&#10003;</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`routine-content-col ${isCompleted ? 'is-completed-node' : ''}`}
                    onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="routine-habit-header-row">
                      <h3 className={`routine-habit-title ${isCompleted ? 'completed-text' : ''}`}>
                        {isActive && "→ "}
                        {isCompleted && "✔ "}
                        {habit.title}
                        {isActive && <span className="routine-badge-active"> (active)</span>}
                        {isCompleted && <span className="routine-badge-done"> (done)</span>}
                      </h3>
                      <span className="routine-expand-icon">{isExpanded ? "▲" : "▼"}</span>
                      <button
                        className="routine-habit-delete"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteHabit(habit.id);
                        }}
                        aria-label={`Delete ${habit.title}`}
                        title="Delete habit"
                      >
                        &times;
                      </button>
                    </div>
                    {!isCompleted && (
                      <p className="routine-habit-meta">
                        {isSubmitting === habit.id ? "Saving..." : `${habit.remaining_value} ${habit.target_type === 'duration' ? 'min' : 'left'}`}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="routine-subhabits-section" onClick={(e) => e.stopPropagation()}>
                        <div className="routine-subhabits-list">
                          {habit.sub_habits?.map(sub => (
                            <div key={sub.id} className="routine-subhabit-item">
                              <div 
                                className={`routine-subhabit-checkbox ${sub.completed_today ? 'completed' : ''}`}
                                onClick={() => handleToggleSubHabit(sub.id)}
                              >
                                {sub.completed_today && "✓"}
                              </div>
                              <span className={`routine-subhabit-title ${sub.completed_today ? 'completed' : ''}`}>
                                {sub.title}
                              </span>
                              <button 
                                className="routine-subhabit-delete"
                                onClick={() => handleDeleteSubHabit(sub.id)}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                        <form className="routine-subhabit-form" onSubmit={(e) => handleAddSubHabit(e, habit.id)}>
                          <input 
                            type="text" 
                            placeholder="Add a step..." 
                            value={subHabitDrafts[habit.id] || ""}
                            onChange={(e) => setSubHabitDrafts((prev) => ({ ...prev, [habit.id]: e.target.value }))}
                            className="routine-subhabit-input"
                          />
                          <button 
                            type="submit" 
                            className="routine-subhabit-add-btn"
                            disabled={isAddingSubHabit === habit.id}
                          >
                            {isAddingSubHabit === habit.id ? "..." : "+"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <form className="routine-inline-add" onSubmit={handleAddHabit}>
          <input
            ref={addHabitInputRef}
            type="text"
            value={habitTitle}
            onChange={(event) => setHabitTitle(event.target.value)}
            placeholder="Add habit name..."
            className="routine-inline-add-input"
          />
          <button
            type="submit"
            className="routine-inline-add-btn"
            disabled={isAddingHabit || !habitTitle.trim()}
          >
            {isAddingHabit ? "Adding..." : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
