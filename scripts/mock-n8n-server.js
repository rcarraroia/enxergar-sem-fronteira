/**
 * Mock n8n Server para Testes E2E
 *
 * Simula um servidor n8n para testes automatizados
 */

const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// MOCK DATA
// ============================================================================

const sessions = new Map();
const responses = {
  greeting: [
    'Olá! Como posso ajudar você hoje?',
    'Bem-vindo! Em que posso ser útil?',
    'Oi! Estou aqui para ajudar. O que você precisa?'
  ],
  pricing: [
    'Nossos preços começam em R$ 99/mês. Gostaria de mais detalhes?',
    'Temos planos a partir de R$ 99. Posso explicar as opções disponíveis.',
    'Os valores variam de R$ 99 a R$ 299 por mês, dependendo do plano.'
  ],
  contact: [
    'Você pode nos contatar pelo telefone (11) 1234-5678 ou email contato@empresa.com',
    'Entre em contato conosco: (11) 1234-5678 ou contato@empresa.com',
    'Nossos canais de contato: telefone (11) 1234-5678 e email contato@empresa.com'
  ],
  hours: [
    'Funcionamos de segunda a sexta, das 9h às 18h.',
    'Nosso horário de atendimento é de 9h às 18h, de segunda a sexta-feira.',
    'Estamos disponíveis das 9h às 18h, nos dias úteis.'
  ],
  default: [
    'Obrigado pela sua mensagem! Como posso ajudar?',
    'Entendi. Pode me dar mais detalhes sobre o que você precisa?',
    'Interessante! Conte-me mais sobre isso.',
    'Vou ajudar você com isso. Pode me explicar melhor?'
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateResponse(message, sessionId, type) {
  const lowerMessage = message.toLowerCase();

  let responseArray = responses.default;
  let actions = [];

  // Determinar tipo de resposta baseado na mensagem
  if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('hello')) {
    responseArray = responses.greeting;
  } else if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo')) {
    responseArray = responses.pricing;
    actions.push({
      type: 'redirect',
      url: '/pricing',
      label: 'Ver planos'
    });
  } else if (lowerMessage.includes('contato') || lowerMessage.includes('telefone') || lowerMessage.includes('email')) {
    responseArray = responses.contact;
    actions.push({
      type: 'redirect',
      url: '/contact',
      label: 'Página de contato'
    });
  } else if (lowerMessage.includes('horário') || lowerMessage.includes('funcionamento') || lowerMessage.includes('atendimento')) {
    responseArray = responses.hours;
  }

  // Selecionar resposta aleatória
  const response = responseArray[Math.floor(Math.random() * responseArray.length)];

  // Simular delay de processamento
  const processingTime = Math.random() * 1000 + 500; // 500-1500ms

  // Determinar se sessão deve ser encerrada
  const sessionComplete = lowerMessage.includes('tchau') ||
                          lowerMessage.includes('obrigado') ||
                          lowerMessage.includes('bye');

  return {
    success: true,
    data: {
      response,
      sessionId,
      sessionComplete,
      actions,
      metadata: {
        sentiment: determineSentiment(message),
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        processedAt: new Date().toISOString(),
        processingTime: Math.round(processingTime),
        chatType: type
      }
    },
    error: null
  };
}

