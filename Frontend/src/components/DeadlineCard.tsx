import type { DeadlineStatus, DeadlineCategory } from '@/lib/store';

interface DeadlineCardProps {
  title: string;
  dueDate: string;
  daysLeft: number;
  penaltyRate: string;
  status: DeadlineStatus;
  category: DeadlineCategory;
  variant?: 'compact' | 'full';
  onFile?: () => void;
  onMark?: () => void;
}

const statusClasses: Record<DeadlineStatus, string> = {
  overdue: 'status-overdue',
  warning: 'status-warning',
  upcoming: 'status-upcoming',
  done: 'status-done',
};

const statusLabel: Record<DeadlineStatus, string> = {
  overdue: 'Overdue',
  warning: 'Due Soon',
  upcoming: 'Upcoming',
  done: 'Filed',
};

const DeadlineCard = ({
  title, dueDate, daysLeft, penaltyRate, status, variant = 'compact', onFile, onMark,
}: DeadlineCardProps) => {
  return (
    <div className={`rounded-lg border p-4 card-hover ${statusClasses[status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-body font-semibold text-foreground truncate">{title}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full font-body ${
              status === 'overdue' ? 'bg-destructive text-destructive-foreground' :
              status === 'warning' ? 'bg-warning text-warning-foreground' :
              status === 'done' ? 'bg-secondary text-secondary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {statusLabel[status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            Due: <span className="font-mono text-sm">{dueDate}</span>
          </p>
          {status !== 'done' && (
            <p className="text-sm text-muted-foreground font-body mt-1">
              {daysLeft < 0
                ? <span className="text-destructive font-medium">{Math.abs(daysLeft)} days overdue</span>
                : daysLeft === 0
                  ? <span className="text-destructive font-medium">Due today!</span>
                  : <span>{daysLeft} days left</span>
              }
              {' · '}Penalty: <span className="font-mono text-sm">{penaltyRate}</span>
            </p>
          )}
        </div>
        {variant === 'full' && status !== 'done' && (
          <div className="flex flex-col gap-2 shrink-0">
            {onFile && (
              <button onClick={onFile} className="px-3 py-1.5 text-xs font-body font-medium rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors">
                File now →
              </button>
            )}
            {onMark && (
              <button onClick={onMark} className="px-3 py-1.5 text-xs font-body font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-forest-dark hover:text-secondary-foreground transition-colors">
                Mark as filed ✓
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlineCard;
