import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";

// --- Utils ---
function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function maskCpf(cpf: string) {
  const d = onlyDigits(cpf).padStart(11, "0").slice(-11);
  // ***.***.***-XX (mantém só os 2 últimos)
  return `***.***.***-${d.slice(-2)}`;
}

// Hash com Web Crypto API (melhor que libs; irreversível)
// ATENÇÃO: em produção, adicione um "pepper" secreto DO LADO DO SERVIDOR.
async function sha256Hex(input: string) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Ex.: combine cpf normalizado + um salt estático do cliente (opcional) + PEPPER no servidor
const CLIENT_SALT = "v1-healthdict"; // ok expor (versão/rotina); NÃO é segredo

export async function addTestUser() {
  try {
    // Exemplo de CPF vindo com máscara
    const rawCpf = "123.456.789-10";
    const cpfDigits = onlyDigits(rawCpf);

    // Gera campos derivados (sem expor CPF):
    const cpfMasked = maskCpf(cpfDigits);
    const cpfHash = await sha256Hex(`${CLIENT_SALT}:${cpfDigits}`); 
    // ↑ Ideal: usar Cloud Function para adicionar um PEPPER secreto do servidor antes do hash.

    const userData = {
      name: "Flinstns Santos",
      email: "flinstonsantos@teste.com",
      // NÃO envie `cpf` para o banco!
      cpfMasked,          // para exibir
      cpfHash,            // para busca/unique
      diabetesType: "type2",
      diabetesDuration: "1 ano",
      gender: "masculino",
      isFollowedUp: false,
      hasChronicComplications: true,
      chronicComplicationsDescription: "Meningite, Retinopatia diabética, Neuropatia",
      isHypertensive: true,
      weight: 65,
      height: 170,
      medications: ["Metformina", "Insulina", "Alprazolam", "Ritalina"],
      role: "user",
      status: "active",
      createdAt: new Date(),
    };

    await addDoc(collection(db, "users"), userData);
    console.log("Usuário de teste adicionado com sucesso (CPF protegido)!");
  } catch (error) {
    console.error("Erro ao adicionar usuário de teste:", error);
  }
}