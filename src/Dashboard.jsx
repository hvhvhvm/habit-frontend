import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import "./Dashboard.css";

const stateCopy = {
  RISING: {
    label: "Rising",
    headline: "Your rhythm is building."
  },
  STEADY: {
    label: "Steady",
    headline: "You are holding the line."
  },
  RESET: {
    label: "Reset",
    headline: "Today is still recoverable."
  }
};

function formatDelta(delta) {
  if (delta > 0) {
    return `+${Math.round(delta)}% vs yesterday`;
  }

  if (delta < 0) {
    return `${Math.round(delta)}% vs yesterday`;
  }

  return "Flat vs yesterday";
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function getMomentumIndicator(state, delta) {
  if (state === "RISING") {
    return {
      arrow: "\u2197",
      label: delta >= 0 ? "High momentum" : "Momentum holding",
      className: "dashboard-arrow-up"
    };
  }

  if (state === "RESET") {
    return {
      arrow: "\u2198",
      label: "Low momentum",
      className: "dashboard-arrow-down"
    };
  }

  return {
    arrow: "\u2192",
    label: "Balanced momentum",
    className: "dashboard-arrow-neutral"
  };
}

function getCompletionValue(habit) {
  return Math.max(
    Number(habit.remaining_value) ||
      Number(habit.effective_target_value) ||
      Number(habit.target_value) ||
      1,
    1
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [habits, setHabits] = useState([]);
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [submittingHabitId, setSubmittingHabitId] = useState(null);
  const [streak, setStreak] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [heatmapData,setHeatmapData] = useState([]);
  const categoryData = data?.categories?.map(c => {
    const catConfig = getCategoryData(c.name);
    return {
      name: c.name,
      percent: c.percent,
      fill: catConfig.color
    };
  }) || [];

  const renderCustomBarLabel = (props) => {
    const { x, y, width, value } = props;
    let text = "Focus Here ⚠️";
    let fill = "#f59e0b";
    
    if (value >= 90) {
      text = "On Track ✅";
      fill = "#22c55e"; // Using a brighter green for the text so it's readable
    } else if (value >= 60) {
      text = "Keep Going";
      fill = "#22c55e";
    }

    // Make sure y doesn't clip (cap it if close to top of svg)
    const yPos = Math.max(y - 10, 15);

    return (
      <text x={x + width / 2} y={yPos} fill={fill} textAnchor="middle" fontSize={11} fontWeight={700}>
        {text}
      </text>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
    useEffect(() => {
      if (!token) {
        navigate("/login");
      }
    }, [token, navigate]);
  useEffect(() => {

    if (!message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setMessage("");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {

    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const res = await fetch("https://habit-backend-v3gv.onrender.com/dashboard/", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Dashboard request failed");
        }

        const nextData = await res.json();

        if (!cancelled) {
          setData(nextData);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("We could not load your dashboard right now.");
        }
      }
    };


    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  useEffect(() => {
    let cancelled = false;

    const loadHabits = async () => {
      try {
        const res = await fetch("https://habit-backend-v3gv.onrender.com/habits", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Habits request failed");
        }

        const habitsData = await res.json();

        if (!cancelled) {
          setHabits(habitsData);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setMessage("Failed to load habits");
        }
      }
    };

    loadHabits();

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashboardRes, habitsRes, recentRes, streakRes, heatmapRes] = await Promise.all([
          fetch("https://habit-backend-v3gv.onrender.com/dashboard/", { headers }),
          fetch("https://habit-backend-v3gv.onrender.com/habits", { headers }),
          fetch("https://habit-backend-v3gv.onrender.com/habits/recent-completed?limit=5", { headers }),
          fetch("https://habit-backend-v3gv.onrender.com/streak", { headers }),
          fetch("https://habit-backend-v3gv.onrender.com/dashboard/heatmap/", { headers })
        ]);

        if ([dashboardRes, habitsRes, recentRes, streakRes, heatmapRes].some(r => r.status === 401)) {
          handleLogout();
          return;
        }

        const [dashboardData, habitsData, recentData, streakData, heatmapDataResponse] = await Promise.all([
          dashboardRes.json(),
          habitsRes.json(),
          recentRes.json(),
          streakRes.json(),
          heatmapRes.json()
        ]);

        if (!cancelled) {
          setData(dashboardData);
          setHabits(habitsData);
          setRecentCompleted(recentData);
          setStreak(streakData);
          setHeatmapData(heatmapDataResponse);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    };

    if (token) {
      loadDashboardData();
    }

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  const activeHabits = habits.filter((habit) => habit.is_due_today && !habit.completed_today);

  const handleCompleteHabit = async (habit) => {
    try {
      setSubmittingHabitId(habit.id);

      const completeRes = await fetch("https://habit-backend-v3gv.onrender.com/logs", {
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

      if (completeRes.status === 401) {
        handleLogout();
        return;
      }

      if (!completeRes.ok) {
        throw new Error("Failed to complete habit");
      }

      const [habitsRes, dashboardRes, recentRes, streakRes, heatmapRes] = await Promise.all([
        fetch("https://habit-backend-v3gv.onrender.com/habits", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("https://habit-backend-v3gv.onrender.com/dashboard/", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("https://habit-backend-v3gv.onrender.com/habits/recent-completed?limit=5", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("https://habit-backend-v3gv.onrender.com/streak", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("https://habit-backend-v3gv.onrender.com/dashboard/heatmap/", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      if (
        habitsRes.status === 401 ||
        dashboardRes.status === 401 ||
        recentRes.status === 401 ||
        streakRes.status === 401 ||
        heatmapRes.status === 401
      ) {
        handleLogout();
        return;
      }

      if (!habitsRes.ok || !dashboardRes.ok || !recentRes.ok || !streakRes.ok || !heatmapRes.ok) {
        throw new Error("Failed to refresh dashboard");
      }

      const [nextHabits, nextDashboard, nextRecent, nextStreak, nextHeatmap] = await Promise.all([
        habitsRes.json(),
        dashboardRes.json(),
        recentRes.json(),
        streakRes.json(),
        heatmapRes.json()
      ]);

      setHabits(nextHabits);
      setData(nextDashboard);
      setRecentCompleted(nextRecent);
      setStreak(nextStreak);
      setHeatmapData(nextHeatmap);
      setMessage(`${habit.title} completed from dashboard`);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to complete habit");
    } finally {
      setSubmittingHabitId(null);
    }
  };

  if (error) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-error">
          <h1>Dashboard</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", animation: "opacity 1.5s ease-in-out infinite", opacity: 0.7 }}>
          <h2 style={{ color: "#9ca3af", fontWeight: 500 }}>Organizing your space...</h2>
          <p style={{ color: "#6b7280", marginTop: "8px" }}>Pulling today's progress & momentum</p>
        </div>
      </div>
    );
  }

  const momentum = data.momentum;
  const tone = stateCopy[momentum.state] || stateCopy.STEADY;
  const momentumIndicator = getMomentumIndicator(momentum.state, momentum.delta);
  const todayProgress = clampPercent(data.today_progress);
  const momentumScore = clampPercent(momentum.score);
  const averageScore = clampPercent(momentum.window_average);
  const completedRatio = data.total_habits
    ? `${data.completed_today} / ${data.total_habits}`
    : "0 / 0";
  const pendingHabits = activeHabits.length;
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="dashboard-shell">
      <div className="dashboard-frame">
        <div className="dashboard-topbar">
          <div className="dashboard-title-block">
            <h1 className="dashboard-brand">Habit Dashboard</h1>
            <p className="dashboard-date">{todayLabel}</p>
            <div className="dashboard-streak-row">
              <div className="dashboard-streak-chip">
                {streak?.current_streak ?? 0} day streak
              </div>
              {streak?.perfect_day_today && (
                <div className="dashboard-perfect-day-chip">Perfect day</div>
              )}
            </div>
          </div>



          <div className="dashboard-actions">
            <button
              className="dashboard-button dashboard-button-primary"
              onClick={() => navigate("/habits")}
            >
              Go to habits
            </button>
            <button
              className="dashboard-button dashboard-button-secondary"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        <section className="dashboard-panel">
          <h3>Category Progress</h3>

          <div style={{ position: "relative", width: "100%", height: 260, padding: "10px 0" }}>
            {categoryData.length > 1 && (
              <div 
                style={{ 
                  position: "absolute", 
                  top: 40, 
                  bottom: 40, 
                  left: 55, 
                  right: 10, 
                  pointerEvents: "none", 
                  display: "flex",
                  zIndex: 1
                }}
              >
                {categoryData.map((_, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      flex: 1, 
                      borderRight: index < categoryData.length - 1 ? "1.5px dashed #4b5563" : "none",
                      opacity: 0.5
                    }} 
                  />
                ))}
              </div>
            )}
            <ResponsiveContainer>
              <BarChart data={categoryData} margin={{ top: 30, right: 10, left: -5, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4b5563" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1f2937" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6b7280" stopOpacity={1} />
                    <stop offset="100%" stopColor="#374151" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#374151" strokeOpacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={(props) => {
                    const { x, y, payload } = props;
                    return (
                      <g transform={`translate(${x},${y})`} onClick={() => navigate(`/category-routine/${encodeURIComponent(payload.value)}`)} style={{ cursor: "pointer" }}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="middle"
                          fill="#1f2937"
                          fontSize={14}
                          fontWeight={700}
                        >
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                  height={50}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#9ca3af", fontSize: 13 }}
                  dx={-10}
                  width={40}
                />
                <Tooltip 
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  contentStyle={{ 
                    backgroundColor: "#111827", 
                    border: "1px solid #374151", 
                    borderRadius: "12px", 
                    color: "#f9fafb",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    padding: "12px 16px",
                    zIndex: 100
                  }}
                  itemStyle={{ color: "#a5b4fc", fontWeight: "600" }}
                  formatter={(value) => [`${value}%`, "Completed"]}
                />

                <Bar
                  dataKey="percent"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  activeBar={{ cursor: "pointer", stroke: "#9ca3af", strokeWidth: 1 }}
                  onClick={(data) => {
                    const category = data?.payload?.name;
                    if (!category) return;
                    navigate(`/category-routine/${encodeURIComponent(category)}`);
                  }}
                  style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                >
                  <LabelList dataKey="percent" content={renderCustomBarLabel} />
                  {categoryData.map((entry, index) => {
                    let fillColor = "#f59e0b"; // Warning: Yellow
                    if (entry.percent >= 90) {
                      fillColor = "#166534"; // Strong consistency: Dark Green
                    } else if (entry.percent >= 60) {
                      fillColor = "#22c55e"; // Average progress: Normal Green
                    }
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <ConsistencyHeatmap data={heatmapData} />

        {message && <p className="dashboard-message">{message}</p>}

        <section className="dashboard-panel dashboard-progress-hero">
          <div className="dashboard-progress-hero-head">
            <div>
              <span className="dashboard-stat-label">Today&apos;s progress</span>
              <h2 className="dashboard-progress-hero-title">
                {Math.round(todayProgress)}% complete
              </h2>
            </div>
            <strong className="dashboard-progress-ratio">{completedRatio}</strong>
          </div>

          <div className="dashboard-track dashboard-track-large" aria-hidden="true">
            <div
              className="dashboard-fill"
              style={{ width: `${todayProgress}%` }}
            />
          </div>

          <div className="dashboard-progress-summary">
            <div className="dashboard-progress-pill">
              <span>Completed</span>
              <strong>{data.completed_today}</strong>
            </div>
            <div className="dashboard-progress-pill">
              <span>Active today</span>
              <strong>{activeHabits.length}</strong>
            </div>
            <div className="dashboard-progress-pill">
              <span>Momentum</span>
              <strong>{tone.label}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-focus-grid">
          <article className="dashboard-panel dashboard-momentum-card">
            <div className="dashboard-momentum-head">
              <span
                className={`dashboard-label dashboard-label-${momentum.state.toLowerCase()}`}
              >
                {tone.label} momentum
              </span>
              <div className={`dashboard-momentum-arrow ${momentumIndicator.className}`}>
                <span>{momentumIndicator.arrow}</span>
              </div>
            </div>

            <div className="dashboard-momentum-main">
              <div>
                <h2 className="dashboard-headline">Momentum</h2>
                <p className="dashboard-copy">{tone.headline}</p>
              </div>
              <div className="dashboard-score-block">
                <span className="dashboard-stat-label">Momentum score</span>
                <p className="dashboard-score-value">{Math.round(momentumScore)}%</p>
                <p className={`dashboard-score-status ${momentumIndicator.className}`}>
                  {momentumIndicator.label}
                </p>
              </div>
            </div>

            <div className="dashboard-track" aria-hidden="true">
              <div
                className="dashboard-fill dashboard-fill-momentum"
                style={{ width: `${momentumScore}%` }}
              />
            </div>

            <div className="dashboard-momentum-footer">
              <p className="dashboard-copy">{momentum.message}</p>
              <div className="dashboard-momentum-stats">
                <div>
                  <span className="dashboard-stat-label">Trend</span>
                  <strong>{formatDelta(momentum.delta)}</strong>
                </div>
                <div>
                  <span className="dashboard-stat-label">3-day average</span>
                  <strong>{Math.round(averageScore)}%</strong>
                </div>
              </div>
            </div>
          </article>

          <aside
            className="dashboard-panel dashboard-active-card"
            onClick={() => navigate("/habits")}
            style={{ cursor: "pointer" }}
          >
            <div className="dashboard-active-head">
              <div>
                <span className="dashboard-stat-label">Active habits</span>
              </div>
            </div>

            {activeHabits.length === 0 ? (
              <p className="dashboard-empty-copy">
                No active habits left today. Your dashboard is clear.
              </p>
            ) : (
              <div className="dashboard-preview-list">
                {activeHabits.slice(0, 3).map((habit) => (
                  <div key={habit.id} className="dashboard-preview-item">
                    <div>
                      <strong>{habit.title}</strong>
                      <p>
                        {habit.remaining_value}
                        {habit.target_type === "duration" ? " min" : ""} left
                      </p>
                    </div>
                    <button
                      className="dashboard-inline-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCompleteHabit(habit);
                      }}
                      disabled={submittingHabitId === habit.id}
                    >
                      {submittingHabitId === habit.id ? "Saving..." : "Complete"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <span className="dashboard-stat-label">Recent completed habits</span>
            </div>
            {recentCompleted.length === 0 ? (
              <p>No habits completed yet.</p>
            ) : (
              <div>
                {recentCompleted.slice(0, 3).map((completed) => (
                  <div key={completed.id}>
                    <strong>{completed.habit_title}</strong>
                    <p className="dashboard-completed-time">
                      {new Date(completed.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate("/habits", { state: { tab: "completed" } })}>
              View All
            </button>
          </aside>
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
            <p
              className={`dashboard-stat-value ${
                momentum.delta >= 0
                  ? "dashboard-stat-positive"
                  : "dashboard-stat-negative"
              }`}
            >
              {momentumIndicator.arrow} {momentum.delta >= 0 ? "+" : ""}
              {Math.round(momentum.delta)}%
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
              <button
                className="dashboard-button dashboard-button-secondary dashboard-button-small"
                onClick={() => navigate("/habits")}
              >
                Active habits
              </button>
            </div>

            <div className="dashboard-detail-list">
              <div className="dashboard-detail-item">
                <span>Today vs yesterday</span>
                <strong>{formatDelta(momentum.delta)}</strong>
              </div>
              <div className="dashboard-detail-item">
                <span>Pending habits</span>
                <strong>{pendingHabits}</strong>
              </div>
              <div className="dashboard-detail-item">
                <span>Yesterday&apos;s progress</span>
                <strong>{Math.round(clampPercent(momentum.yesterday))}%</strong>
              </div>
              <div className="dashboard-detail-item">
                <span>Next action</span>
                <strong>
                  {activeHabits.length > 0 ? "Finish one active habit" : "Review habits"}
                </strong>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
