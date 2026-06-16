interface RolePickerProps {
  availableRoles: string[];
  selected: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
}

export default function RolePicker({ availableRoles, selected, onChange, disabled }: RolePickerProps) {
  const toggle = (role: string) => {
    if (disabled) return;
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableRoles.map((role) => {
        const active = selected.includes(role);
        return (
          <button
            key={role}
            type="button"
            onClick={() => toggle(role)}
            disabled={disabled}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              active
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
            } disabled:opacity-50`}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}