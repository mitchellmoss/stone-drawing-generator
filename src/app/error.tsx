"use client"

import React from 'react';

export function ErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="error-boundary">
      {children}
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h1>
          <p className="mb-4 max-w-md">{error.message || "An unexpected error occurred"}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
