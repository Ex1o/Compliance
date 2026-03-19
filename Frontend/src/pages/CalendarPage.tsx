import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import DeadlineBadge from '@/components/DeadlineBadge';
import { useCalendar, useMarkFiled } from '@/hooks/useDeadlines';
import { ChevronLeft, ChevronRight, X, ExternalLink, Calendar } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedDeadline, setSelectedDeadline] = useState<any | null>(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const { data, isLoading } = useCalendar(year, month);
  const markFiled = useMarkFiled();

  const today = new Date();
  const monthIndex = month - 1;
  const deadlinesByDay = data?.data?.deadlines || {};
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const totalDays = lastDay.getDate();

  const getDeadlinesForDay = (day: number) => {
    return deadlinesByDay[String(day)] || [];
  };

  const isToday = (day: number) => {
    return year === today.getFullYear() && monthIndex === today.getMonth() && day === today.getDate();
  };

  const isPast = (day: number) => {
    const cellDate = new Date(year, monthIndex, day);
    return cellDate < today;
  };

  const hasOverdue = (dayDeadlines: any[]) => {
    return dayDeadlines.some(d => d.status === 'OVERDUE');
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const categoryColor: Record<string, string> = {
    gst: 'bg-[hsl(var(--pill-gst))]',
    tds: 'bg-[hsl(var(--pill-tds))]',
    pf: 'bg-[hsl(var(--pill-pf))]',
    mca: 'bg-[hsl(var(--pill-mca))]',
    industry: 'bg-[hsl(var(--pill-industry))]',
  };

  const mapCategory = (category: string) => {
    const value = category?.toLowerCase();
    if (value === 'gst' || value === 'tds' || value === 'pf' || value === 'mca') return value;
    return 'industry';
  };

  const listDeadlines: any[] = Object.entries(deadlinesByDay).flatMap(([day, items]) =>
    (items as any[]).map((item) => ({ ...item, day: Number(day) }))
  );

  const handleMarkFiled = (deadline: any) => {
    markFiled.mutate(deadline.id);
    setSelectedDeadline(null);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl md:text-3xl text-foreground">My Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-xs font-body font-medium rounded-md transition-colors min-h-[36px] ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >Monthly</button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-body font-medium rounded-md transition-colors min-h-[36px] ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >List</button>
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-2 rounded-md hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display text-xl text-foreground">{MONTHS[monthIndex]} {year}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-2 rounded-md hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
        {isLoading && (
          <div className="animate-pulse space-y-4 mb-4">
            <div className="h-24 bg-warm-100 rounded-lg" />
            <div className="h-48 bg-warm-100 rounded-lg" />
          </div>
        )}

        {view === 'calendar' ? (
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-7">
              {DAYS.map(d => (
                <div key={d} className="p-2 text-center text-xs font-body font-medium text-muted-foreground bg-muted border-b border-border">{d}</div>
              ))}
              {cells.map((day, i) => {
                const dayDeadlines = day ? getDeadlinesForDay(day) : [];
                const isTodayCell = day ? isToday(day) : false;
                const isPastCell = day ? isPast(day) : false;
                const hasOverdueDeadlines = isPastCell && hasOverdue(dayDeadlines);

                return (
                  <div
                    key={i}
                    className={`min-h-[80px] md:min-h-[100px] p-1.5 border-b border-r border-border transition-colors ${
                      day
                        ? hasOverdueDeadlines
                          ? 'bg-[#FEF2F2]'
                          : 'bg-card'
                        : 'bg-muted/50'
                    } ${isTodayCell ? 'ring-[1.5px] ring-inset ring-primary' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-body ${isTodayCell ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayDeadlines.map(dl => (
                            <div key={dl.id} className="relative">
                              <button
                                onClick={() => setSelectedDeadline(dl)}
                                className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] md:text-xs font-body font-medium text-primary-foreground truncate ${
                                  dl.status === 'OVERDUE'
                                    ? 'bg-[#E24B4A] animate-pulse-deadline'
                                    : categoryColor[mapCategory(dl.category)]
                                }`}
                              >
                                {dl.title}
                              </button>
                              {dl.status === 'OVERDUE' && (
                                <span className="block text-[10px] font-body font-medium text-destructive mt-0.5">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {listDeadlines.length > 0 ? (
              listDeadlines
                .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
                .map(d => (
                  <button key={d.id} onClick={() => setSelectedDeadline(d)} className="w-full text-left p-4 rounded-lg border border-border bg-card card-hover flex items-center gap-4">
                    <DeadlineBadge category={mapCategory(d.category)} label={String(d.category || 'OTHER').toUpperCase()} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-foreground truncate">{d.title}</p>
                      <p className="text-xs font-body text-muted-foreground">Due: <span className="font-mono">{String(d.dueDate).slice(0, 10)}</span></p>
                    </div>
                    <span className={`text-xs font-body font-medium ${d.status === 'OVERDUE' ? 'text-destructive' : (d.daysLeft || 0) <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {(d.daysLeft || 0) < 0 ? `${Math.abs(d.daysLeft)}d overdue` : d.daysLeft === 0 ? 'Today' : `${d.daysLeft}d left`}
                    </span>
                  </button>
                ))
            ) : (
              <div className="rounded-lg border border-border p-12 text-center">
                <Calendar className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-body font-semibold text-foreground mb-2">No deadlines this month</h3>
                <p className="text-sm font-body text-muted-foreground">All clear for this period.</p>
              </div>
            )}
          </div>
        )}

        {/* Drawer */}
        {selectedDeadline && (
          <>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 right-0 w-full max-w-[320px] h-full bg-card border-l border-[#E8E4DF] shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="font-display text-xl text-foreground">{selectedDeadline.title}</h2>
                    <p className="font-body text-sm text-muted-foreground mt-1">{selectedDeadline.form}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDeadline(null)}
                    className="p-2 rounded-md hover:bg-muted transition-colors -mr-2 -mt-2"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Due date</p>
                  <p className="font-mono text-base text-foreground">{String(selectedDeadline.dueDate).slice(0, 10)}</p>
                  {selectedDeadline.daysLeft < 0 ? (
                    <p className="text-sm font-body text-destructive font-medium mt-1">
                      {Math.abs(selectedDeadline.daysLeft)} days overdue
                    </p>
                  ) : selectedDeadline.daysLeft === 0 ? (
                    <p className="text-sm font-body text-destructive font-medium mt-1">Due today!</p>
                  ) : (
                    <p className="text-sm font-body text-muted-foreground mt-1">{selectedDeadline.daysLeft} days away</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">Penalty if missed</p>
                  <p className="font-mono text-sm text-foreground">{selectedDeadline.penaltyRate || `₹${selectedDeadline.accrued || 0}`}</p>
                  {selectedDeadline.status === 'OVERDUE' && selectedDeadline.accrued && (
                    <p className="font-mono text-2xl text-destructive font-bold mt-2">
                      ₹{selectedDeadline.accrued.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2">Category</p>
                  <DeadlineBadge category={mapCategory(selectedDeadline.category)} label={String(selectedDeadline.category || 'OTHER').toUpperCase()} />
                </div>

                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-2">Government portal</p>
                  <a
                    href={selectedDeadline.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-body font-medium rounded-md border border-primary text-primary hover:bg-primary/5 transition-colors"
                  >
                    File on portal <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border">
                <button
                  onClick={() => handleMarkFiled(selectedDeadline)}
                  className="w-full px-4 py-3 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[48px]"
                >
                  Mark as filed
                </button>
              </div>
            </motion.div>
            <div
              className="fixed inset-0 bg-black/15 z-40"
              onClick={() => setSelectedDeadline(null)}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
