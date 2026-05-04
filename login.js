const bcrypt = require("bcryptjs");

exports.handler = async (event) => {
  const { email, senha } = JSON.parse(event.body);

  // busca usuário no banco
  const usuario = /* buscar no Firestore */;

  if (!usuario) {
    return { statusCode: 401, body: "Usuário não encontrado" };
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    return { statusCode: 401, body: "Senha inválida" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, id: usuario.id })
  };
};
