import { NavLink, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "./api";
import "./AppShell.css";

const menuItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: "dashboard",
  },
  {
    label: "Habits",
    to: "/habits",
    icon: "habits",
  },
  {
    label: "Momentum",
    to: "/dashboard#momentum",
    icon: "momentum",
  },
  {
    label: "1% Better",
    icon: "better",
    badge: "New",
  },
  {
    label: "Insights",
    to: "/dashboard#insights",
    icon: "insights",
  },
  {
    label: "AI Coach",
    icon: "coach",
  },
  {
    label: "Settings",
    icon: "settings",
  },
];

function Icon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (name === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M9 3v18" />
        <path d="M3 9h18" />
        <path d="M15 15h.01" />
      </svg>
    );
  }

  if (name === "habits") {
    return (
      <svg {...common}>
        <path d="M9 11l2 2 4-4" />
        <path d="M20 12a8 8 0 1 1-3.4-6.55" />
        <path d="M17 3l1.5 2.5L21 4" />
      </svg>
    );
  }

  if (name === "momentum") {
    return (
      <svg {...common}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M4 15l6-6 4 4 6-8" />
      </svg>
    );
  }

  if (name === "better") {
    return (
      <svg {...common}>
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    );
  }

  if (name === "insights") {
    return (
      <svg {...common}>
        <path d="M4 20h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-3" />
        <path d="M6 9l3-3 3 3 5-5" />
      </svg>
    );
  }

  if (name === "coach") {
    return (
      <svg {...common}>
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M4.93 4.93l2.12 2.12" />
        <path d="M16.95 16.95l2.12 2.12" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
        <path d="M4.93 19.07l2.12-2.12" />
        <path d="M16.95 7.05l2.12-2.12" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    );
  }

  if (name === "chevron-left") {
    return (
      <svg {...common}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
    );
  }

  if (name === "chevron-right") {
    return (
      <svg {...common}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.35 1.08V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.08-.35H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .35-1.08V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.18.39.5.72.9.9.33.15.69.21 1.05.18H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z" />
    </svg>
  );
}

function SidebarItem({ item, collapsed }) {
  const content = (
    <>
      <span className="app-sidebar-icon-wrap" title={collapsed ? item.label : undefined}>
        <Icon name={item.icon} />
      </span>
      <span className="app-sidebar-label">{item.label}</span>
      {item.badge && <span className="app-sidebar-badge">{item.badge}</span>}
    </>
  );

  if (!item.to) {
    return (
      <button
        className="app-sidebar-link app-sidebar-link-muted"
        type="button"
        title={collapsed ? item.label : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      className={({ isActive }) =>
        `app-sidebar-link ${isActive && item.to === "/dashboard" ? "is-active" : ""}`
      }
      to={item.to}
      title={collapsed ? item.label : undefined}
    >
      {content}
    </NavLink>
  );
}

function AppShell({ children }) {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(12);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    if (!token) {
      return undefined;
    }

    fetch(apiUrl("/dashboard/"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.streak != null) {
          setStreak(Number(data.streak) || 0);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const collapsed = !sidebarOpen;

  return (
    <div className={`app-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      <div className={`app-sidebar-wrap${collapsed ? " app-sidebar-wrap--collapsed" : ""}`}>
        <aside
          className={`app-sidebar${collapsed ? " app-sidebar--collapsed" : ""}`}
          aria-label="Main navigation"
        >
          {/* Top section: brand + nav */}
          <div className="app-sidebar-top">
            <div className="app-sidebar-brand">
              <span className="app-sidebar-logo" aria-hidden="true" />
              <span className="app-sidebar-brand-name">Focus Now</span>
            </div>

          <nav className="app-sidebar-nav">
            {menuItems.map((item) => (
              <SidebarItem item={item} key={item.label} collapsed={collapsed} />
            ))}
          </nav>
        </div>

        {/* Bottom section: streak card + logout */}
        <div className="app-sidebar-bottom">
          {!collapsed && (
            <div className="app-streak-card">
              <div className="app-streak-count">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12.2 22c4.2 0 7.2-2.7 7.2-6.8 0-3-1.7-5.1-3.7-7.3-.5 2.2-1.8 3.4-3.1 4.1.4-3.5-1.2-6.4-4.6-9.1.4 4.5-3.4 6.3-3.4 11.5C4.6 19 7.9 22 12.2 22z"
                    fill="#f35f2c"
                  />
                  <path
                    d="M12.4 19.5c1.8 0 3-1.1 3-2.9 0-1.3-.7-2.3-1.6-3.2-.2.9-.8 1.4-1.4 1.7.2-1.5-.5-2.7-1.9-3.9.2 1.9-1.5 2.8-1.5 5C9 18.2 10.5 19.5 12.4 19.5z"
                    fill="#ffd166"
                  />
                </svg>
                <strong>{streak}</strong>
              </div>
              <p>Day streak</p>
              <span className="app-streak-divider" />
              <p className="app-streak-copy">Small progress, every single day.</p>
              <span className="app-streak-plant" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {collapsed && (
            <div
              className="app-streak-icon-only"
              title={`${streak} day streak`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12.2 22c4.2 0 7.2-2.7 7.2-6.8 0-3-1.7-5.1-3.7-7.3-.5 2.2-1.8 3.4-3.1 4.1.4-3.5-1.2-6.4-4.6-9.1.4 4.5-3.4 6.3-3.4 11.5C4.6 19 7.9 22 12.2 22z"
                  fill="#f35f2c"
                />
                <path
                  d="M12.4 19.5c1.8 0 3-1.1 3-2.9 0-1.3-.7-2.3-1.6-3.2-.2.9-.8 1.4-1.4 1.7.2-1.5-.5-2.7-1.9-3.9.2 1.9-1.5 2.8-1.5 5C9 18.2 10.5 19.5 12.4 19.5z"
                  fill="#ffd166"
                />
              </svg>
              <span className="app-streak-icon-count">{streak}</span>
            </div>
          )}

          <button
            className="app-logout-button"
            onClick={handleLogout}
            type="button"
            title={collapsed ? "Log out" : undefined}
          >
            <Icon name="logout" />
            <span className="app-sidebar-label">Log out</span>
          </button>
          </div>

        </aside>

        {/* Pill tab toggle — outside aside so it's never clipped */}
        <button
          className="app-sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} />
        </button>
      </div>

      <main className="app-main">{children}</main>
    </div>
  );
}

export default AppShell;
