type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-danger/25 bg-danger-soft px-5 py-10 text-center text-sm text-danger">
      {message}
    </div>
  );
}
