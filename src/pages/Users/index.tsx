import React, { useState, useEffect } from "react";
import { Search, UserCheck, UserX, Users } from "lucide-react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { db } from "../../services/firebase";
import "./styles.css";

type User = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  diabetesType: string;
  status: "active" | "inactive";
  role: string;
  createdAt?: any;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const q = query(
        collection(db, "users"),
        where("role", "==", "user"),
        orderBy("name")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        status: "active", // default se não existir
        ...doc.data()
      })) as User[];
      setUsers(data);
    } catch (e) {
      console.error("Erro ao buscar usuários:", e);
      setError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  function openStatusModal(user: User) {
    setStatusUser(user);
    setShowStatusModal(true);
  }

  function closeStatusModal() {
    setShowStatusModal(false);
    setStatusUser(null);
  }

  async function confirmStatusChange() {
    if (!statusUser) return;

    try {
      setStatusLoading(true);
      const newStatus = statusUser.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "users", statusUser.id), { status: newStatus });
      await fetchUsers();
      closeStatusModal();
    } catch (e) {
      console.error("Erro ao alterar status:", e);
      alert("Erro ao alterar status do usuário");
    } finally {
      setStatusLoading(false);
    }
  }

  function formatCPF(cpf: string): string {
    if (!cpf) return "Não informado";
    
    // Remove qualquer formatação existente (pontos, traços, espaços)
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return "CPF inválido";
    }
    
    // Aplica a censura: 123.***.***-**
    return `${cleanCPF.slice(0, 3)}.***.***-**`;
  }

  function formatDate(date: any): string {
    if (!date) return "Data não disponível";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("pt-BR");
  }

  function getDiabetesTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      "type1": "Tipo 1",
      "type2": "Tipo 2",
      "gestational": "Gestacional",
      "other": "Outro"
    };
    return types[type] || type || "Não informado";
  }

  const filteredUsers = users.filter(user => {
    if (searchTerm.length < 3) return true;
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="panel">
      <div className="users-title">
        <div className="users-title-left">
          <div className="panel-title">
            <Users size={18} /> Usuários
          </div>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="users-toolbar">
        <div className="search-box">
          <Search size={16} className="muted-ico" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail (mín. 3 caracteres)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <button
            className="btn-outline clear-filter"
            onClick={() => setSearchTerm("")}
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="empty">Carregando usuários...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty">
          {searchTerm.length >= 3
            ? "Nenhum usuário encontrado para essa busca."
            : searchTerm.length > 0 && searchTerm.length < 3
            ? "Digite pelo menos 3 caracteres para buscar."
            : "Nenhum usuário cadastrado."
          }
        </div>
      ) : (
        <div className="user-list">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-item">
              <div className="user-main">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-details">
                  <div className="user-detail">
                    <strong>CPF:</strong> {formatCPF(user.cpf)}
                  </div>
                  <div className="user-detail">
                    <strong>Diabetes:</strong> {getDiabetesTypeLabel(user.diabetesType)}
                  </div>
                </div>
                <div className="user-meta">
                  <span className={`status-badge ${user.status}`}>
                    {user.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                  <span className="user-date">
                    Cadastrado em: {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
              <div className="user-actions">
                <button
                  className={`icon-btn ${user.status === "active" ? "warning" : "success"}`}
                  onClick={() => openStatusModal(user)}
                  title={user.status === "active" ? "Inativar usuário" : "Ativar usuário"}
                >
                  {user.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de status */}
      {showStatusModal && statusUser && (
        <>
          <div className="modal-backdrop" onClick={closeStatusModal} />
          <div className="modal">
            <div className="modal-head">
              <h2>Confirmar Alteração</h2>
            </div>

            <div className="modal-form">
              <p>
                Deseja realmente <strong>{statusUser.status === "active" ? "inativar" : "ativar"}</strong> o usuário <strong>"{statusUser.name}"</strong>?
              </p>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "8px" }}>
                {statusUser.status === "active"
                  ? "Usuários inativos não poderão acessar o aplicativo."
                  : "O usuário poderá acessar o aplicativo novamente."
                }
              </p>

              <div className="modal-actions" style={{ marginTop: "24px" }}>
                <button type="button" className="btn-danger" onClick={closeStatusModal}>
                  Não
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmStatusChange}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Alterando..." : "Sim"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
