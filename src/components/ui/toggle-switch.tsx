"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

export default function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-coral" : "bg-surface-3 border border-hairline-strong"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full transition-transform duration-200 ${
          checked ? "translate-x-6 bg-void" : "translate-x-1 bg-ink-faint"
        }`}
      />
    </button>
  );
}
