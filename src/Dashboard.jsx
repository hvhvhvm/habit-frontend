import { useCallback, useEffect, useState } from "react";
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

function getCategoryStatusStyle(percent) {
  if (percent >= 100) {
    return {
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      borderColor: "rgba(34, 197, 94, 0.28)",
      color: "#166534",
    };
  }

  if (percent > 0) {
    return {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
      borderColor: "rgba(245, 158, 11, 0.28)",
      color: "#b45309",
    };
  }

  return {
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    borderColor: "rgba(45, 36, 24, 0.1)",
    color: "#6b7280",
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

function getFocusProgress(habit) {
  const completed = Number(habit.completed_today_value) || 0;
  const target = Math.max(
    Number(habit.effective_target_value) || Number(habit.target_value) || 1,
    1
  );
  const percent = Math.min(Math.round((completed / target) * 100), 100);
  const unit = habit.target_type === "duration" ? "mins" : "done";

  return {
    percent,
    text: `${completed} / ${target} ${unit} completed`,
  };
}

function getHabitCategoryLabel(habit) {
  return habit.category?.trim() || "Uncategorized";
}

function getHabitTimeBlock(habit) {
  return habit.routine_id ? "routine" : (habit.time_block || "default");
}

function getRoutineFilterId(routineId) {
  return `routine-${routineId}`;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [habits, setHabits] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [recentCompleted, setRecentCompleted] = useState([]);
  const [submittingHabitId, setSubmittingHabitId] = useState(null);
  const [focusFilter, setFocusFilter] = useState("all");
  const [focusView, setFocusView] = useState("habits");
  
  const navigate = useNavigate();
  const [user,setUser] = useState(null);
  const token = localStorage.getItem("token");
  const [heatmapData,setHeatmapData] = useState([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);


  const categoryData = data?.categories?.map(c => {
    const catConfig = getCategoryData(c.name);
    return {
      name: c.name,
      percent: c.percent,
      fill: catConfig.color
    };
  }) || [];
  const name = localStorage.getItem("name") || "";

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

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/login");
  }, [navigate]);
    useEffect(() => {
      if (!token) {
        navigate("/login");
      }
    }, [token, navigate]);
 useEffect(() => {
  async function fetchUserData() {
    try {
      const res = await fetch(apiUrl("/auth/me"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load data");
      }

      const load = await res.json();

      setUser(load);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  fetchUserData();
}, [navigate, token]);

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

    const loadDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashboardRes, habitsRes, routinesRes, recentRes, heatmapRes] = await Promise.all([
          fetch(apiUrl("/dashboard/"), { headers }),
          fetch(apiUrl("/dashboard/my-habits"), { headers }),
          fetch(apiUrl("/routines"), { headers }),
          fetch(apiUrl("/habits/recent-completed?limit=5"), { headers }),
          fetch(apiUrl("/dashboard/heatmap/"), { headers })
        ]);

        if ([dashboardRes, habitsRes, routinesRes, recentRes, heatmapRes].some(r => r.status === 401)) {
          handleLogout();
          return;
        }
        if (!dashboardRes.ok || !habitsRes.ok || !routinesRes.ok || !recentRes.ok || !heatmapRes.ok) {
          throw new Error("Failed to load dashboard");
        }

        const [dashboardData, habitsData, routinesData, recentData, heatmapDataResponse] = await Promise.all([
          dashboardRes.json(),
          habitsRes.json(),
          routinesRes.json(),
          recentRes.json(),
          heatmapRes.json()
        ]);
        console.log("DASHBOARD DATA 👉", dashboardData);

        if (!cancelled) {
          setData(dashboardData);
          setHabits(habitsData);
          setRoutines(routinesData);
          setRecentCompleted(recentData);
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
  }, [handleLogout, token]);

  const activeHabits = habits.filter((habit) => habit.is_due_today && !habit.completed_today);
  const routineTabs = routines
    .map((routine) => ({
      id: getRoutineFilterId(routine.id),
      routineId: routine.id,
      label: routine.name,
      icon: routine.emoji,
      count: activeHabits.filter((habit) => Number(habit.routine_id) === Number(routine.id)).length
    }))
    .filter((tab) => tab.count > 0);
  const focusTabs = [
    { id: "all", label: "All", count: activeHabits.length },
    { id: "morning", label: "Morning", icon: "☀", count: activeHabits.filter((habit) => getHabitTimeBlock(habit) === "morning").length },
    { id: "evening", label: "Evening", icon: "🌆", count: activeHabits.filter((habit) => getHabitTimeBlock(habit) === "evening").length },
    { id: "night", label: "Night", icon: "☂", count: activeHabits.filter((habit) => getHabitTimeBlock(habit) === "night").length },
    ...routineTabs
  ].filter((tab) => tab.id === "all" || tab.count > 0);
  const visibleFocusHabits = focusFilter === "all"
    ? activeHabits
    : focusFilter.startsWith("routine-")
      ? activeHabits.filter((habit) => getRoutineFilterId(habit.routine_id) === focusFilter)
      : activeHabits.filter((habit) => getHabitTimeBlock(habit) === focusFilter);
    const routineCards = routines.map((routine) => {

      const routineHabits = activeHabits.filter(
        (habit) => Number(habit.routine_id) === Number(routine.id)
      );

      const completed =
        routineHabits.filter((habit) => habit.completed_today).length;

      const total = routineHabits.length;

      const progress =
        total > 0
          ? Math.round((completed / total) * 100)
          : 0;

      return {
        ...routine,
        total,
        completed,
        progress,
        habits: routineHabits
      };
    }).filter((routine) => routine.total > 0);

  const handleCompleteHabit = async (habit) => {
    try {
      setSubmittingHabitId(habit.id);

      const completeRes = await fetch(apiUrl("/logs"), {
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

      const [habitsRes, dashboardRes, recentRes, heatmapRes] = await Promise.all([
        fetch(apiUrl("/dashboard/my-habits"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(apiUrl("/dashboard/"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(apiUrl("/habits/recent-completed?limit=5"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(apiUrl("/dashboard/heatmap/"), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      if (
        habitsRes.status === 401 ||
        dashboardRes.status === 401 ||
        recentRes.status === 401 ||
        heatmapRes.status === 401
      ) {
        handleLogout();
        return;
      }

      if (!habitsRes.ok || !dashboardRes.ok || !recentRes.ok || !heatmapRes.ok) {
        throw new Error("Failed to refresh dashboard");
      }

      const [nextHabits, nextDashboard, nextRecent, nextHeatmap] = await Promise.all([
        habitsRes.json(),
        dashboardRes.json(),
        recentRes.json(),
        heatmapRes.json()
      ]);

      setHabits(nextHabits);
      setData(nextDashboard);
      setRecentCompleted(nextRecent);
      setHeatmapData(nextHeatmap);
      setMessage(`${habit.title} completed! +${habit.points || 10} Points 🎉`);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to complete habit");
    } finally {
      setSubmittingHabitId(null);
    }
  };
  useEffect(() => {
    if (!user?.id) return;

    const visitedDashboardKey = `visited_dashboard_${user.id}`;
    const visitedDashboard = localStorage.getItem(visitedDashboardKey);

    if (!visitedDashboard) {
      setIsFirstVisit(true);
      localStorage.setItem(visitedDashboardKey, "true");
    } else {
      setIsFirstVisit(false);
    }
  }, [user?.id]);

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
  function getSessionProgress(habit) {
    const total = Number(habit.total_sessions) || Number(habit.target_value) || 1;
    const completed = Math.min(Number(habit.completed_today_value) || 0, total);
    const remaining = Math.max(total - completed, 0);
    const percent = Math.min(Math.round((completed / total) * 100), 100);

    return { total, completed, remaining, percent };
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
  const displayName = name || user?.username || "there";
  const greetingTitle = isFirstVisit
    ? `Start your journey, ${displayName}`
    : `Welcome back, ${displayName}`;
  const greetingCopy = isFirstVisit
    ? "Your dashboard is ready. Start with one small win today."
    : "Pick up your rhythm and keep the day moving.";
  const streakLabel = data.streak > 0 ? `${data.streak} day streak` : "Start your streak today";
  
  return (
    <div className="dashboard-shell">
      <div className="dashboard-frame">
        <div className="dashboard-topbar">
          <div className="dashboard-title-block">
            
            <p className="dashboard-date">{todayLabel}</p>
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
        <h1>
          {isFirstVisit
            ? `Start your journey, ${name} 🔥`
            : `Welcome back, ${name} 👋`}
        </h1>
        <h2>{data.streak > 0
            ?  `🔥 ${data.streak} day streak`
            : "🔥 Start your streak today!"}
          </h2>
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
              <span className="dashboard-stat-label">
                Focus Now
              </span>

              <h2>What's your plan for today?</h2>
            </div>

            <button
              className="dashboard-routine-button"
              type="button"
              onClick={() => navigate("/habits", { state: { viewMode: "routine" } })}
            >
              View Routine Planner
            </button>
          </div>
                  <div className="dashboard-focus-view-switch">

          <button
            className={`dashboard-view-btn ${
              focusView === "habits" ? "active" : ""
            }`}
            onClick={() => setFocusView("habits")}
          >
            ✨ Habits
          </button>

          <button
            className={`dashboard-view-btn ${
              focusView === "routines" ? "active" : ""
            }`}
            onClick={() => setFocusView("routines")}
          >
            🪄 Routines
          </button>

        </div>
          <div className="dashboard-focus-tabs" aria-label="Focus filters">
            {focusTabs.map((tab) => (
              <button
                key={tab.id}
                className={`dashboard-focus-tab ${focusFilter === tab.id ? "is-active" : ""}`}
                type="button"
                onClick={() => setFocusFilter(tab.id)}
              >
                <span>{tab.icon}</span>
                <strong>{tab.label}</strong>
                {tab.id !== "all" && <small>{tab.count} habits</small>}
              </button>
            ))}
          </div>
          
          {focusView === "habits" && (

            visibleFocusHabits.length === 0 ? (

              <p className="dashboard-empty-copy">
                No active habits left today.
                Your dashboard is clear.
              </p>

            ) : (

              <div
                className="dashboard-focus-strip"
                aria-label="Active habits to focus on"
              >

                {visibleFocusHabits.map((habit) => {

                  const progress =
                    getFocusProgress(habit);

                  const category =
                    getHabitCategoryLabel(habit);

                  const sessionProgress =
                    getSessionProgress(habit);

                  return (

                    <article
                      key={habit.id}
                      className="dashboard-focus-card"
                      onClick={() => navigate("/habits")}
                      style={{ cursor: "pointer" }}
                    >

                      <div className="dashboard-focus-card-top">

                        <span>{category}</span>

                        <h3>{habit.title}</h3>

                      </div>

                      <p className="dashboard-focus-progress-text">
                        {progress.text}
                      </p>

                      <div
                        className="dashboard-focus-progress-track"
                        aria-hidden="true"
                      >

                        <div
                          className="dashboard-focus-progress-fill"
                          style={{
                            width: `${progress.percent}%`
                          }}
                        />

                      </div>

                      <p className="dashboard-focus-copy">

                        {sessionProgress.remaining > 0
                          ? `${sessionProgress.remaining} left today`
                          : "Almost complete 🔥"}

                      </p>

                      <button
                        className="dashboard-focus-complete"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCompleteHabit(habit);
                        }}
                        disabled={submittingHabitId === habit.id}
                        type="button"
                      >

                        {submittingHabitId === habit.id
                          ? "Saving..."
                          : "Complete"}

                      </button>

                    </article>

                  );
                })}

              </div>

            )

          )}
          {focusView === "routines" && (

            <div className="dashboard-routines-grid">

              {routineCards.map((routine) => (

                <article
                  key={routine.id}
                  className="dashboard-routine-card"
                  onClick={() =>
                        navigate(`/routines/${routine.id}`)
                      }
                >

                  <div className="dashboard-routine-card-top">

                    <div>
                      

                      <span className="dashboard-routine-emoji">
                        {routine.emoji}
                      </span>

                      <h3>{routine.name}</h3>
                      
                    </div>

                    <span className="dashboard-routine-progress">
                      {routine.progress}%
                    </span>
                    

                  </div>

                  <p>
                    {routine.total} habits
                  </p>
                  

                  <div className="dashboard-focus-progress-track">

                    <div
                      className="dashboard-focus-progress-fill"
                      style={{
                        width: `${routine.progress}%`
                      }}
                    />

                  </div>

                </article>

              ))}

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
                    <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6b7280" stopOpacity={1} />
                      <stop offset="100%" stopColor="#374151" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" vertical={false} horizontal={true} stroke="#374151" strokeOpacity={0.24} />
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
                            fontSize={13}
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
                    tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 700 }}
                    tickFormatter={(value) => `${value}`}
                    width={34}
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
                    barSize={38}
                    maxBarSize={54}
                    minPointSize={8}
                    activeBar={{ cursor: "pointer", stroke: "#1f2937", strokeWidth: 1.5, fillOpacity: 0.9 }}
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

            <div className="dashboard-category-summary">
              {categoryData.map((category) => {
                const statusStyle = getCategoryStatusStyle(category.percent);

                return (
                  <button
                    key={category.name}
                    className="dashboard-category-chip"
                    onClick={() => navigate(`/category-routine/${encodeURIComponent(category.name)}`)}
                    style={{
                      backgroundColor: statusStyle.backgroundColor,
                      borderColor: statusStyle.borderColor,
                    }}
                    type="button"
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
        </section>

      <OneBetterGraph />



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
