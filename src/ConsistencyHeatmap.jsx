import React from 'react';
import './ConsistencyHeatmap.css';

const ConsistencyHeatmap = ({ data }) => {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Handle empty or loading data
  if (!data || data.length === 0) {
    return (
      <div className="consistency-heatmap-card">
        <div className="consistency-heatmap-header">
          <span className="consistency-heatmap-icon">🔥</span>
          <h3 className="consistency-heatmap-title">Consistency Heatmap</h3>
        </div>
        <div className="consistency-heatmap-placeholder">
          <div className="placeholder-text">Loading consistency data...</div>
          <div className="placeholder-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="placeholder-column">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="placeholder-box"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Organize data into rows (weeks)
  // We expect data to be aligned starting from a Monday
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    const week = data.slice(i, i + 7);
    // Pad the last week if it's incomplete
    while (week.length < 7) {
      week.push({ date: null, count: 0, completed_habits: 0 });
    }
    weeks.push(week);
  }

  // We only want to show the last 10-12 weeks for the dashboard view
  const displayWeeks = weeks.slice(-12);

  const getColor = (count) => {
    if (count === 0) return '#262a33'; // Empty
    if (count <= 25) return '#344e5c'; // Low
    if (count <= 50) return '#a3d977'; // Medium
    if (count <= 75) return '#4a9e5a'; // High
    return '#1a5e3a'; // Very High
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="consistency-heatmap-card">
      <div className="consistency-heatmap-header">
        <span className="consistency-heatmap-icon">🔥</span>
        <h3 className="consistency-heatmap-title">Consistency Heatmap</h3>
      </div>

      <div className="consistency-heatmap-content">
        <div className="consistency-heatmap-y-labels">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <span key={i}>{day}</span>
          ))}
        </div>

        <div className="consistency-heatmap-grid-container">
          <div className="consistency-heatmap-grid">
            {displayWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="consistency-heatmap-column">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="consistency-heatmap-box"
                    style={{ backgroundColor: getColor(day.count) }}
                  >
                    <div className="consistency-heatmap-tooltip">
                      <div className="tooltip-date">{formatDate(day.date)}</div>
                      <div className="tooltip-count">{day.completed_habits} habits completed</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="consistency-heatmap-footer">
        <span>Less</span>
        <div className="consistency-heatmap-legend">
          <div className="legend-box" style={{ backgroundColor: '#262a33' }}></div>
          <div className="legend-box" style={{ backgroundColor: '#344e5c' }}></div>
          <div className="legend-box" style={{ backgroundColor: '#a3d977' }}></div>
          <div className="legend-box" style={{ backgroundColor: '#4a9e5a' }}></div>
          <div className="legend-box" style={{ backgroundColor: '#1a5e3a' }}></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ConsistencyHeatmap;
