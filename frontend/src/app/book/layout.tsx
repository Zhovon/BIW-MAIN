import React from 'react';
import Script from 'next/script';

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Guarantee Tailwind CSS loads for the widget regardless of Vercel build caching! */}
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      {children}
    </>
  );
}
