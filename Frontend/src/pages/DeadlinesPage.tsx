import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import DeadlineBadge from '@/components/DeadlineBadge';
import { useDeadlines, useMarkFiled } from '@/hooks/useDeadlines';
import { Search, ChevronDown, Check, ExternalLink, X } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const categoryTabs = ['All', 'GST', 'TDS', 'PF/ESI', 'MCA', 'Income Tax', 'Industry'];
const statusFilters = ['All', 'Overdue', 'Upcoming', 'Filed this year'];
const sortOptions = ['Due date', 'Penalty (high to low)', 'Category'];

const DeadlinesPage = () => {
  const markFiled = useMarkFiled();
  const [params, setParams] = useState<{ category?: string; status?: string; search?: string }>({});
  const { data, isLoading, error, refetch } = useDeadlines(params);
  const deadlines = data?.data || [];
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Due date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState<any | null>(null);
  const mapCategory = (category: string) => {
    const value = category?.toLowerCase();
    if (value === 'gst' || value === 'tds' || value === 'pf' || value === 'mca') return value;
    return 'industry';
  };
  const isDone = (status: string) => status?.toUpperCase() === 'FILED';
  const isOverdue = (status: string) => status?.toUpperCase() === 'OVERDUE';

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

  // Filter deadlines
  const filteredDeadlines = deadlines.filter(d => {
    // Category filter
    if (activeCategory !== 'All') {
      const catMap: Record<string, string[]> = {
        'GST': ['gst'],
        'TDS': ['tds'],
        'PF/ESI': ['pf'],
        'MCA': ['mca'],
        'Income Tax': ['tds'], // Using TDS as proxy for Income Tax
        'Industry': ['industry'],
      };
      if (!catMap[activeCategory]?.includes(mapCategory(d.category))) return false;
    }

    // Status filter
    if (activeStatus === 'Overdue' && !isOverdue(d.status)) return false;
    if (activeStatus === 'Upcoming' && isOverdue(d.status)) return false;
    if (activeStatus === 'Filed this year' && !isDone(d.status)) return false;

    // Search filter
    if (searchQuery && !String(d.title).toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  // Sort deadlines
  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    if (sortBy === 'Due date') {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === 'Penalty (high to low)') {
      return (b.penaltyAccrued || 0) - (a.penaltyAccrued || 0);
    }
    return a.category.localeCompare(b.category);
  });

  const getCategoryCounts = () => {
    const counts: Record<string, number> = { All: deadlines.length };
    categoryTabs.slice(1).forEach(cat => {
      const catMap: Record<string, string[]> = {
        'GST': ['gst'],
        'TDS': ['tds'],
        'PF/ESI': ['pf'],
        'MCA': ['mca'],
        'Income Tax': ['tds'],
        'Industry': ['industry'],
      };
      counts[cat] = deadlines.filter((d: any) => catMap[cat]?.includes(mapCategory(d.category))).length;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  const getRowBackground = (deadline: any) => {
    if (isDone(deadline.status)) return 'bg-muted/50';
    if (isOverdue(deadline.status)) return 'bg-[#FEF2F2] hover:bg-[#FDE8E8]';
    if (deadline.daysLeft <= 7) return 'bg-[#FFFBF0] hover:bg-[#FFF8E6]';
    return 'bg-card hover:bg-muted/30';
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-baseline justify-between mb-6">
          <h1 className="font-display text-2xl md:text-3xl text-foreground">All Deadlines</h1>
          <span className="text-sm font-body text-muted-foreground">{deadlines.length} total this year</span>
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="sticky top-0 z-10 bg-background py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-border mb-4">
          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3">
            {categoryTabs.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-sm font-body font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat} ({categoryCounts[cat] || 0})
              </button>
            ))}
          </div>

          {/* Search, Sort, Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status pills */}
            <div className="flex items-center gap-2">
              {statusFilters.map(status => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-2.5 py-1 text-xs font-body font-medium rounded transition-colors ${
                    activeStatus === status
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm font-body rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px]"
              >
                {sortOptions.map(opt => (
                  <option key={opt} value={opt}>Sort: {opt}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setParams((prev) => ({ ...prev, search: e.target.value || undefined }));
                    }}
                placeholder="Search deadlines..."
                className="pl-9 pr-4 py-2 text-sm font-body rounded-md border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] w-48"
              />
            </div>
          </div>
        </motion.div>

        {/* Deadline table */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          {sortedDeadlines.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-3 font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Form</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Days Left</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Penalty</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeadlines.map((d) => (
                    <tr
                      key={d.id}
                      className={`border-t border-border cursor-pointer transition-colors ${getRowBackground(d)}`}
                      onClick={() => setSelectedDeadline(d)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <DeadlineBadge category={mapCategory(d.category)} label={String(d.category || 'OTHER').toUpperCase()} />
                          <span className={`font-medium ${isDone(d.status) ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {d.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{d.form}</td>
                      <td className="p-3 font-mono text-xs">{String(d.dueDate).slice(0, 10)}</td>
                      <td className="p-3">
                        {isDone(d.status) ? (
                          <span className="text-secondary font-medium flex items-center gap-1">
                            <Check size={14} /> Filed
                          </span>
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
                      <td className="p-3 font-mono text-xs hidden md:table-cell">{d.penaltyRate}</td>
                      <td className="p-3">
                        {isDone(d.status) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-secondary/10 text-secondary">
                            <Check size={12} /> Filed
                          </span>
                        ) : (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
          ) : (
            <div className="rounded-lg border border-border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-body font-semibold text-foreground mb-2">
                {activeStatus === 'Filed this year'
                  ? 'No filed deadlines yet'
                  : `No ${activeCategory !== 'All' ? activeCategory : ''} deadlines found`}
              </h3>
              <p className="text-sm font-body text-muted-foreground">
                {activeStatus === 'Filed this year'
                  ? 'Mark your first deadline as filed from the dashboard.'
                  : activeCategory !== 'All'
                    ? `No ${activeCategory} deadlines found for your profile. Check your compliance scope in Settings.`
                    : 'No deadlines match your current filters.'}
              </p>
              {activeStatus === 'Filed this year' && (
                <a href="/dashboard" className="inline-flex items-center gap-1 mt-4 text-sm font-body font-medium text-primary hover:underline">
                  Go to dashboard <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </motion.div>

        {/* Deadline detail drawer */}
        {selectedDeadline && (
          <>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 w-full max-w-[320px] h-full bg-card border-l border-border shadow-2xl z-50 p-6 overflow-y-auto"
            >
              <button
                onClick={() => setSelectedDeadline(null)}
                className="mb-6 p-2 rounded-md hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <DeadlineBadge category={mapCategory(selectedDeadline.category)} label={String(selectedDeadline.category || 'OTHER').toUpperCase()} />

              <h2 className="font-display text-xl text-foreground mt-3 mb-1">{selectedDeadline.title}</h2>
              <p className="font-body text-sm text-muted-foreground mb-6">Form: {selectedDeadline.form}</p>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-1">Due date</p>
                  <p className="font-mono text-sm text-foreground">{String(selectedDeadline.dueDate).slice(0, 10)}</p>
                  {selectedDeadline.daysLeft < 0 ? (
                    <p className="text-sm font-body text-destructive font-medium">{Math.abs(selectedDeadline.daysLeft)} days overdue</p>
                  ) : selectedDeadline.daysLeft === 0 ? (
                    <p className="text-sm font-body text-destructive font-medium">Due today!</p>
                  ) : (
                    <p className="text-sm font-body text-muted-foreground">{selectedDeadline.daysLeft} days away</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-1">Penalty if missed</p>
                  <p className="font-mono text-sm text-foreground">{selectedDeadline.penaltyRate}</p>
                  {selectedDeadline.penaltyAccrued && isOverdue(selectedDeadline.status) && (
                    <p className="font-mono text-lg text-destructive font-bold mt-1">
                      ₹{selectedDeadline.penaltyAccrued.toLocaleString('en-IN')} accrued
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-1">Category</p>
                  <DeadlineBadge category={mapCategory(selectedDeadline.category)} label={String(selectedDeadline.category || 'OTHER').toUpperCase()} />
                </div>

                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-2">Government portal</p>
                  <a
                    href={selectedDeadline.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium rounded-md border border-primary text-primary hover:bg-primary/5 transition-colors"
                  >
                    File on portal <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <button
                onClick={() => {
                  markFiled.mutate(selectedDeadline.id);
                  setSelectedDeadline(null);
                }}
                className="w-full px-4 py-3 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px]"
              >
                Mark as filed
              </button>
            </motion.div>
            <div
              className="fixed inset-0 bg-foreground/15 z-40"
              onClick={() => setSelectedDeadline(null)}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default DeadlinesPage;
