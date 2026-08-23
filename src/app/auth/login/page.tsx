'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OnboardingAuth } from '@/components/OnboardingAuth';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || undefined;

  return <OnboardingAuth redirectUrl={redirectUrl} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-r from-[#403294] via-[#6E3B9B] to-[#C9379D] flex items-center justify-center text-white font-sans">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold">Chargement de la connexion...</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
