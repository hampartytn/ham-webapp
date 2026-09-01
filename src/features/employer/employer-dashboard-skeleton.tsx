export function EmployerDashboardSkeleton({
  omitWelcome = false,
}: {
  omitWelcome?: boolean;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {omitWelcome ? null : (
        <div className="ham-employer__skel h-20 w-full rounded-xl" />
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="ham-employer__skel h-32 rounded-xl" />
        <div className="ham-employer__skel h-32 rounded-xl" />
        <div className="ham-employer__skel h-32 rounded-xl" />
        <div className="ham-employer__skel h-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="ham-employer__skel h-80 rounded-xl lg:col-span-2" />
        <div className="ham-employer__skel h-80 rounded-xl" />
      </div>
    </div>
  );
}
