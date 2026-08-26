export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
      <div className="h-8 w-48 rounded-full bg-hairline skeleton" />
      <div className="mt-8 space-y-7">
        <div className="h-72 rounded-[1.75rem] skeleton" />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="h-44 rounded-2xl skeleton" />
          <div className="h-44 rounded-2xl skeleton" />
        </div>
      </div>
    </div>
  );
}
