type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-10 text-center text-sm text-foreground-muted shadow-card">
      {message}
    </div>
  );
}
