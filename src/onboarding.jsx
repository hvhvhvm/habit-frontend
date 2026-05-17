import { useState } from "react";

const TOTAL_STEPS = 8;

const habitMap = {
  Fitness: {
    "15": [
      {
        title: "Running",
        target_type: "minutes",
        target_value: 10,
        points: 10,
      },
      {
        title: "Stretching",
        target_type: "minutes",
        target_value: 5,
        points: 5,
      },
    ],

    "30": [
      {
        title: "Running",
        target_type: "minutes",
        target_value: 20,
        points: 20,
      },
      {
        title: "Pull Ups",
        target_type: "count",
        target_value: 20,
        points: 15,
      },
      {
        title: "Stretching",
        target_type: "minutes",
        target_value: 10,
        points: 5,
      },
    ],

    "60": [
      {
        title: "Running",
        target_type: "minutes",
        target_value: 30,
        points: 25,
      },
      {
        title: "Pull Ups",
        target_type: "count",
        target_value: 50,
        points: 20,
      },
      {
        title: "Squats",
        target_type: "count",
        target_value: 20,
        points: 10,
      },
      {
        title: "Plank",
        target_type: "minutes",
        target_value: 1,
        points: 10,
      },
      {
        title: "Stretching",
        target_type: "minutes",
        target_value: 10,
        points: 5,
      },
    ],

    "all": [
      {
        title: "Full Workout",
        target_type: "minutes",
        target_value: 90,
        points: 40,
      },
      {
        title: "Running",
        target_type: "minutes",
        target_value: 30,
        points: 25,
      },
      {
        title: "Pull Ups",
        target_type: "count",
        target_value: 50,
        points: 20,
      },
      {
        title: "Plank",
        target_type: "minutes",
        target_value: 3,
        points: 15,
      },
      {
        title: "Stretching",
        target_type: "minutes",
        target_value: 15,
        points: 5,
      },
    ],
  },

  Study: {
    "15": [
      {
        title: "Reading",
        target_type: "pages",
        target_value: 5,
        points: 10,
      },
    ],

    "30": [
      {
        title: "Reading",
        target_type: "pages",
        target_value: 20,
        points: 15,
      },
      {
        title: "Study Session",
        target_type: "minutes",
        target_value: 30,
        points: 20,
      },
    ],

    "60": [
      {
        title: "Reading",
        target_type: "pages",
        target_value: 30,
        points: 20,
      },
      {
        title: "Study Session",
        target_type: "minutes",
        target_value: 60,
        points: 30,
      },
      {
        title: "Flashcards",
        target_type: "minutes",
        target_value: 20,
        points: 10,
      },
    ],

    "all": [
      {
        title: "Deep Study",
        target_type: "minutes",
        target_value: 120,
        points: 50,
      },
      {
        title: "Reading",
        target_type: "pages",
        target_value: 50,
        points: 25,
      },
      {
        title: "Flashcards",
        target_type: "minutes",
        target_value: 30,
        points: 15,
      },
    ],
  },

  "Self Care": {
    "15": [
      {
        title: "Skincare",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Drink Water",
        target_type: "liters",
        target_value: 2,
        points: 10,
      },
    ],

    "30": [
      {
        title: "Hair Routine",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Skincare",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Drink Water",
        target_type: "liters",
        target_value: 2,
        points: 10,
      },
    ],

    "60": [
      {
        title: "Hair Routine",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Skincare",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Drink Water",
        target_type: "liters",
        target_value: 2,
        points: 10,
      },
      {
        title: "Cold Shower",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
    ],

    "all": [
      {
        title: "Full Grooming Routine",
        target_type: "count",
        target_value: 1,
        points: 30,
      },
      {
        title: "Hair Mask",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Skincare",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Drink Water",
        target_type: "liters",
        target_value: 3,
        points: 15,
      },
    ],
  },

  Diet: {
    "15": [
      {
        title: "Track Meals",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Drink Water",
        target_type: "liters",
        target_value: 2,
        points: 10,
      },
    ],

    "30": [
      {
        title: "Meal Prep",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Track Calories",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Drink Water",
        target_type: "liters",
        target_value: 2,
        points: 10,
      },
    ],

    "60": [
      {
        title: "Meal Prep",
        target_type: "count",
        target_value: 1,
        points: 20,
      },
      {
        title: "Track Macros",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Cook Healthy Meal",
        target_type: "count",
        target_value: 1,
        points: 20,
      },
    ],

    "all": [
      {
        title: "Full Meal Prep",
        target_type: "count",
        target_value: 1,
        points: 30,
      },
      {
        title: "Track Macros",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Cook Healthy Meals",
        target_type: "count",
        target_value: 2,
        points: 25,
      },
    ],
  },
  Sleep: {
    "15": [
      {
        title: "Sleep Wind Down",
        target_type: "minutes",
        target_value: 10,
        points: 10,
      },
      {
        title: "No Phone Before Bed",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
    ],

    "30": [
      {
        title: "Sleep Wind Down",
        target_type: "minutes",
        target_value: 20,
        points: 15,
      },
      {
        title: "No Phone Before Bed",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Consistent Bedtime",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
    ],

    "60": [
      {
        title: "Evening Routine",
        target_type: "minutes",
        target_value: 30,
        points: 20,
      },
      {
        title: "No Phone Before Bed",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Consistent Bedtime",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Morning Wake Time",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
    ],

    "all": [
      {
        title: "Full Sleep Routine",
        target_type: "minutes",
        target_value: 45,
        points: 30,
      },
      {
        title: "No Phone Before Bed",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
      {
        title: "Consistent Bedtime",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Morning Wake Time",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
    ],
  },
  "Mental Health": {
    "15": [
      {
        title: "Meditation",
        target_type: "minutes",
        target_value: 5,
        points: 10,
      },
      {
        title: "Gratitude Journal",
        target_type: "count",
        target_value: 1,
        points: 10,
      },
    ],

    "30": [
      {
        title: "Meditation",
        target_type: "minutes",
        target_value: 10,
        points: 15,
      },
      {
        title: "Journal Entry",
        target_type: "count",
        target_value: 1,
        points: 15,
      },
      {
        title: "Gratitude Practice",
        target_type: "count",
        target_value: 3,
        points: 10,
      },
    ],

    "60": [
      {
        title: "Meditation",
        target_type: "minutes",
        target_value: 20,
        points: 25,
      },
      {
        title: "Deep Journaling",
        target_type: "minutes",
        target_value: 20,
        points: 20,
      },
      {
        title: "Breathing Exercise",
        target_type: "minutes",
        target_value: 10,
        points: 10,
      },
      {
        title: "Gratitude Practice",
        target_type: "count",
        target_value: 5,
        points: 10,
      },
    ],

    "all": [
      {
        title: "Meditation",
        target_type: "minutes",
        target_value: 30,
        points: 35,
      },
      {
        title: "Deep Journaling",
        target_type: "minutes",
        target_value: 30,
        points: 25,
      },
      {
        title: "Breathing Exercise",
        target_type: "minutes",
        target_value: 15,
        points: 15,
      },
      {
        title: "Gratitude Practice",
        target_type: "count",
        target_value: 5,
        points: 10,
      },
    ],
  },
};

const categoryEmojis = {
  Fitness: "💪",
  Study: "📚",
  "Self Care": "💆",
  Diet: "🥗",
  Sleep: "😴",
  "Mental Health": "🧘",
};

const whyOptions = [
  { emoji: "😔", label: "I keep starting and quitting" },
  { emoji: "📱", label: "I waste too much time" },
  { emoji: "💪", label: "I want more discipline" },
  { emoji: "📚", label: "I want to be a better student" },
  { emoji: "🌱", label: "I want to improve my life" },
  { emoji: "⚡", label: "I just feel stuck" },
];

const goalsList = [
  { emoji: "💪", label: "Get fitter and stronger" },
  { emoji: "📚", label: "Study and learn better" },
  { emoji: "💆", label: "Take better care of myself" },
  { emoji: "🥗", label: "Eat and live healthier" },
  { emoji: "😴", label: "Fix my sleep" },
  { emoji: "📵", label: "Use my phone less" },
  { emoji: "✨", label: "Be a better person" },
];

const timeOptions = [
  { value: "15", label: "15 minutes", sub: "Perfect starting point", emoji: "⚡" },
  { value: "30", label: "30 minutes", sub: "Solid commitment", emoji: "🕐" },
  { value: "60", label: "1 hour", sub: "Serious about change", emoji: "🕑" },
  { value: "all", label: "Whatever it takes", sub: "All in", emoji: "🔥" },
];

const categoryList = ["Fitness", "Study", "Self Care", "Diet", "Sleep", "Mental Health"];
const maxStarterHabitsByTime = {
  "15": 2,
  "30": 3,
  "60": 4,
  all: 4,
};

const curatedStarterHabits = {
  Fitness: {
    "15": [{ title: "10-Minute Run", target_type: "duration", target_value: 10, points: 10 }],
    "30": [{ title: "20-Minute Run", target_type: "duration", target_value: 20, points: 15 }],
    "60": [{ title: "30-Minute Run", target_type: "duration", target_value: 30, points: 15 }],
    all: [
      { title: "30-Minute Run", target_type: "duration", target_value: 30, points: 15 },
      { title: "Stretching", target_type: "duration", target_value: 10, points: 5 },
    ],
  },
  Study: {
    "15": [{ title: "Read 5 Pages", target_type: "count", target_value: 5, points: 10 }],
    "30": [{ title: "Focused Study", target_type: "duration", target_value: 25, points: 10 }],
    "60": [{ title: "Deep Study", target_type: "duration", target_value: 45, points: 15 }],
    all: [
      { title: "Deep Study", target_type: "duration", target_value: 45, points: 15 },
      { title: "Read 10 Pages", target_type: "count", target_value: 10, points: 10 },
    ],
  },
  "Self Care": {
    "15": [{ title: "Simple Skincare", target_type: "count", target_value: 1, points: 5 }],
    "30": [{ title: "Self-Care Routine", target_type: "duration", target_value: 15, points: 15 }],
    "60": [{ title: "Full Self-Care Routine", target_type: "duration", target_value: 25, points: 15 }],
    all: [
      { title: "Full Self-Care Routine", target_type: "duration", target_value: 25, points: 15 },
      { title: "Drink 6 Glasses of Water", target_type: "count", target_value: 6, points: 10 },
    ],
  },
  Diet: {
    "15": [{ title: "Drink 6 Glasses of Water", target_type: "count", target_value: 6, points: 10 }],
    "30": [{ title: "Log Today's Meals", target_type: "count", target_value: 1, points: 10 }],
    "60": [{ title: "Prepare One Healthy Meal", target_type: "count", target_value: 1, points: 15 }],
    all: [
      { title: "Prepare One Healthy Meal", target_type: "count", target_value: 1, points: 15 },
      { title: "Log Today's Meals", target_type: "count", target_value: 1, points: 10 },
    ],
  },
  Sleep: {
    "15": [{ title: "No Phone Before Bed", target_type: "count", target_value: 1, points: 10 }],
    "30": [{ title: "20-Minute Wind Down", target_type: "duration", target_value: 20, points: 15 }],
    "60": [{ title: "Consistent Bedtime", target_type: "count", target_value: 1, points: 15 }],
    all: [
      { title: "Consistent Bedtime", target_type: "count", target_value: 1, points: 15 },
      { title: "20-Minute Wind Down", target_type: "duration", target_value: 20, points: 15 },
    ],
  },
  "Mental Health": {
    "15": [{ title: "5-Minute Meditation", target_type: "duration", target_value: 5, points: 5 }],
    "30": [{ title: "Gratitude Journal", target_type: "count", target_value: 1, points: 10 }],
    "60": [{ title: "Mindful Reset", target_type: "duration", target_value: 20, points: 15 }],
    all: [
      { title: "Mindful Reset", target_type: "duration", target_value: 20, points: 15 },
      { title: "Gratitude Journal", target_type: "count", target_value: 1, points: 10 },
    ],
  },
};

function getHabitKey(category, habit) {
  return `${category}:${habit.title}`;
}

function normalizeTargetType(targetType) {
  return targetType === "duration" || targetType === "minutes" ? "duration" : "count";
}

function formatTargetLabel(habit) {
  if (habit.target_type === "duration" || habit.target_type === "minutes") return `${habit.target_value} minutes`;
  if (habit.target_type === "pages") return `${habit.target_value} pages`;
  if (habit.target_type === "liters") return `${habit.target_value} liters`;
  return `${habit.target_value} time${habit.target_value === 1 ? "" : "s"}`;
}

function normalizeStarterPoints(points) {
  if (points >= 15) return 15;
  if (points >= 10) return 10;
  return 5;
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "32px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "4px",
            flex: 1,
            borderRadius: "2px",
            background: i < step ? "#c8a96e" : "rgba(255,255,255,0.15)",
            transition: "background 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [whyHere, setWhyHere] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [time, setTime] = useState("");
  const [categories, setCategories] = useState([]);
  const [generatedHabits, setGeneratedHabits] = useState({});
  const [removedHabits, setRemovedHabits] = useState([]);
  const [personalWhy, setPersonalWhy] = useState("");
  const [animating, setAnimating] = useState(false);

  function nextStep() {
    setAnimating(true);
    setTimeout(() => {
      setStep((p) => p + 1);
      setAnimating(false);
    }, 200);
  }

  function prevStep() {
    setAnimating(true);
    setTimeout(() => {
      setStep((p) => p - 1);
      setAnimating(false);
    }, 200);
  }

  function toggleGoal(goal) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  function getMaxCategories() {
    return maxStarterHabitsByTime[time] || 3;
  }

  function toggleCategory(cat) {
    const max = getMaxCategories();
    if (categories.includes(cat)) {
      setCategories((prev) => prev.filter((c) => c !== cat));
    } else {
      if (categories.length >= max) return;
      setCategories((prev) => [...prev, cat]);
    }
  }

  function generateHabits() {
    const result = {};
    const selectedCategories = categories.slice(0, getMaxCategories());

    selectedCategories.forEach((cat) => {
      const bestStarterHabit =
        curatedStarterHabits[cat]?.[time] ||
        curatedStarterHabits[cat]?.["30"] ||
        habitMap[cat]?.["30"]?.[0];

      if (bestStarterHabit) {
        result[cat] = Array.isArray(bestStarterHabit)
          ? bestStarterHabit.slice(0, time === "all" ? 2 : 1)
          : [bestStarterHabit];
      }
    });

    setGeneratedHabits(result);
    setRemovedHabits([]);
  }

  function toggleHabit(habitKey) {
    setRemovedHabits((prev) =>
      prev.includes(habitKey) ? prev.filter((h) => h !== habitKey) : [...prev, habitKey]
    );
  }

  function getFinalHabits() {
    const all = [];
    Object.entries(generatedHabits).forEach(([cat, habits]) => {
      habits.forEach((h) => {
        if (!removedHabits.includes(getHabitKey(cat, h))) all.push({
          ...h,
          target_type: normalizeTargetType(h.target_type),
          points: normalizeStarterPoints(h.points),
          category: cat,
        });
      });
    });
    return all;
  }

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Georgia', serif",
    padding: "20px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "420px",
    opacity: animating ? 0 : 1,
    transform: animating ? "translateY(10px)" : "translateY(0)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  };

  const titleStyle = {
    fontSize: "26px",
    fontWeight: "700",
    color: "#f5f0e8",
    marginBottom: "8px",
    lineHeight: "1.3",
    letterSpacing: "-0.5px",
  };

  const subtitleStyle = {
    fontSize: "14px",
    color: "rgba(245,240,232,0.5)",
    marginBottom: "32px",
    lineHeight: "1.6",
  };

  const primaryBtn = {
    width: "100%",
    padding: "16px",
    background: "#c8a96e",
    border: "none",
    borderRadius: "14px",
    color: "#1a1a2e",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "24px",
    letterSpacing: "0.3px",
    transition: "opacity 0.2s",
  };

  const ghostBtn = {
    background: "none",
    border: "none",
    color: "rgba(245,240,232,0.4)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "12px",
    display: "block",
    margin: "8px auto 0",
  };

  const backBtn = {
    background: "none",
    border: "none",
    color: "rgba(245,240,232,0.4)",
    fontSize: "13px",
    cursor: "pointer",
    padding: "0",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  const optionBtn = (selected) => ({
    width: "100%",
    padding: "14px 18px",
    background: selected ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)",
    border: selected ? "1.5px solid #c8a96e" : "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: selected ? "#c8a96e" : "#f5f0e8",
    fontSize: "15px",
    cursor: "pointer",
    marginBottom: "10px",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.2s ease",
    fontFamily: "'Georgia', serif",
  });

  // SCREEN 1 — Entry
  if (step === 1) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>🔥</div>
          <h1 style={{ ...titleStyle, fontSize: "32px", marginBottom: "16px" }}>
            Your best self starts<br />with one habit.
          </h1>
          <p style={subtitleStyle}>
            Build discipline. Track progress.<br />Become who you want to be.
          </p>
          <button style={primaryBtn} onClick={nextStep}>
            Begin my journey →
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2 — Name
  if (step === 2) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          {step > 2 && (
            <button style={backBtn} onClick={prevStep}>← Back</button>
          )}
          <h2 style={titleStyle}>What should we<br />call you?</h2>
          <p style={subtitleStyle}>This is your personal journey.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: "100%",
              padding: "16px",
              background: "rgba(255,255,255,0.07)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              color: "#f5f0e8",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "'Georgia', serif",
            }}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && nextStep()}
            autoFocus
          />
          <button
            style={{ ...primaryBtn, opacity: name.trim() ? 1 : 0.4 }}
            disabled={!name.trim()}
            onClick={nextStep}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 3 — Why here
  if (step === 3) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          <button style={backBtn} onClick={prevStep}>← Back</button>
          <h2 style={titleStyle}>Hey {name},<br />what brings you here?</h2>
          <p style={subtitleStyle}>Pick your most honest answer.</p>
          {whyOptions.map((opt) => (
            <button
              key={opt.label}
              style={optionBtn(whyHere === opt.label)}
              onClick={() => { setWhyHere(opt.label); }}
            >
              <span style={{ fontSize: "20px" }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
          <button
            style={{ ...primaryBtn, opacity: whyHere ? 1 : 0.4 }}
            disabled={!whyHere}
            onClick={nextStep}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 4 — Goals
  if (step === 4) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          <button style={backBtn} onClick={prevStep}>← Back</button>
          <h2 style={titleStyle}>What do you want<br />to change most?</h2>
          <p style={subtitleStyle}>Select all that apply.</p>
          {goalsList.map((g) => (
            <button
              key={g.label}
              style={optionBtn(selectedGoals.includes(g.label))}
              onClick={() => toggleGoal(g.label)}
            >
              <span style={{ fontSize: "20px" }}>{g.emoji}</span>
              <span>{g.label}</span>
              {selectedGoals.includes(g.label) && (
                <span style={{ marginLeft: "auto", color: "#c8a96e" }}>✓</span>
              )}
            </button>
          ))}
          <button
            style={{ ...primaryBtn, opacity: selectedGoals.length ? 1 : 0.4 }}
            disabled={selectedGoals.length === 0}
            onClick={nextStep}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 5 — Time
  if (step === 5) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          <button style={backBtn} onClick={prevStep}>← Back</button>
          <h2 style={titleStyle}>How much time can<br />you give daily?</h2>
          <p style={subtitleStyle}>Be honest — small beats nothing every time.</p>
          {timeOptions.map((t) => (
            <button
              key={t.value}
              style={optionBtn(time === t.value)}
              onClick={() => setTime(t.value)}
            >
              <span style={{ fontSize: "20px" }}>{t.emoji}</span>
              <div>
                <div style={{ fontWeight: "600" }}>{t.label}</div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginTop: "2px" }}>{t.sub}</div>
              </div>
            </button>
          ))}
          <button
            style={{ ...primaryBtn, opacity: time ? 1 : 0.4 }}
            disabled={!time}
            onClick={nextStep}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 6 — Categories
  if (step === 6) {
    const max = getMaxCategories();
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          <button style={backBtn} onClick={prevStep}>← Back</button>
          <h2 style={titleStyle}>Which areas matter<br />most to you?</h2>
          <p style={subtitleStyle}>
            Select up to {max} areas — these become your habit categories.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {categoryList.map((cat) => {
              const selected = categories.includes(cat);
              const disabled = !selected && categories.length >= max;
              return (
                <button
                  key={cat}
                  onClick={() => !disabled && toggleCategory(cat)}
                  style={{
                    padding: "18px 12px",
                    background: selected ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.05)",
                    border: selected ? "1.5px solid #c8a96e" : "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    color: selected ? "#c8a96e" : disabled ? "rgba(245,240,232,0.3)" : "#f5f0e8",
                    cursor: disabled ? "not-allowed" : "pointer",
                    textAlign: "center",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                    {categoryEmojis[cat]}
                  </div>
                  {cat}
                  {selected && <div style={{ fontSize: "11px", marginTop: "4px" }}>✓ selected</div>}
                </button>
              );
            })}
          </div>
          <button
            style={{ ...primaryBtn, opacity: categories.length ? 1 : 0.4 }}
            disabled={categories.length === 0}
            onClick={() => { generateHabits(); nextStep(); }}
          >
            Build my plan →
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 7 — Habit Suggestions
  if (step === 7) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, maxHeight: "90vh", overflowY: "auto" }}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          <button style={backBtn} onClick={prevStep}>← Back</button>
          <h2 style={titleStyle}>Your personal<br />starting plan:</h2>
          <p style={subtitleStyle}>
            Uncheck anything that doesn't feel right.
          </p>
          {Object.entries(generatedHabits).map(([cat, habits]) => (
            <div key={cat} style={{ marginBottom: "24px" }}>
              <div style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#c8a96e",
                letterSpacing: "1.5px",
                marginBottom: "10px",
              }}>
                {categoryEmojis[cat]} {cat.toUpperCase()}
              </div>
              {habits.map((habit) => {
                const habitKey = getHabitKey(cat, habit);
                const removed = removedHabits.includes(habitKey)
                return (
                  <div
                    key={habitKey}
                    onClick={() => toggleHabit(habitKey)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      background: removed ? "rgba(255,255,255,0.02)" : "rgba(200,169,110,0.1)",
                      border: removed ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(200,169,110,0.3)",
                      borderRadius: "10px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "6px",
                      border: removed ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid #c8a96e",
                      background: removed ? "transparent" : "#c8a96e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "12px",
                    }}>
                      {!removed && "✓"}
                    </div>
                    <span style={{
                      color: removed ? "rgba(245,240,232,0.3)" : "#f5f0e8",
                      fontSize: "14px",
                      textDecoration: removed ? "line-through" : "none",
                    }}>
                      {habit.title} — {formatTargetLabel(habit)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          <button
            style={{ ...primaryBtn, opacity: getFinalHabits().length ? 1 : 0.4 }}
            disabled={getFinalHabits().length === 0}
            onClick={nextStep}
          >
            This looks good →
          </button>
          <button style={ghostBtn} onClick={nextStep}>
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 8 — Personal WHY + Ready
  if (step === 8) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <ProgressBar step={step - 1} total={TOTAL_STEPS} />
          <button style={backBtn} onClick={prevStep}>← Back</button>
          <h2 style={titleStyle}>One last thing,<br />{name}.</h2>
          <p style={subtitleStyle}>
            Why does this really matter to you?<br />
            Your answer stays between you and the app.
          </p>
          <textarea
            value={personalWhy}
            onChange={(e) => setPersonalWhy(e.target.value)}
            placeholder='eg. "I want to feel proud of who I am every day"'
            rows={4}
            style={{
              width: "100%",
              padding: "16px",
              background: "rgba(255,255,255,0.07)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              color: "#f5f0e8",
              fontSize: "14px",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
              fontFamily: "'Georgia', serif",
              lineHeight: "1.6",
            }}
          />
          <button
            style={primaryBtn}
            onClick={() => {
              const finalHabits = getFinalHabits();
              if (onComplete) {
                onComplete({
                  name: name,
                  whyHere,
                  goals: selectedGoals,
                  time,
                  categories,
                  habits: finalHabits,
                  personalWhy,
                });
              }
            }}
          >
            Start my journey 🔥
          </button>
          <button style={ghostBtn} onClick={() => {
            const finalHabits = getFinalHabits();
            if (onComplete) {
              onComplete({
                name,
                whyHere,
                goals: selectedGoals,
                time,
                categories,
                habits: finalHabits,
                personalWhy: "",
              });
            }
          }}>
            Skip — let's go
          </button>
        </div>
      </div>
    );
  }

  return null;
}
