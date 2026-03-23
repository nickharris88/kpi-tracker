'use client';

import { ReactNode } from 'react';
import { ClientLayout } from '../client-layout';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
