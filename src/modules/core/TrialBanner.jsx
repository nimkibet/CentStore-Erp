import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export default function TrialBanner() {
  return (
    <div className="bg-red-600 text-white font-semibold py-2 px-4 text-center shadow-sm flex items-center justify-center space-x-2 text-sm sticky top-0 z-50 w-full uppercase">
      <AlertTriangle className="w-4 h-4 text-white" />
      <span>Trial Environment: Database entries are automatically reset every 12 hours.</span>
      <Clock className="w-4 h-4 text-white ml-1 hidden md:inline-block" />
    </div>
  );
}
