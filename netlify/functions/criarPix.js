export async function handler(event) {
  const { valor } = JSON.parse(event.body);

  const response = await fetch("https://api.gerencianet.com.br/v2/cob", {
    method: "POST",
    headers: {
      Authorization: "Bearer SEU_TOKEN_AQUI",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      calendario: { expiracao: 300 },
      valor: { original: (valor / 100).toFixed(2) },
      chave: "SUA_CHAVE_PIX"
    })
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify({
      qr: data.pixCopiaECola,
      txid: data.txid
    })
  };
}
