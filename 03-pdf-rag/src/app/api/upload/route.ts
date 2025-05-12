import queue from '@/lib/queue';
import { UploadResponse } from '@/types';
import { put } from '@vercel/blob';


export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const blob = await put(
          `${new Date().toLocaleDateString('en-GB').replace(/\//g, '_')}_${file.name}`,
          file,
          { access: 'public' }
        );

        await queue.add("addFile", {
          url: blob.url,
          name: file.name,
          date: new Date().toLocaleDateString('en-GB')
        });
        return blob.url;
      })
    );

    const response: UploadResponse = {
      success: true,
      urls: uploaded,
    };

    return Response.json(response);

  } catch (error) {
    console.error('Error uploading files:', error);

    const response: UploadResponse = {
      success: false,
      urls: [],
      error: {
        message: 'Error uploading files',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    const statusCode = response?.error?.detail.includes('This blob already exists') ? 409 : 500;
    return Response.json(response, { status: statusCode });
  }
}
