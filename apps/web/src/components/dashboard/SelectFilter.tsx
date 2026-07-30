import { Field, NativeSelect } from '@chakra-ui/react';

type SelectFilterProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: string;
  onChange: (value: string) => void;
  /** Turns an option key into its display text. Defaults to the key itself. */
  formatOption?: (option: T) => string;
};

/** Labelled dropdown with an "All" escape hatch, used by every dashboard filter. */
export function SelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
  formatOption,
}: SelectFilterProps<T>) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <NativeSelect.Root size="sm">
        <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {formatOption ? formatOption(option) : option}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}
