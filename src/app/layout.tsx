import './globals.css';
import { AppLayoutWrapper } from '@/components/AppLayoutWrapper';

export const metadata = {
  title: 'LivraisonOuaga - Plateforme de mise en relation Clients & Livreurs',
  description: 'Trouvez facilement des livreurs indépendants vérifiés à Ouagadougou, Burkina Faso. Sécurité renforcée par codes OTP.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LivraisonOuaga',
  },
};

export const viewport = {
  themeColor: '#009688',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-[#009688] selection:text-white">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
