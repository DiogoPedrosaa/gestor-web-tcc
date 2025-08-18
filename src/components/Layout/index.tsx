import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Apple, BarChart3, LogOut, Menu, X, Heart } from "lucide-react"; // Adicionar Heart
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import "./styles.css";

export default function Layout() {

  const { signOutApp } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    async function fetchUserName() {
      try {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setUserName(snap.data().name || "");
        }
      } catch {}
    }
    fetchUserName();
  }, []);

  async function handleSignOut() {
    await signOutApp();
    navigate("/login", { replace: true });
  }

  function NavItems({ onItemClick }: { onItemClick?: () => void }) {
    return (
      <>
        <NavLink to="/dashboard" className="nav-item" onClick={onItemClick}>
          <LayoutDashboard size={18} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/usuarios" className="nav-item" onClick={onItemClick}>
          <Users size={18} /> <span>Usuários</span>
        </NavLink>
        <NavLink to="/administradores" className="nav-item" onClick={onItemClick}>
          <Users size={18} /> <span>Administradores</span>
        </NavLink>
        <NavLink to="/alimentos" className="nav-item" onClick={onItemClick}>
          <Apple size={18} /> <span>Alimentos</span>
        </NavLink>
        <NavLink to="/complicações" className="nav-item" onClick={onItemClick}>
          <Heart size={18} /> <span>Complicações</span>
        </NavLink>
        <NavLink to="/relatorios" className="nav-item" onClick={onItemClick}>
          <BarChart3 size={18} /> <span>Relatórios</span>
        </NavLink>

        <button className="nav-item nav-danger" onClick={() => { onItemClick?.(); handleSignOut(); }}>
          <LogOut size={18} /> <span>Sair</span>
        </button>
      </>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar desktop */}

      <aside className="sidebar">
        <div className="brand">
            <div className="brand-logo" style={{ fontWeight: "bold" }}>{userName ? userName : "ADMIN"}</div>
          <div className="brand-text"><span>Painel Administrativo</span></div>
        </div>
        <nav className="nav"><NavItems /></nav>
      </aside>

      {/* Drawer mobile */}
      <aside className="sidebar-mobile" data-open={mobileOpen}>
        <div className="sidebar-mobile-head">
            <div className="brand-logo" style={{ fontWeight: "bold" }}>{userName ? userName : "A"}</div>
          <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18}/></button>
        </div>
        <nav className="nav"><NavItems onItemClick={() => setMobileOpen(false)} /></nav>
      </aside>
      <div className="backdrop" data-open={mobileOpen} onClick={() => setMobileOpen(false)} />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn hamburger" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="page-title">Painel Administrativo</h1>
              <p className="page-sub">Sistema de Gestão InsulinAid</p>
            </div>
          </div>
          <div className="topbar-actions" />
        </header>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
