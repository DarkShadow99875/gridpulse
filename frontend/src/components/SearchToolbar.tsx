import { Search, X } from 'lucide-react';
import { ReactNode } from 'react';

interface SearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
  onReset?: () => void;
}

export default function SearchToolbar({
  search,
  onSearchChange,
  placeholder = 'Cerca...',
  children,
  onReset,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>
      {children}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
          Reset
        </button>
      )}
    </div>
  );
}