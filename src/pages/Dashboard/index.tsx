import { Users2, Apple, Activity, AlertTriangle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useEffect, useMemo, useState } from "react";
import "./styles.css";

export default function DashboardPage() {
  const [foodsCount, setFoodsCount] = useState<number>(0);

  // mock de métricas (substitua por dados reais quando tiver backend/consultas)
  const mediaGlicemica = 126; // mg/dL
  const usuariosAtivos = 892;
  const taxaAdocao = 87; // %

  // séries fictícias para gráficos (ex.: últimos 7 dias)
  const serieGlicemia = useMemo(() => [118, 122, 130, 125, 129, 127, 126], []);
  const serieUsuarios = useMemo(() => [810, 828, 835, 850, 864, 881, 892], []);
  const serieAdocao = useMemo(() => [82, 83, 84, 85, 85, 86, 87], []);

  useEffect(() => {
    async function fetchFoodsCount() {
      const snap = await getDocs(collection(db, "foods"));
      setFoodsCount(snap.size);
    }
    fetchFoodsCount();
  }, []);

  return (
    <div className="dash-grid">
      {/* KPIs do topo */}
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

      {/* DASHBOARD (substitui "Atividade Recente" + "Estatísticas Rápidas") */}
      <section className="panel">
        <div className="panel-title">Dashboard</div>

        <div className="dash-cards">
          {/* Card 1: Média Glicêmica */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <Activity size={18} />
                <span>Média Glicêmica</span>
              </div>
              <span className="muted">Últimos 7 dias</span>
            </div>

            <div className="dash-card-body">
              <Gauge value={mediaGlicemica} min={70} max={180} unit="mg/dL" />
              <Sparkline data={serieGlicemia} maxY={180} />
            </div>
          </div>

          {/* Card 2: Usuários Ativos */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <Users2 size={18} />
                <span>Usuários Ativos</span>
              </div>
              <span className="muted">Últimos 7 dias</span>
            </div>

            <div className="dash-card-body">
              <div className="big-number">{usuariosAtivos}</div>
              <Bars data={serieUsuarios} />
            </div>
          </div>

          {/* Card 3: Taxa de Adoção */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <span className="dot dot-blue" />
                <span>Taxa de Adoção</span>
              </div>
              <span className="muted">Últimos 7 dias</span>
            </div>

            <div className="dash-card-body">
              <div className="big-number">{taxaAdocao}%</div>
              <Progress value={taxaAdocao} />
              <Sparkline data={serieAdocao} maxY={100} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Componentes visuais simples em SVG ---------- */

function Gauge({
  value,
  min = 0,
  max = 100,
  unit,
}: {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const radius = 52;
  const circumference = Math.PI * radius; // semi-círculo
  const stroke = circumference * pct;

  return (
    <div className="gauge">
      <svg viewBox="0 0 120 70" width="100%" height="70">
        {/* trilho */}
        <path
          d="M10,60 A50,50 0 0 1 110,60"
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* valor */}
        <path
          d="M10,60 A50,50 0 0 1 110,60"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${stroke} ${circumference}`}
        />
      </svg>
      <div className="gauge-value">
        {value} {unit}
        <span className="gauge-sub">Faixa alvo: {min}-{max} {unit}</span>
      </div>
    </div>
  );
}

function Sparkline({ data, maxY = Math.max(...data) }: { data: number[]; maxY?: number }) {
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (v / maxY) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="sparkline">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
}

function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const width = 100 / data.length;

  return (
    <div className="bars">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {data.map((v, i) => {
          const h = (v / max) * 100;
          const x = i * width + 4 * 0.5; // padding leve
          const w = width - 4; // gap
          const y = 100 - h;
          return <rect key={i} x={x} y={y} width={w} height={h} rx="2" />;
        })}
      </svg>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
