import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Plus, Search, X, Send } from 'lucide-react';
import { useAddClient, useCaDashboard, useMarkClientFiled } from '@/hooks/useCa';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const CADashboardPage = () => {
  const { data, isLoading, error, refetch } = useCaDashboard();
  const addClient = useAddClient();
  const markFiled = useMarkClientFiled();
  const dashboard = data?.data;
  const clients = dashboard?.clients || [];
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [newClientMobile, setNewClientMobile] = useState('');

  const filtered = clients.filter((c: any) => c.name?.toLowerCase().includes(search.toLowerCase()));

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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0} className="font-display text-2xl md:text-3xl text-foreground">
            CA Dashboard
          </motion.h1>
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px]">
            <Plus size={16} /> Add Client
          </button>
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4 bg-card border border-border">
            <p className="text-xs font-body font-medium uppercase tracking-wide text-muted-foreground mb-1">Managing client businesses</p>
            <p className="font-display text-3xl text-foreground">{dashboard?.summary?.totalClients || 0}</p>
          </div>
          <div className="rounded-lg p-4 bg-[#FEF2F2]">
            <p className="text-xs font-body font-medium uppercase tracking-wide text-destructive/70 mb-1">Overdue clients</p>
            <p className="font-display text-3xl text-destructive">{dashboard?.summary?.overdueClients || 0}</p>
          </div>
          <div className="rounded-lg p-4 bg-[#FFFBF0]">
            <p className="text-xs font-body font-medium uppercase tracking-wide text-[#D4820A]/70 mb-1">Due this week</p>
            <p className="font-display text-3xl text-[#D4820A]">{dashboard?.summary?.dueThisWeek || 0}</p>
          </div>
          <div className="rounded-lg p-4 bg-[#F0FDF4]">
            <p className="text-xs font-body font-medium uppercase tracking-wide text-secondary/70 mb-1">All clear</p>
            <p className="font-display text-3xl text-secondary">{dashboard?.summary?.allClear || 0}</p>
          </div>
        </motion.div>

        <div className="relative ml-auto mb-4 w-60">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs font-body rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px] w-full"
          />
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="rounded-lg border border-border overflow-hidden bg-card">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-3 font-medium text-muted-foreground">Business</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Entity</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Overdue</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Due this week</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Next deadline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <Fragment key={c.id}>
                  <tr className="border-t border-border cursor-pointer transition-colors hover:bg-muted/30" onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}>
                    <td className="p-3 font-medium text-foreground">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.entityType}</td>
                    <td className="p-3">{c.overdueCount}</td>
                    <td className="p-3">{c.dueThisWeek}</td>
                    <td className="p-3">{c.complianceScore}</td>
                    <td className="p-3">{c.nextDeadline?.title} ({c.nextDeadline?.daysLeft}d)</td>
                  </tr>
                  {expandedClient === c.id && (
                    <tr key={`${c.id}-details`}>
                      <td colSpan={6} className="p-4 bg-muted/50 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Next due: {String(c.nextDeadline?.dueDate || '').slice(0, 10)} | Total penalty: ₹{(c.totalPenalty || 0).toLocaleString('en-IN')}
                          </div>
                          {c.nextDeadline?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markFiled.mutate(c.nextDeadline.id);
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-forest-dark transition-colors"
                            >
                              Mark as filed
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </motion.div>

        {showAddModal && (
          <>
            <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-lg border border-border shadow-2xl z-50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-foreground">Add new client</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-md hover:bg-muted transition-colors">
                  <X size={18} />
                </button>
              </div>
              <label htmlFor="owner-mobile" className="text-xs font-body font-medium text-muted-foreground mb-1.5 block">Owner mobile number</label>
              <div className="flex">
                <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-border text-sm font-body text-muted-foreground">+91</div>
                <input
                  id="owner-mobile"
                  type="tel"
                  value={newClientMobile}
                  onChange={(e) => setNewClientMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter mobile number"
                  className="flex-1 px-3 py-2.5 rounded-r-md border border-l-0 border-border bg-card text-sm font-body font-mono focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
                />
              </div>
              <button
                onClick={() => {
                  addClient.mutate(newClientMobile);
                  setShowAddModal(false);
                  setNewClientMobile('');
                }}
                disabled={newClientMobile.length !== 10}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                Add client
              </button>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default CADashboardPage;
