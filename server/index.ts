import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const prisma = new PrismaClient();

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
const pcIndex = process.env.PINECONE_INDEX || '';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Simple embed stub using Gemini embedding-001; you can switch to text-embedding-004 if available
async function embed(texts: string[]): Promise<number[][]> {
  const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
  const results = await Promise.all(
    texts.map(async (t) => {
      const r = await embeddingModel.embedContent(t);
      return r.embedding.values as number[];
    })
  );
  return results;
}

app.post('/api/ingest', async (req, res) => {
  try {
    const schema = z.object({
      documents: z.array(z.object({ id: z.string(), text: z.string().min(1) }))
    });
    const { documents } = schema.parse(req.body);

    const vectors = await embed(documents.map((d) => d.text));
    const index = pinecone.index(pcIndex);
    await index.upsert(
      documents.map((d, i) => ({ id: d.id, values: vectors[i], metadata: { text: d.text } }))
    );

    res.json({ ok: true, upserted: documents.length });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Ingest failed' });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const schema = z.object({ query: z.string().min(1), topK: z.number().min(1).max(8).default(4) });
    const { query, topK } = schema.parse(req.body);

    const [qvec] = await embed([query]);
    const index = pinecone.index(pcIndex);
    const search = await index.query({ vector: qvec, topK, includeMetadata: true });
    const contexts = (search.matches || [])
      .map((m: any) => (m?.metadata?.text as string) || '')
      .filter(Boolean)
      .slice(0, topK);

    const prompt = `You are a warehouse assistant. Use the context to answer.
Context:\n${contexts.join('\n---\n')}\n\nQuestion: ${query}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ answer: text, contexts });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Query failed' });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


