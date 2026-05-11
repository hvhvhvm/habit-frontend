import React, { useState } from "react";
import { apiUrl } from "./api";
import "./CreateRoutineModal.css";

const TIME_BLOCKS = [
  { id: "morning", label: "Morning", icon: "☀️", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" },
  { id: "evening", label: "Evening", icon: "🌆", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
  { id: "night", label: "Night", icon: "🌙", gradient: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)" },
  { id: "default", label: "Constant", icon: "🔄", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
];

const REPEAT_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "custom", label: "Custom Days" },
  { value: "today", label: "Today Only" },
];

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function CreateRoutineModal({ onClose, onCreated, token }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [timeBlock, setTimeBlock] = useState("morning");
  const [repeat, setRepeat] = useState("daily");
  const [days, setDays] = useState([]);
  const [habitInputs, setHabitInputs] = useState([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addHabitRow = () => {
    setHabitInputs((prev) => [...prev, ""]);
  };

  const updateHabitInput = (index, value) => {
    setHabitInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const removeHabitRow = (index) => {
    setHabitInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDay = (day) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const habitNames = habitInputs
    .map((h) => h.trim())
    .filter((h) => h.length > 0);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a routine name");
      return;
    }

    if (habitNames.length === 0) {
      setError("Add at least one habit");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. Create the routine
      const routineRes = await fetch(apiUrl("/routines"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), emoji }),
      });

      if (!routineRes.ok) {
        throw new Error("Failed to create routine");
      }

      const routine = await routineRes.json();

      // 2. Create each habit under this routine
      const habitPromises = habitNames.map((habitTitle) =>
        fetch(apiUrl("/habits"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: habitTitle,
            target_type: "count",
            target_value: 1,
            category: "Productivity",
            time_block: timeBlock,
            routine_id: routine.id,
            points: 10,
            repeat,
            days: repeat === "custom" ? days : [],
            is_session: false,
            focus_time: null,
            break_time: null,
            total_sessions: null,
          }),
        })
      );

      await Promise.all(habitPromises);

      if (typeof onCreated === "function") {
        onCreated(routine);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crm-overlay" onClick={onClose}>
      <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crm-header">
          <div>
            <span className="crm-label">New Routine</span>
            <h2>Build your routine</h2>
          </div>
          <button className="crm-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="crm-body">
          {error && <p className="crm-error">{error}</p>}

          {/* Name + Emoji */}
          <div className="crm-name-row">
            <input
              className="crm-emoji-input"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              aria-label="Routine emoji"
            />
            <input
              className="crm-input crm-name-input"
              placeholder="Routine name (e.g. Morning Workout)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Time Block */}
          <div className="crm-section">
            <label className="crm-section-label">Time Block</label>
            <div className="crm-timeblock-row">
              {TIME_BLOCKS.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  className={`crm-timeblock-btn ${timeBlock === block.id ? "is-active" : ""}`}
                  onClick={() => setTimeBlock(block.id)}
                >
                  <span
                    className="crm-timeblock-dot"
                    style={{ background: block.gradient }}
                  >
                    {block.icon}
                  </span>
                  <span>{block.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Repeat */}
          <div className="crm-section">
            <label className="crm-section-label">Repeat</label>
            <div className="crm-repeat-row">
              {REPEAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`crm-repeat-btn ${repeat === opt.value ? "is-active" : ""}`}
                  onClick={() => setRepeat(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {repeat === "custom" && (
              <div className="crm-days-row">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`crm-day-btn ${days.includes(day) ? "is-active" : ""}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Habits List */}
          <div className="crm-section">
            <label className="crm-section-label">
              Habits
              <span className="crm-habit-count">{habitNames.length} added</span>
            </label>

            <div className="crm-habits-list">
              {habitInputs.map((value, index) => (
                <div className="crm-habit-row" key={index}>
                  <span className="crm-habit-number">{index + 1}</span>
                  <input
                    className="crm-input crm-habit-input"
                    placeholder={`Habit name (e.g. ${
                      index === 0
                        ? "Drink water"
                        : index === 1
                          ? "Stretch 5 mins"
                          : "Journaling"
                    })`}
                    value={value}
                    onChange={(e) => updateHabitInput(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && value.trim()) {
                        addHabitRow();
                      }
                    }}
                  />
                  {habitInputs.length > 1 && (
                    <button
                      className="crm-habit-remove"
                      type="button"
                      onClick={() => removeHabitRow(index)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="crm-add-habit-btn"
              type="button"
              onClick={addHabitRow}
            >
              + Add another habit
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="crm-footer">
          <button className="crm-cancel" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="crm-save"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Creating..." : `Create Routine (${habitNames.length} habits)`}
          </button>
        </div>
      </div>
    </div>
  );
}
