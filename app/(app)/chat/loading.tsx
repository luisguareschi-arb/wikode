export default function ChatLoading() {
  return (
    <div className="grid h-full min-h-screen grid-cols-1 lg:grid-cols-[360px_1fr]">
      <div className="border-r bg-gray-50 p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-3 w-52 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 space-y-2">
          <div className="h-16 animate-pulse rounded-md bg-gray-200" />
          <div className="h-16 animate-pulse rounded-md bg-gray-200" />
          <div className="h-16 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          <div className="h-16 w-2/3 animate-pulse rounded-lg bg-gray-200" />
          <div className="ml-auto h-16 w-1/2 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
