import { NavLink, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "./api";
import "./AppShell.css";

const menuItems = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
  { label: "Habits", to: "/habits", icon: "habits" },
  { label: "Momentum", to: "/momentum", icon: "momentum" },
  { label: "1% Better", to: "/1percent", icon: "better", badge: "New" },
  { label: "Insights", to: "/dashboard#insights", icon: "insights" },
  { label: "AI Coach", to: "/ai", icon: "coach" },
  { label: "Settings", icon: "settings" },
];

function Icon({ name, size = 20 }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": "true", style: { flexShrink: 0 },
  };
  const icons = {
    dashboard: <svg {...p}><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 3v18M3 9h18M15 15h.01"/></svg>,
    habits:    <svg {...p}><path d="M9 11l2 2 4-4"/><path d="M20 12a8 8 0 1 1-3.4-6.55"/><path d="M17 3l1.5 2.5L21 4"/></svg>,
    momentum:  <svg {...p}><path d="M4 19V9M10 19V5M16 19v-7"/><path d="M4 15l6-6 4 4 6-8"/></svg>,
    better:    <svg {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>,
    insights:  <svg {...p}><path d="M4 20h16M7 16V9M12 16V5M17 16v-3"/><path d="M6 9l3-3 3 3 5-5"/></svg>,
    coach:     <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
    settings:  <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    logout:    <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
    chevLeft:  <svg {...p}><path d="M15 18l-6-6 6-6"/></svg>,
    chevRight: <svg {...p}><path d="M9 18l6-6-6-6"/></svg>,
    menu:      <svg {...p}><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
    close:     <svg {...p}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    flame:     (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M12.2 22c4.2 0 7.2-2.7 7.2-6.8 0-3-1.7-5.1-3.7-7.3-.5 2.2-1.8 3.4-3.1 4.1.4-3.5-1.2-6.4-4.6-9.1.4 4.5-3.4 6.3-3.4 11.5C4.6 19 7.9 22 12.2 22z" fill="#f35f2c"/>
        <path d="M12.4 19.5c1.8 0 3-1.1 3-2.9 0-1.3-.7-2.3-1.6-3.2-.2.9-.8 1.4-1.4 1.7.2-1.5-.5-2.7-1.9-3.9.2 1.9-1.5 2.8-1.5 5C9 18.2 10.5 19.5 12.4 19.5z" fill="#ffd166"/>
      </svg>
    ),
  };
  return icons[name] ?? icons.settings;
}

function SidebarItem({ item, collapsed, onClick }) {
  const inner = (
    <>
      <span className="nav-icon"><Icon name={item.icon} /></span>
      <span className="nav-label">{item.label}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
    </>
  );

  if (!item.to) {
    return (
      <button
        className="nav-link nav-link--muted"
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }

  return (
    <NavLink
      className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
      to={item.to}
      title={collapsed ? item.label : undefined}
      onClick={onClick}
    >
      {inner}
    </NavLink>
  );
}

function AppShell({ children }) {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("cached_dashboard_data") || "null");
      return Number(cached?.streak) || 0;
    } catch {
      return 0;
    }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/login");
  }, [navigate]);

  const syncGlobalCache = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(apiUrl("/dashboard/full"), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.dashboard?.streak != null) {
          setStreak(Number(data.dashboard.streak) || 0);
        }
        if (data.dashboard) {
          localStorage.setItem("cached_dashboard_data", JSON.stringify(data.dashboard));
        }
        if (data.habits) {
          localStorage.setItem("cached_habits_data", JSON.stringify(data.habits));
        }
        if (data.heatmap) {
          localStorage.setItem("cached_heatmap_data", JSON.stringify(data.heatmap));
        }
        if (data.recent_completed) {
          localStorage.setItem("cached_recent_completed_data", JSON.stringify(data.recent_completed));
        }
        if (data.routines) {
          localStorage.setItem("cached_routines_data", JSON.stringify(data.routines));
        }
      }
    } catch (err) {
      console.error("Failed to sync global cache:", err);
    }
  }, []);

  useEffect(() => {
    const handleMutation = () => {
      try {
        const cached = JSON.parse(localStorage.getItem("cached_dashboard_data") || "null");
        if (cached?.streak != null) setStreak(Number(cached.streak) || 0);
      } catch {
        syncGlobalCache();
      }
    };
    window.addEventListener("habit-mutate", handleMutation);
    return () => window.removeEventListener("habit-mutate", handleMutation);
  }, [syncGlobalCache]);

  /* Close mobile drawer on outside click */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (!e.target.closest(".app-sidebar") && !e.target.closest(".mobile-menu-btn")) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  return (
    <div className={`app-shell${collapsed ? " is-collapsed" : ""}`}>

      {/* ── Mobile top bar ── */}
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <span className="brand-logo" aria-hidden="true" />
          <span className="brand-name">Focus Now</span>
        </div>
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <Icon name={mobileOpen ? "close" : "menu"} size={22} />
        </button>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`app-sidebar${mobileOpen ? " mobile-open" : ""}`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="brand-logo" aria-hidden="true" />
          <span className="brand-name">Focus Now</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Primary">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.label}
              item={item}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Streak card */}
        <div className="streak-section">
          <div className="streak-card">
            <div className="streak-top">
              <Icon name="flame" size={22} />
              <strong className="streak-num">{streak}</strong>
              <span className="streak-label">day streak</span>
            </div>
            <div className="streak-bar">
              {[...Array(7)].map((_, i) => (
                <span key={i} className={`streak-dot${i < (streak % 7 || 7) ? " streak-dot--lit" : ""}`} />
              ))}
            </div>
            <p className="streak-copy">Small progress, every single day.</p>
          </div>
        </div>

        {/* Logout */}
        <button className="nav-logout" onClick={handleLogout} type="button">
          <Icon name="logout" />
          <span className="nav-label">Log out</span>
        </button>

        {/* Desktop collapse toggle */}
        <button
          className="collapse-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          <Icon name={collapsed ? "chevRight" : "chevLeft"} size={14} />
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="app-main">{children}</main>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-bottom-nav" aria-label="Bottom navigation">
        {menuItems.slice(0, 5).map((item) => (
          item.to ? (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => `bottom-nav-item${isActive ? " bottom-nav-item--active" : ""}`}
              aria-label={item.label}
            >
              <Icon name={item.icon} size={22} />
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          ) : (
            <button key={item.label} className="bottom-nav-item" aria-label={item.label} type="button">
              <Icon name={item.icon} size={22} />
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          )
        ))}
      </nav>
    </div>
  );
}

export default AppShell;
