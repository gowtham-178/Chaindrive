import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const textareaId = props.id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-ink mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-3 py-2 
            bg-white border rounded-lg 
            text-ink placeholder:text-ink-lighter
            focus-ring
            disabled:bg-ink/5 disabled:cursor-not-allowed
            resize-vertical
            ${error ? 'border-danger' : 'border-ink/20'}
            ${className}
          `}
          rows={4}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-ink-light">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
