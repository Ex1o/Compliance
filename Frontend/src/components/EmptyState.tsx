import { ReactNode } from 'react';
import { Shield, Calendar, FileText, CheckCircle2, AlertTriangle, Users, Search, Bell } from 'lucide-react';

type EmptyStateVariant = 'shield' | 'calendar' | 'document' | 'success' | 'warning' | 'users' | 'search' | 'notifications';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const variantIcons: Record<EmptyStateVariant, typeof Shield> = {
  shield: Shield,
  calendar: Calendar,
  document: FileText,
  success: CheckCircle2,
  warning: AlertTriangle,
  users: Users,
  search: Search,
  notifications: Bell,
};

const variantColors: Record<EmptyStateVariant, string> = {
  shield: 'text-secondary bg-secondary/10',
  calendar: 'text-primary bg-primary/10',
  document: 'text-muted-foreground bg-muted',
  success: 'text-secondary bg-secondary/10',
  warning: 'text-[#D4820A] bg-[#FFFBF0]',
  users: 'text-muted-foreground bg-muted',
  search: 'text-muted-foreground bg-muted',
  notifications: 'text-primary bg-primary/10',
};

const EmptyState = ({
  variant = 'document',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => {
  const Icon = variantIcons[variant];
  const colorClasses = variantColors[variant];

  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center ${className}`}>
      {/* Icon container with SVG illustration */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${colorClasses}`}>
        <Icon size={28} />
      </div>

      {/* Title */}
      <h3 className="font-body font-semibold text-foreground mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm font-body text-muted-foreground max-w-sm">{description}</p>

      {/* Optional action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// Shield with checkmark SVG illustration for compliance success
export const ShieldSuccessSVG = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full ${className}`}
  >
    <path
      d="M32 4L8 14V30C8 46 18.4 55.6 32 60C45.6 55.6 56 46 56 30V14L32 4Z"
      fill="hsl(var(--secondary) / 0.15)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 32L28 38L42 24"
      stroke="hsl(var(--secondary))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Calendar with checkmark SVG illustration
export const CalendarSuccessSVG = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full ${className}`}
  >
    <rect
      x="8"
      y="12"
      width="48"
      height="44"
      rx="4"
      fill="hsl(var(--primary) / 0.15)"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
    />
    <path
      d="M8 24H56"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
    />
    <path
      d="M20 8V16"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M44 8V16"
      stroke="hsl(var(--primary))"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M24 38L30 44L42 32"
      stroke="hsl(var(--secondary))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Document empty SVG illustration
export const DocumentEmptySVG = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full ${className}`}
  >
    <path
      d="M16 8H40L52 20V56H16V8Z"
      fill="hsl(var(--muted))"
      stroke="hsl(var(--muted-foreground) / 0.5)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M40 8V20H52"
      stroke="hsl(var(--muted-foreground) / 0.5)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 32H44"
      stroke="hsl(var(--muted-foreground) / 0.3)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M24 40H36"
      stroke="hsl(var(--muted-foreground) / 0.3)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// All clear mascot SVG
export const AllClearSVG = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-full ${className}`}
  >
    {/* Background circle */}
    <circle cx="40" cy="40" r="36" fill="hsl(var(--secondary) / 0.1)" />

    {/* Shield body */}
    <path
      d="M40 12L20 20V36C20 48 28 56 40 60C52 56 60 48 60 36V20L40 12Z"
      fill="hsl(var(--secondary) / 0.2)"
      stroke="hsl(var(--secondary))"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Checkmark */}
    <path
      d="M30 38L36 44L50 30"
      stroke="hsl(var(--secondary))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Sparkles */}
    <circle cx="16" cy="24" r="2" fill="hsl(var(--primary))" />
    <circle cx="64" cy="28" r="1.5" fill="hsl(var(--primary))" />
    <circle cx="68" cy="52" r="2" fill="hsl(var(--secondary))" />
    <circle cx="12" cy="48" r="1.5" fill="hsl(var(--secondary))" />
  </svg>
);

export default EmptyState;
