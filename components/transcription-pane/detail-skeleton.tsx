export function DetailSkeleton() {
  return (
    <div className="flex w-[640px] max-w-full flex-col">
      <div className="flex flex-col gap-2 pb-8">
        <div className="h-7 w-72 animate-pulse rounded bg-[#1414140F]" />
        <div className="h-3 w-56 animate-pulse rounded bg-[#1414140A]" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3 pb-6">
          <div className="h-4 w-40 animate-pulse rounded bg-[#1414140F]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#1414140A]" />
          <div className="h-4 w-[92%] animate-pulse rounded bg-[#1414140A]" />
          <div className="h-4 w-[76%] animate-pulse rounded bg-[#1414140A]" />
        </div>
      ))}
    </div>
  );
}
