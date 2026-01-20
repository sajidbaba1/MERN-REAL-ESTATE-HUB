import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class RagService {
    constructor() {
        this.geminiApiKey = process.env.GEMINI_API_KEY;
        this.pineconeApiKey = process.env.PINECONE_API_KEY;
        this.pineconeHost = process.env.PINECONE_HOST;
        this.pineconeIndex = process.env.PINECONE_INDEX || 'reals';
    }

    async ingestBusinessFacts(facts) {
        const texts = this.toBusinessTexts(facts);
        if (texts.length === 0) {
            return { upserts: 0 };
        }
        const vectors = await this.embedTexts(texts);
        await this.upsertPinecone(texts, vectors);
        return { upserts: texts.length };
    }

    async query(question) {
        const vectors = await this.embedTexts([question]);
        const qVec = vectors[0];
        const matches = await this.queryPinecone(qVec, 8);

        const context = matches
            .map(m => m.metadata?.text || '')
            .filter(t => t !== '')
            .join('\n');

        const prompt = `You are a polite and precise business analytics assistant for a real estate platform.

Context (facts, logs):
${context}

User question: ${question}

Answer succinctly with numbers and dates when available. If uncertain, say so and suggest what data would help.`;

        const answer = await this.generateAnswer(prompt);

        return {
            answer,
            matches
        };
    }

    toBusinessTexts(payload) {
        const out = [];

        const properties = payload.properties || [];
        for (const p of properties) {
            out.push(`PROPERTY | id=${p.id} | title=${p.title} | city=${p.city} | state=${p.state} | price=${p.price} | status=${p.status}`);
        }

        const inquiries = payload.inquiries || [];
        for (const q of inquiries) {
            out.push(`INQUIRY | id=${q.id} | propertyId=${q.propertyId} | clientId=${q.clientId} | ownerId=${q.ownerId} | status=${q.status} | offered=${q.offeredPrice} | agreed=${q.agreedPrice} | createdAt=${q.createdAt} | updatedAt=${q.updatedAt}`);
        }

        const messages = payload.messages || [];
        for (const m of messages) {
            let content = m.content || '';
            if (content.length > 400) content = content.substring(0, 400);
            out.push(`MESSAGE | id=${m.id} | inquiryId=${m.inquiryId} | senderId=${m.senderId} | type=${m.messageType} | amount=${m.priceAmount} | sentAt=${m.sentAt} | content=${content}`);
        }

        return out;
    }

    async embedTexts(texts) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.geminiApiKey}`;
        const vectors = [];
        const batchSize = 64;

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const body = {
                content: {
                    parts: [{ text: batch.join('\n---\n') }]
                }
            };

            const response = await axios.post(url, body);
            const data = response.data;

            if (data.embedding) {
                vectors.push(data.embedding.values);
            } else if (data.embeddings) {
                for (const emb of data.embeddings) {
                    vectors.push(emb.values);
                }
            }
        }
        return vectors;
    }

    async upsertPinecone(texts, vectors) {
        if (!this.pineconeHost) throw new Error('Missing Pinecone host');

        const url = `${this.pineconeHost.replace(/\/+$/, '')}/vectors/upsert`;
        const vecs = texts.map((text, i) => ({
            id: `biz-${Date.now()}-${i}`,
            values: vectors[i],
            metadata: { text }
        }));

        await axios.post(url, { vectors: vecs }, {
            headers: { 'Api-Key': this.pineconeApiKey }
        });
    }

    async queryPinecone(vector, topK) {
        if (!this.pineconeHost) return [];

        const url = `${this.pineconeHost.replace(/\/+$/, '')}/query`;
        const body = {
            vector,
            topK,
            includeMetadata: true
        };

        const response = await axios.post(url, body, {
            headers: { 'Api-Key': this.pineconeApiKey }
        });

        return response.data.matches || [];
    }

    async generateAnswer(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`;
        const body = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        try {
            const response = await axios.post(url, body);
            return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer.';
        } catch (error) {
            console.error('Gemini generate failed:', error.message);
            return 'No answer.';
        }
    }
}

export default new RagService();
