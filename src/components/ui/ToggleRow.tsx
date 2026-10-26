interface ToggleOption<T extends string> {
  id: T;
  label: string;
}

interface ToggleRowProps<T extends string> {
  label: string;
  options: Array<ToggleOption<T>>;
  value: T;
  onChange: (id: T) => void;
}

/** A wrapped grid of hard-edged options. Anything but a select box. */
export function ToggleRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: ToggleRowProps<T>) {
  return (
    <div>
      <div className="sv-label" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div className="sv-toggle-grid" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="sv-toggle"
            data-active={option.id === value}
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
