import { Worker } from 'bullmq';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
const worker = new Worker('files', async job => {
    console.log("heyyyy");

    if (job.name === 'addFile') {
        console.log('file added', job.data);
        // read the pdf
        const data = JSON.parse(job.data);
        const fileUrl = data.url;
        console.log('fileUrl', fileUrl);
        
        // Fetch the PDF file and convert to Blob
        const response = await fetch(fileUrl);
        console.log('response',response);
        
        const blob = await response.blob();
        console.log('blobb',blob);
        
        const loader = new PDFLoader(blob);
        const docs = await loader.load();
        console.log('doc',docs);


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