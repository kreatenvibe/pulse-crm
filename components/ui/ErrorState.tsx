type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-danger/20 bg-danger-soft px-5 py-10 text-center text-sm text-danger shadow-card">
      {message}
    </div>
  );
}
