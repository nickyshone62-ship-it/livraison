import React from 'react';
import { AccessGuard } from '@/components/AccessGuard';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccessGuard allowedRoles={['driver', 'admin']}>
      {children}
    </AccessGuard>
  );
}
