export async function handler(event) {
  const txid = event.queryStringParameters.txid;

  const response = await fetch(`https://api.gerencianet.com.br/v2/cob/${txid}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer SEU_TOKEN_AQUI"
    }
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify({
      pago: data.status === "CONCLUIDA"
    })
  };
}