function determineSentiment(message) {
  const positiveWords = ['obrigado', 'ótimo', 'excelente', 'bom', 'legal', 'perfeito'];
  const negativeWords = ['ruim', 'péssimo', 'problema', 'erro', 'difícil', 'complicado'];

  const lowerMessage = message.toLowerCase();

  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function simulateError(probability = 0.05) {
  return Math.random() < probability;
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Public chat webhook
app.post('/webhook/public', async (req, res) => {
  const { message, sessionId, type = 'public', timestamp } = req.body;

  // Validação básica
  if (!message || !sessionId) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Mensagem e sessionId são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      }
    });
  }

  // Simular erro ocasional
  if (simulateError(0.02)) { // 2% de chance de erro
    return res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        retryable: true
      }
    });
  }

  // Simular timeout ocasional
  if (simulateError(0.01)) { // 1% de chance de timeout
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s timeout
  }

  try {
    // Armazenar sessão
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        type,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      });
    }

    const session = sessions.get(sessionId);
    session.messages.push({
      id: faker.string.uuid(),
      content: message,
      sender: 'user',
      timestamp: timestamp || new Date().toISOString()
    });
    session.lastActivity = new Date().toISOString();

    // Simular delay de processamento
    const delay = Math.random() * 800 + 200; // 200-1000ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Gerar resposta
    const response = generateResponse(message, sessionId, type);

    // Adicionar resposta à sessão
    session.messages.push({
      id: faker.string.uuid(),
      content: response.data.response,
      sender: 'agent',
      timestamp: new Date().toISOString()
    });

    res.json(response);

  } catch (error) {
    console.error('Error processing public chat:', error);
    res.status(500).json({
      success: false,
      error: {
        type: 'PROCESSING_ERROR',
        message: 'Erro ao processar mensagem',
        code: 'PROCESSING_FAILED',
        retryable: true
      }
    });
  }
});

// Admin chat webhook
app.post('/webhook/admin', async (req, res) => {
  const { message, sessionId, type = 'admin', userId, timestamp } = req.body;

  // Validação para admin
  if (!message || !sessionId || !userId) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Mensagem, sessionId e userId são obrigatórios para chat admin',
        code: 'MISSING_ADMIN_FIELDS'
      }
    });
  }

  try {
    // Processar mensagem admin (mais detalhada)
    const session = sessions.get(sessionId) || {
      id: sessionId,
      type,
      userId,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    sessions.set(sessionId, session);

    // Resposta mais técnica para admin
    const adminResponse = {
      success: true,
      data: {
        response: `[Admin] Mensagem processada: "${message}". Sessão: ${sessionId}`,
        sessionId,
        sessionComplete: false,
        actions: [
          {
            type: 'log',
            data: {
              userId,
              message,
              timestamp: new Date().toISOString()
            }
          }
        ],
        metadata: {
          adminMode: true,
          userId,
          sessionStats: {
            messageCount: session.messages.length + 1,
            duration: Date.now() - new Date(session.createdAt).getTime()
          },
          processedAt: new Date().toISOString()
        }
      },
      error: null
    };

    await new Promise(resolve => setTimeout(resolve, 300)); // Delay menor para admin

    res.json(adminResponse);

  } catch (error) {
    console.error('Error processing admin chat:', error);
    res.status(500).json({
      success: false,
      error: {
        type: 'PROCESSING_ERROR',
        message: 'Erro ao processar mensagem admin',
        code: 'ADMIN_PROCESSING_FAILED',
        retryable: true
      }
    });
  }
});

// Webhook genérico para testes
app.post('/webhook/:type', (req, res) => {
  const { type } = req.params;
  const { message, sessionId } = req.body;

  res.json({
    success: true,
    data: {
      response: `Webhook ${type} recebido: ${message}`,
      sessionId,
      sessionComplete: false,
      metadata: {
        webhookType: type,
        processedAt: new Date().toISOString()
      }
    }
  });
});

// Listar sessões (para debug)
app.get('/sessions', (req, res) => {
  const sessionList = Array.from(sessions.values()).map(session => ({
    id: session.id,
    type: session.type,
    messageCount: session.messages.length,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity
  }));

  res.json({
    sessions: sessionList,
    total: sessionList.length
  });
});

// Obter sessão específica
app.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Sessão não encontrada'
    });
  }

  res.json(session);
});

// Limpar sessões
app.delete('/sessions', (req, res) => {
  const count = sessions.size;
  sessions.clear();

  res.json({
    message: `${count} sessões removidas`,
    clearedAt: new Date().toISOString()
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      type: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      code: 'UNHANDLED_ERROR'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NOT_FOUND',
      message: `Endpoint não encontrado: ${req.method} ${req.path}`,
      code: 'ENDPOINT_NOT_FOUND'
    }
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`🚀 Mock n8n server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Public webhook: http://localhost:${PORT}/webhook/public`);
  console.log(`👨‍💼 Admin webhook: http://localhost:${PORT}/webhook/admin`);
  console.log(`📊 Sessions: http://localhost:${PORT}/sessions`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down mock n8n server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down mock n8n server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
