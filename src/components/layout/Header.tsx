'use client';

import { ThemeToggleButton } from '@/components/ui/theme-toggle';
import { Calendar } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo y título */}
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Planico</h1>
        </div>

        {/* Controles de la derecha */}
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}