import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";

// Função para adicionar um usuário manualmente
export async function addTestUser() {
  try {
    // 1. Criar usuário no Authentication (opcional, se você precisar que o usuário tenha login)
    // const userCredential = await createUserWithEmailAndPassword(auth, "paciente@teste.com", "Senha123");
    // const uid = userCredential.user.uid;
    
    // 2. Adicionar documento no Firestore
    const userData = {
      name: "Maria Silva Santos", // Nome com mais de 20 caracteres
      email: "paciente@teste.com",
      cpf: "123.456.789-10", // Formato com máscara
      diabetesType: "type2", // Conforme suas opções
      diabetesDuration: "5 anos", 
      gender: "feminino",
      isFollowedUp: true,
      hasChronicComplications: false,
      chronicComplicationsDescription: "",
      isHypertensive: true,
      weight: 68,
      height: 165,
      medications: ["Metformina", "Insulina"],
      role: "user", // Importante definir como user
      status: "active",
      createdAt: new Date()
    };
    
    // Adicionar o documento à coleção "users"
    await addDoc(collection(db, "users"), userData);
    
    console.log("Usuário de teste adicionado com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar usuário de teste:", error);
  }
}