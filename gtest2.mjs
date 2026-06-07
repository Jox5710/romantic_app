import { GoogleGenerativeAI } from '@google/generative-ai';
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const generationConfig = { temperature: 0.6, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } };
const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash-lite', generationConfig });
const r = await model.generateContent('Rewrite gentler, output only the rewrite: you never listen to me');
console.log('lite ->', r.response.text().trim().slice(0,70));
