import { DashboardStats } from "@/lib/types";
import { statsCountLabel } from "@/lib/articleStatusLabels";

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
        <p className="text-sm text-gray-500">Pas encore de données.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {entries.map(([key, count]) => (
            <StatCard
              key={key}
              label={statsCountLabel(key)}
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
        <StatCard label="Jours depuis l'inscription" value={stats.daysSinceJoined} />
        <StatCard
          label="Taux d'approbation"
          value={
            stats.approvalRate === null
              ? "--"
              : `${Math.round(stats.approvalRate)}%`
          }
        />
      </div>

      <CountGroup title="Articles" counts={stats.articleCounts} />
      <CountGroup
        title="Relectures"
        counts={Object.fromEntries(
          Object.entries(stats.reviewCounts).filter(([status]) => status !== "PENDING"),
        )}
      />
    </div>
  );
}