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
  const hasError = Boolean(error);
  const hasTrailing = Boolean(trailing);

  /* Right padding clears the error message/circle and the trailing slot so
     typed text never runs underneath them. Only increases while an error is
     active, so the idle layout is unchanged. */
  const rightPadding = hasError
    ? hasTrailing
      ? "pr-52"
      : "pr-44"
    : hasTrailing
      ? "pr-12"
      : "";

  const inputClasses = [
    "w-full h-11 rounded-[10px] bg-surface px-4 text-sm text-text-primary",
    "border transition-colors duration-150 ease-out",
    "placeholder:text-text-secondary",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    hasError
      ? "border-danger focus:border-danger"
      : "border-border focus:border-primary",
    "focus:outline-none",
    rightPadding,
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
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          {...rest}
        />

        {hasError || hasTrailing ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1.5 overflow-hidden pr-3">
            {hasError ? (
              <>
                <span
                  aria-hidden="true"
                  className="alert-circle flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 7v6m0 4h.01"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  id={errorId}
                  role="alert"
                  className="whitespace-nowrap text-xs font-medium text-danger"
                >
                  {error}
                </span>
              </>
            ) : null}

            {hasTrailing ? (
              <div className="pointer-events-auto flex shrink-0">
                {trailing}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}