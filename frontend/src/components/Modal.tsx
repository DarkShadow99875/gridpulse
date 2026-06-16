import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, title, onClose, children, wide = false }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}