"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Callback page - handles OIDC redirect from Cognito
 * This page is shown while processing the authentication callback
 */
export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The actual callback processing happens in the API route
    // This page just shows a loading state
    // The API route will redirect to home after processing
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

