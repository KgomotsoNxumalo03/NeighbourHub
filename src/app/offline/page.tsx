import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold">NeighbourHub is offline</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          The app is installable and ready for a richer offline mode later. Reconnect to load live community data.
        </p>
        <Link href="/" className="mt-5 inline-flex rounded-lg bg-[#006B3C] px-4 py-3 text-sm font-bold text-white">
          Return home
        </Link>
      </div>
    </main>
  );
}
