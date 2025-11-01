'use client';

import { Suspense } from 'react';
import LiveGamePage from '@/pages/LiveGamePage';

export default function LiveGameRoute({ params }: { params: { sessionId: string } }) {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Game...</h2>
          <p className="text-gray-600">Please wait while we connect to the game session.</p>
        </div>
      </div>
    }>
      <LiveGamePage />
    </Suspense>
  );
}