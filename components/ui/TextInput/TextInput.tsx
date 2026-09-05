import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  trailing?: ReactNode;
}

export default function TextInput({
  label,
  error,
  trailing,
  id,
  className = "",
  ...rest
}: TextInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  const inputClasses = [
    "w-full h-11 rounded-[10px] bg-surface px-4 text-sm text-text-primary",
    "border transition-colors duration-150 ease-out",
    "placeholder:text-text-secondary",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error
      ? "border-danger focus:border-danger"
      : "border-border focus:border-primary",
    "focus:outline-none",
    trailing ? "pr-12" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-text-secondary">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
