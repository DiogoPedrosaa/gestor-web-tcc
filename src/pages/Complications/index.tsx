import { useState, useEffect } from "react";
import { Plus, Edit, Search, Trash2, Heart } from "lucide-react"; // Adicionar Heart
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  orderBy, 
  query 
} from "firebase/firestore";
import { db } from "../../services/firebase";
import "./styles.css";

type Complication = {
  id: string;
  name: string;
  keywords: string[];
  instructions?: string;
  createdAt?: any;
};

export default function ComplicationsPage() {
  const [complications, setComplications] = useState<Complication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingComplication, setEditingComplication] = useState<Complication | null>(null);
  const [deletingComplication, setDeletingComplication] = useState<Complication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados do formulário
  const [formName, setFormName] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchComplications();
  }, []);

  async function fetchComplications() {
    try {
      setLoading(true);
      const q = query(collection(db, "complications"), orderBy("name"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complication[];
      setComplications(data);
    } catch (e) {
      console.error("Erro ao buscar complicações:", e);
      setError("Erro ao carregar complicações");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingComplication(null);
    setFormName("");
    setFormKeywords("");
    setFormInstructions("");
    setError(null);
    setShowModal(true);
  }

  function openEditModal(complication: Complication) {
    setEditingComplication(complication);
    setFormName(complication.name);
    setFormKeywords(complication.keywords.join(", "));
    setFormInstructions(complication.instructions || "");
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingComplication(null);
    setError(null);
  }

  function openDeleteModal(complication: Complication) {
    setDeletingComplication(complication);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingComplication(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      // Validações
      if (!formName.trim()) {
        throw new Error("Nome da complicação é obrigatório");
      }
      if (formName.length > 120) {
        throw new Error("Nome deve ter no máximo 120 caracteres");
      }
      if (!formKeywords.trim()) {
        throw new Error("Palavras-chave são obrigatórias");
      }
      if (formInstructions.length > 500) {
        throw new Error("Instruções devem ter no máximo 500 caracteres");
      }

      // Processar palavras-chave
      const keywords = formKeywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      if (keywords.length === 0) {
        throw new Error("Pelo menos uma palavra-chave é obrigatória");
      }

      const complicationData = {
        name: formName.trim(),
        keywords,
        instructions: formInstructions.trim() || undefined,
        ...(editingComplication ? {} : { createdAt: new Date() })
      };

      if (editingComplication) {
        await updateDoc(doc(db, "complications", editingComplication.id), complicationData);
      } else {
        await addDoc(collection(db, "complications"), complicationData);
      }

      await fetchComplications();
      closeModal();
    } catch (e: any) {
      setError(e.message || "Erro ao salvar complicação");
    } finally {
      setFormLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingComplication) return;

    try {
      setDeleteLoading(true);
      await deleteDoc(doc(db, "complications", deletingComplication.id));
      await fetchComplications();
      closeDeleteModal();
    } catch (e) {
      console.error("Erro ao excluir complicação:", e);
      alert("Erro ao excluir complicação");
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredComplications = complications.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="panel">
      <div className="complications-title">
        <div className="complications-title-left">
          <div className="panel-title">
            <Heart size={18} /> Complicações
          </div>
        </div>
        <button className="btn-primary complications-add" onClick={openAddModal}>
          <Plus size={18} />
          Adicionar complicação
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="complications-toolbar">
        <div className="search-box">
          <Search size={16} className="muted-ico" />
          <input
            type="text"
            placeholder="Buscar por nome ou palavras-chave..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de complicações */}
      {loading ? (
        <div className="empty">Carregando complicações...</div>
      ) : filteredComplications.length === 0 ? (
        <div className="empty">
          {searchTerm ? "Nenhuma complicação encontrada para essa busca." : "Nenhuma complicação cadastrada."}
        </div>
      ) : (
        <div className="complication-list">
          {filteredComplications.map(complication => (
            <div key={complication.id} className="complication-item">
              <div className="complication-main">
                <div className="complication-name">{complication.name}</div>
                <div className="complication-keywords">
                  <strong>Palavras-chave:</strong> {complication.keywords.join(", ")}
                </div>
                {complication.instructions && (
                  <div className="complication-instructions">
                    <strong>Instruções:</strong> {complication.instructions}
                  </div>
                )}
              </div>
              <div className="complication-actions">
                <button
                  className="icon-btn"
                  onClick={() => openEditModal(complication)}
                  title="Editar complicação"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => openDeleteModal(complication)}
                  title="Excluir complicação"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cadastro/edição */}
      {showModal && (
        <>
          <div className="modal-backdrop" onClick={closeModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>{editingComplication ? "Editar Complicação" : "Nova Complicação"}</h2>
            </div>

            {error && (
              <div className="alert-error">{error}</div>
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="label">
                Nome da complicação <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex: Retinopatia diabética"
                maxLength={120}
                required
              />

              <label className="label">
                Palavras-chave <span style={{ color: "red" }}>*</span>
                <span className="label-optional"> (separadas por vírgula)</span>
              </label>
              <input
                className="input-base"
                type="text"
                value={formKeywords}
                onChange={e => setFormKeywords(e.target.value)}
                placeholder="Ex: visão, olhos, retina, cegueira"
                required
              />

              <label className="label">
                Instruções/Recomendações <span className="label-optional">(opcional)</span>
              </label>
              <textarea
                className="input-base"
                value={formInstructions}
                onChange={e => setFormInstructions(e.target.value)}
                placeholder="Instruções ou recomendações para esta complicação..."
                maxLength={500}
                rows={4}
              />

              <div className="modal-actions">
                <button type="button" className="btn-danger" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && deletingComplication && (
        <>
          <div className="modal-backdrop" onClick={closeDeleteModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Confirmar Exclusão</h2>
            </div>

            <div className="modal-form">
              <p>Tem certeza que deseja excluir a complicação <strong>"{deletingComplication.name}"</strong>?</p>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                Esta ação não pode ser desfeita.
              </p>

              <div className="modal-actions" style={{ marginTop: "24px" }}>
                <button type="button" className="btn-outline" onClick={closeDeleteModal}>
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