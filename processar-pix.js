// netlify/functions/processar-pix.js
// Função serverless para processar Pix via Asaas
// Variável de ambiente necessária: ASAAS_KEY

const ASAAS_URL = process.env.ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

const ASAAS_KEY = process.env.ASAAS_KEY;

// Inicializa Firebase Admin via REST (sem SDK pesado)
const FIREBASE_PROJECT = 'zentry-app-74275';
const FIREBASE_KEY     = process.env.FIREBASE_SERVICE_KEY; // JSON da service account

exports.handler = async (event) => {

  // ── CORS ──
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ erro: 'Método não permitido' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { valor, nomeDestino, chavePix, uidRemetente, descricao } = body;

    // ── VALIDAÇÕES ──
    if (!valor || valor <= 0)   throw new Error('Valor inválido');
    if (!chavePix)              throw new Error('Chave Pix não informada');
    if (!uidRemetente)          throw new Error('Usuário não identificado');
    if (!ASAAS_KEY)             throw new Error('API Key não configurada');

    // ── 1. BUSCA CLIENTE NO ASAAS (ou cria se não existir) ──
    // TODO: implementar busca/criação de customer no Asaas
    // Por enquanto usa um customer_id fixo de teste
    const customerId = process.env.ASAAS_CUSTOMER_ID || 'cus_sandbox_test';

    // ── 2. CRIA TRANSFERÊNCIA PIX NO ASAAS ──
    const transferBody = {
      value:           valor,
      pixAddressKey:   chavePix,
      pixAddressKeyType: detectarTipoChave(chavePix),
      description:     descricao || `Pix Zentry para ${nomeDestino || chavePix}`,
      scheduleDate:    new Date().toISOString().split('T')[0]
    };

    const asaasResp = await fetch(`${ASAAS_URL}/transfers`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_KEY
      },
      body: JSON.stringify(transferBody)
    });

    const asaasData = await asaasResp.json();

    if (!asaasResp.ok) {
      console.error('Erro Asaas:', asaasData);
      throw new Error(asaasData?.errors?.[0]?.description || 'Erro ao processar no Asaas');
    }

    // ── 3. RETORNA SUCESSO (o app atualiza o Firestore) ──
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sucesso:      true,
        transacaoId:  asaasData.id,
        status:       asaasData.status,
        valor,
        mensagem:     'Pix processado com sucesso'
      })
    };

  } catch (err) {
    console.error('Erro na function processar-pix:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ sucesso: false, erro: err.message })
    };
  }
};

// Detecta tipo da chave Pix
function detectarTipoChave(chave) {
  if (!chave) return 'EVP';
  if (chave.includes('@'))                    return 'EMAIL';
  const digits = chave.replace(/\D/g, '');
  if (digits.length === 11 && digits[2]==='9') return 'PHONE';
  if (digits.length === 11)                    return 'CPF';
  if (digits.length === 14)                    return 'CNPJ';
  if (chave.length === 36)                     return 'EVP'; // UUID aleatória
  return 'EVP';
        }
