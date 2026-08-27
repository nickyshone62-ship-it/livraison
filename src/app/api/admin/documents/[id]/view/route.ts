import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const docId = params.id;
    if (!docId) {
      return NextResponse.json({ error: 'Identifiant document requis' }, { status: 400 });
    }

    const doc = await db.driverDocument.findUnique({
      where: { id: docId },
    });

    if (!doc || !doc.fileUrl) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    let imageBuffer: Buffer;
    let mimeType = 'image/jpeg';

    if (doc.fileUrl.startsWith('data:')) {
      const parts = doc.fileUrl.split(';base64,');
      mimeType = parts[0].split(':')[1] || 'image/jpeg';
      const base64Data = parts[1] || '';
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (doc.fileUrl.startsWith('http')) {
      const res = await fetch(doc.fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = res.headers.get('content-type') || 'image/jpeg';
    } else {
      return NextResponse.json({ error: 'Format non pris en charge' }, { status: 400 });
    }

    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': 'inline',
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Erreur affichage document admin:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'affichage du fichier' }, { status: 500 });
  }
}
