type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-10 text-center text-sm text-foreground-muted shadow-card">
      {message}
    </div>
  );
}
