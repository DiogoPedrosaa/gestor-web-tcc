import React, { useState, useEffect } from "react";
import { Search, UserCheck, UserX, Users, X, User as UserIcon } from "lucide-react";
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
  diabetesType: string;
  diabetesDuration: string;
  gender: string;
  height: number;
  weight: number;
  medications: string[];
  isFollowedUp: boolean;
  isHypertensive: boolean;
  hasChronicComplications: boolean;
  chronicComplicationsDescription?: string; // Adicionado
  status: "active" | "inactive";
  role: string;
  createdAt?: any;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  function openDetailsModal(user: User) {
    setSelectedUser(user);
    setShowDetailsModal(true);
  }

  function closeDetailsModal() {
    setShowDetailsModal(false);
    setSelectedUser(null);
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

  function calculateBMI(weight: number, height: number): number {
    if (!weight || !height || height === 0) return 0;
    // height em cm, convertendo para metros
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  function getBMICategory(bmi: number): { category: string; color: string } {
    if (bmi === 0) return { category: "Não informado", color: "#64748b" };
    if (bmi < 18.5) return { category: "Abaixo do peso", color: "#3b82f6" };
    if (bmi < 25) return { category: "Peso normal", color: "#10b981" };
    if (bmi < 30) return { category: "Sobrepeso", color: "#f59e0b" };
    if (bmi < 35) return { category: "Obesidade Grau I", color: "#f97316" };
    if (bmi < 40) return { category: "Obesidade Grau II", color: "#ef4444" };
    return { category: "Obesidade Grau III", color: "#dc2626" };
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

  function getGenderLabel(gender: string): string {
    const genders: { [key: string]: string } = {
      "masculino": "Masculino",
      "feminino": "Feminino",
      "outro": "Outro"
    };
    return genders[gender] || gender || "Não informado";
  }

  function formatMedications(medications: string[] | undefined): string {
    if (!medications || medications.length === 0) return "Nenhuma";
    if (medications.length === 1) return medications[0];
    return `${medications[0]} e mais ${medications.length - 1}`;
  }

  function parseChronicComplications(description: string): string[] {
    if (!description) return [];
    // Separar por vírgula, ponto e vírgula ou quebra de linha
    return description
      .split(/[,;\n]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
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
          {filteredUsers.map(user => {
            const bmi = calculateBMI(user.weight, user.height);
            const bmiCategory = getBMICategory(bmi);
            
            return (
              <div key={user.id} className="user-item" onClick={() => openDetailsModal(user)}>
                <div className="user-main">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                  
                  <div className="user-details">
                    <div className="user-detail">
                      <strong>Gênero:</strong> 
                      <span className="detail-value">{getGenderLabel(user.gender)}</span>
                    </div>
                    <div className="user-detail">
                      <strong>Diabetes:</strong> 
                      <span className="detail-value">{getDiabetesTypeLabel(user.diabetesType)}</span>
                    </div>
                    <div className="user-detail">
                      <strong>Duração:</strong> 
                      <span className="detail-value">{user.diabetesDuration || "Não informado"}</span>
                    </div>
                  </div>

                  <div className="user-details">
                    <div className="user-detail">
                      <strong>Peso:</strong> 
                      <span className="detail-value">{user.weight ? `${user.weight} kg` : "Não informado"}</span>
                    </div>
                    <div className="user-detail">
                      <strong>Altura:</strong> 
                      <span className="detail-value">{user.height ? `${user.height} cm` : "Não informado"}</span>
                    </div>
                    <div className="user-detail">
                      <strong>IMC:</strong> 
                      {bmi > 0 ? (
                        <span style={{ color: bmiCategory.color, fontWeight: 500 }}>
                          {` ${bmi.toFixed(1)} - ${bmiCategory.category}`}
                        </span>
                      ) : (
                        <span className="detail-value"> Não calculado</span>
                      )}
                    </div>
                  </div>

                  <div className="user-details">
                    <div className="user-detail">
                      <strong>Medicações:</strong> 
                      <span className="detail-value">{formatMedications(user.medications)}</span>
                    </div>
                  </div>

                  <div className="user-conditions">
                    {user.isFollowedUp && (
                      <span className="condition-badge positive">Em acompanhamento</span>
                    )}
                    {user.isHypertensive && (
                      <span className="condition-badge warning">Hipertenso</span>
                    )}
                    {user.hasChronicComplications && (
                      <span className="condition-badge negative">Complicações crônicas</span>
                    )}
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
                <div className="user-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className={`icon-btn ${user.status === "active" ? "warning" : "success"}`}
                    onClick={() => openStatusModal(user)}
                    title={user.status === "active" ? "Inativar usuário" : "Ativar usuário"}
                  >
                    {user.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalhes do usuário */}
      {showDetailsModal && selectedUser && (
        <>
          <div className="modal-backdrop" onClick={closeDetailsModal} />
          <div className="modal details-modal">
            <div className="modal-head">
              <div className="modal-head-content">
                <div className="modal-title">
                  <UserIcon size={20} />
                  <h2>Detalhes do Paciente</h2>
                </div>
                <button className="close-btn" onClick={closeDetailsModal}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-form">
              <div className="details-section">
                <h3>Informações Pessoais</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Nome completo:</label>
                    <span>{selectedUser.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>E-mail:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>Gênero:</label>
                    <span className="detail-value">{getGenderLabel(selectedUser.gender)}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Informações de Diabetes</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Tipo de diabetes:</label>
                    <span className="detail-value">{getDiabetesTypeLabel(selectedUser.diabetesType)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Duração do diabetes:</label>
                    <span className="detail-value">{selectedUser.diabetesDuration || "Não informado"}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Dados Físicos</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Peso:</label>
                    <span className="detail-value">{selectedUser.weight ? `${selectedUser.weight} kg` : "Não informado"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Altura:</label>
                    <span className="detail-value">{selectedUser.height ? `${selectedUser.height} cm` : "Não informado"}</span>
                  </div>
                  <div className="detail-item">
                    <label>IMC:</label>
                    {(() => {
                      const bmi = calculateBMI(selectedUser.weight, selectedUser.height);
                      const bmiCategory = getBMICategory(bmi);
                      return bmi > 0 ? (
                        <span style={{ color: bmiCategory.color, fontWeight: 500 }}>
                          {`${bmi.toFixed(1)} - ${bmiCategory.category}`}
                        </span>
                      ) : (
                        <span className="detail-value">Não calculado</span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Medicações</h3>
                <div className="medications-list">
                  {selectedUser.medications && selectedUser.medications.length > 0 ? (
                    selectedUser.medications.map((medication, index) => (
                      <div key={index} className="medication-item-detail">
                        <span className="medication-number">{index + 1}.</span>
                        <span className="medication-name">{medication}</span>
                      </div>
                    ))
                  ) : (
                    <span className="no-medications">Nenhuma medicação cadastrada</span>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h3>Condições de Saúde</h3>
                <div className="conditions-grid">
                  <div className="condition-item">
                    <label>Possui acompanhamento:</label>
                    <span className={`condition-status ${selectedUser.isFollowedUp ? 'positive' : 'negative'}`}>
                      {selectedUser.isFollowedUp ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="condition-item">
                    <label>Hipertensão:</label>
                    <span className={`condition-status ${selectedUser.isHypertensive ? 'warning' : 'negative'}`}>
                      {selectedUser.isHypertensive ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>

                {/* Seção específica para complicações crônicas */}
                <div className="complications-section">
                  <h4>Complicações Crônicas</h4>
                  {selectedUser.hasChronicComplications ? (
                    <div className="complications-list">
                      {selectedUser.chronicComplicationsDescription ? (
                        parseChronicComplications(selectedUser.chronicComplicationsDescription).map((complication, index) => (
                          <div key={index} className="complication-item">
                            <span className="complication-number">{index + 1}.</span>
                            <span className="complication-name">{complication}</span>
                          </div>
                        ))
                      ) : (
                        <span className="complications-not-specified">Complicações presentes, mas não especificadas</span>
                      )}
                    </div>
                  ) : (
                    <span className="no-complications">Nenhuma complicação crônica reportada</span>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h3>Informações da Conta</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedUser.status}`}>
                      {selectedUser.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Data de cadastro:</label>
                    <span>{formatDate(selectedUser.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
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
                <button type="button" className="btn-outline" onClick={closeStatusModal}>
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
