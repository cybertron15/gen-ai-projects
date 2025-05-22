import { Queue } from "bullmq";

const queue = new Queue("files",
    {
        connection: {
            host: 'localhost',
            port: 6379
        } 
    });

const add = async (data: any) => { 
    await queue.add("addFile", data);
}
 
const data = {  
    url: 'https://70bhefogc7jezmwv.public.blob.vercel-storage.com/16_05_2025_sample-local-pdf.pdf',
    name: 'Palash Dhavle Resume 2025.pdf',
    date: '13/05/2025',
    id: Math.floor(Math.random() * 1000000), 
}  
add(data); 
