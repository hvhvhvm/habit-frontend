import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import Register from "./Register";
import Habit from "./Habits";
import FocusPage from "./FocusPage";
import AIInsights from "./AIinsights";
import Momentum from "./Momentum";
import CategoryRoutinePage from "./CategoryRoutinePage";
import Onboarding from "./onboarding";
import AppShell from "./AppShell";
import { apiUrl } from "./api";

import OnePercent from "./1percent";
import RoutineDetailPage from "./routinedetail";

function normalizeHabitTargetType(targetType) {
  return targetType === "duration" || targetType === "minutes" ? "duration" : "count";
}

function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkUser() {
      const publicRoutes = ["/login", "/register"];

      if (publicRoutes.includes(location.pathname)) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const res = await fetch(apiUrl("/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();

        if (!data.onboarding_done && location.pathname !== "/onboarding") {
          navigate("/onboarding", { replace: true });
          return;
        }

        if (data.onboarding_done && location.pathname === "/onboarding") {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [navigate, location.pathname]);

  if (loading) return <div>Loading...</div>;

  async function handleOnboardingComplete(data) {
    try {
      const token = localStorage.getItem("token");
      
      localStorage.setItem("name", data.name);

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      for (const h of data.habits) {
        const res = await fetch(apiUrl("/habits"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: h.title,
            category: h.category,
            target_type: normalizeHabitTargetType(h.target_type),
            target_value: h.target_value,
            repeat: "daily",
            days: [],
            points: h.points,
            is_session: false,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Habit creation failed:", errorText);
        }
      }

      const completeRes = await fetch(apiUrl("/auth/complete-onboarding"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!completeRes.ok) {
        const errorText = await completeRes.text();
        console.error("Complete onboarding failed:", errorText);
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Onboarding error:", err);
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding onComplete={handleOnboardingComplete} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/habits"
        element={
          <ProtectedRoute>
            <AppShell>
              <Habit />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/focus"
        element={
          <ProtectedRoute>
            <AppShell>
              <FocusPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="/1percent"        
       element={
          <ProtectedRoute>
            <AppShell>
              <OnePercent />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <AppShell>
              <AIInsights />
            </AppShell>
          </ProtectedRoute>
        }
      />
        <Route
        path="/momentum"
        element={
          <ProtectedRoute>
            <AppShell>
              <Momentum />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines/:routineId"
        element={
        <ProtectedRoute>
          <RoutineDetailPage />
        </ProtectedRoute>
        }


      />
      

      <Route
        path="/category-routine/:categoryName"
        element={
          <ProtectedRoute>
            <AppShell>
              <CategoryRoutinePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
