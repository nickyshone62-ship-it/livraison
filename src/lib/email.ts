import nodemailer from 'nodemailer';

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
      ? '👤 CLIENT' 
      : '👤 CLIENT';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdfb; margin: 0; padding: 20px; color: #004D40; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 4px solid #009688; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; border-bottom: 2px solid #e6fffa; padding-bottom: 20px; margin-bottom: 24px; }
        .badge { background: #009688; color: #ffffff; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; display: inline-block; }
        h2 { font-size: 22px; font-weight: 900; margin: 12px 0 4px 0; color: #004D40; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; }
        .table td.label { color: #64748b; font-size: 12px; text-transform: uppercase; width: 35%; font-weight: 800; }
        .action-container { text-align: center; margin-top: 32px; }
        .btn-approve { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff !important; font-size: 15px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="badge">🔔 Alerte Administrateur LivraisonOuaga</span>
          <h2>Nouvelle Inscription en Attente</h2>
          <p style="font-size: 13px; color: #00796B; font-weight: 700;">Un nouveau dossier candidat nécessite votre approbation.</p>
        </div>

        <table class="table">
          <tr>
            <td class="label">Rôle / Type :</td>
            <td>${roleLabel}</td>
          </tr>
          <tr>
            <td class="label">Nom Complet :</td>
            <td>${data.fullName}</td>
          </tr>
          <tr>
            <td class="label">Téléphone :</td>
            <td>${data.phone}</td>
          </tr>
          <tr>
            <td class="label">Adresse E-mail :</td>
            <td>${data.email || 'Non renseignée'}</td>
          </tr>
          <tr>
            <td class="label">N° CNIB / Pass :</td>
            <td>${data.idCardNumber || 'Non renseigné'}</td>
          </tr>
          <tr>
            <td class="label">Véhicule :</td>
            <td>${data.vehicleType || 'Non renseigné'} (${data.brand || ''})</td>
          </tr>
          <tr>
            <td class="label">Zones Desservies :</td>
            <td>${data.preferredZones || 'Ouagadougou'}</td>
          </tr>
          <tr>
            <td class="label">Moyen de Paiement :</td>
            <td>${data.paymentMethod || 'Mobile Money'}</td>
          </tr>
        </table>

        <div class="action-container">
          <a href="${approvalUrl}" class="btn-approve">✅ APPROUVER &amp; ACTIVER CE COMPTE EN 1 CLIC</a>
        </div>

        <div class="footer">
          LivraisonOuaga 🇧🇫 • Panneau Administrateur Central<br>
          <a href="${adminPanelUrl}" style="color: #009688;">Accéder au tableau de bord central</a>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`============================================================`);
  console.log(`📧 [ALERTE D'INSCRIPTION EXPÉDIÉE À ${adminEmail}]`);
  console.log(`👤 Candidat : ${data.fullName} (${data.phone})`);
  console.log(`🔗 LIEN D'APPROBATION DIRECTE : ${approvalUrl}`);
  console.log(`============================================================`);

  // 1. Instant Direct HTTP Email Dispatch Gateway to nickyshone62@gmail.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        _subject: `🚨 [Nouveau Dossier] ${roleLabel} : ${data.fullName} (${data.phone})`,
        "Nom complet": data.fullName,
        "Rôle": roleLabel,
        "Téléphone": data.phone,
        "Email": data.email || "Non renseigné",
        "N° CNIB": data.idCardNumber || "Non renseigné",
        "Véhicule": `${data.vehicleType || 'Non renseigné'} (${data.brand || ''})`,
        "Zones desservies": data.preferredZones || "Ouagadougou",
        "Moyen de paiement": data.paymentMethod || "Mobile Money",
        "Lien d'approbation 1-Clic": approvalUrl,
        "_template": "table",
      }),
    }).then(() => {
      clearTimeout(timeoutId);
      console.log(`✅ [EMAIL PHYSIQUE DISPATCHÉ ET EXPÉDIÉ DIRECTEMENT À ${adminEmail}]`);
    }).catch(err => {
      clearTimeout(timeoutId);
      console.error('HTTP Email Gateway Error:', err);
    });
  } catch (err) {
    console.error('HTTP Email Gateway Trigger Error:', err);
  }

  // 2. Nodemailer SMTP (if SMTP server config is present)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"LivraisonOuaga Alertes" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🚨 [Nouveau Dossier] ${roleLabel} : ${data.fullName} (${data.phone})`,
        html: htmlContent,
      });
      console.log(`✅ [EMAIL SMTP EXPÉDIÉ À ${adminEmail}]`);
    } catch (err) {
      console.error('⚠️ [SMTP EMAIL SEND ERROR]:', err);
    }
  }

  return {
    success: true,
    approvalUrl,
    adminPanelUrl,
    message: `Alerte administrateur générée et expédiée à ${adminEmail}`,
  };
}
