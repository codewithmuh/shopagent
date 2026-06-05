/**
 * Shared dashboard metric card — icon on top, value, then label. Used by the
 * merchant and company dashboards so their stats read consistently. Pure
 * presentational; the page supplies the already-fetched value.
 */
export function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  loading = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft card-lift">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-gray-200" />
        ) : typeof value === "number" ? (
          value.toLocaleString()
        ) : (
          value
        )}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
