import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, X, Apple, Edit3, Trash2, Search, Filter, ChevronLeft, ChevronRight, SortAsc, SortDesc
} from "lucide-react";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, deleteDoc, doc
} from "firebase/firestore";
import { db } from "../../services/firebase";
import "./styles.css";


type NovaClass = "g1" | "g2" | "g3" | "g4";
const NOVA_OPTIONS: { value: NovaClass | "all"; label: string }[] = [
  { value: "all", label: "Todas as classificações" },
  { value: "g1", label: "G1 — In natura / Minimamente processado" },
  { value: "g2", label: "G2 — Ingrediente culinário processado" },
  { value: "g3", label: "G3 — Processado" },
  { value: "g4", label: "G4 — Ultraprocessado" },
];

type Food = {
  id: string;
  name: string;
  classification: NovaClass;
  carbs100?: number | null;     
  carbsPortion?: number | null; 
  portionDesc?: string | null;   
  createdAt?: any;
};

type SortBy = "createdAt_desc" | "name_asc" | "name_desc";

export default function FoodsPage() {
  // modal state
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);

  // form state
  const [name, setName] = useState("");
  const [classification, setClassification] = useState<NovaClass>("g4");
  const [carbs100, setCarbs100] = useState<string>("");         // usar string p/ lidar com vazio
  const [carbsPortion, setCarbsPortion] = useState<string>("");
  const [portionDesc, setPortionDesc] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // list state
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<NovaClass | "all">("all");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt_desc");

  // pagination
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  // carregar em tempo real
  useEffect(() => {
    const q = query(collection(db, "foods"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Food[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setFoods(rows);
    });
    return () => unsub();
  }, []);

  // derived list (filter + search + sort)
  const filtered = useMemo(() => {
    let rows = [...foods];

    // filtro por classificação
    if (classFilter !== "all") {
      rows = rows.filter((f) => f.classification === classFilter);
    }

    // busca por nome
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter((f) => f.name.toLowerCase().includes(term));
    }

    // ordenação
    rows.sort((a, b) => {
      if (sortBy === "createdAt_desc") {
        const ta = a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.seconds ?? 0;
        return tb - ta;
      }
      if (sortBy === "name_asc") return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      if (sortBy === "name_desc") return b.name.localeCompare(a.name, "pt-BR", { sensitivity: "base" });
      return 0;
    });

    return rows;
  }, [foods, classFilter, searchTerm, sortBy]);

  // paginação client-side
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  useEffect(() => {
    // quando muda filtro/busca/ordenacao, reseta p/ primeira página
    setPage(1);
  }, [classFilter, searchTerm, sortBy]);

  function openAddModal() {
    setMode("add");
    setEditingId(null);
    setName("");
    setClassification("g4");
    setCarbs100("");
    setCarbsPortion("");
    setPortionDesc("");
    setErr(null);
    setOpen(true);
  }

  function openEditModal(item: Food) {
    setMode("edit");
    setEditingId(item.id);
    setName(item.name);
    setClassification(item.classification);
    setCarbs100(item.carbs100 != null ? String(item.carbs100) : "");
    setCarbsPortion(item.carbsPortion != null ? String(item.carbsPortion) : "");
    setPortionDesc(item.portionDesc ?? "");
    setErr(null);
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  function openDeleteModal(food: Food) {
    setDeletingFood(food);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingFood(null);
  }

  async function confirmDelete() {
    if (!deletingFood) return;

    try {
      setDeleteLoading(true);
      await deleteDoc(doc(db, "foods", deletingFood.id));
      closeDeleteModal();
    } catch (e: any) {
      alert(e.message || "Não foi possível remover.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr("Informe o nome do alimento.");
      return;
    }
    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        classification,
        carbs100: carbs100 === "" ? null : Number(carbs100),
        carbsPortion: carbsPortion === "" ? null : Number(carbsPortion),
        portionDesc: portionDesc.trim() === "" ? null : portionDesc.trim(),
      };

      if (mode === "add") {
        await addDoc(collection(db, "foods"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } else if (mode === "edit" && editingId) {
        await updateDoc(doc(db, "foods", editingId), payload as any);
      }

      closeModal();
    } catch (e: any) {
      setErr(e.message || "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-title foods-title">
        <span className="foods-title-left">
          <Apple size={18} /> Alimentos
        </span>
        <button className="btn-primary foods-add" onClick={openAddModal}>
          <Plus size={16} /> Adicionar alimento
        </button>
      </div>


      <div className="foods-toolbar">
        <div className="search-box">
          <Search size={16} className="muted-ico" />
          <input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <div className="select-wrap">
            <Filter size={16} className="muted-ico" />
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value as NovaClass | "all")}>
              {NOVA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="select-wrap">
            {sortBy === "name_desc" || sortBy === "createdAt_desc" ? <SortDesc size={16} className="muted-ico" /> : <SortAsc size={16} className="muted-ico" />}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="createdAt_desc">Mais recentes</option>
              <option value="name_asc">Nome (A–Z)</option>
              <option value="name_desc">Nome (Z–A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {pageRows.length === 0 ? (
        <div className="empty">Nenhum alimento encontrado.</div>
      ) : (
        <ul className="food-list">
          {pageRows.map((f) => (
            <li key={f.id} className="food-item">
              <div className="food-main">
                <div className="food-name">{f.name}</div>
                <div className={`badge ${f.classification}`}>
                  {NOVA_OPTIONS.find((o) => o.value === f.classification)?.label}
                </div>
                {(f.carbs100 != null || f.carbsPortion != null) && (
                  <div className="food-macros">
                    {f.carbs100 != null && <span><b>{f.carbs100}</b> g carbo/100 g</span>}
                    {f.carbsPortion != null && (
                      <span>
                        <b>{f.carbsPortion}</b> g/porção{f.portionDesc ? ` (${f.portionDesc})` : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="food-actions">
                <button className="icon-btn" aria-label="Editar" onClick={() => openEditModal(f)}><Edit3 size={18} /></button>
                <button className="icon-btn danger" aria-label="Remover" onClick={() => openDeleteModal(f)}><Trash2 size={18} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Paginação */}
      <div className="pager">
        <button
          className="pager-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageSafe <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="pager-info">
          Página <b>{pageSafe}</b> de <b>{totalPages}</b>
        </span>
        <button
          className="pager-btn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={pageSafe >= totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Modal de cadastro/edição */}
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={mode === "add" ? "Adicionar alimento" : "Editar alimento"}>
          <div className="modal">
            <div className="modal-head">
              <h3>{mode === "add" ? "Adicionar alimento" : "Editar alimento"}</h3>
              <button className="icon-btn" onClick={closeModal} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            {err && <div className="alert-error">{err}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <label className="label">Nome do alimento</label>
              <input
                className="input-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Maçã, Pão de forma, Iogurte..."
                required
              />

              <label className="label">Classificação (NOVA)</label>
              <select
                className="input-base"
                value={classification}
                onChange={(e) => setClassification(e.target.value as NovaClass)}
              >
                {NOVA_OPTIONS.filter(o => o.value !== "all").map((opt) => (
                  <option key={opt.value} value={opt.value as NovaClass}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="grid-two">
                <div>
                  <label className="label">Carboidratos (g) por 100 g <span className="label-optional">(opcional)</span></label>
                  <input
                    className="input-base"
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbs100}
                    onChange={(e) => setCarbs100(e.target.value)}
                    placeholder="ex.: 14"
                  />
                </div>
                <div>
                  <label className="label">Carboidratos (g) por porção <span className="label-optional">(opcional)</span></label>
                  <input
                    className="input-base"
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbsPortion}
                    onChange={(e) => setCarbsPortion(e.target.value)}
                    placeholder="ex.: 12"
                  />
                </div>
              </div>

              <label className="label">Descrição da porção <span className="label-optional">(opcional)</span></label>
              <input
                className="input-base"
                value={portionDesc}
                onChange={(e) => setPortionDesc(e.target.value)}
                placeholder='ex.: "1 fatia (25 g)" ou "1 unidade (130 g)"'
              />

              <div className="modal-actions">
                <button type="button" className="btn-danger" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>

            <div className="modal-foot-hint">
              * A classificação NOVA não define carboidratos; os campos acima são independentes.
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && deletingFood && (
        <>
          <div className="modal-backdrop" onClick={closeDeleteModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Confirmar Exclusão</h2>
            </div>

            <div className="modal-form">
              <p>Tem certeza que deseja excluir o alimento <strong>"{deletingFood.name}"</strong>?</p>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                Esta ação não pode ser desfeita.
              </p>

              <div className="modal-actions" style={{ marginTop: "24px" }}>
                <button type="button" className="btn-ghost" onClick={closeDeleteModal}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-danger" 
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
