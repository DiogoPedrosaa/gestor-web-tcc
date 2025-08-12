import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Apple, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "./styles.css";

export default function Layout() {
  const { signOutApp } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutApp();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">A</div>
          <div className="brand-text"><strong>InsulinAid</strong><span>Admin Panel</span></div>
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className="nav-item"><LayoutDashboard size={18} /> <span>Dashboard</span></NavLink>
          <NavLink to="/usuarios"  className="nav-item"><Users size={18} /> <span>Usuários</span></NavLink>
          <NavLink to="/alimentos" className="nav-item"><Apple size={18} /> <span>Alimentos</span></NavLink>
          <NavLink to="/relatorios" className="nav-item"><BarChart3 size={18} /> <span>Relatórios</span></NavLink>

          <button className="nav-item nav-danger" onClick={handleSignOut} style={{ marginTop: 12 }}>
            <LogOut size={18} /> <span>Sair</span>
          </button>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Painel Administrativo</h1>
            <p className="page-sub">Sistema de Gestão InsulinAid</p>
          </div>
          <div className="topbar-actions" />
        </header>

        <div className="content"><Outlet /></div>
      </div>
    </div>
  );
}
