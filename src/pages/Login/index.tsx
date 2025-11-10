import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { humanizeAuthError } from "../../utils/authErrors";
import logo from "../../assets/Logo.png"; // Mudar para src/assets
import "./styles.css";


export default function LoginPage() {
  const { signIn, signOutApp } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
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
    
    // Validar se o email está preenchido
    if (!email || email.trim() === "") {
      setErr("Por favor, preencha o campo de e-mail para recuperar sua senha.");
      return;
    }

    // Validar formato básico do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErr("Por favor, informe um e-mail válido.");
      return;
    }

    setLoadingReset(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      
      setInfo("✓ E-mail de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.");
      setEmail("");
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        setErr("E-mail não cadastrado no sistema.");
      } else if (e.code === "auth/invalid-email") {
        setErr("E-mail inválido.");
      } else if (e.code === "auth/too-many-requests") {
        setErr("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
      } else {
        setErr(humanizeAuthError(e));
      }
    } finally {
      setLoadingReset(false);
    }
  }

  return (
    <>
      <div className="bg-floaters" />
      <main className="login-wrapper">
        <section className="login-card">
          <div className="logo">
            <img 
              src={logo} 
              alt="GlicoInfo Logo" 
              width="250" 
              height="250" 
              style={{ objectFit: "contain" }}
            />
          </div>

          <h1 className="title">Glico<span className="title-emph">Info</span></h1>
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
            <div className="alert alert-error">
              {err}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <label className="label">Email</label>
            <div className="input">
              <Mail size={18} className="input-icon" />
              <input 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                type="email" 
                placeholder="seu@email.com" 
                required 
              />
            </div>

            <label className="label">Senha</label>
            <div className="input">
              <Lock size={18} className="input-icon" />
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type={show ? "text" : "password"} 
                placeholder="Digite sua senha" 
                required 
              />
              <button 
                type="button" 
                className="ghost" 
                onClick={() => setShow(v => !v)} 
                aria-label="Mostrar/ocultar senha"
              >
                {show ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>

            <button 
              className="btn-primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <button 
            type="button"
            className="forgot" 
            onClick={handleForgot}
            disabled={loadingReset}
          >
            {loadingReset ? "Enviando..." : "Esqueceu sua senha?"}
          </button>
          
          <div className="hr" />
        
        </section>
      </main>
    </>
  );
}
