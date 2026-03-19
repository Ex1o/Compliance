import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import PenaltyTicker from '@/components/PenaltyTicker';
import DeadlineCard from '@/components/DeadlineCard';
import DeadlineBadge from '@/components/DeadlineBadge';
import ComplianceScore from '@/components/ComplianceScore';
import { useDashboard, useMarkFiled } from '@/hooks/useDeadlines';
import { useHealthScore } from '@/hooks/useHealthScore';
import { AlertTriangle, Clock, CalendarDays, Shield } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const DashboardPage = () => {
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: scoreData } = useHealthScore();
  const markFiled = useMarkFiled();
  const dashboard = data?.data;
  const upcoming = dashboard?.upcoming || [];
  const overdueItems = dashboard?.overdueItems || [];

  const mapCategory = (category: string) => {
    const value = category?.toLowerCase();
    if (value === 'gst' || value === 'tds' || value === 'pf' || value === 'mca') return value;
    return 'industry';
  };

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 bg-warm-100 rounded-lg" />
      <div className="h-48 bg-warm-100 rounded-lg" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <p className="text-red-600 mb-4">Failed to load data</p>
      <button onClick={() => refetch()} className="text-saffron underline">Try again</button>
    </div>
  );

  const metrics = [
    { label: 'Overdue now', value: dashboard?.summary?.overdue ?? 0, icon: AlertTriangle, className: 'bg-[#FEF2F2] text-destructive' },
    { label: 'Due this week', value: dashboard?.summary?.dueThisWeek ?? 0, icon: Clock, className: 'bg-[#FFFBF0] text-[#D4820A]' },
    { label: 'Due this month', value: dashboard?.summary?.dueThisMonth ?? 0, icon: CalendarDays, className: 'bg-muted text-foreground' },
    { label: 'Compliance score', value: null, icon: Shield, className: 'bg-[#F0FDF4] text-secondary' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="font-display text-2xl md:text-3xl text-foreground mb-6"
        >
          Dashboard
        </motion.h1>

        {/* Metric cards with stagger animation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i}
              className={`rounded-lg p-4 md:p-5 ${m.className} card-hover`}
            >
              <div className="flex items-center gap-2 mb-2">
                <m.icon size={16} />
                <span className="text-xs font-body font-medium uppercase tracking-wide">{m.label}</span>
              </div>
              {m.value !== null ? (
                <p className="font-display text-3xl">{m.value}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <ComplianceScore score={scoreData?.data?.overall ?? 0} size={48} showLabel={false} />
                  <span className="font-mono text-2xl font-bold text-secondary">{scoreData?.data?.overall ?? 0}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Penalty ticker */}
        {overdueItems.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mb-8">
            <h2 className="font-body font-semibold text-foreground mb-3">Penalties accumulating right now</h2>
            <p className="font-mono text-sm text-destructive mb-3">
              Total estimated penalties this month: ₹{(dashboard?.penalties?.total ?? 0).toLocaleString('en-IN')}
            </p>
            <div className="space-y-3">
              {overdueItems.map((d: any) => (
                <PenaltyTicker
                  key={d.id}
                  dailyRate={d.dailyRate || 50}
                  daysOverdue={d.daysOverdue || 0}
                  filingName={d.title}
                />
              ))}
            </div>
            <p className="font-mono text-sm text-secondary mt-3">
              Penalties you avoided: ₹{(dashboard?.penalties?.saved ?? 0).toLocaleString('en-IN')}
            </p>
          </motion.div>
        )}

        {/* Upcoming deadlines */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
          <h2 className="font-body font-semibold text-foreground mb-3">Upcoming deadlines</h2>
          {!upcoming.length ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">No upcoming deadlines</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <>

          {/* Table (desktop) */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 font-medium text-muted-foreground">Deadline</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Form</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Days Left</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Penalty</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((d: any, i: number) => (
                  <tr key={d.id} className={`border-t border-border transition-colors ${i % 2 === 0 ? 'bg-card hover:bg-muted/30' : 'bg-background hover:bg-muted/30'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <DeadlineBadge category={mapCategory(d.category)} label={(d.category || 'OTHER').toUpperCase()} />
                        <span className="font-medium text-foreground">{d.title}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{d.form}</td>
                    <td className="p-3 font-mono text-xs">{String(d.dueDate).slice(0, 10)}</td>
                    <td className="p-3">
                      {d.status === 'FILED' ? (
                        <span className="text-secondary font-medium">Filed</span>
                      ) : d.daysLeft < 0 ? (
                        <span className="text-[#C0392B] font-bold">{Math.abs(d.daysLeft)} days overdue</span>
                      ) : d.daysLeft === 0 ? (
                        <span className="text-destructive font-bold">Due today!</span>
                      ) : d.daysLeft <= 7 ? (
                        <span className="text-[#D4820A] font-medium">{d.daysLeft} days</span>
                      ) : (
                        <span className="text-muted-foreground">{d.daysLeft} days</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">{d.penaltyRate}</td>
                    <td className="p-3">
                      {d.status !== 'FILED' && (
                        <div className="flex gap-2">
                          <a
                            href={d.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors"
                          >
                            File now
                          </a>
                          <button
                            onClick={() => markFiled.mutate(d.id)}
                            className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:bg-forest-dark transition-colors"
                          >
                            Mark filed
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden space-y-3">
            {upcoming.map((d: any) => (
              <DeadlineCard
                key={d.id}
                title={d.title}
                dueDate={String(d.dueDate).slice(0, 10)}
                daysLeft={d.daysLeft}
                penaltyRate={d.penaltyRate}
                status={(d.status || '').toLowerCase() === 'filed' ? 'done' : d.daysLeft < 0 ? 'overdue' : d.daysLeft <= 7 ? 'warning' : 'upcoming'}
                category={mapCategory(d.category)}
                variant="full"
                onFile={() => window.open(d.portalUrl, '_blank')}
                onMark={() => markFiled.mutate(d.id)}
              />
            ))}
          </div>
            </>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
