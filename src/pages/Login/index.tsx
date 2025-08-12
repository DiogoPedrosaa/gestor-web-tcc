import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { humanizeAuthError } from "../../utils/authErrors";
import "./styles.css";


export default function LoginPage() {
  const { signIn, signOutApp } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const cred = await signIn(email, password);
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "users", uid));
      const role = snap.exists() ? (snap.data().role as string) : "patient";
      if (role !== "admin") {
        await signOutApp();
        throw new Error("Acesso restrito: apenas administradores podem usar o painel web.");
      }
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(humanizeAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    setErr(null);
    setInfo(null);
    if (!email) return setErr("Informe o e-mail para recuperar a senha.");
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setInfo("Se o e-mail existir, enviamos um link para redefinir a senha.");
    } catch (e) {
      setErr(humanizeAuthError(e));
    }
  }

  return (
    <>
      <div className="bg-floaters" />
      <main className="login-wrapper">
        <section className="login-card">
          <div className="logo"><div className="logo-grad">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 12h4l2-6 4 12 2-6h4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div></div>

          <h1 className="title">Diabetes<span className="title-emph">Monitor</span></h1>
          <p className="subtitle">Acesse sua plataforma de monitoramento pessoal</p>

          {location?.state?.reason === "not-admin" && (
            <div className="alert alert-warn">
              Acesso restrito a administradores.
            </div>
          )}

          {info && (
            <div className="alert alert-info">
              {info}
            </div>
          )}
          {err && (
            <div className="alert">
              {err}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <label className="label">Email</label>
            <div className="input">
              <Mail size={18} className="input-icon" />
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="seu@email.com" required />
            </div>

            <label className="label">Senha</label>
            <div className="input">
              <Lock size={18} className="input-icon" />
              <input value={password} onChange={e=>setPassword(e.target.value)} type={show ? "text" : "password"} placeholder="Digite sua senha" required />
              <button type="button" className="ghost" onClick={()=>setShow(v=>!v)} aria-label="Mostrar/ocultar senha">
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <button className="forgot" onClick={handleForgot}>Esqueceu sua senha?</button>
          <div className="hr" />
        
        </section>
      </main>
    </>
  );
}
