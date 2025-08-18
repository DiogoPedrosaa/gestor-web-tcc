import { useState, useEffect } from "react";
import { Plus, Edit, Search, Trash2, Pill } from "lucide-react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  orderBy, 
  query, 
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../services/firebase";
import "./styles.css";

type Medication = {
  id: string;
  commercialName: string;
  genericName: string;
  pharmaceuticalForm: string;
  concentration: string;
  administrationRoute: string;
  description?: string;
  createdAt?: any;
};

const PHARMACEUTICAL_FORMS = [
  { value: "comprimido", label: "Comprimido" },
  { value: "capsula", label: "Cápsula" },
  { value: "solucao_injetavel", label: "Solução injetável" },
  { value: "caneta_insulina", label: "Caneta de insulina" },
  { value: "frasco_ampola", label: "Frasco-ampola" },
  { value: "xarope", label: "Xarope" },
  { value: "suspensao", label: "Suspensão" },
  { value: "creme", label: "Creme" },
  { value: "gel", label: "Gel" },
  { value: "aerossol", label: "Aerossol" }
];

const ADMINISTRATION_ROUTES = [
  { value: "oral", label: "Oral" },
  { value: "subcutanea", label: "Subcutânea" },
  { value: "intravenosa", label: "Intravenosa" },
  { value: "intramuscular", label: "Intramuscular" },
  { value: "topica", label: "Tópica" },
  { value: "inalatoria", label: "Inalatória" },
  { value: "retal", label: "Retal" },
  { value: "oftalmologica", label: "Oftalmológica" }
];

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados do formulário
  const [formCommercialName, setFormCommercialName] = useState("");
  const [formGenericName, setFormGenericName] = useState("");
  const [formPharmaceuticalForm, setFormPharmaceuticalForm] = useState("");
  const [formConcentration, setFormConcentration] = useState("");
  const [formAdministrationRoute, setFormAdministrationRoute] = useState("");
  const [formDescription, setFormDescription] = useState("");

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    try {
      setLoading(true);
      const q = query(collection(db, "medications"), orderBy("commercialName"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[];
      setMedications(data);
    } catch (e) {
      console.error("Erro ao buscar medicamentos:", e);
      setError("Erro ao carregar medicamentos");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingMedication(null);
    clearForm();
    setError(null);
    setShowModal(true);
  }

  function openEditModal(medication: Medication) {
    setEditingMedication(medication);
    setFormCommercialName(medication.commercialName);
    setFormGenericName(medication.genericName);
    setFormPharmaceuticalForm(medication.pharmaceuticalForm);
    setFormConcentration(medication.concentration);
    setFormAdministrationRoute(medication.administrationRoute);
    setFormDescription(medication.description || "");
    setError(null);
    setShowModal(true);
  }

  function clearForm() {
    setFormCommercialName("");
    setFormGenericName("");
    setFormPharmaceuticalForm("");
    setFormConcentration("");
    setFormAdministrationRoute("");
    setFormDescription("");
  }

  function closeModal() {
    setShowModal(false);
    setEditingMedication(null);
    setError(null);
  }

  function openDeleteModal(medication: Medication) {
    setDeletingMedication(medication);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingMedication(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      // Validações
      if (!formCommercialName.trim()) {
        throw new Error("Nome comercial é obrigatório");
      }
      if (formCommercialName.length > 120) {
        throw new Error("Nome comercial deve ter no máximo 120 caracteres");
      }
      if (!formGenericName.trim()) {
        throw new Error("Nome genérico é obrigatório");
      }
      if (!formPharmaceuticalForm) {
        throw new Error("Forma farmacêutica é obrigatória");
      }
      if (!formConcentration.trim()) {
        throw new Error("Concentração é obrigatória");
      }
      if (!formAdministrationRoute) {
        throw new Error("Via de administração é obrigatória");
      }
      if (formDescription.length > 300) {
        throw new Error("Descrição deve ter no máximo 300 caracteres");
      }

      const medicationData = {
        commercialName: formCommercialName.trim(),
        genericName: formGenericName.trim(),
        pharmaceuticalForm: formPharmaceuticalForm,
        concentration: formConcentration.trim(),
        administrationRoute: formAdministrationRoute,
        description: formDescription.trim() || undefined,
        ...(editingMedication ? {} : { createdAt: serverTimestamp() })
      };

      if (editingMedication) {
        await updateDoc(doc(db, "medications", editingMedication.id), medicationData);
      } else {
        await addDoc(collection(db, "medications"), medicationData);
      }

      await fetchMedications();
      closeModal();
    } catch (e: any) {
      setError(e.message || "Erro ao salvar medicamento");
    } finally {
      setFormLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingMedication) return;

    try {
      setDeleteLoading(true);
      await deleteDoc(doc(db, "medications", deletingMedication.id));
      await fetchMedications();
      closeDeleteModal();
    } catch (e) {
      console.error("Erro ao excluir medicamento:", e);
      alert("Erro ao excluir medicamento");
    } finally {
      setDeleteLoading(false);
    }
  }

  function getFormLabel(value: string, options: Array<{value: string, label: string}>): string {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  }

  const filteredMedications = medications.filter(medication =>
    medication.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="medications-title">
        <div className="medications-title-left">
          <div className="panel-title">
            <Pill size={18} /> Medicamentos
          </div>
        </div>
        <button className="btn-primary medications-add" onClick={openAddModal}>
          <Plus size={18} />
          Adicionar medicamento
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="medications-toolbar">
        <div className="search-box">
          <Search size={16} className="muted-ico" />
          <input
            type="text"
            placeholder="Buscar por nome comercial ou genérico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de medicamentos */}
      {loading ? (
        <div className="empty">Carregando medicamentos...</div>
      ) : filteredMedications.length === 0 ? (
        <div className="empty">
          {searchTerm ? "Nenhum medicamento encontrado para essa busca." : "Nenhum medicamento cadastrado."}
        </div>
      ) : (
        <div className="medication-list">
          {filteredMedications.map(medication => (
            <div key={medication.id} className="medication-item">
              <div className="medication-main">
                <div className="medication-name">
                  {medication.commercialName}
                  <span className="medication-generic">({medication.genericName})</span>
                </div>
                <div className="medication-details">
                  <div className="medication-detail">
                    <strong>Forma:</strong> {getFormLabel(medication.pharmaceuticalForm, PHARMACEUTICAL_FORMS)}
                  </div>
                  <div className="medication-detail">
                    <strong>Concentração:</strong> {medication.concentration}
                  </div>
                  <div className="medication-detail">
                    <strong>Via:</strong> {getFormLabel(medication.administrationRoute, ADMINISTRATION_ROUTES)}
                  </div>
                </div>
                {medication.description && (
                  <div className="medication-description">{medication.description}</div>
                )}
              </div>
              <div className="medication-actions">
                <button
                  className="icon-btn"
                  onClick={() => openEditModal(medication)}
                  title="Editar medicamento"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => openDeleteModal(medication)}
                  title="Excluir medicamento"
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
              <h2>{editingMedication ? "Editar Medicamento" : "Novo Medicamento"}</h2>
            </div>

            {error && (
              <div className="alert-error">{error}</div>
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="label">
                Nome comercial <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="text"
                value={formCommercialName}
                onChange={e => setFormCommercialName(e.target.value)}
                placeholder="Ex: Glifage"
                maxLength={120}
                required
              />

              <label className="label">
                Nome genérico / Princípio ativo <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="text"
                value={formGenericName}
                onChange={e => setFormGenericName(e.target.value)}
                placeholder="Ex: Metformina"
                required
              />

              <label className="label">
                Forma farmacêutica <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="input-base"
                value={formPharmaceuticalForm}
                onChange={e => setFormPharmaceuticalForm(e.target.value)}
                required
              >
                <option value="">Selecione a forma farmacêutica</option>
                {PHARMACEUTICAL_FORMS.map(form => (
                  <option key={form.value} value={form.value}>
                    {form.label}
                  </option>
                ))}
              </select>

              <label className="label">
                Concentração <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="text"
                value={formConcentration}
                onChange={e => setFormConcentration(e.target.value)}
                placeholder="Ex: 500 mg, 100 UI/mL"
                required
              />

              <label className="label">
                Via de administração <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="input-base"
                value={formAdministrationRoute}
                onChange={e => setFormAdministrationRoute(e.target.value)}
                required
              >
                <option value="">Selecione a via de administração</option>
                {ADMINISTRATION_ROUTES.map(route => (
                  <option key={route.value} value={route.value}>
                    {route.label}
                  </option>
                ))}
              </select>

              <label className="label">
                Descrição <span className="label-optional">(opcional, máx. 300 caracteres)</span>
              </label>
              <textarea
                className="input-base"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Informações adicionais sobre o medicamento..."
                maxLength={300}
                rows={3}
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
      {showDeleteModal && deletingMedication && (
        <>
          <div className="modal-backdrop" onClick={closeDeleteModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Confirmar Exclusão</h2>
            </div>

            <div className="modal-form">
              <p>Tem certeza que deseja excluir o medicamento <strong>"{deletingMedication.commercialName}"</strong>?</p>
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