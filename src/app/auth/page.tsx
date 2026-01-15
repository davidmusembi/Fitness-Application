'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to register page as the default
    router.replace('/auth/register');
  }, [router]);

  return null;
}
