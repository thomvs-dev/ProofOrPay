import type { InputHTMLAttributes } from "react";

export function NbLabel({
  htmlFor,
  children,
  error,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="nb-label">{children}</span>
      {error && (
        <span className="block text-xs text-nb-pink mt-0.5 normal-case tracking-normal">
          {error}
        </span>
      )}
    </label>
  );
}

export function NbInput({
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      className={`nb-input ${error ? "border-nb-pink" : ""} ${className}`.trim()}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
}
