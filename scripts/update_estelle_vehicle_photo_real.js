const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEstelleVehiclePhotoReal() {
  console.log("Mise a jour de la photo de l'engin d'Estelle avec l'image generee...");

  const imgPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\b7aeae74-ca4f-422a-b04f-e710602d7921\\yamaha_sirius_motorcycle_1788016328215.png';

  if (!fs.existsSync(imgPath)) {
    console.error("Fichier image non trouve:", imgPath);
    await prisma.$disconnect();
    return;
  }

  const imageBuffer = fs.readFileSync(imgPath);
  const base64Data = imageBuffer.toString('base64');
  const fileUrl = `data:image/png;base64,${base64Data}`;

  const driverId = '923153ec-6f4d-40cb-bed8-989c83e5c133';

  // Check if document exists
  const existing = await prisma.$queryRaw`
    SELECT id FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid AND document_type = 'vehicle_photo'
  `;

  if (existing && existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE public.driver_documents
      SET file_url = ${fileUrl}, status = 'pending', updated_at = NOW()
      WHERE id = ${existing[0].id}::uuid
    `;
    console.log("Photo de l'engin mise a jour avec succes pour Zongo Estelle (ID:", existing[0].id, ") !");
  } else {
    await prisma.$executeRaw`
      INSERT INTO public.driver_documents (id, driver_id, document_type, file_url, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${driverId}::uuid, 'vehicle_photo', ${fileUrl}, 'pending', NOW(), NOW())
    `;
    console.log("Photo de l'engin inseree avec succes!");
  }

  const checkDoc = await prisma.$queryRaw`
    SELECT id, document_type, length(file_url) as len FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid AND document_type = 'vehicle_photo'
  `;
  console.log("Resultat en BDD pour vehicle_photo:", checkDoc);

  await prisma.$disconnect();
}

updateEstelleVehiclePhotoReal().catch(console.error);
