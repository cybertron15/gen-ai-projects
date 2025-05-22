import dotenv from 'dotenv';
dotenv.config()
import { Worker } from 'bullmq';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter, RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { getVectorStore } from './lib/vectorDB';

// Throttling config (e.g., 1 request per 2 seconds)
const MIN_TIME_BETWEEN_REQUESTS_MS = 2000;
let lastFetchTime = 0;

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 2000;

const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<Response> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch: ${url}`);
            const response = await throttledFetch(url);

            if (response.ok) {
                return response;
            }

            console.warn(`Fetch failed (attempt ${attempt}): ${response.status} ${response.statusText}`);
        } catch (err) {
            console.warn(`Fetch error (attempt ${attempt}):`, err);
        }

        if (attempt < retries) {
            console.log(`Retrying in ${RETRY_INTERVAL_MS}ms...`);
            await new Promise(res => setTimeout(res, RETRY_INTERVAL_MS));
        }
    }

    throw new Error(`Failed to fetch ${url} after ${retries} attempts.`);
};


const throttledFetch = async (url: string): Promise<Response> => {
    const now = Date.now();
    const timeSinceLast = now - lastFetchTime;

    if (timeSinceLast < MIN_TIME_BETWEEN_REQUESTS_MS) {
        const waitTime = MIN_TIME_BETWEEN_REQUESTS_MS - timeSinceLast;
        console.log(`Throttling: Waiting ${waitTime}ms before fetching`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastFetchTime = Date.now();
    return fetch(url);
};

const worker = new Worker('files', async job => {
    console.log('Job received:', job.name);

    if (job.name !== 'addFile') {
        console.warn('Unexpected job name:', job.name);
        return;
    }

    try {
        console.log('Processing addFile job. Data:', job.data);

        const fileUrl = job.data.url;
        if (!fileUrl || typeof fileUrl !== 'string') {
            throw new Error('Invalid or missing fileUrl in job data');
        }

        console.log('Fetching PDF from:', fileUrl);

        const response = await fetchWithRetry(fileUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch PDF. Status: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('Fetched blob of size:', blob.size);

        try {
            const loader = new PDFLoader(blob);
            let docs = await loader.load();
            console.log('Loaded PDF and extracted docs:', docs.length);
            
            // adding source as the URL of the file
            docs = docs.map(doc => ({
                ...doc,
                metadata: {
                    ...doc.metadata,
                    source: fileUrl,
                },
            }));
            
            console.log('docs', docs);

            // - Splitting the document into chunks (loader.load() already does this but Im doing it again to show how to do it)
            // const textSplitter = await new CharacterTextSplitter({ chunkSize: 30, chunkOverlap: 0 });

            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 100,
                chunkOverlap: 0,
            });

            const chunks = await textSplitter.splitDocuments(docs)

            console.log('Split into chunks:', chunks.length);
            console.log(chunks);

            // - Storing in Qdrant DB
            const vectorStore = await getVectorStore()

            console.log('embedded chunks');
            await vectorStore.addDocuments(chunks);
            console.log('embedded and stored chunks');
        }

        catch (err) {
            console.error('Error loading PDF:', err);
        }




    } catch (err) {
        console.error('Error processing job:', err);
    }
}, {
    concurrency: 100, // Keep high for processing logic, but we’ll throttle fetch manually
    connection: {
        host: 'localhost',
        port: 6379
    }
});
