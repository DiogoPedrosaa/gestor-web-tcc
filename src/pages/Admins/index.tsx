import { useState, useEffect } from "react";
import { Plus, Edit, Search, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  orderBy, 
  query,
  where 
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./styles.css";

type Admin = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt?: any;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [statusAdmin, setStatusAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Estados do formulário
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), where("role", "==", "admin"), orderBy("name"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        status: "active", // default se não existir
        ...doc.data()
      })) as Admin[];
      setAdmins(data);
    } catch (e) {
      console.error("Erro ao buscar administradores:", e);
      setError("Erro ao carregar administradores");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormConfirmPassword("");
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
  }

  function openDeleteModal(admin: Admin) {
    setDeletingAdmin(admin);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeletingAdmin(null);
  }

  function openStatusModal(admin: Admin) {
    setStatusAdmin(admin);
    setShowStatusModal(true);
  }

  function closeStatusModal() {
    setShowStatusModal(false);
    setStatusAdmin(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      // Validações
      if (!formName.trim()) {
        throw new Error("Nome completo é obrigatório");
      }
      if (formName.trim().length < 3) {
        throw new Error("Nome deve ter pelo menos 3 caracteres");
      }
      if (formName.length > 120) {
        throw new Error("Nome deve ter no máximo 120 caracteres");
      }
      if (!formEmail.trim()) {
        throw new Error("E-mail é obrigatório");
      }
      if (!isValidEmail(formEmail)) {
        throw new Error("E-mail deve ter formato válido");
      }
      if (!formPassword) {
        throw new Error("Senha é obrigatória");
      }
      if (formPassword.length < 8) {
        throw new Error("Senha deve ter pelo menos 8 caracteres");
      }
      if (formPassword !== formConfirmPassword) {
        throw new Error("Senha e confirmação devem ser idênticas");
      }

      // Verificar se e-mail já existe
      const existingAdmin = admins.find(admin => admin.email.toLowerCase() === formEmail.toLowerCase());
      if (existingAdmin) {
        throw new Error("E-mail já está em uso por outro administrador");
      }

      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formEmail, formPassword);
      
      // 2. Salvar dados do admin no Firestore IMEDIATAMENTE e AGUARDAR
      const adminData = {
        name: formName.trim(),
        email: formEmail.toLowerCase(),
        role: "admin",
        status: "active",
        createdAt: new Date(),
        uid: userCredential.user.uid
      };

      // Garantir que isso termine antes de continuar
      await addDoc(collection(db, "users"), adminData);
      
      // 3. Fazer logout do novo usuário criado
      await signOut(auth);
      
      // 4. Fechar modal e mostrar sucesso
      closeModal();
      
      // 5. Mostrar mensagem de sucesso e redirecionar para login
      alert("Administrador criado com sucesso! Você será redirecionado para fazer login novamente.");
      
      // 6. Redirecionar para login
      navigate("/login", { replace: true });
      
    } catch (e: any) {
      console.error("Erro completo:", e);
      setError(e.message || "Erro ao criar administrador");
    } finally {
      setFormLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingAdmin) return;

    try {
      setDeleteLoading(true);
      await deleteDoc(doc(db, "users", deletingAdmin.id));
      await fetchAdmins();
      closeDeleteModal();
    } catch (e) {
      console.error("Erro ao excluir administrador:", e);
      alert("Erro ao excluir administrador");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusAdmin) return;

    try {
      setStatusLoading(true);
      const newStatus = statusAdmin.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "users", statusAdmin.id), { status: newStatus });
      await fetchAdmins();
      closeStatusModal();
    } catch (e) {
      console.error("Erro ao alterar status:", e);
      alert("Erro ao alterar status do administrador");
    } finally {
      setStatusLoading(false);
    }
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function formatDate(date: any): string {
    if (!date) return "Data não disponível";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("pt-BR");
  }

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="admins-title">
        <div className="admins-title-left">
          <div className="panel-title">
            <Users size={18} /> Administradores
          </div>
        </div>
        <button className="btn-primary admins-add" onClick={openAddModal}>
          <Plus size={18} />
          Adicionar administrador
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="admins-toolbar">
        <div className="search-box">
          <Search size={16} className="muted-ico" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de administradores */}
      {loading ? (
        <div className="empty">Carregando administradores...</div>
      ) : filteredAdmins.length === 0 ? (
        <div className="empty">
          {searchTerm ? "Nenhum administrador encontrado para essa busca." : "Nenhum administrador cadastrado."}
        </div>
      ) : (
        <div className="admin-list">
          {filteredAdmins.map(admin => (
            <div key={admin.id} className="admin-item">
              <div className="admin-main">
                <div className="admin-name">{admin.name}</div>
                <div className="admin-email">{admin.email}</div>
                <div className="admin-meta">
                  <span className={`status-badge ${admin.status}`}>
                    {admin.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                  <span className="admin-date">
                    Criado em: {formatDate(admin.createdAt)}
                  </span>
                </div>
              </div>
              <div className="admin-actions">
                <button
                  className={`icon-btn ${admin.status === "active" ? "warning" : "success"}`}
                  onClick={() => openStatusModal(admin)}
                  title={admin.status === "active" ? "Inativar administrador" : "Ativar administrador"}
                >
                  {admin.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => openDeleteModal(admin)}
                  title="Excluir administrador"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cadastro */}
      {showModal && (
        <>
          <div className="modal-backdrop" onClick={closeModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Novo Administrador</h2>
            </div>

            {error && (
              <div className="alert-error">{error}</div>
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="label">
                Nome completo <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex: João Silva"
                maxLength={120}
                required
              />

              <label className="label">
                E-mail <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                placeholder="Ex: joao@exemplo.com"
                required
              />

              <label className="label">
                Senha <span style={{ color: "red" }}>*</span>
                <span className="label-optional"> (mínimo 8 caracteres)</span>
              </label>
              <input
                className="input-base"
                type="password"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Digite uma senha segura"
                minLength={8}
                required
              />

              <label className="label">
                Confirmar senha <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="input-base"
                type="password"
                value={formConfirmPassword}
                onChange={e => setFormConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
              />

              <div className="modal-actions">
                <button type="button" className="btn-danger" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? "Criando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && deletingAdmin && (
        <>
          <div className="modal-backdrop" onClick={closeDeleteModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Confirmar Exclusão</h2>
            </div>

            <div className="modal-form">
              <p>Tem certeza que deseja excluir o administrador <strong>"{deletingAdmin.name}"</strong>?</p>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                Esta ação não pode ser desfeita e o administrador perderá acesso ao sistema.
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

      {/* Modal de confirmação de status */}
      {showStatusModal && statusAdmin && (
        <>
          <div className="modal-backdrop" onClick={closeStatusModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Confirmar Alteração</h2>
            </div>

            <div className="modal-form">
              <p>
                Deseja realmente <strong>{statusAdmin.status === "active" ? "inativar" : "ativar"}</strong> o administrador <strong>"{statusAdmin.name}"</strong>?
              </p>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                {statusAdmin.status === "active" 
                  ? "Administradores inativos não poderão acessar o sistema."
                  : "O administrador poderá acessar o sistema novamente."
                }
              </p>

              <div className="modal-actions" style={{ marginTop: "24px" }}>
                <button type="button" className="btn-outline" onClick={closeStatusModal}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={confirmStatusChange}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Alterando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}