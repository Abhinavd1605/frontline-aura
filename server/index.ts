import 'dotenv/config';
import { env } from './env';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
const upload = multer({ limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 } });

const prisma = new PrismaClient();

const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY || '' });
const pcIndex = env.PINECONE_INDEX || '';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Ensure TTS friendly output: remove emojis/symbols commonly read aloud
const sanitizeText = (input: string): string => {
  return input
    // remove emojis and pictographs (broad surrogate range)
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/[\u2600-\u26FF]/g, '')
    // remove common markdown bullets and symbols
    .replace(/[•*#>_`~|$%^<>\[\]{}@+=]/g, '')
    // collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    .trim();
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Simple embed stub using Gemini embedding-001; you can switch to text-embedding-004 if available
async function embed(texts: string[]): Promise<number[][]> {
  // Choose an embedding model that matches the Pinecone index dimension
  // Pinecone index is configured with env.PINECONE_DIM (default 1024)
  // Use a 1024-dim model to satisfy: llama-text-embed-v2 (1024)
  const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const results = await Promise.all(
    texts.map(async (t) => {
      const r = await embeddingModel.embedContent(t);
      const v = r.embedding.values as number[];
      // If the target index expects 1024 and we received 768 (older models), pad to 1024
      if (env.PINECONE_DIM && v.length !== env.PINECONE_DIM) {
        const dim = env.PINECONE_DIM;
        const out = new Array(dim).fill(0);
        for (let i = 0; i < Math.min(v.length, dim); i++) out[i] = v[i];
        return out;
      }
      return v;
    })
  );
  return results;
}

// Split long text into overlapping chunks to respect embedding payload limits
function chunkText(text: string, chunkSize = 6000, overlap = 400): string[] {
  const chunks: string[] = [];
  let i = 0;
  const len = text.length;
  if (len <= chunkSize) return [text];
  while (i < len) {
    const end = Math.min(i + chunkSize, len);
    const chunk = text.slice(i, end);
    chunks.push(chunk);
    if (end >= len) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
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

// Upload and ingest files (PDF or text) into Pinecone
app.post('/api/ingest/upload', upload.array('files', 8), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const machineId = typeof req.query.machineId === 'string' ? req.query.machineId : undefined;
    const docs: { id: string; text: string }[] = [];
    for (const f of files) {
      if (f.mimetype === 'application/pdf') {
        // Lazy-load legacy pdfjs ESM build for Node
        const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const getDocument = (pdfjs as any).getDocument || (pdfjs as any).default?.getDocument;
        if (!getDocument) throw new Error('pdfjs getDocument not available');
        const data = new Uint8Array(f.buffer); // ensure standard typed array
        const loadingTask = getDocument({ data, disableWorker: true });
        const doc = await loadingTask.promise;
        let text = '';
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const pageText = (content.items || [])
            .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
            .join(' ');
          text += pageText + '\n';
        }
        if (text.trim()) docs.push({ id: `${f.originalname}-${Date.now()}`, text });
      } else if (f.mimetype.startsWith('text/')) {
        const text = f.buffer.toString('utf-8');
        if (text.trim()) docs.push({ id: `${f.originalname}-${Date.now()}`, text });
      }
    }
    if (docs.length === 0) return res.status(400).json({ error: 'Unsupported or empty files' });

    // Chunk each doc, embed and upsert
    const index = pinecone.index(pcIndex);
    for (const d of docs) {
      const chunks = chunkText(d.text);
      const vectors = await embed(chunks);
      const toUpsert = vectors.map((vec, i) => ({
        id: `${d.id}#${i}`,
        values: vec,
        metadata: { text: chunks[i], source: 'upload', machineId: machineId ?? '' }
      }));
      await index.upsert(toUpsert);
    }
    res.json({ ok: true, upserted: docs.length });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Upload ingest failed' });
  }
});

// Text-to-Speech endpoint supporting Piper (local) and Azure Speech (cloud)
app.post('/api/tts', async (req, res) => {
  try {
    const schema = z.object({ text: z.string().min(1) });
    const { text } = schema.parse(req.body);

    const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(env.DEEPGRAM_MODEL)}&encoding=${env.DEEPGRAM_ENCODING}`;
    const dg = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    if (!dg.ok) throw new Error(`Deepgram TTS error ${dg.status}`);
    const ct = env.DEEPGRAM_ENCODING === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    res.setHeader('Content-Type', ct);
    const buf = Buffer.from(await dg.arrayBuffer());
    res.send(buf);
    return;
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'TTS failed' });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const schema = z.object({
      query: z.string().min(1),
      topK: z.number().min(1).max(8).default(4),
      machine: z.string().optional(),
      machineId: z.string().optional()
    });
    const { query, topK, machine, machineId } = schema.parse(req.body);

    let contexts: string[] = [];
    try {
      const [qvec] = await embed([query]);
      const index = pinecone.index(pcIndex);
      const filter = machineId ? { machineId: { $eq: machineId } } : undefined as any;
      const search = await index.query({ vector: qvec, topK, includeMetadata: true, filter });
      contexts = (search.matches || [])
        .map((m: any) => (m?.metadata?.text as string) || '')
        .filter(Boolean)
        .slice(0, topK);
    } catch (e) {
      // Pinecone unavailable or index not found → fall back to LLM-only
      contexts = [];
    }

    // If a machine is specified, only use contexts that reference it
    let usedContexts = contexts;
    if (machine) {
      const lower = machine.toLowerCase();
      const machineContexts = contexts.filter((c) => c.toLowerCase().includes(lower));
      if (machineContexts.length > 0) {
        usedContexts = machineContexts;
      } else {
        usedContexts = [];
      }
    }

    let prompt: string;
    if (usedContexts.length > 0) {
      prompt = `You are a warehouse assistant.
First summarize in one or two sentences.
Then provide short, precise steps. Avoid emojis and symbols.
Context:
${usedContexts.join('\n---\n')}

Question: ${query}`;
    } else {
      // No relevant context → LLM-only fallback
      prompt = `You are a warehouse assistant.
There is no retrieved documentation for this question${machine ? ` about the machine ${machine}` : ''}.
Provide a short, precise answer. Avoid emojis and symbols.
If you are not certain, say what additional information is needed.
Question: ${query}`;
    }

    const result = await model.generateContent(prompt);
    const text = sanitizeText(result.response.text());

    res.json({ answer: text, contexts: usedContexts });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Query failed' });
  }
});

// Streaming version: NDJSON lines with { delta } and initial { contexts }
app.post('/api/query/stream', async (req, res) => {
  try {
    const schema = z.object({
      query: z.string().min(1),
      topK: z.number().min(1).max(8).default(4),
      machine: z.string().optional()
    });
    const { query, topK, machine } = schema.parse(req.body);

    // Pinecone with timeout guard
    const withTimeout = async <T,>(p: Promise<T>, ms = 1200): Promise<T | null> => {
      return await Promise.race<T | null>([
        p.catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
      ]);
    };

    let contexts: string[] = [];
    const pineconeTry = withTimeout((async () => {
      const [qvec] = await embed([query]);
      const index = pinecone.index(pcIndex);
      const search = await index.query({ vector: qvec, topK, includeMetadata: true });
      return (search.matches || [])
        .map((m: any) => (m?.metadata?.text as string) || '')
        .filter(Boolean)
        .slice(0, topK);
    })());
    const maybe = await pineconeTry;
    if (maybe) contexts = maybe;

    let usedContexts = contexts;
    if (machine) {
      const lower = machine.toLowerCase();
      const machineContexts = contexts.filter((c) => c.toLowerCase().includes(lower));
      usedContexts = machineContexts.length > 0 ? machineContexts : [];
    }

    let prompt: string;
    if (usedContexts.length > 0) {
      prompt = `You are a warehouse assistant.
Provide a structured response with no emojis and no symbols.
Use short sentences and bullet-like lines without symbols.
Sections to include when relevant: Summary, Steps, Safety, Next Actions.
Context:
${usedContexts.join('\n---\n')}

Question: ${query}`;
    } else {
      prompt = `You are a warehouse assistant.
There is no retrieved documentation for this question${machine ? ` about the machine ${machine}` : ''}.
Provide a structured response with no emojis and no symbols.
Use short sentences and bullet-like lines without symbols.
Sections to include when relevant: Summary, Steps, Safety, Next Actions.
If you are not certain, say what additional information is needed.
Question: ${query}`;
    }

    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // initial contexts line
    res.write(JSON.stringify({ contexts: usedContexts }) + "\n");

    const streamResult: any = await (model as any).generateContentStream?.(prompt);
    if (!streamResult || !streamResult.stream) {
      // Fallback to non-streaming
      const result = await model.generateContent(prompt);
      const text = sanitizeText(result.response.text());
      res.write(JSON.stringify({ delta: text }) + "\n");
      return res.end();
    }
    for await (const chunk of streamResult.stream) {
      const chunkText = typeof chunk.text === 'function' ? sanitizeText(chunk.text()) : '';
      if (chunkText) res.write(JSON.stringify({ delta: chunkText }) + "\n");
    }
    res.end();
  } catch (err: any) {
    console.error(err);
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
    res.status(400).end(JSON.stringify({ error: err.message || 'Query stream failed' }));
  }
});

// Simple Prisma-backed logs for connectivity test
app.post('/api/log', async (req, res) => {
  try {
    const schema = z.object({ machineId: z.string(), event: z.string(), details: z.string().optional() });
    const { machineId, event, details } = schema.parse(req.body);
    const log = await prisma.machineLog.create({ data: { machineId, event, details } });
    res.json(log);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Log failed' });
  }
});

app.get('/api/logs', async (_req, res) => {
  try {
    const logs = await prisma.machineLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(logs);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Fetch logs failed' });
  }
});

// Machines CRUD
app.get('/api/machines', async (_req, res) => {
  try {
    const items = await prisma.machine.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(items);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to fetch machines' });
  }
});

app.post('/api/machines', async (req, res) => {
  try {
    const schema = z.object({ name: z.string().min(1), posX: z.number(), posY: z.number(), posZ: z.number() });
    const data = schema.parse(req.body);
    const created = await prisma.machine.create({ data });
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create machine' });
  }
});

app.put('/api/machines/:id', async (req, res) => {
  try {
    const schema = z.object({ name: z.string().min(1), posX: z.number(), posY: z.number(), posZ: z.number() });
    const data = schema.parse(req.body);
    const updated = await prisma.machine.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update machine' });
  }
});

app.delete('/api/machines/:id', async (req, res) => {
  try {
    await prisma.machine.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete machine' });
  }
});

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


