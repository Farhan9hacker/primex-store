import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || `upload-${Date.now()}`;

    console.log('Upload Request:', {
        url: request.url,
        filename,
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        hasBody: !!request.body
    });

    if (!request.body) {
        return NextResponse.json({ error: 'No file body provided' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN is missing');
        return NextResponse.json({ error: 'Server configuration error: Missing Blob Token' }, { status: 500 });
    }

    try {
        const blob = await put(filename, request.body, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Blob put error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
