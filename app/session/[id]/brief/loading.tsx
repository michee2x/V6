import { Skeleton } from "@/components/ui/skeleton";

export default function BriefLoading() {
  return (
    <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto relative h-full">
      {/* Header skeleton */}
      <div className="px-8 py-4 border-b border-border bg-muted/30 flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-36" />
        <div className="ml-auto flex gap-2">
           <Skeleton className="h-8 w-8 rounded-md" />
           <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-8 pb-32 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Input pill skeleton */}
      <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8 bg-background border border-border shadow-lg rounded-full px-4 py-3 flex items-center gap-2">
        <Skeleton className="h-5 w-full rounded-full" />
      </div>
    </div>
  );
}
