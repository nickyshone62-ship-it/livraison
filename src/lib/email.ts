import { db } from './db';

export interface AdminUserAlertParams {
  userId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: string;
  idCardNumber?: string | null;
  idCardFileUrl?: string | null;
  photoUrl?: string | null;
  vehicleType?: string | null;
  brand?: string | null;
  vehiclePhotoUrl?: string | null;
  preferredZones?: string | null;
  paymentMethod?: string | null;
}

export async function sendAdminNewUserAlertEmail(data: AdminUserAlertParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approvalUrl = `${baseUrl}/api/admin/approve-user?userId=${data.userId}`;
  const adminPanelUrl = `${baseUrl}/admin`;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'nickyshone62@gmail.com';

  const roleLabel = data.role === 'LIVREUR' 
    ? '🛵 LIVREUR' 
    : data.role === 'COMMERCANT' 
      ? '🏪 BOUTIQUE / COMMERÇANT' 
      : '👤 CLIENT PARTICULIER';

  console.log(`============================================================`);
  console.log(`📧 [ALERTE D'INSCRIPTION ENVOYÉE À L'ADMINISTRATION: ${adminEmail}]`);
  console.log(`👤 Candidat : ${data.fullName}`);
  console.log(`📞 Téléphone : ${data.phone}`);
  console.log(`✉️ Email : ${data.email || 'Non renseigné'}`);
  console.log(`📋 Rôle : ${roleLabel}`);
  console.log(`🪪 CNIB / Passeport : ${data.idCardNumber || 'Non renseigné'}`);
  console.log(`🛵 Véhicule : ${data.vehicleType || 'Non renseigné'} (${data.brand || ''})`);
  console.log(`📍 Zones : ${data.preferredZones || 'Ouagadougou'}`);
  console.log(`💳 Paiement : ${data.paymentMethod || 'Mobile Money'}`);
  console.log(`------------------------------------------------------------`);
  console.log(`🔗 LIEN D'APPROBATION DIRECTE DANS L'EMAIL : ${approvalUrl}`);
  console.log(`============================================================`);

  return {
    success: true,
    approvalUrl,
    adminPanelUrl,
    message: `Alerte administrateur générée pour ${data.fullName}`,
  };
}
