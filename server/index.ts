import express from 'express';
import cors from 'cors';

import dotenv from 'dotenv';
import OpenAI from 'openai';
import {
  readDataFile,
  writeDataFile,
  generateId,
  validateContract,
  Contract,
} from './utils';

dotenv.config();

const port = process.env.PORT || 8080;
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
// Initialize OpenAI
const openai = new OpenAI({
  baseURL:
    process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-Title': process.env.SITE_NAME || 'Contract Generator',
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Contract generation endpoint
app.post('/generate-contract', async (req: any, res: any) => {
  try {
    const { clientName, clientAddress, contractType } = req.body;

    if (!clientName || !clientAddress || !contractType) {
      return res.status(400).json({
        success: false,
        message:
          'Client name, address, and contract type are required',
      });
    }

    if (
      !['Employment Agreement', 'Loan', 'Service Agreement'].includes(
        contractType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract type',
      });
    }

    // Generate contract content using OpenAI
    let contractContent = '';
    try {
      const prompt = `Generate a simple 3-sentence draft contract for a ${contractType} between our company and ${clientName} at ${clientAddress}. Make it professional but simple.`;

      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
      });

      contractContent =
        completion.choices[0].message.content ||
        'Contract content could not be generated.';
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      // Fallback to mock content if OpenAI fails
      contractContent = `This is a draft ${contractType} between our company and ${clientName} located at ${clientAddress}. The terms and conditions will be finalized upon mutual agreement. This contract serves as a preliminary document for review and discussion.`;
    }
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const id = generateId();
    const readData = readDataFile();
    var existingContracts = readData.contracts || [];
    var contractToSubmit = {clientAddress,clientName,contractContent,contractType,createdAt,id,updatedAt};
    existingContracts.push(contractToSubmit);
    console.log('Existing contracts:', existingContracts);
    writeDataFile({contracts:existingContracts} );
    res.status(201).json({
      success: true,
      message: 'Contract generated successfully',
      data: { 'id': id, clientName: clientName, clientAddress: clientAddress, contractType: contractType, contractContent: contractContent ,createdAt: createdAt, updatedAt: updatedAt },
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating contract',
    });
  }
});

// GET /contracts - Get all contracts
app.get('/contracts', (req: any, res: any) => {
  try {
    const readData = readDataFile();
    const contracts = readData.contracts || [];
    
    console.log('Read data:', readData);
    res.json({
      success: true,
      data: contracts,
      count: contracts.length,
    });
  } catch (error) {
    console.error('Error reading contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while reading contracts',
    });
  }
});

// GET /contracts/:id - Get a specific contract
app.get('/contracts/:id', (req: any, res: any) => {
  try {
    const contract = readDataFile().contracts.find(
      (contract: Contract) => contract.id === req.params.id
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: req.params.id,
        name: contract.clientName,
        description: contract.contractContent,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        contractType: contract.contractType
      },
    });
  } catch (error) {
    console.error('Error reading contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while reading contract',
    });
  }
});

// PUT /contracts/:id - Update a contract
app.put('/contracts/:id', (req: any, res: any) => {
  try {
    const validation = validateContract(req.body); // moved validation here

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const contractId = req.params.id;
    const readData = readDataFile();
    const contracts = readData.contracts || [];
    const contractIndex = contracts.findIndex((c: Contract) => c.id === contractId);
    const contract = contracts[contractIndex];
    

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found',
      });
    }
    const updatedAt = new Date().toISOString();
    contracts[contractIndex] = {
      ...contracts[contractIndex],
      clientName: req.body.clientName || contracts[contractIndex].clientName,
      clientAddress: req.body.clientAddress || contracts[contractIndex].clientAddress,
      contractType: req.body.contractType || contracts[contractIndex].contractType,
      contractContent: req.body.contractContent || contracts[contractIndex].contractContent,
      updatedAt: updatedAt,
    };

    writeDataFile({ contracts });

    res.json({
      success: true,
      message: 'Contract updated successfully',
      data: {
        clientName: req.body.clientName || contracts[contractIndex].clientName,
      clientAddress: req.body.clientAddress || contracts[contractIndex].clientAddress,
      contractType: req.body.contractType || contracts[contractIndex].contractType,
      contractContent: req.body.contractContent || contracts[contractIndex].contractContent,
      updatedAt: updatedAt
    },
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating contract',
    });
  }
});

// DELETE /contracts/:id - Delete a contract
app.delete('/contracts/:id', (req: any, res: any) => {
  try {
    const contract = readDataFile().contracts.find(
      (contract: Contract) => contract.id === req.params.id
    );

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found',
      });
    }

    const contractFiltered = readDataFile().contracts.filter(
      (contract: Contract) => contract.id !== req.params.id
    );
    writeDataFile({ contracts: contractFiltered });

    console.log('Contract deleted:', contract.id);
    console.log('Remaining contracts:', contractFiltered.length);

    res.json({
      success: true,
      message: 'Contract deleted successfully',
      data: {
        id: req.params.id,
        name: contract.clientName,
        description: contract.contractContent,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        contractType: contract.contractType,
      },
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting contract',
    });
  }
});

// AI Chat endpoint for contract support and advice
app.post('/ai-chat', async (req: any, res: any) => {
  try {
    const message = req.body.message; // req.body.message;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string',
      });
    }

    // Create a focused prompt for contract-related advice only
    const systemPrompt = `You are a legal AI assistant specializing in contract law and business agreements. Your role is to provide helpful advice and information about contracts, legal terms, and business agreements.

IMPORTANT: You should ONLY respond to questions about:
- Contract law and legal concepts
- Business agreements and terms
- Contract clauses and provisions
- Legal compliance and best practices
- Contract negotiation tips
- Common contract pitfalls and how to avoid them

If someone asks about anything unrelated to contracts or legal matters, politely redirect them to ask contract-related questions. Do not provide advice on other legal areas outside of contracts.

Keep your responses professional, informative, and focused on contract-related topics.`;

    const userPrompt = `User question: ${message}

Please provide helpful contract-related advice or information. If this question is not related to contracts, politely redirect the user.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse =
        completion.choices[0].message.content ||
        'I apologize, but I was unable to generate a response. Please try asking your question again.';

      res.json({
        success: true,
        message: 'AI response generated successfully',
        data: {
          response: aiResponse,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);

      // Fallback response for contract-related questions
      const fallbackResponse = `I understand you're asking about contracts. While I'm experiencing technical difficulties with my AI service, I can tell you that I'm designed to help with contract-related questions, legal terms, business agreements, and contract best practices. Please try asking your question again in a moment, or rephrase it to be more specific about contracts.`;

      res.json({
        success: true,
        message: 'AI response generated successfully (fallback)',
        data: {
          response: fallbackResponse,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing AI chat',
    });
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
  console.log(`API endpoints:`);
  console.log(`  POST   /generate-contract - Generate new contract`);
  console.log(
    `  POST   /ai-chat - AI assistant for contract support and advice`
  );
  console.log(`  GET    /contracts - Get all contracts`);
  console.log(`  GET    /contracts/:id - Get specific contract`);
  console.log(`  PUT    /contracts/:id - Update contract`);
  console.log(`  DELETE /contracts/:id - Delete contract`);
});
