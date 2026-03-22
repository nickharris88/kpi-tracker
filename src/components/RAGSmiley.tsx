'use client';

import { RAGStatus } from '@/lib/types';

interface RAGSmileyProps {
  status: RAGStatus;
  onClick?: (status: RAGStatus) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-4xl',
};

export default function RAGSmiley({ status, onClick, size = 'md' }: RAGSmileyProps) {
  const cycle: RAGStatus[] = [null, 'green', 'amber', 'red'];

  const handleClick = () => {
    if (!onClick) return;
    const currentIndex = cycle.indexOf(status);
    const nextIndex = (currentIndex + 1) % cycle.length;
    onClick(cycle[nextIndex]);
  };

  const getEmoji = () => {
    switch (status) {
      case 'green': return '😄';
      case 'amber': return '😐';
      case 'red': return '😞';
      default: return '⚪';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'green': return 'bg-emerald-100 dark:bg-emerald-900/40 ring-emerald-400';
      case 'amber': return 'bg-amber-100 dark:bg-amber-900/40 ring-amber-400';
      case 'red': return 'bg-red-100 dark:bg-red-900/40 ring-red-400';
      default: return 'bg-gray-100 dark:bg-gray-800 ring-gray-300 dark:ring-gray-600';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'green': return 'Achieved';
      case 'amber': return 'Partially';
      case 'red': return 'Missed';
      default: return 'Not rated';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]} ${getBgColor()}
        rounded-full flex items-center justify-center
        ring-2 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
        ${status ? 'shadow-md' : ''}
      `}
      title={getLabel()}
      aria-label={getLabel()}
    >
      {getEmoji()}
    </button>
  );
}

export function RAGLegend() {
  return (
    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
      <span className="flex items-center gap-1">😄 Green = Achieved</span>
      <span className="flex items-center gap-1">😐 Amber = Partial</span>
      <span className="flex items-center gap-1">😞 Red = Missed</span>
      <span className="flex items-center gap-1">⚪ Not rated</span>
    </div>
  );
}
