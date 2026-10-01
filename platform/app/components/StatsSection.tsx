import { DashboardStats } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function CountGroup({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts);
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No data yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {entries.map(([key, count]) => (
            <StatCard
              key={key}
              label={key.charAt(0) + key.slice(1).toLowerCase()}
              value={count}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function StatsSection({ stats }: { stats: DashboardStats }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Days since joined" value={stats.daysSinceJoined} />
        <StatCard
          label="Approval rate"
          value={
            stats.approvalRate === null
              ? "N/A"
              : `${Math.round(stats.approvalRate * 100)}%`
          }
        />
      </div>

      <CountGroup title="Articles" counts={stats.articleCounts} />
      <CountGroup title="Reviews" counts={stats.reviewCounts} />
    </div>
  );
}