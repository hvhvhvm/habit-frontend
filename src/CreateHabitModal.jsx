import React, { useState } from 'react';
import './CreateHabitModal.css';
import { categoryMap } from './CategoryConfig';

const weekDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function CreateHabitModal({ onClose, onAddHabit, onEditHabit, initialHabit = null }) {
  const isEditMode = Boolean(initialHabit);
  const initialCategoryIsStandard = Object.keys(categoryMap).includes(initialHabit?.category || 'Productivity');
  const defaultCategory = initialHabit?.category ? (initialCategoryIsStandard ? initialHabit.category : 'Custom') : 'Productivity';

  const [title, setTitle] = useState(initialHabit?.title || '');
  const [category, setCategory] = useState(defaultCategory);
  const [customCategory, setCustomCategory] = useState(!initialCategoryIsStandard ? initialHabit.category : '');
  const [type, setType] = useState(initialHabit?.target_type || 'count');
  const [target, setTarget] = useState(initialHabit?.target_value || 1);
  const [repeat, setRepeat] = useState(initialHabit?.repeat || 'daily');
  const [days, setDays] = useState(initialHabit?.days || []);
  const [time, setTime] = useState(initialHabit?.scheduled_time || '');
  const [isSession, setIsSession] = useState(Boolean(initialHabit?.is_session) || false);
  const [focusTime, setFocusTime] = useState(initialHabit?.focus_time || 25);
  const [breakTime, setBreakTime] = useState(initialHabit?.break_time || 5);
  const [totalSessions, setTotalSessions] = useState(initialHabit?.total_sessions || 1);

  const handleDayToggle = (day) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a habit name");
      return;
    }

    const payload = {
      title: title.trim(),
      target_type: isSession ? "count" : type,
      target_value: isSession ? Number(totalSessions) : Number(target),
      category: category === 'Custom' ? (customCategory.trim() || 'Custom') : category,
      scheduled_time: isSession ? null : (time || null),
      repeat: isSession ? "daily" : repeat,
      days: isSession ? [] : (repeat === 'custom' ? days : []), 
      is_session: isSession,
      focus_time: isSession ? Number(focusTime) : null,
      break_time: isSession ? Number(breakTime) : null,
      total_sessions: isSession ? Number(totalSessions) : null
    };

    if (isEditMode && typeof onEditHabit === "function") {
      onEditHabit(payload);
      return;
    }

    onAddHabit(payload);
  };

  return (
    <div className="chm-overlay" onClick={onClose}>
      <div className="chm-modal" onClick={e => e.stopPropagation()}>
        <div className="chm-header">
          <h2>{isEditMode ? "Edit Habit" : "Create New Habit"}</h2>
          <button className="chm-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="chm-body">
          <div className="chm-field">
            <label>Habit Name</label>
            <input 
              type="text" 
              placeholder="e.g., Morning meditation"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="chm-input"
            />
          </div>

          <div className="chm-field">
            <label>Category</label>
            <div className="chm-categories">
              {Object.entries(categoryMap).map(([catName, catData]) => (
                <button 
                  key={catName} 
                  type="button"
                  className={`chm-category-btn ${category === catName ? 'active' : ''}`}
                  onClick={() => setCategory(catName)}
                  style={category === catName ? {
                    backgroundColor: `${catData.color}20`,
                    borderColor: catData.color,
                    color: '#fff'
                  } : {}}
                >
                  <span className="chm-icon">{catData.icon}</span> <span className="chm-cat-txt">{catName}</span>
                </button>
              ))}
            </div>
          </div>

          {category === 'Custom' && (
            <div className="chm-field" style={{ animation: 'fadeIn 0.2s ease', marginTop: '-10px' }}>
              <input 
                type="text" 
                placeholder="Enter custom category name (e.g., Coding)"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="chm-input"
              />
            </div>
          )}

          <div className="chm-row" style={{ gap: '10px' }}>
            <div className="chm-field" style={{ flex: 1.2, minWidth: 0 }}>
              <label>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="chm-input chm-select" style={{ padding: '10px 26px 10px 10px', backgroundPosition: 'right 8px center' }}>
                <option value="count">Count</option>
                <option value="duration">Minutes</option>
              </select>
            </div>
            <div className="chm-field" style={{ flex: 0.8, minWidth: 0 }}>
              <label>Target</label>
              <input 
                type="number" 
                min="1" 
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="chm-input"
                style={{ padding: '10px 10px' }}
              />
            </div>
            <div className="chm-field" style={{ flex: 1.2, minWidth: 0 }}>
              <label>Repeat</label>
              <div className="chm-select-wrapper" style={{ width: '100%' }}>
                  <select value={repeat} onChange={e => setRepeat(e.target.value)} className="chm-input chm-select" style={{ padding: '10px 26px 10px 10px', backgroundPosition: 'right 8px center', width: '100%' }}>
                    <option value="daily">Daily</option>
                    <option value="custom">Custom</option>
                    <option value="today">Today</option>
                  </select>
              </div>
            </div>
          </div>

          {repeat === 'custom' && !isSession && (
            <div className="chm-field" style={{ animation: 'fadeIn 0.2s ease' }}>
              <label>Select Days</label>
              <div className="chm-days-row">
                {weekDays.map(day => (
                  <button
                    key={day}
                    className={`chm-day-btn ${days.includes(day) ? 'active' : ''}`}
                    onClick={() => handleDayToggle(day)}
                  >
                    {day.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chm-field">
            <label>Time (Optional)</label>
            <div className="chm-time-input-wrapper">
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="chm-input chm-time-input"
              />
            </div>
          </div>

          <div className={`chm-focus-timer-toggle ${isSession ? 'active' : ''}`}>
            <label className="chm-toggle-label">
                <div className="chm-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      checked={isSession}
                      onChange={e => setIsSession(e.target.checked)}
                    />
                    <span className="chm-checkmark"></span>
                </div>
                <div className="chm-focus-label-text">
                  <strong>Enable Focus Timer</strong>
                  <span>Add a Pomodoro-style timer</span>
                </div>
            </label>
            {isSession && (
              <div className="chm-focus-settings">
                  <div className="chm-focus-field">
                      <label>Sessions</label>
                      <input type="number" min="1" className="chm-input chm-focus-input" value={totalSessions} onChange={e => setTotalSessions(e.target.value)} />
                  </div>
                  <div className="chm-focus-field">
                      <label>Focus (min)</label>
                      <input type="number" min="1" className="chm-input chm-focus-input" value={focusTime} onChange={e => setFocusTime(e.target.value)} />
                  </div>
                  <div className="chm-focus-field">
                      <label>Break (min)</label>
                      <input type="number" min="0" className="chm-input chm-focus-input" value={breakTime} onChange={e => setBreakTime(e.target.value)} />
                  </div>
              </div>
            )}
          </div>
        </div>

        <div className="chm-footer">
          <button className="chm-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="chm-create-btn" onClick={handleSave}>
            {isEditMode ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
