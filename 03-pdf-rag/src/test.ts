import dotenv from 'dotenv';
dotenv.config();
console.log('Working dir:', process.cwd());
console.log('env keys:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('QDRANT')));
console.log('qudrant', process.env.QDRANT_URL);
console.log('openai key', process.env.OPENAI_API_KEY);   