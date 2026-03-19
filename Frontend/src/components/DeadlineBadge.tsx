export type DeadlineCategory = "gst" | "tds" | "pf" | "mca" | "industry";

interface DeadlineBadgeProps {
  category: DeadlineCategory;
  label: string;
}

const pillClasses: Record<DeadlineCategory, string> = {
  gst: 'pill-gst',
  tds: 'pill-tds',
  pf: 'pill-pf',
  mca: 'pill-mca',
  industry: 'pill-industry',
};

const DeadlineBadge = ({ category, label }: DeadlineBadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body ${pillClasses[category]}`}>
    {label}
  </span>
);

export default DeadlineBadge;
