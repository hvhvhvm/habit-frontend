import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Habits.css";
import CreateHabitModal from "./CreateHabitModal";
import FocusSessionModal from "./FocusSessionModal";
import { getCategoryData } from "./CategoryConfig";

function getQuickValues(habit) {
  if (habit.target_type === "duration") {
    return [10, 15, 30].filter((value, index, array) => {
      return value > 0 && array.indexOf(value) === index;
    });
  }

  const target = Number(habit.target_value) || 1;
  const values = [1, Math.min(3, target), Math.min(5, target)];

  return values.filter((value, index, array) => {
    return value > 0 && array.indexOf(value) === index;
  });
}

function formatQuickLabel(habit, value) {
  if (habit.target_type === "duration") {
    return `+${value} min`;
  }

  return `+${value}`;
}

function getHabitCategoryLabel(habit) {
  return habit.category?.trim() || "Uncategorized";
}

function formatScheduleTime(scheduledTime) {
  if (!scheduledTime) {
    return "Anytime";
  }

  return new Date(`1970-01-01T${scheduledTime}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function normalizeHabits(habits) {
  const seen = new Map();

  habits.forEach((habit) => {
    if (habit?.id != null) {
      seen.set(habit.id, habit);
    }
  });

  return Array.from(seen.values());
}

function getSessionProgress(habit) {
  const total = Number(habit.total_sessions) || Number(habit.target_value) || 1;
  const completed = Math.min(Number(habit.completed_today_value) || 0, total);
  const remaining = Math.max(total - completed, 0);
  const percent = Math.min(Math.round((completed / total) * 100), 100);

  return { total, completed, remaining, percent };
}

function Habit() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const sectionRef = useRef(null);
  const initialTab = location.state?.tab === "completed" ? "completed" : "active";
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("");
  const [type, setType] = useState("count");
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState("daily");
  const [days, setDays] = useState([]);
  const [category, setCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [customValues, setCustomValues] = useState({});
  const [submittingHabitId, setSubmittingHabitId] = useState(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [focusHabit, setFocusHabit] = useState(null);
  const [isSession, setIsSession] = useState(false);
  const [focusTime, setFocusTime] = useState("");
  const [breakTime, setBreakTime] = useState("");
  const [totalSessions, setTotalSessions] = useState("");
  const showTemporaryMessage = useCallback((nextMessage) => {
    setMessage(nextMessage);

    window.setTimeout(() => {
      setMessage("");
    }, 2000);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/habits", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load habits");
      }

      const habitsData = await res.json();
      setHabits(normalizeHabits(habitsData));
    } catch (err) {
      console.error(err);
      setMessage("Failed to load habits");
    }
  }, [handleLogout, token]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  useEffect(() => {
    setCurrentTab(initialTab);
  }, [initialTab]);

  const activeHabits = habits.filter((habit) => {
    return habit.is_due_today && !habit.completed_today;
  });

  const completedHabits = habits.filter((habit) => {
    return habit.is_due_today && habit.completed_today;
  });

  const currentHabits = currentTab === "active" ? activeHabits : completedHabits;
  const categories = [
    "All",
    ...new Set(currentHabits.map((habit) => getHabitCategoryLabel(habit)))
  ];

  const filterByCategory = useCallback(
    (list) =>
      selectedCategory === "All"
        ? list
        : list.filter(
            (habit) =>
              getHabitCategoryLabel(habit)?.toLowerCase().trim() ===
              selectedCategory.toLowerCase().trim()
          ),
    [selectedCategory]
  );
  const filteredActiveHabits = filterByCategory(activeHabits);
  const filteredCompletedHabits = filterByCategory(completedHabits);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  const jumpToSection = useCallback(() => {
    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    jumpToSection();
  };

  const handleSelectCategory = (nextCategory, tab = currentTab) => {
    setSelectedCategory(nextCategory);
    setCurrentTab(tab);
    jumpToSection();
  };

  const handleDays = (event) => {
    const value = event.target.value;

    if (event.target.checked) {
      setDays((previous) => [...previous, value]);
      return;
    }

    setDays((previous) => previous.filter((day) => day !== value));
  };

  const handleSessionToggle = (checked) => {
    setIsSession(checked);

    if (checked) {
      setType("count");
      setTarget("");
      setTime("");
      setRepeat("daily");
      setDays([]);
      return;
    }

    setFocusTime("");
    setBreakTime("");
    setTotalSessions("");
  };

  const handleAddHabit = (habitData) => {
    if (isAddingHabit) return;
    setIsAddingHabit(true);

    fetch("http://127.0.0.1:8000/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(habitData)
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }
        if (!res.ok) throw new Error("Could not add habit");
        return res.json();
      })
      .then((newHabit) => {
        if (!newHabit) return;
        setShowModal(false);
        showTemporaryMessage("Habit added successfully");
        return fetchHabits();
      })
      .catch((err) => {
        console.error(err);
        setMessage(err.message || "Error adding habit");
      })
      .finally(() => {
        setIsAddingHabit(false);
      });
  };

  const deleteHabit = (id) => {
    fetch(`http://127.0.0.1:8000/habits/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }

        if (!res.ok) {
          throw new Error("Delete failed");
        }

        setHabits((previous) => previous.filter((habit) => habit.id !== id));
        showTemporaryMessage("Habit deleted");
        return true;
      })
      .catch((err) => {
        console.error(err);
        showTemporaryMessage("Error deleting habit");
      });
  };

  const handleEditHabit = (habit) => {
    setEditingHabit(habit);
    setShowModal(true);
  };

  const handleUpdateHabit = (habitData) => {
    if (!editingHabit || isAddingHabit) return;
    setIsAddingHabit(true);

    fetch(`http://127.0.0.1:8000/habits/${editingHabit.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(habitData)
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }

        if (!res.ok) {
          throw new Error("Could not update habit");
        }

        return res.json();
      })
      .then((updatedHabit) => {
        if (!updatedHabit) return;
        setEditingHabit(null);
        setShowModal(false);
        showTemporaryMessage("Habit updated successfully");
        return fetchHabits();
      })
      .catch((err) => {
        console.error(err);
        setMessage(err.message || "Error updating habit");
      })
      .finally(() => {
        setIsAddingHabit(false);
      });
  };

  const submitProgress = (habit, value) => {
    const parsedValue = Number(value);

    if (!parsedValue || parsedValue < 0) {
      setMessage("Enter a valid progress value");
      return;
    }

    setSubmittingHabitId(habit.id);

    fetch("http://127.0.0.1:8000/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        habit_id: habit.id,
        value_completed: parsedValue
      })
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return null;
        }

        if (!res.ok) {
          throw new Error("Failed to update habit");
        }

        return res.json();
      })
      .then((result) => {
        if (!result) {
          return;
        }

        setCustomValues((previous) => ({
          ...previous,
          [habit.id]: ""
        }));

        showTemporaryMessage(
          `${habit.title} updated by ${parsedValue}${habit.target_type === "duration" ? " min" : ""}`
        );

        return fetchHabits();
      })
      .catch((err) => {
        console.error(err);
        setMessage(err.message || "Could not update progress");
      })
      .finally(() => {
        setSubmittingHabitId(null);
      });
  };

  const handleCustomValueChange = (habitId, value) => {
    setCustomValues((previous) => ({
      ...previous,
      [habitId]: value
    }));
  };

  const handleCustomSubmit = (habit) => {
    submitProgress(habit, customValues[habit.id]);
  };

  const visibleHabits =
    currentTab === "active" ? filteredActiveHabits : filteredCompletedHabits;
  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category);
    }
  }, [location.state]);
  return (
    <div className="habits-shell">
      <div className="habits-frame">
        <div className="habits-topbar">
          <div>
            <h2 className="habits-title">My Habits</h2>

            <p className="habits-subtitle">
              Create a new habit and track your progress💪
            </p>
          </div>
          <button
            className="habits-nav-button"
            onClick={() => navigate("/dashboard")}
          >
            Go to dashboard
          </button>
        </div>

        {message && <p className="habits-message">{message}</p>}

       

        <section ref={sectionRef} className="habits-section">
          
          <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '12px 0 32px' }}>
            <button className="habits-new-btn" onClick={() => setShowModal(true)}>
              <span className="habits-new-btn-plus">+</span> New Habit
            </button>
          </div>

          {showModal && (
            <CreateHabitModal
              onClose={() => {
                setShowModal(false);
                setEditingHabit(null);
              }}
              onAddHabit={handleAddHabit}
              onEditHabit={handleUpdateHabit}
              initialHabit={editingHabit}
            />
          )}

          <div className="habits-section-header">
            <h3>{currentTab === "active" ? "Active habits" : "Completed today"}</h3>
            <span>
              {currentTab === "active"
                ? `${filteredActiveHabits.length} left today`
                : `${filteredCompletedHabits.length} done`}
            </span>
          </div>

          <div className="habits-tab-row habits-tab-row-spaced">
            <button
              className={`habits-tab-button ${currentTab === "active" ? "is-active" : ""}`}
              onClick={() => handleTabChange("active")}
            >
              Active
              <span>{activeHabits.length}</span>
            </button>
            <button
              className={`habits-tab-button ${currentTab === "completed" ? "is-active" : ""}`}
              onClick={() => handleTabChange("completed")}
            >
              Completed
              <span>{completedHabits.length}</span>
            </button>
          </div>

          <div className="habit-category-row">
            {categories.map((cat) => {
              const catData = cat === "All" ? { color: "#6b7280" } : getCategoryData(cat);
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className={`habit-category-filter ${isSelected ? "is-active" : ""}`}
                  style={isSelected ? { backgroundColor: catData.color, color: "#fff", borderColor: catData.color } : {}}
                  onClick={() => handleSelectCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {currentTab === "active" ? (
            <>
              {visibleHabits.length === 0 ? (
                <p className="habit-empty-state">
                  {selectedCategory === "All"
                    ? "No active habits left today."
                    : `No active habits in ${selectedCategory}.`}
                </p>
              ) : (
                <div className="habit-card-grid">
                  {visibleHabits.map((habit) => {
                    const sessionProgress = getSessionProgress(habit);

                    return (
                    <article key={habit.id} className="habit-card group relative">
                      <div className="habit-card-header">
                        <div>
                          <h4>{habit.title}</h4>

                          {habit.is_session ? (
                            <p>
                              {habit.total_sessions} sessions | {habit.focus_time} min focus | {habit.break_time} min break
                            </p>
                          ) : (
                            <p>
                              {habit.target_type === "duration" ? "Minutes" : "Count"} target:{" "}
                              {habit.target_value}
                            </p>
                          )}
                        </div>

                        <div className="habit-card-actions-top">
                          <div className="habit-card-actions-hover">
                            <button
                              onClick={() => handleEditHabit(habit)}
                              className="habit-action-btn edit-btn"
                              title="Edit Habit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                                <path d="m15 5 4 4"/>
                              </svg>
                            </button>

                            <button
                              onClick={() => deleteHabit(habit.id)}
                              className="habit-action-btn delete-btn"
                              title="Delete Habit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" x2="10" y1="11" y2="17"/>
                                <line x1="14" x2="14" y1="11" y2="17"/>
                              </svg>
                            </button>
                          </div>
                          <button
                            className="habit-category-button habit-category-under-actions"
                            onClick={() =>
                              handleSelectCategory(getHabitCategoryLabel(habit), "active")
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              backgroundColor: `${getCategoryData(getHabitCategoryLabel(habit)).color}15`,
                              color: getCategoryData(getHabitCategoryLabel(habit)).color,
                              border: `1px solid ${getCategoryData(getHabitCategoryLabel(habit)).color}30`
                            }}
                          >
                            {getHabitCategoryLabel(habit)}
                          </button>
                        </div>
                      </div>

                      <div className="habit-meta">
                        {habit.is_session ? (
                          <span>Session habit</span>
                        ) : (
                          <>
                            <span>Time: {formatScheduleTime(habit.scheduled_time)}</span>
                            <span>Repeat: {habit.repeat}</span>
                            {habit.repeat === "custom" && (
                              <span>Days: {habit.days?.join(", ")}</span>
                            )}
                          </>
                        )}
                      </div>

                      {habit.is_session ? (
                        <div className="habit-progress-block">
                          <div className="habit-progress-row">
                            <strong>
                              Sessions completed: {sessionProgress.completed} / {sessionProgress.total}
                            </strong>
                            <span>Remaining: {sessionProgress.remaining}</span>
                          </div>
                          <div className="habit-progress-track" aria-hidden="true">
                            <div
                              className="habit-progress-fill"
                              style={{ width: `${sessionProgress.percent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="habit-progress-block">
                          <div className="habit-progress-row">
                            <strong>{habit.progress_percent}% done</strong>
                            <span>
                              Remaining: {habit.remaining_value}
                              {habit.target_type === "duration" ? " min" : ""}
                            </span>
                          </div>
                          <div className="habit-progress-track" aria-hidden="true">
                            <div
                              className="habit-progress-fill"
                              style={{ width: `${habit.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="habit-actions">
                        {habit.is_session ? (
                          <button
                            className="habit-session-button"
                            onClick={() => setFocusHabit(habit)}
                          >
                            Start Focus
                          </button>
                        ) : (
                          <>
                            <div className="habit-quick-actions">
                              {getQuickValues(habit).map((value) => (
                                <button
                                  key={value}
                                  className="habit-quick-button"
                                  onClick={() => submitProgress(habit, value)}
                                  disabled={submittingHabitId === habit.id}
                                >
                                  {formatQuickLabel(habit, value)}
                                </button>
                              ))}
                            </div>

                            <div className="habit-custom-row">
                              <input
                                type="number"
                                min="1"
                                value={customValues[habit.id] || ""}
                                onChange={(event) =>
                                  handleCustomValueChange(habit.id, event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    handleCustomSubmit(habit);
                                  }
                                }}
                                placeholder={
                                  habit.target_type === "duration"
                                    ? "Custom minutes"
                                    : "Custom value"
                                }
                              />
                              <button
                                className="habits-primary-button"
                                onClick={() => handleCustomSubmit(habit)}
                                disabled={submittingHabitId === habit.id}
                              >
                                {submittingHabitId === habit.id ? "Saving..." : "Add"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                    );
                  })}
                </div>
              )}

            </>
          ) : visibleHabits.length === 0 ? (
            <div className="habit-done-list">
              <p className="habit-empty-state">
                {selectedCategory === "All"
                  ? "Nothing completed yet. First win is next."
                  : `Nothing completed yet in ${selectedCategory}.`}
              </p>
            </div>
          ) : (
            <div className="habit-done-list">
              {visibleHabits.map((habit) => (
                <div key={habit.id} className="habit-done-item">
                  <div className="habit-done-copy">
                    <strong>{habit.title}</strong>
                    {habit.is_session ? (
                      <span>Completed all {habit.total_sessions} sessions</span>
                    ) : (
                      <span>
                        Finished with {habit.completed_today_value}
                        {habit.target_type === "duration" ? " min" : ""}
                      </span>
                    )}
                  </div>
                  <div className="habit-done-actions">
                    <button
                      className="habit-category-button"
                      onClick={() =>
                        handleSelectCategory(getHabitCategoryLabel(habit), "completed")
                      }
                    >
                      {getHabitCategoryLabel(habit)}
                    </button>
                    <button
                      onClick={() => handleEditHabit(habit)}
                      className="habit-action-btn edit-btn"
                      title="Edit Habit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="habit-action-btn delete-btn"
                      title="Delete Habit"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
