type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="border-y border-border px-5 py-12 text-center text-sm text-foreground-muted">
      {message}
    </div>
  );
}
