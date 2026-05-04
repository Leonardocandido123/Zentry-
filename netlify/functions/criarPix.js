// netlify/functions/criarPix.js

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    const { valor, uid } = JSON.parse(event.body);

    // 🔒 VALIDAÇÕES
    if (!valor || valor <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Valor inválido" })
      };
    }

    if (!uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Usuário não identificado" })
      };
    }

    // 🔎 CONFERE SE USUÁRIO EXISTE
    const userRef = db.collection("usuarios").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ erro: "Usuário não encontrado" })
      };
    }

    // 🔥 CRIA COBRANÇA NO PSP (Gerencianet)
    const response = await fetch("https://api.gerencianet.com.br/v2/cob", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GN_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        calendario: { expiracao: 300 },
        valor: { original: (valor / 100).toFixed(2) },
        chave: process.env.CHAVE_PIX,

        // 🔑 ESSENCIAL PRA SABER QUEM PAGOU
        infoAdicionais: [
          {
            nome: "userId",
            valor: uid
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.txid) {
      throw new Error("Erro ao criar cobrança Pix");
    }

    // 💾 SALVA COBRANÇA NO FIRESTORE
    await db.collection("cobrancas").doc(data.txid).set({
      uid,
      valor,
      status: "pendente",
      txid: data.txid,
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        qr: data.pixCopiaECola,
        txid: data.txid
      })
    };

  } catch (err) {
    console.error("Erro criarPix:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ erro: err.message })
    };
  }
};
