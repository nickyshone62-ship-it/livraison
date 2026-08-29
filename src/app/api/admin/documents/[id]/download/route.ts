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

    let doc = await db.driverDocument.findUnique({
      where: { id: docId },
    });

    let fileUrl = doc?.fileUrl;
    let docType = doc?.documentType || 'document';
    let driverName = 'livreur';

    if (doc?.driverId) {
      const profile = await db.profile.findUnique({ where: { id: doc.driverId } });
      if (profile?.fullName) driverName = profile.fullName;
    }

    if (!fileUrl && (docId.startsWith('recto_') || docId.startsWith('verso_') || docId.startsWith('avatar_'))) {
      const userId = docId.split('_')[1];
      if (userId) {
        const profile = await db.profile.findUnique({ where: { id: userId } });
        if (profile) {
          if (profile.fullName) driverName = profile.fullName;
          if (docId.startsWith('recto_')) {
            fileUrl = profile.cniRectoUrl || undefined;
            docType = 'identity_card_recto';
          } else if (docId.startsWith('verso_')) {
            fileUrl = profile.cniVersoUrl || undefined;
            docType = 'identity_card_verso';
          } else if (docId.startsWith('avatar_')) {
            fileUrl = profile.avatarUrl || undefined;
            docType = 'photo';
          }
        }
      }
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    const cleanDriverName = driverName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanDocType = docType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanDriverName}_${cleanDocType}.jpg`;

    let imageBuffer: Buffer;
    let mimeType = 'image/jpeg';

    if (fileUrl.startsWith('data:')) {
      const parts = fileUrl.split(';base64,');
      mimeType = parts[0].split(':')[1] || 'image/jpeg';
      const base64Data = parts[1] || '';
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (fileUrl.startsWith('http')) {
      const res = await fetch(fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = res.headers.get('content-type') || 'image/jpeg';
    } else {
      return NextResponse.json({ error: 'Format de fichier non pris en charge' }, { status: 400 });
    }

    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Erreur téléchargement document admin:', error);
    return NextResponse.json({ error: 'Erreur lors du téléchargement du fichier' }, { status: 500 });
  }
}
