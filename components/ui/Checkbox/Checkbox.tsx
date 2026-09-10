import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export default function Checkbox({
  label,
  id,
  className = "",
  ...rest
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none ${className}`}
    >
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 accent-primary cursor-pointer"
        {...rest}
      />
      {label}
    </label>
  );
}
