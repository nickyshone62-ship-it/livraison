const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function attachEstelleVehiclePhoto() {
  console.log("Ajout de la photo d'engin pour Zongo Estelle...");

  const driverId = '923153ec-6f4d-40cb-bed8-989c83e5c133';

  // Base64 sample image of a motorcycle for Estelle's Yamaha Sirius
  const vehiclePhotoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAHgA8ABAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  // Check if vehicle_photo already exists
  const existing = await prisma.$queryRaw`
    SELECT id FROM public.driver_documents
    WHERE driver_id = ${driverId}::uuid AND document_type = 'vehicle_photo'
  `;

  if (existing && existing.length > 0) {
    console.log("La photo d'engin existe deja!");
  } else {
    await prisma.$executeRaw`
      INSERT INTO public.driver_documents (id, driver_id, document_type, file_url, status, created_at, updated_at)
      VALUES (gen_random_uuid(), ${driverId}::uuid, 'vehicle_photo', ${vehiclePhotoBase64}, 'pending', NOW(), NOW())
    `;
    console.log("Photo d'engin ajoutee avec succes pour Zongo Estelle (Yamaha Sirius)!");
  }

  const finalDocs = await prisma.$queryRaw`
    SELECT id, document_type, status FROM public.driver_documents WHERE driver_id = ${driverId}::uuid
  `;
  console.log("Documents finaux de Zongo Estelle:", finalDocs);

  await prisma.$disconnect();
}

attachEstelleVehiclePhoto().catch(console.error);
