type FormErrorProps = {
  /** Stable id so a field can point to it via aria-describedby. */
  id?: string;
  /** Message from React Hook Form (e.g. errors.name?.message). Falsy renders nothing. */
  message?: string;
};

/** Renders a field-level validation message, or nothing when there is no error. */
export function FormError({ id, message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm text-danger">
      {message}
    </p>
  );
}
