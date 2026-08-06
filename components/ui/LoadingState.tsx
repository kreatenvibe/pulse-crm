type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: LoadingStateProps) {
  return (
    <div className="border-y border-border px-5 py-12 text-center text-sm text-foreground-muted">
      {message}
    </div>
  );
}
