import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import PenaltyTicker from '@/components/PenaltyTicker';
import DeadlineBadge from '@/components/DeadlineBadge';
import { useDashboard, useMarkFiled } from '@/hooks/useDeadlines';
import { Shield } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const PenaltiesPage = () => {
  const { data, isLoading, error, refetch } = useDashboard();
  const markFiled = useMarkFiled();
  const dashboard = data?.data;
  const overdue = dashboard?.overdueItems || [];
  const totalPenalty = dashboard?.penalties?.total || 0;
  const savedAmount = dashboard?.penalties?.saved || 0;
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

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="font-display text-2xl md:text-3xl text-foreground mb-6">
          Penalty Tracker
        </motion.h1>

        {/* Total penalty */}
        {overdue.length > 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="rounded-lg border-2 border-destructive bg-destructive/5 p-6 md:p-8 mb-8">
            <h2 className="font-body font-semibold text-destructive mb-1">Total estimated penalties this month</h2>
            <p className="font-mono text-4xl md:text-5xl font-bold text-destructive penalty-pulse mb-2">
              ₹{totalPenalty.toLocaleString('en-IN')}
            </p>
            <p className="text-sm font-body text-muted-foreground">This updates every day. File now to stop the clock.</p>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="rounded-lg border-2 border-secondary bg-secondary/5 p-6 md:p-8 mb-8 text-center">
            <Shield size={48} className="text-secondary mx-auto mb-3" />
            <h2 className="font-display text-2xl text-foreground mb-1">₹0 penalty risk</h2>
            <p className="text-sm font-body text-muted-foreground">You're fully compliant. Sab clear hai!</p>
          </motion.div>
        )}

        {/* Breakdown */}
        {overdue.length > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mb-8">
            <h2 className="font-body font-semibold text-foreground mb-4">Active penalties</h2>
            <div className="space-y-3">
              {overdue.map((d: any) => (
                <PenaltyTicker
                  key={d.id}
                  dailyRate={d.dailyRate || 50}
                  daysOverdue={d.daysOverdue || 0}
                  filingName={d.title}
                />
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-3 font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Due Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Days Overdue</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Rate</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Penalty</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((d: any) => (
                    <tr key={d.id} className="border-t border-border bg-destructive/5">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <DeadlineBadge category={mapCategory(d.category)} label={(d.category || 'OTHER').toUpperCase()} />
                          <span className="font-medium text-foreground">{d.title}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs hidden sm:table-cell">{String(d.dueDate).slice(0, 10)}</td>
                      <td className="p-3 text-destructive font-medium">{d.daysOverdue} days</td>
                      <td className="p-3 font-mono text-xs hidden sm:table-cell">{d.penaltyRate}</td>
                      <td className="p-3 font-mono text-destructive font-semibold">₹{(d.accrued || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <a href={d.portalUrl} target="_blank" rel="noopener noreferrer"
                            className="px-2 py-1 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors">
                            File now
                          </a>
                          <button
                            onClick={() => markFiled.mutate(d.id)}
                            className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:bg-forest-dark transition-colors"
                          >
                            Mark filed
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Saved */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="rounded-lg border-2 border-secondary bg-secondary/5 p-6">
          <h2 className="font-body font-semibold text-secondary mb-1">Penalties you avoided</h2>
          <p className="font-mono text-3xl font-bold text-secondary mb-1">₹{savedAmount.toLocaleString('en-IN')}</p>
          <p className="text-sm font-body text-muted-foreground">Saved this year by filing on time. That's the ROI of your subscription.</p>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default PenaltiesPage;
