import { Worker } from 'bullmq';

const worker = new Worker('files', async job => {
    if (job.name === 'addFile') {
        console.log('file added', job.data);
        // read the pdf
        // chunk the pdf
        // call openai embeddings for each chunk
        // store the chunk in quadrant db
    }
}, {
    concurrency: 100,
    connection:
    {
        host: 'localhost',
        port: 6379
    }
});