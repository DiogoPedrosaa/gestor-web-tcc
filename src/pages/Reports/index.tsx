import React, { useState, useEffect } from "react";
import { FileText, Filter, Download, X, RefreshCw, Calendar, FileDown } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "../../services/firebase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./styles.css";

type ReportType = "users" | "medications" | "foods" | "complications";

type ReportData = {
  [key: string]: any;
};

const REPORT_TYPES = [
  { value: "users", label: "Usuários cadastrados no sistema" },
  { value: "medications", label: "Medicações cadastradas" },
  { value: "foods", label: "Alimentos cadastrados" },
  { value: "complications", label: "Complicações cadastradas" }
];

const RECORDS_PER_PAGE_OPTIONS = [10, 25, 50];

export default function ReportsPage() {
  // Estados dos filtros
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Estados dos dados
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  
  // Estados da interface
  const [showResults, setShowResults] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Limpar filtros
  function clearFilters() {
    setReportType("");
    setStartDate("");
    setEndDate("");
    setShowResults(false);
    setReportData([]);
    setError(null);
    setCurrentPage(1);
  }

  // Validar datas
  function validateDates(): string | null {
    if (!startDate || !endDate) {
      return "Data inicial e final são obrigatórias";
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (start > end) {
      return "Data inicial deve ser menor ou igual à data final";
    }

    if (start > today || end > today) {
      return "Não é permitido selecionar datas futuras";
    }

    return null;
  }

  // Gerar relatório
  async function generateReport() {
    const dateError = validateDates();
    if (dateError) {
      setError(dateError);
      return;
    }

    if (!reportType) {
      setError("Selecione o tipo de relatório");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ajustar as datas para incluir o dia completo
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");

      // Criar timestamps do Firestore
      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      let data: ReportData[] = [];

      switch (reportType) {
        case "users":
          data = await fetchUsersReport(startTimestamp, endTimestamp);
          break;
        case "medications":
          data = await fetchMedicationsReport(startTimestamp, endTimestamp);
          break;
        case "foods":
          data = await fetchFoodsReport(startTimestamp, endTimestamp);
          break;
        case "complications":
          data = await fetchComplicationsReport(startTimestamp, endTimestamp);
          break;
      }

      setReportData(data);
      setShowResults(true);
      setCurrentPage(1);
    } catch (e) {
      console.error("Erro ao gerar relatório:", e);
      setError("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Funções de busca por tipo de relatório
  async function fetchUsersReport(start: Timestamp, end: Timestamp): Promise<ReportData[]> {
    const q = query(
      collection(db, "users"),
      where("role", "==", "user"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    );
    const snap = await getDocs(q);
    const users = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.name || "",
        email: data.email || "",
        genero: getGenderLabel(data.gender || ""),
        diabetes: getDiabetesTypeLabel(data.diabetesType || ""),
        duracao: data.diabetesDuration || "",
        peso: data.weight || "",
        altura: data.height || "",
        imc: data.weight && data.height ? ((data.weight / Math.pow(data.height / 100, 2)).toFixed(1)) : "",
        acompanhamento: data.isFollowedUp ? "Sim" : "Não",
        hipertenso: data.isHypertensive ? "Sim" : "Não",
        possuiComplicacoes: data.hasChronicComplications ? "Sim" : "Não",
        descricaoComplicacoes: data.hasChronicComplications 
          ? (data.chronicComplicationsDescription || "Não especificado")
          : "-",
        medicamentos: Array.isArray(data.medications) 
          ? data.medications.join(", ") 
          : (data.medications || "-"),
        status: data.status === "active" ? "Ativo" : "Inativo",
        dataCadastro: data.createdAt?.toDate?.()?.toLocaleDateString("pt-BR") || "",
        createdAt: data.createdAt
      };
    });
    
    return users.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    }).map(user => {
      const { createdAt, ...userWithoutCreatedAt } = user;
      return userWithoutCreatedAt;
    });
  }

  async function fetchMedicationsReport(start: Timestamp, end: Timestamp): Promise<ReportData[]> {
    const q = query(
      collection(db, "medications"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    );
    const snap = await getDocs(q);
    const medications = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nomeGenerico: data.genericName || "",
        nomeComercial: data.commercialName || "",
        concentracao: data.concentration || "",
        formaFarmaceutica: data.pharmaceuticalForm || "",
        viaAdministracao: data.administrationRoute || "",
        descricao: data.description || "",
        dataCadastro: data.createdAt?.toDate?.()?.toLocaleDateString("pt-BR") || "",
        createdAt: data.createdAt
      };
    });
    
    return medications.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    }).map(medication => {
      const { createdAt, ...medicationWithoutCreatedAt } = medication;
      return medicationWithoutCreatedAt;
    });
  }

  async function fetchFoodsReport(start: Timestamp, end: Timestamp): Promise<ReportData[]> {
    const q = query(
      collection(db, "foods"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    );
    const snap = await getDocs(q);
    const foods = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.name || "",
        classificacaoNova: getNovaClassLabel(data.classification || ""),
        carboidratosPor100g: data.carbs100 || "",
        carboidratosPorPorcao: data.carbsPortion || "",
        descricaoPorcao: data.portionDesc || "",
        dataCadastro: data.createdAt?.toDate?.()?.toLocaleDateString("pt-BR") || "",
        createdAt: data.createdAt
      };
    });
    
    return foods.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    }).map(food => {
      const { createdAt, ...foodWithoutCreatedAt } = food;
      return foodWithoutCreatedAt;
    });
  }

  async function fetchComplicationsReport(start: Timestamp, end: Timestamp): Promise<ReportData[]> {
    const q = query(
      collection(db, "complications"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    );
    const snap = await getDocs(q);
    const complications = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.name || "",
        palavrasChave: Array.isArray(data.keywords) ? data.keywords.join(", ") : (data.keywords || ""),
        instrucoes: data.instructions || "",
        dataCadastro: data.createdAt?.toDate?.()?.toLocaleDateString("pt-BR") || "",
        createdAt: data.createdAt
      };
    });
    
    return complications.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    }).map(complication => {
      const { createdAt, ...complicationWithoutCreatedAt } = complication;
      return complicationWithoutCreatedAt;
    });
  }

  // Funções auxiliares de formatação
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

  function getNovaClassLabel(novaClass: string): string {
    const classes: { [key: string]: string } = {
      "g1": "Grupo 1 - In natura/Minimamente processados",
      "g2": "Grupo 2 - Ingredientes culinários", 
      "g3": "Grupo 3 - Processados",
      "g4": "Grupo 4 - Ultraprocessados"
    };
    return classes[novaClass] || novaClass || "Não informado";
  }

  // Formatar label da coluna
  function formatColumnLabel(column: string): string {
    const labels: { [key: string]: string } = {
      // Usuários
      nome: "Nome",
      email: "E-mail",
      genero: "Gênero",
      diabetes: "Tipo Diabetes",
      duracao: "Duração",
      peso: "Peso (kg)",
      altura: "Altura (cm)",
      imc: "IMC",
      acompanhamento: "Acompanhamento",
      hipertenso: "Hipertenso",
      possuiComplicacoes: "Possui Complicações",
      descricaoComplicacoes: "Descrição das Complicações",
      medicamentos: "Medicamentos",
      status: "Status",
      dataCadastro: "Data Cadastro",
      
      // Medicações
      nomeGenerico: "Nome Genérico",
      nomeComercial: "Nome Comercial",
      concentracao: "Concentração",
      formaFarmaceutica: "Forma Farmacêutica",
      viaAdministracao: "Via de Administração",
      descricao: "Descrição",
      
      // Alimentos
      classificacaoNova: "Classificação NOVA",
      carboidratosPor100g: "Carboidratos (100g)",
      carboidratosPorPorcao: "Carboidratos por Porção",
      descricaoPorcao: "Descrição da Porção",
      
      // Complicações
      palavrasChave: "Palavras-chave",
      instrucoes: "Instruções"
    };
    return labels[column] || column;
  }

  // Obter colunas da tabela
  function getTableColumns(): string[] {
    if (reportData.length === 0) return [];
    return Object.keys(reportData[0]).filter(key => key !== "id");
  }

  // Obter dados paginados
  function getPaginatedData(): ReportData[] {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return reportData.slice(startIndex, endIndex);
  }

  // Calcular total de páginas
  function getTotalPages(): number {
    return Math.ceil(reportData.length / recordsPerPage);
  }

  // Função para calcular larguras inteligentes das colunas
  // (Removido por duplicidade - mantida apenas a versão mais abaixo)

  // Função para calcular comprimento máximo baseado na largura da coluna
  function getMaxLengthForColumn(column: string, width: number): number {
    const charsPerMm = 2.5;
    return Math.floor(width * charsPerMm);
  }

  // Exportar CSV
  function exportToCSV() {
    if (reportData.length === 0) {
      setError("Não há dados para exportar");
      return;
    }

    setExporting(true);

    try {
      const columns = getTableColumns();
      const csvContent = [
        columns.map(col => formatColumnLabel(col)).join(","),
        ...reportData.map(row => 
          columns.map(col => {
            const value = row[col] || "";
            return typeof value === "string" && (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(",")
        ),
        "",
        `"Relatório gerado em: ${new Date().toLocaleString("pt-BR")}"`
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Erro ao exportar CSV:", e);
      setError("Erro ao exportar relatório");
    } finally {
      setExporting(false);
    }
  }

  // Exportar PDF
  function exportToPDF() {
    if (reportData.length === 0) {
      setError("Não há dados para exportar");
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const columns = getTableColumns();
      
      // Cabeçalho
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 297, 15, 'F');
      
      const reportTitle = REPORT_TYPES.find(type => type.value === reportType)?.label || "Relatório";
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(reportTitle.toUpperCase(), 2, 10); // Movido de 5 para 2
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("SISTEMA DE GESTÃO DIABETES", 200, 10);
      
      doc.setTextColor(0, 0, 0);
      
      // Informações do relatório
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("PERÍODO:", 2, 22); // Movido de 5 para 2
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date(startDate).toLocaleDateString("pt-BR")} até ${new Date(endDate).toLocaleDateString("pt-BR")}`, 20, 22);
      
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL:", 2, 28); // Movido de 5 para 2
      doc.setFont("helvetica", "normal");
      doc.text(`${reportData.length}`, 17, 28);
      
      doc.setFont("helvetica", "bold");
      doc.text("GERADO:", 70, 28); // Movido de 75 para 70
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleString("pt-BR")}`, 85, 28);
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(2, 32, 295, 32); // Linha ainda mais larga (de 2 a 295)

      // Calcular larguras inteligentes das colunas - AINDA MAIS ESPAÇO
      const columnWidths = calculateColumnWidths(columns, reportData);
      
      // Preparar dados da tabela
      const tableData = reportData.map(row => 
        columns.map(col => {
          let value = row[col] || "-";
          const maxLength = getMaxLengthForColumn(col, columnWidths[col]);
          if (typeof value === "string" && value.length > maxLength) {
            value = value.substring(0, maxLength - 3) + "...";
          }
          return value;
        })
      );

      // Criar estilos de coluna
      const columnStyles: { [key: number]: any } = {};
      columns.forEach((_, index) => {
        columnStyles[index] = { 
          cellWidth: columnWidths[columns[index]],
          overflow: 'linebreak'
        };
      });

      // Tabela - MARGENS MÍNIMAS
      autoTable(doc, {
        head: [columns.map(col => formatColumnLabel(col))],
        body: tableData,
        startY: 36,
        theme: 'striped',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: columnStyles,
        margin: { top: 36, right: 2, bottom: 20, left: 2 }, // Margens laterais mínimas de 2mm
        tableWidth: 'auto',
        didDrawPage: (data) => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;
          
          doc.setDrawColor(200, 200, 200);
          doc.line(2, pageHeight - 15, pageWidth - 2, pageHeight - 15); // Linha de rodapé máxima
          
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          
          doc.text(`Página ${data.pageNumber}`, 2, pageHeight - 8); // Movido para a extrema esquerda
          doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, pageWidth - 60, pageHeight - 8);
          
          const systemText = "Sistema de Gestão Diabetes";
          const textWidth = doc.getTextWidth(systemText);
          doc.text(systemText, (pageWidth - textWidth) / 2, pageHeight - 8);
        }
      });

      const fileName = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (e) {
      console.error("Erro ao exportar PDF:", e);
      setError("Erro ao exportar relatório em PDF");
    } finally {
      setExporting(false);
    }
  }

  // Função para calcular larguras inteligentes das colunas - MÁXIMO ESPAÇO
  function calculateColumnWidths(columns: string[], data: ReportData[]): { [key: string]: number } {
    const totalWidth = 293; // Aumentado de 287 para 293 (297 - 4 margens mínimas)
    const columnWidths: { [key: string]: number } = {};
    
    const columnTypeWidths: { [key: string]: number } = {
      imc: 15,
      peso: 18,
      altura: 18,
      duracao: 20,
      acompanhamento: 25,
      hipertenso: 20,
      possuiComplicacoes: 25,
      status: 18,
      dataCadastro: 25,
      genero: 20,
      diabetes: 20,
      concentracao: 25,
      formaFarmaceutica: 30,
      viaAdministracao: 30,
      carboidratosPor100g: 25,
      carboidratosPorPorcao: 25,
      classificacaoNova: 35,
      nome: 35,
      nomeGenerico: 35,
      nomeComercial: 35,
      descricaoPorcao: 30,
      email: 40,
      descricao: 45,
      descricaoComplicacoes: 45,
      medicamentos: 50,
      palavrasChave: 40,
      instrucoes: 45
    };
    
    let usedWidth = 0;
    let undefinedColumns: string[] = [];
    
    columns.forEach(col => {
      if (columnTypeWidths[col]) {
        columnWidths[col] = columnTypeWidths[col];
        usedWidth += columnTypeWidths[col];
      } else {
        undefinedColumns.push(col);
      }
    });
    
    const remainingWidth = totalWidth - usedWidth;
    const widthPerUndefined = undefinedColumns.length > 0 ? remainingWidth / undefinedColumns.length : 0;
    
    undefinedColumns.forEach(col => {
      columnWidths[col] = Math.max(20, widthPerUndefined);
    });
    
    return columnWidths;
  }

  return (
    <div className="panel">
      <div className="reports-title">
        <div className="panel-title">
          <FileText size={18} /> Relatórios do Sistema
        </div>
      </div>

      {/* Seção de Filtros */}
      <div className="filters-section">
        <h3><Filter size={16} /> Filtros</h3>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label className="label">
              Tipo de relatório <span style={{ color: "red" }}>*</span>
            </label>
            <select
              className="input-base"
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
            >
              <option value="">Selecione o tipo de relatório</option>
              {REPORT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="label">
              Data inicial <span style={{ color: "red" }}>*</span>
            </label>
            <input
              className="input-base"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="filter-group">
            <label className="label">
              Data final <span style={{ color: "red" }}>*</span>
            </label>
            <input
              className="input-base"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="filters-actions">
          <button
            className="btn-primary"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? <RefreshCw size={16} className="spinning" /> : <Filter size={16} />}
            {loading ? "Gerando..." : "Gerar Relatório"}
          </button>
          
          <button
            className="btn-outline"
            onClick={clearFilters}
          >
            <X size={16} />
            Limpar Filtros
          </button>
        </div>

        {error && (
          <div className="alert-error">{error}</div>
        )}
      </div>

      {/* Seção de Resultados */}
      {showResults && (
        <div className="results-section">
          <div className="results-header">
            <h3>Resultados</h3>
            <div className="results-actions">
              <div className="pagination-controls">
                <label>Registros por página:</label>
                <select
                  value={recordsPerPage}
                  onChange={e => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {RECORDS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              {reportData.length > 0 && (
                <div className="export-buttons">
                  <button
                    className="btn-success"
                    onClick={exportToCSV}
                    disabled={exporting}
                  >
                    {exporting ? <RefreshCw size={16} className="spinning" /> : <Download size={16} />}
                    Exportar CSV
                  </button>
                  
                  <button
                    className="btn-pdf"
                    onClick={exportToPDF}
                    disabled={exporting}
                  >
                    {exporting ? <RefreshCw size={16} className="spinning" /> : <FileDown size={16} />}
                    Exportar PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {reportData.length === 0 ? (
            <div className="empty-results">
              Nenhum registro encontrado para os critérios selecionados.
            </div>
          ) : (
            <>
              <div className="results-info">
                Total de registros: <strong>{reportData.length}</strong>
              </div>

              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      {getTableColumns().map(column => (
                        <th key={column}>{formatColumnLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedData().map((row, index) => (
                      <tr key={index}>
                        {getTableColumns().map(column => (
                          <td key={column}>{row[column] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {getTotalPages() > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  
                  <span className="pagination-info">
                    Página {currentPage} de {getTotalPages()}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                    disabled={currentPage === getTotalPages()}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
