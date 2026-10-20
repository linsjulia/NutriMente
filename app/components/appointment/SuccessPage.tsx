import React from 'react';
import { SuccessCard } from './SuccessCard';

export const SuccessPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
        <SuccessCard />
      </main>
    </div>
  );
};