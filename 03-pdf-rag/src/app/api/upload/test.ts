import { Queue } from "bullmq";

const queue = new Queue("files",
    {
        connection: {
            host: 'localhost',
            port: 6379
        }
    });
await queue.add("addFile", {
    url: 'https://70bhefogc7jezmwv.public.blob.vercel-storage.com/13_05_2025_Palash%20Dhavle%20Resume%202025.pdf',
    name: 'Palash Dhavle Resume 2025.pdf',
    date: '13/05/2025'
});