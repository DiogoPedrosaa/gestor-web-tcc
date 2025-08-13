
import { Users2, Apple, Activity, AlertTriangle} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useEffect, useState } from "react";
import "./styles.css";


export default function DashboardPage() {
  const [foodsCount, setFoodsCount] = useState<number>(0);

  useEffect(() => {
    async function fetchFoodsCount() {
      const snap = await getDocs(collection(db, "foods"));
      setFoodsCount(snap.size);
    }
    fetchFoodsCount();
  }, []);

  return (
    <div className="dash-grid">
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-head">
            <span>Total de Usuários</span>
            <div className="kpi-ico"><Users2 size={18} /></div>
          </div>
          <div className="kpi-value">1,248</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-head">
            <span>Alimentos Cadastrados</span>
            <div className="kpi-ico"><Apple size={18} /></div>
          </div>
          <div className="kpi-value">{foodsCount}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <span>Medições Hoje</span>
            <div className="kpi-ico"><Activity size={18} /></div>
          </div>
          <div className="kpi-value">142</div>
        </div>

        <div className="kpi-card kpi-warn">
          <div className="kpi-head">
            <span>Alertas Pendentes</span>
            <div className="kpi-ico"><AlertTriangle size={18} /></div>
          </div>
          <div className="kpi-value">23</div>
          <div className="kpi-foot">Requerem atenção</div>
        </div>
      </section>

      {/* Atividade recente */}
      <section className="panel">
        <div className="panel-title">Atividade Recente</div>
        <ul className="activity">
          <li>
            <div className="avatar">MS</div>
            <div className="info">
              <div><strong>Maria Silva</strong> <span className="tag tag-success">Sucesso</span></div>
              <p>Registrou medição de glicose: 120 mg/dL</p>
              <span className="muted">há 5 min</span>
            </div>
          </li>

          <li>
            <div className="avatar">JS</div>
            <div className="info">
              <div><strong>João Santos</strong> <span className="tag">Info</span></div>
              <p>Adicionou novo alimento: Maçã Verde</p>
              <span className="muted">há 12 min</span>
            </div>
          </li>

          <li>
            <div className="avatar">AC</div>
            <div className="info">
              <div><strong>Ana Costa</strong> <span className="tag tag-warn">Atenção</span></div>
              <p>Medição alta detectada: 180 mg/dL</p>
              <span className="muted">há 25 min</span>
            </div>
          </li>

          <li>
            <div className="avatar">CL</div>
            <div className="info">
              <div><strong>Carlos Lima</strong> <span className="tag">Info</span></div>
              <p>Novo usuário registrado</p>
              <span className="muted">há 38 min</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="panel">
        <div className="panel-title">Estatísticas Rápidas</div>
        <div className="stats">
          <div className="stat">
            <span className="label">Média Glicêmica</span>
            <span className="value value-green">126 mg/dL</span>
          </div>
          <div className="stat">
            <span className="label">Usuários Ativos</span>
            <span className="value value-blue">892</span>
          </div>
          <div className="stat">
            <span className="label">Taxa de Adoção</span>
            <span className="value">87%</span>
          </div>
        </div>
      </section>
    </div>
  );
}
