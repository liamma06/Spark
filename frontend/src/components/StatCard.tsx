import StatBadge from "./StatBadge";

interface StatCardProps {
  title: string;
  stat: string | number;
  badgeStat: string;
  badgeDetails: string;
  statColor?: string;
}

export function StatCard({
  title,
  stat,
  badgeStat,
  badgeDetails,
  statColor = "text-slate-800",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-3">
      <p className="text-lg font-medium">{title}</p>
      <p className={`text-[3em] font-semibold ${statColor}`}>{stat}</p>
      <StatBadge stat={badgeStat} details={badgeDetails} />
    </div>
  );
}
