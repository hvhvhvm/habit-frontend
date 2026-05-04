import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiUrl } from "./api";
import "./OneBetterGraph.css";

const GREEN = "#1f6a43";
const MUTED_GREEN = "#b8cfba";
const WARNING = "#d45a3a";

const RANGE_OPTIONS = [
  { label: "3 Months", days: 90 },
  { label: "9 Months", days: 270 },
  { label: "1 Year", days: 365 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hasDueHabits(day) {
  return Number(day.total_habits) > 0;
}

function rollingAverage(points, index, key, windowSize = 5) {
  const window = points.slice(Math.max(0, index - windowSize + 1), index + 1);
  return window.reduce((sum, point) => sum + Number(point[key] || 0), 0) / window.length;
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calcDailyTarget(day) {
  if (!hasDueHabits(day)) return null;

  const completion = clamp(Number(day.completion_percent) || 0, 0, 100);
  let target = completion * 0.78;

  if (day.streak_alive) target += 6;
  if (day.recovered) target += 4;

  return clamp(target, 0, 92);
}

function buildSeries(days) {
  if (!days?.length) return [];

  const sorted = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
  let score = 0;

  const scored = sorted.map((day, index) => {
    const target = calcDailyTarget(day);
    const completionPct = clamp(Number(day.completion_percent) || 0, 0, 100);
    const missedDueDay = hasDueHabits(day) && completionPct === 0;

    if (target == null) {
      return {
        date: day.date,
        label: fmtDate(day.date),
        score,
        rawScore: null,
        completionPct: null,
        completedHabits: 0,
        totalHabits: 0,
        missedDueDay: false,
        hadDueHabits: false,
      };
    }

    const liftRate = day.recovered ? 0.16 : 0.12;
    const dipRate = missedDueDay ? 0.1 : 0.06;
    const rate = target >= score ? liftRate : dipRate;
    const maxRise = index < 7 ? 3.2 : 4.5;
    const maxDrop = missedDueDay ? 3 : 1.8;
    const delta = clamp((target - score) * rate, -maxDrop, maxRise);

    score = clamp(score + delta, 0, 100);

    return {
      date: day.date,
      label: fmtDate(day.date),
      score: Math.round(score * 10) / 10,
      rawScore: Math.round(target),
      completionPct,
      completedHabits: Number(day.completed_habits) || 0,
      totalHabits: Number(day.total_habits) || 0,
      missedDueDay,
      hadDueHabits: true,
    };
  });

  const withProgress = scored.map((point, index) => ({
    ...point,
    progress: Math.round(rollingAverage(scored, index, "score") * 10) / 10,
  }));
  const trend = calcTrend(withProgress.map((point) => point.progress));

  return withProgress.map((point, index) => ({
    ...point,
    trend: trend[index],
    previousProgress: withProgress[index - 1]?.progress ?? point.progress,
  }));
}

function calcTrend(values) {
  if (values.length < 2) return values;

  const n = values.length;
  const sumX = values.reduce((sum, _value, index) => sum + index, 0);
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = values.reduce((sum, _value, index) => sum + index * index, 0);
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_value, index) => Math.round((intercept + slope * index) * 10) / 10);
}

function calcConsistency(days) {
  if (!days?.length) return 0;
  const recent = days.slice(-30).filter(hasDueHabits);
  if (!recent.length) return 0;
  const completedDays = recent.filter((day) => Number(day.completion_percent) > 0).length;
  return Math.round((completedDays / recent.length) * 100);
}

function calcBestStreak(days) {
  if (!days?.length) return 0;

  const sorted = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
  let best = 0;
  let current = 0;

  for (const day of sorted) {
    if (!hasDueHabits(day)) continue;
    current = Number(day.completion_percent) > 0 ? current + 1 : 0;
    best = Math.max(best, current);
  }

  return best;
}

function getYScale(series) {
  if (!series.length) return { domain: [0, 40], ticks: [0, 10, 20, 30, 40] };

  const values = series.flatMap((point) => [point.progress, point.trend, 0]);
  const max = Math.max(...values);
  const upper = Math.max(40, Math.ceil((max + 8) / 10) * 10);
  const ticks = [];

  for (let tick = 0; tick <= upper; tick += 10) {
    ticks.push(tick);
  }

  return { domain: [0, upper], ticks };
}

function getJourneyMessage(series) {
  const latest = series.at(-1)?.progress ?? 0;
  const previous = series.at(-8)?.progress ?? series[0]?.progress ?? latest;
  const delta = latest - previous;

  if (series.length < 5) return "The first signal is forming.";
  if (delta > 3) return "Your rhythm is becoming visible.";
  if (delta < -2) return "A lighter stretch, still recoverable.";
  return "Steady consistency is compounding.";
}

function Dot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload?.hadDueHabits) return null;

  const dipped = payload.missedDueDay || payload.progress < payload.previousProgress - 1.4;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#fff"
      stroke={dipped ? WARNING : GREEN}
      strokeWidth={2.4}
    />
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point?.hadDueHabits) return null;

  return (
    <div className="one-better-tooltip">
      <strong>{label}</strong>
      <span>
        Completed{" "}
        <b>
          {point.completedHabits}/{point.totalHabits}
        </b>
      </span>
      <span>
        Day quality <b>{point.completionPct}%</b>
      </span>
      <span>
        Journey signal <b>{Math.round(point.progress)}%</b>
      </span>
    </div>
  );
}

function TrendUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 16.5 9.5 11l4 4L20 8.5" />
      <path d="M15 8.5h5v5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3v4M17 3v4M4.5 9h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.7 5.45 6.02.88-4.36 4.24 1.03 5.99L12 16.72l-5.39 2.84 1.03-5.99-4.36-4.24 6.02-.88L12 3Z" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21c-3.5 0-6.2-2.5-6.2-5.8 0-2.6 1.5-4.4 3.5-6.4.7-.7 1.4-1.7 1.4-3.3 2.3 1.1 4.5 3.3 4.5 6.2.8-.5 1.4-1.3 1.7-2.4 1.2 1.2 1.9 3 1.9 4.9 0 3.9-2.8 6.8-6.8 6.8Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </svg>
  );
}

function StatCard({ label, value, sub, icon, tone = "plain" }) {
  return (
    <article className={`one-better-stat one-better-stat-${tone}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {sub && <span>{sub}</span>}
      </div>
      <div className="one-better-stat-icon">{icon}</div>
    </article>
  );
}

export default function OneBetterGraph() {
  const [days, setDays] = useState([]);
  const [journey, setJourney] = useState({ started: false, start_date: null });
  const [streak, setStreak] = useState(0);
  const [rangeDays, setRangeDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const token = localStorage.getItem("token");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [journeyRes, historyRes, dashboardRes] = await Promise.all([
        fetch(apiUrl("/dashboard/journey"), { headers }),
        fetch(apiUrl(`/dashboard/progress-history/?days=${rangeDays}`), { headers }),
        fetch(apiUrl("/dashboard/"), { headers }),
      ]);

      if (journeyRes.ok) setJourney(await journeyRes.json());

      if (historyRes.ok) {
        const history = await historyRes.json();
        setDays(history.days ?? []);
        if (history.journey_started === false) {
          setJourney({ started: false, start_date: null });
        }
      } else {
        console.error("Progress history failed:", historyRes.status, await historyRes.text());
      }

      if (dashboardRes.ok) {
        const dashboard = await dashboardRes.json();
        setStreak(Number(dashboard.streak) || 0);
      }
    } catch (error) {
      console.error("OneBetterGraph:", error);
    } finally {
      setLoading(false);
    }
  }, [rangeDays, token]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    load().finally(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const startJourney = async () => {
    if (!token) return;

    setStarting(true);
    try {
      const res = await fetch(apiUrl("/dashboard/journey/start"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setJourney(await res.json());
        await load();
      }
    } catch (error) {
      console.error("Start journey failed:", error);
    } finally {
      setStarting(false);
    }
  };

  const series = useMemo(() => buildSeries(days), [days]);
  const consistency = useMemo(() => calcConsistency(days), [days]);
  const bestStreak = useMemo(() => calcBestStreak(days), [days]);
  const yScale = useMemo(() => getYScale(series), [series]);
  const latestProgress = Math.round(series.at(-1)?.progress ?? 0);
  const message = useMemo(() => getJourneyMessage(series), [series]);
  const tickEvery = Math.max(1, Math.ceil(series.length / 9));

  if (loading) {
    return <section className="one-better-loading">Loading your journey...</section>;
  }

  if (!journey.started) {
    return (
      <section className="one-better">
        <article className="one-better-start">
          <div>
            <p>1% Better Journey</p>
            <h3>Start with a clean signal.</h3>
            <span>
              Your graph begins when you choose to start. From there, consistency builds slowly and honestly.
            </span>
          </div>
          <button type="button" onClick={startJourney} disabled={starting}>
            {starting ? "Starting..." : "Start Journey"}
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="one-better">
      <div className="one-better-stats">
        <StatCard
          label="Journey Signal"
          value={`${latestProgress}%`}
          sub={message}
          icon={<TrendUpIcon />}
          tone="hero"
        />
        <StatCard
          label="Consistency"
          value={`${consistency}%`}
          sub="Last 30 due days"
          icon={<CalendarIcon />}
        />
        <StatCard
          label="Best Streak"
          value={`${bestStreak} Days`}
          sub="Since journey start"
          icon={<StarIcon />}
          tone="green"
        />
        <StatCard
          label="Current Streak"
          value={`${streak} Days`}
          sub="Current rhythm"
          icon={<FlameIcon />}
          tone="warm"
        />
      </div>

      <article className="one-better-card">
        <header className="one-better-header">
          <div className="one-better-title">
            <h3>1% Better Journey</h3>
            <button
              className="one-better-info"
              title="A bounded consistency signal using rolling averages. Completed habits lift it slowly; missed due habits flatten or dip it gently."
              type="button"
              aria-label="How this journey graph works"
            >
              <InfoIcon />
            </button>
          </div>

          <div className="one-better-filter" aria-label="Journey time range">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.days}
                className={rangeDays === option.days ? "is-active" : ""}
                type="button"
                onClick={() => setRangeDays(option.days)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {series.length === 0 ? (
          <div className="one-better-empty">Complete a due habit to form the first signal.</div>
        ) : (
          <div className="one-better-chart-wrap">
            <div className="one-better-badge">{latestProgress}%</div>

            <ResponsiveContainer width="100%" height={330}>
              <ComposedChart data={series} margin={{ top: 42, right: 52, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="oneBetterArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#e8e2d9" strokeDasharray="4 6" vertical={false} />
                <ReferenceLine y={0} stroke="#cfc8bd" strokeWidth={1.4} />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  interval={tickEvery - 1}
                  minTickGap={22}
                  tick={{ fill: "#57534e", fontSize: 13 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={yScale.domain}
                  tick={{ fill: "#57534e", fontSize: 13 }}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  ticks={yScale.ticks}
                  width={50}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#d8d0c5", strokeDasharray: "4 4" }} />

                <Line
                  activeDot={false}
                  dataKey="trend"
                  dot={false}
                  isAnimationActive
                  animationDuration={900}
                  stroke={MUTED_GREEN}
                  strokeDasharray="7 7"
                  strokeLinecap="round"
                  strokeWidth={2}
                  type="monotone"
                />
                <Area
                  activeDot={{ r: 6, fill: "#fff", stroke: GREEN, strokeWidth: 2.5 }}
                  dataKey="progress"
                  dot={(props) => <Dot key={props.index} {...props} />}
                  fill="url(#oneBetterArea)"
                  fillOpacity={1}
                  isAnimationActive
                  animationDuration={900}
                  stroke={GREEN}
                  strokeLinecap="round"
                  strokeWidth={3}
                  type="monotone"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
}
