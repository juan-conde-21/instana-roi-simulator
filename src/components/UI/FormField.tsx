import React from 'react';
import HelpTooltip from './HelpTooltip';

interface SelectOption { value: string; label: string }

interface FormFieldProps {
  label: string;
  hint?: string;
  help?: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, help, children }: FormFieldProps) {
  return (
    <div className="form-group">
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        {help && <HelpTooltip content={help} />}
      </div>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  hint?: string;
  help?: string;
}

export function SelectField({ label, value, onChange, options, hint, help }: SelectFieldProps) {
  return (
    <FormField label={label} hint={hint} help={help}>
      <select
        className="form-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FormField>
  );
}

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  hint?: string;
  help?: string;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberField({
  label, value, onChange, placeholder, hint, help, min, max, prefix, suffix
}: NumberFieldProps) {
  return (
    <FormField label={label} hint={hint} help={help}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ color: 'var(--ibm-text-secondary)', fontWeight: 500 }}>{prefix}</span>}
        <input
          type="number"
          className="form-input"
          value={value ?? ''}
          onChange={e => {
            const v = e.target.value;
            onChange(v === '' ? null : parseFloat(v));
          }}
          placeholder={placeholder ?? ''}
          min={min}
          max={max}
        />
        {suffix && <span style={{ color: 'var(--ibm-text-secondary)' }}>{suffix}</span>}
      </div>
    </FormField>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  help?: string;
}

export function TextField({ label, value, onChange, placeholder, hint, help }: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} help={help}>
      <input
        type="text"
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FormField>
  );
}

interface ToggleGroupProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: SelectOption[];
  hint?: string;
  help?: string;
}

export function ToggleGroup<T extends string>({ label, value, onChange, options, hint, help }: ToggleGroupProps<T>) {
  return (
    <FormField label={label} hint={hint} help={help}>
      <div className="toggle-group">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            className={`toggle-option${value === o.value ? ' selected' : ''}`}
            onClick={() => onChange(o.value as T)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </FormField>
  );
}

interface CheckboxGroupProps {
  label?: string;
  items: Array<{ key: string; label: string }>;
  checked: Record<string, boolean>;
  onChange: (key: string, val: boolean) => void;
}

export function CheckboxGroup({ label, items, checked, onChange }: CheckboxGroupProps) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="checkbox-group">
        {items.map(item => (
          <label key={item.key} className={`checkbox-item${checked[item.key] ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!checked[item.key]}
              onChange={e => onChange(item.key, e.target.checked)}
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}
