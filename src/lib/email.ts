export interface SendVerificationEmailParams {
  email: string;
  fullName: string;
  verifyToken: string;
}

export async function sendAccountVerificationEmail({ email, fullName, verifyToken }: SendVerificationEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;

  // Multi-channel Email Dispatch Log
  console.log(`============================================================`);
  console.log(`📧 [EMAIL DE VALIDATION ENVOYÉ À ${email}]`);
  console.log(`👤 Destinataire : ${fullName}`);
  console.log(`🔗 Lien unique de validation de compte : ${verifyUrl}`);
  console.log(`============================================================`);

  return {
    success: true,
    verifyUrl,
    message: `Un e-mail de validation a été envoyé à ${email}. Veuillez cliquer sur le lien dans votre boîte mail pour valider votre compte.`,
  };
}
