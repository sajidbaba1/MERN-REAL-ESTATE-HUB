import ragService from '../services/ragService.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class RagController {
    async ingest(req, res) {
        try {
            // In Node.js, we can just call the internal analytics controller logic or 
            // fetch via local URL. We'll simulate the fetch for consistency.
            const response = await axios.get(`http://localhost:${process.env.PORT || 8889}/api/analytics/export/business-data`, {
                headers: { Authorization: req.headers.authorization }
            });
            const facts = response.data;
            const result = await ragService.ingestBusinessFacts(facts);
            res.json(result);
        } catch (error) {
            console.error('RAG ingest failed:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    async query(req, res) {
        try {
            const question = req.body.question || '';
            const result = await ragService.query(question);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new RagController();
