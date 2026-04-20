import { useState, useEffect } from "react";
import "./Heatmap.css";

function Heatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const res = await fetch("https://habit-backend-v3gv.onrender.com//heatmap", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load heatmap data");
        }

        const data = await res.json();
        setHeatmapData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [token]);

  const getIntensityClass = (count) => {
    if (count === 0) return "heatmap-day-empty";
    if (count < 20) return "heatmap-day-low";
    if (count < 40) return "heatmap-day-medium";
    if (count < 60) return "heatmap-day-high";
    if (count < 80) return "heatmap-day-very-high";
    return "heatmap-day-perfect";
  };

  const getTooltipText = (date, count, totalHabits) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    
    return `${formattedDate}: ${Math.round(count)}% (${totalHabits} habits)`;
  };

  const organizeByWeeks = (data) => {
    const weeks = [];
    let currentWeek = [];
    
    data.forEach((day, index) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7 || index === data.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeks = organizeByWeeks(heatmapData);

  if (loading) {
    return (
      <div className="heatmap-container">
        <div className="heatmap-loading">Loading heatmap...</div>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3>Activity Heatmap</h3>
        <p className="heatmap-subtitle">Your daily habit completion over the last year</p>
      </div>
      
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-colors">
          <div className="legend-color heatmap-day-empty"></div>
          <div className="legend-color heatmap-day-low"></div>
          <div className="legend-color heatmap-day-medium"></div>
          <div className="legend-color heatmap-day-high"></div>
          <div className="legend-color heatmap-day-very-high"></div>
          <div className="legend-color heatmap-day-perfect"></div>
        </div>
        <span>More</span>
      </div>

      <div className="heatmap-grid">
        <div className="weekday-labels">
          {weekDays.map(day => (
            <div key={day} className="weekday-label">{day}</div>
          ))}
        </div>
        
        <div className="heatmap-weeks">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="heatmap-week">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`heatmap-day ${getIntensityClass(day.count)}`}
                  title={getTooltipText(day.date, day.count, day.total_habits)}
                >
                  <span className="day-number">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
              
              {week.length < 7 && (
                <>
                  {Array.from({ length: 7 - week.length }).map((_, emptyIndex) => (
                    <div
                      key={`empty-${weekIndex}-${emptyIndex}`}
                      className="heatmap-day heatmap-day-empty"
                    />
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="heatmap-stats">
        <div className="stat-card">
          <div className="stat-number">{heatmapData.filter(d => d.count >= 80).length}</div>
          <div className="stat-label">Perfect Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{heatmapData.filter(d => d.count >= 60).length}</div>
          <div className="stat-label">Good Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{heatmapData.filter(d => d.count > 0).length}</div>
          <div className="stat-label">Active Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.round(heatmapData.reduce((sum, d) => sum + d.count, 0) / heatmapData.length)}%</div>
          <div className="stat-label">Average</div>
        </div>
      </div>
    </div>
  );
}

export default Heatmap;
