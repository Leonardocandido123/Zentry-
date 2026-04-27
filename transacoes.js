import { db } from "./zentry-core.js";
import { collection, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function criarTransacao({
  uid,
  tipo,
  valor,
  descricao,
  nomeDestino,
  nomeRemetente,
  chavePix
}) {

  const txId = "ZNT" + Date.now();

  const dados = {
    id: txId,
    tipo,
    valor,
    descricao,
    nomeDestino: nomeDestino || null,
    nomeRemetente: nomeRemetente || "Minha Conta",
    chavePix: chavePix || null,
    status: "concluido",
    criadoEm: serverTimestamp()
  };

  await addDoc(
    collection(db, "usuarios", uid, "transacoes"),
    dados
  );

  // 🔥 vai pro comprovante com ID
  window.location.href = "comprovante.html?id=" + txId;
}
