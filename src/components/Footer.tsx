import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-4 text-center text-sm text-muted-foreground mt-auto">
      <p>
        (c) 2025 by Fredi Bach - Vibe coded with{' '}
        <Link 
          href="https://co.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          co.dev
        </Link>{' '}
        and Claude Sonnet
      </p>
    </footer>
  );
}