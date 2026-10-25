import { NavLink, useNavigate } from "react-router-dom";
import { CalendarRange, LayoutDashboard, Users, CalendarDays, Truck, Settings as SettingsIcon, ShieldCheck, User, LogOut } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { useSettings } from "../settings.jsx";
import NotificationBell from "./NotificationBell.jsx";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/vendors", label: "Vendors", icon: Truck },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { app_name, logo } = useSettings();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar no-print">
      <NavLink to="/dashboard" className="brand">
        {logo ? <img src={logo} alt="" className="brand-logo" /> : <CalendarRange size={20} />}
        {app_name}
      </NavLink>
      <nav className="nav-links">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
        {user.role === "admin" && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-pill nav-pill-active" : "nav-pill")}>
            <ShieldCheck size={14} /> Admin
          </NavLink>
        )}
        <NotificationBell />
        <span className="nav-user">
          <User size={14} /> {user.name}
        </span>
        <button className="icon-button" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={15} />
        </button>
      </nav>
    </header>
  );
}
