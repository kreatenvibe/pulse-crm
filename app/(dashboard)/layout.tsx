export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full">
      <header className="border-b border-zinc-200 px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold tracking-tight">Pulse CRM</p>
      </header>
      <main className="px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
