export function EmployerDashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="ham-employer__skel h-[7.5rem] w-full rounded-[1.35rem]" />
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.7fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="ham-employer__skel h-[8.5rem] rounded-[1.35rem]" />
          <div className="ham-employer__skel h-[8.5rem] rounded-[1.35rem]" />
          <div className="ham-employer__skel h-[8.5rem] rounded-[1.35rem]" />
        </div>
        <div className="ham-employer__skel h-[8.5rem] rounded-[1.35rem]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="ham-employer__skel h-80 rounded-[1.35rem]" />
        <div className="ham-employer__skel h-80 rounded-[1.35rem]" />
      </div>
    </div>
  );
}
