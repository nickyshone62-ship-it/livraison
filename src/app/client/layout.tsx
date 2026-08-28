import React from 'react';
import { AccessGuard } from '@/components/AccessGuard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGuard allowedRoles={['client', 'admin']}>
      {children}
    </AccessGuard>
  );
}
