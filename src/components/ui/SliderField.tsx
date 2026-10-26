import { useId } from 'react';

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  unit: string;
  sub?: string;
  onChange: (value: number) => void;
}

/** A labelled parameter row: mono label, live value, and a hard-edged slider. */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  unit,
  sub,
  onChange,
}: SliderFieldProps) {
  const id = useId();
  return (
    <div className="sv-field">
      <div className="sv-field-head">
        <label className="sv-field-label" htmlFor={id}>
          {label}
        </label>
        <span className="sv-field-value">
          {display}
          {unit ? <span className="sv-field-unit"> {unit}</span> : null}
        </span>
      </div>
      <input
        id={id}
        className="sv-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
      {sub ? <div className="sv-field-sub">{sub}</div> : null}
    </div>
  );
}
