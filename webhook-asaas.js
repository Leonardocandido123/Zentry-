// netlify/functions/webhook-asaas.js
// Recebe notificações do Asaas quando pagamento é confirmado
// Configure no painel Asaas: https://warm-tapioca-c1b6a9.netlify.app/.netlify/functions/webhook-asaas

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { event: tipo, payment } = payload;

    console.log('Webhook Asaas recebido:', tipo, payment?.id);

    // ── TIPOS DE EVENTO ──
    switch (tipo) {

      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        // Pagamento confirmado — atualizar Firestore
        console.log('Pagamento confirmado:', payment.id, 'Valor:', payment.value);
        // TODO: atualizar saldo no Firestore via Admin SDK
        break;

      case 'TRANSFER_CREATED':
        console.log('Transferência criada:', payment.id);
        break;

      case 'TRANSFER_DONE':
        console.log('Transferência concluída:', payment.id);
        break;

      case 'TRANSFER_FAILED':
        console.log('Transferência falhou:', payment.id);
        // TODO: estornar saldo no Firestore
        break;

      case 'PAYMENT_OVERDUE':
        console.log('Pagamento vencido:', payment.id);
        break;

      default:
        console.log('Evento não tratado:', tipo);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recebido: true })
    };

  } catch (err) {
    console.error('Erro no webhook:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ erro: err.message })
    };
  }
};
