const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SkalePay API configuration
const SKALEPAY_API_URL = process.env.SKALEPAY_API_URL;
const API_TOKEN = process.env.API_TOKEN;
const DEBTOR_NAME = process.env.DEBTOR_NAME || 'Usuário Teste';
const DEBTOR_DOCUMENT = process.env.DEBTOR_DOCUMENT || '12345678901';
const SOURCE_ACCOUNT_BRANCH = process.env.SOURCE_ACCOUNT_BRANCH || '0001';
const SOURCE_ACCOUNT_NUMBER = process.env.SOURCE_ACCOUNT_NUMBER || '12345678';

// Endpoint to generate Pix
app.post('/api/generate-pix', async (req, res) => {
  const { amount } = req.body;

  // Validate amount
  if (!amount || amount < 15 || amount > 500) {
    return res.status(400).json({ error: 'O valor deve estar entre 15 e 500 BRL' });
  }

  // Validate required environment variables
  if (!SKALEPAY_API_URL || !API_TOKEN) {
    console.error('Variáveis de ambiente ausentes:', { SKALEPAY_API_URL, API_TOKEN });
    return res.status(500).json({ error: 'Configuração da API SkalePay incompleta' });
  }

  try {
    const pixData = {
      amount: amount.toFixed(2), // Garantir 2 casas decimais
      debtor_name: DEBTOR_NAME,
      debtor_document: DEBTOR_DOCUMENT,
      type_document: 'CPF',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      expiration_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 dias
      type_fine: 'NONE',
      fine: 0,
      fine_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      source_account_branch_identifier: SOURCE_ACCOUNT_BRANCH,
      source_account_number: SOURCE_ACCOUNT_NUMBER
    };

    console.log('Enviando requisição para SkalePay:', { url: SKALEPAY_API_URL, pixData });

    const response = await axios.post(SKALEPAY_API_URL, pixData, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json' // Adicionado conforme documentação
      }
    });

    console.log('Resposta da SkalePay:', response.data);

    res.json({
      pix_copy_and_paste: response.data.pix_copy_and_paste,
      qr_code_base64: response.data.base_64_image,
      qr_code_id: response.data.qr_code_id,
      status: response.data.status
    });
  } catch (error) {
    console.error('Erro ao gerar Pix:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falha ao gerar Pix: ' + (error.response?.data?.message || error.message) });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
