import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
        console.log('AVAILABLE MODELS:');
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${m.name} (Ver: ${m.version}, Concepts: ${m.inputTokenLimit})`);
            }
        });
    } else {
        console.log('Error listing models:', data);
    }
  } catch (e) {
    console.error('Failed:', e.message);
  }
}

listModels();
