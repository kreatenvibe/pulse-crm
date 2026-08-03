type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded border border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
