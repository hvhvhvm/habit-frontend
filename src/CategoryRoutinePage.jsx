import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CategoryRoutinePage.css";

function getCompletionValue(habit) {
  return Math.max(
    Number(habit.remaining_value) ||
      Number(habit.target_value) ||
      1,
    1
  );
}

export default function CategoryRoutinePage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [newSubHabitTitle, setNewSubHabitTitle] = useState("");
  const [isAddingSubHabit, setIsAddingSubHabit] = useState(null);

  const fetchRoutineData = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/dashboard/category/${encodeURIComponent(categoryName)}`, {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchRoutineData();
  }, [categoryName, token, navigate]);

  const handleComplete = async (habit) => {
    if (habit.completed_today || isSubmitting) return;

    try {
      setIsSubmitting(habit.id);
      const res = await fetch("http://127.0.0.1:8000/logs", {
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

      // Refresh the page data
      await fetchRoutineData();

      // Show micro-feedback
      const activeHabitsHere = data?.habits?.filter(h => h.is_due_today) || [];
      const completedCount = activeHabitsHere.filter(h => h.completed_today).length + 1;
      
      if (completedCount >= activeHabitsHere.length) {
        setFeedbackMessage("Routine complete 🎉");
      } else {
        const messages = ["Great job 🔥", "Keep it up 💪", "Nicely done ⚡"];
        setFeedbackMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
      setTimeout(() => setFeedbackMessage(""), 3500);

    } catch (err) {
      console.error(err);
      alert("Error completing habit");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleAddSubHabit = async (e, habitId) => {
    e.preventDefault();
    if (!newSubHabitTitle.trim()) return;

    try {
      setIsAddingSubHabit(habitId);
      const res = await fetch(`http://127.0.0.1:8000/habits/${habitId}/subhabits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newSubHabitTitle })
      });

      if (!res.ok) throw new Error("Failed to add sub-habit");

      setNewSubHabitTitle("");
      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      alert("Error adding sub-habit");
    } finally {
      setIsAddingSubHabit(null);
    }
  };

  const handleToggleSubHabit = async (subHabitId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/subhabits/${subHabitId}/toggle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to toggle sub-habit");

      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      alert("Error toggling sub-habit");
    }
  };

  const handleDeleteSubHabit = async (subHabitId) => {
    if (!window.confirm("Delete this sub-habit?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/subhabits/${subHabitId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete sub-habit");

      await fetchRoutineData();
    } catch (err) {
      console.error(err);
      alert("Error deleting sub-habit");
    }
  };

  if (loading) {
    return (
      <div className="routine-page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", opacity: 0.7 }}>
          <h2 style={{ color: "#9ca3af", fontWeight: 500 }}>Gathering your {categoryName} routine...</h2>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>Just a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="routine-page-shell">
        <div className="routine-container">
          <p>Error: {error}</p>
          <button className="routine-back-btn" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
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
            <h1 className="routine-brand">{categoryName} Routine</h1>
            {feedbackMessage && (
              <p className="routine-feedback-msg">{feedbackMessage}</p>
            )}
          </div>
          <button className="routine-back-btn" onClick={() => navigate("/dashboard")}>
            &larr; Dashboard
          </button>
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

        {activeHabits.length === 0 ? (
          <div className="routine-empty">
            <p>No active {categoryName} habits scheduled for today.</p>
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
                            value={newSubHabitTitle}
                            onChange={(e) => setNewSubHabitTitle(e.target.value)}
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
      </div>
    </div>
  );
}
