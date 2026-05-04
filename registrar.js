const bcrypt = require("bcryptjs");
const { db } = require("./firebase");

exports.handler = async (event) => {
  try {
    const { email, senha, nome, cpf, tel } = JSON.parse(event.body || "{}");

    const emailNormalizado = email?.toLowerCase().trim();

    if (!emailNormalizado || !senha || !nome || !cpf || !tel) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "dados-incompletos" })
      };
    }

    if (senha.length !== 6) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "senha-invalida" })
      };
    }

    const snapshot = await db
      .collection("usuarios")
      .where("email", "==", emailNormalizado)
      .get();

    if (!snapshot.empty) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "usuario-ja-existe" })
      };
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await db.collection("usuarios").add({
      nome,
      email: emailNormalizado,
      cpf,
      tel,
      senha: senhaHash,
      saldo: 0,
      status_verificacao: "pendente",
      criadoEm: new Date()
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        id: novoUsuario.id
      })
    };

  } catch (err) {
    console.error("Erro registrar:", err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "erro-interno" })
    };
  }
};
