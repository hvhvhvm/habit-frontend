// src/pages/Momentum.jsx

import { useEffect, useState } from "react";
import OneBetterGraph from "./OneBetterGraph";
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

  return Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );
}

function getMomentumIndicator(state, delta) {

  if (state === "RISING") {

    return {
      arrow: "↗",
      label:
        delta >= 0
          ? "High momentum"
          : "Momentum holding",

      className: "dashboard-arrow-up"
    };
  }

  if (state === "RESET") {

    return {
      arrow: "↘",
      label: "Low momentum",
      className: "dashboard-arrow-down"
    };
  }

  return {
    arrow: "→",
    label: "Balanced momentum",
    className: "dashboard-arrow-neutral"
  };
}

export default function Momentum() {

  const [data, setData] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {

    async function loadData() {

      try {

        const res = await fetch(
          apiUrl("/dashboard/"),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const dashboardData =
          await res.json();

        setData(dashboardData);

      } catch (err) {

        console.error(err);

      }
    }

    loadData();

  }, [token]);

  if (!data) {

    return (
      <div
        className="dashboard-shell"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh"
        }}
      >
        <h2>Loading momentum...</h2>
      </div>
    );
  }

  const momentum =
    data.momentum;

  const tone =
    stateCopy[momentum.state] ||
    stateCopy.STEADY;

  const momentumIndicator =
    getMomentumIndicator(
      momentum.state,
      momentum.delta
    );

  const momentumScore =
    clampPercent(momentum.score);

  const averageScore =
    clampPercent(momentum.window_average);

  const todayProgress =
    clampPercent(data.today_progress);

  const completedRatio =
    data.total_habits
      ? `${data.completed_today} / ${data.total_habits}`
      : "0 / 0";

  return (

    <div className="dashboard-shell">

      <div className="dashboard-frame">

        {/* HEADER */}

        <section
          className="dashboard-welcome-row"
          style={{ marginBottom: "24px" }}
        >

          <div className="dashboard-welcome-card">

            <span className="dashboard-stat-label">
              Deep analytics
            </span>

            <h1>Momentum Center</h1>

            <p>
              Understand your consistency,
              rhythm, and momentum patterns.
            </p>

          </div>

        </section>

        {/* MOMENTUM CARD */}

        <section
          className="dashboard-insight-grid"
          style={{ marginBottom: "28px" }}
        >

          <article
            className="dashboard-panel dashboard-momentum-card"
          >

            <div className="dashboard-momentum-head">

              <span
                className={`dashboard-label dashboard-label-${momentum.state.toLowerCase()}`}
              >
                {tone.label} momentum
              </span>

              <div
                className={`dashboard-momentum-arrow ${momentumIndicator.className}`}
              >
                <span>
                  {momentumIndicator.arrow}
                </span>
              </div>

            </div>

            <div className="dashboard-momentum-main">

              <div>

                <h2 className="dashboard-headline">
                  Momentum
                </h2>

                <p className="dashboard-copy">
                  {tone.headline}
                </p>

              </div>

              <div className="dashboard-score-block">

                <span className="dashboard-stat-label">
                  Momentum score
                </span>

                <p className="dashboard-score-value">
                  {Math.round(momentumScore)}%
                </p>

                <p
                  className={`dashboard-score-status ${momentumIndicator.className}`}
                >
                  {momentumIndicator.label}
                </p>

              </div>

            </div>

            <div
              className="dashboard-track"
              aria-hidden="true"
            >

              <div
                className="dashboard-fill dashboard-fill-momentum"
                style={{
                  width: `${momentumScore}%`
                }}
              />

            </div>

            <div className="dashboard-momentum-footer">

              <p className="dashboard-copy">
                {momentum.message}
              </p>

              <div className="dashboard-momentum-stats">

                <div>

                  <span className="dashboard-stat-label">
                    Trend
                  </span>

                  <strong>
                    {formatDelta(momentum.delta)}
                  </strong>

                </div>

                <div>

                  <span className="dashboard-stat-label">
                    3-day average
                  </span>

                  <strong>
                    {Math.round(averageScore)}%
                  </strong>

                </div>

              </div>

            </div>

          </article>

        </section>

        {/* GRAPH */}

        <OneBetterGraph />

        {/* PROGRESS HERO */}

        <section
          className="dashboard-panel dashboard-progress-hero"
          style={{ marginTop: "28px" }}
        >

          <div className="dashboard-progress-hero-head">

            <div>

              <span className="dashboard-stat-label">
                Today&apos;s progress
              </span>

              <h2 className="dashboard-progress-hero-title">
                {Math.round(todayProgress)}% complete
              </h2>

            </div>

            <strong className="dashboard-progress-ratio">
              {completedRatio}
            </strong>

          </div>

          <div
            className="dashboard-track dashboard-track-large"
            aria-hidden="true"
          >

            <div
              className="dashboard-fill"
              style={{
                width: `${todayProgress}%`
              }}
            />

          </div>

          <div className="dashboard-progress-summary">

            <div className="dashboard-progress-pill">

              <span>
                Completed
              </span>

              <strong>
                {data.completed_today}
              </strong>

            </div>

            <div className="dashboard-progress-pill">

              <span>
                Active today
              </span>

              <strong>
                {data.total_habits}
              </strong>

            </div>

            <div className="dashboard-progress-pill">

              <span>
                Momentum
              </span>

              <strong>
                {tone.label}
              </strong>

            </div>

          </div>

        </section>

        {/* STATS GRID */}

        <section
          className="dashboard-grid"
          style={{ marginTop: "28px" }}
        >

          <article className="dashboard-panel dashboard-stat-card">

            <span className="dashboard-stat-label">
              Today
            </span>

            <p className="dashboard-stat-value">
              {Math.round(todayProgress)}%
            </p>

            <p className="dashboard-stat-note">
              Average progress across scheduled habits
            </p>

          </article>

          <article className="dashboard-panel dashboard-stat-card">

            <span className="dashboard-stat-label">
              Completed
            </span>

            <p className="dashboard-stat-value">
              {completedRatio}
            </p>

            <p className="dashboard-stat-note">
              Habits fully finished today
            </p>

          </article>

          <article className="dashboard-panel dashboard-stat-card">

            <span className="dashboard-stat-label">
              3-day average
            </span>

            <p className="dashboard-stat-value">
              {Math.round(averageScore)}%
            </p>

            <p className="dashboard-stat-note">
              Broader signal, less daily noise
            </p>

          </article>

          <article className="dashboard-panel dashboard-stat-card">

            <span className="dashboard-stat-label">
              Trend
            </span>

            <p
              className={`dashboard-stat-value ${
                momentum.delta >= 0
                  ? "dashboard-stat-positive"
                  : "dashboard-stat-negative"
              }`}
            >

              {momentumIndicator.arrow}

              {" "}

              {momentum.delta >= 0 ? "+" : ""}

              {Math.round(momentum.delta)}%

            </p>

            <p className="dashboard-stat-note">
              Change from yesterday
            </p>

          </article>

        </section>

        {/* READOUT */}

        <section
          className="dashboard-bottom"
          style={{ marginTop: "28px" }}
        >

          <article className="dashboard-panel dashboard-readout-card">

            <div className="dashboard-readout-head">

              <div>

                <span className="dashboard-stat-label">
                  Readout
                </span>

                <h3 className="dashboard-readout-title">
                  Today first, momentum second
                </h3>

              </div>

            </div>

            <div className="dashboard-detail-list">

              <div className="dashboard-detail-item">

                <span>
                  Today vs yesterday
                </span>

                <strong>
                  {formatDelta(momentum.delta)}
                </strong>

              </div>

              <div className="dashboard-detail-item">

                <span>
                  Yesterday&apos;s progress
                </span>

                <strong>
                  {Math.round(
                    clampPercent(momentum.yesterday)
                  )}%
                </strong>

              </div>

              <div className="dashboard-detail-item">

                <span>
                  Current momentum
                </span>

                <strong>
                  {tone.label}
                </strong>

              </div>

              <div className="dashboard-detail-item">

                <span>
                  Momentum score
                </span>

                <strong>
                  {Math.round(momentumScore)}%
                </strong>

              </div>

            </div>

          </article>

        </section>

      </div>

    </div>
  );
}