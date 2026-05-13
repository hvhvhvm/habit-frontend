import React from "react";
import "./Dashboard.css";
export default function AIInsights() {

  return (

    <div className="dashboard-shell">

      <div className="dashboard-frame">

        <h1>AI Coach</h1>

        <div className="dashboard-grid">

          <div className="dashboard-panel">

            <h3>Strength</h3>

            <p>
              You perform best with
              structured morning routines.
            </p>

          </div>

          <div className="dashboard-panel">

            <h3>Weakness</h3>

            <p>
              Your momentum drops after
              inconsistent sleep.
            </p>

          </div>

          <div className="dashboard-panel">

            <h3>Suggested Habit</h3>

            <p>
              Add a 10-minute shutdown routine.
            </p>

            <button>
              Add Habit
            </button>

          </div>

          <div className="dashboard-panel">

            <h3>Life Direction</h3>

            <p>
              Your current behavior suggests
              increasing discipline but weak recovery balance.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}