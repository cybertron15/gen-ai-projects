import { del } from '@vercel/blob';

export async function DELETE(request: Request) {
    //   const { searchParams } = new URL(request.url);
    //   const urlToDelete = searchParams.get('url') as string;
    const { urls } = await request.json();
    if (!urls || !Array.isArray(urls)) {
        return new Response('Invalid request', { status: 400 });
    }
    else {
        urls.map((url) => {
            del(url);
        })
    }

    return new Response();
}