import { GoogleGenerativeAI } from '@google/generative-ai';
const key = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(key);

async function tryConfig(label, cfg) {
  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: cfg });
    const r = await model.generateContent('Rewrite gentler, output only the rewrite: you never listen to me');
    let txt = '';
    try { txt = r.response.text(); } catch (e) { txt = '[.text() threw: ' + e.message + ']'; }
    console.log(`${label}: OK len=${txt.length} :: ${txt.slice(0,60)}`);
  } catch (e) {
    console.log(`${label}: THREW :: ${e.message.slice(0,200)}`);
  }
}

await tryConfig('A no-thinking-512', { temperature: 0.6, maxOutputTokens: 512 });
await tryConfig('B thinkingBudget0-1024', { temperature: 0.6, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } });
await tryConfig('C 1024-no-thinking', { temperature: 0.6, maxOutputTokens: 1024 });
