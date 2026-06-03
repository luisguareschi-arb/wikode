import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-[hsl(var(--app-active))]", className)} />;
}

function ComposerSkeleton({ mode }: { mode: "empty" | "follow-up" }) {
  const isEmpty = mode === "empty";

  return (
    <div className={cn("w-full", isEmpty ? "max-w-2xl" : "max-w-3xl mx-auto")}>
      {isEmpty && (
        <div className="mb-2 px-1">
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
      )}
      <div
        className={cn(
          "rounded-xl border border-[hsl(var(--border))] bg-white",
          !isEmpty && "relative"
        )}
      >
        <div
          className={cn(
            "px-4",
            isEmpty ? "min-h-[100px] pb-2 pt-4" : "min-h-[72px] py-3 pr-12 pb-10"
          )}
        >
          <Skeleton className={cn("h-3.5", isEmpty ? "w-2/3" : "w-28")} />
          {isEmpty && (
            <>
              <Skeleton className="mt-2.5 h-3.5 w-1/2" />
              <Skeleton className="mt-2.5 h-3.5 w-3/5" />
            </>
          )}
        </div>
        {isEmpty ? (
          <div className="flex items-center justify-between gap-2 px-3 pb-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          </div>
        ) : (
          <Skeleton className="absolute bottom-3 right-3 h-8 w-8 rounded-full" />
        )}
      </div>
    </div>
  );
}

export function ChatEmptySkeleton() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center bg-[hsl(var(--app-surface))] px-4 py-8">
      <ComposerSkeleton mode="empty" />
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="flex h-full flex-1 flex-col bg-[hsl(var(--app-surface))]">
      <header className="flex shrink-0 items-center gap-3 px-4 py-2.5">
        <Skeleton className="h-4 w-48 max-w-[40%]" />
        <Skeleton className="h-3.5 w-28" />
        <div className="ml-auto">
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-6">
          <div className="w-full">
            <div className="rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-3">
              <div className="space-y-2.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          </div>

          <div className="w-full px-3 py-1">
            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-[92%]" />
              <Skeleton className="h-3.5 w-[78%]" />
              <Skeleton className="h-3.5 w-[65%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-[hsl(var(--app-surface))] px-4 pb-4 pt-3">
        <ComposerSkeleton mode="follow-up" />
      </div>
    </div>
  );
}
