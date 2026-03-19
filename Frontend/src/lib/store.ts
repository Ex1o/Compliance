import { create } from 'zustand';

export type EntityType = 'proprietorship' | 'pvt-ltd' | 'llp' | 'partnership';
export type GSTStatus = 'regular' | 'composition' | 'not-registered' | 'applied';
export type EmployeeRange = '0-1' | '2-9' | '10-19' | '20-99' | '100+';
export type Industry = 'trading' | 'manufacturing' | 'food' | 'it-services' | 'export-import' | 'other';
export type TurnoverRange = 'under-20l' | '20l-1.5cr' | '1.5cr-5cr' | '5cr-20cr' | 'above-20cr';
export type ExportStatus = 'regularly' | 'occasionally' | 'no';
export type POSHStatus = '10+' | 'under-10' | 'no';

export interface UserProfile {
  businessName: string;
  gstin: string;
  mobile: string;
  email: string;
  entityType: EntityType;
  gstStatus: GSTStatus;
  employeeRange: EmployeeRange;
  states: string[];
  industry: Industry;
  turnover: TurnoverRange;
  exportStatus: ExportStatus;
  poshStatus: POSHStatus;
}

export type DeadlineStatus = 'overdue' | 'warning' | 'upcoming' | 'done';
export type DeadlineCategory = 'gst' | 'tds' | 'pf' | 'mca' | 'industry';

export interface Deadline {
  id: string;
  title: string;
  form: string;
  dueDate: string;
  category: DeadlineCategory;
  penaltyRate: string;
  penaltyAccrued?: number;
  daysLeft: number;
  status: DeadlineStatus;
  portalUrl: string;
}

export interface ClientBusiness {
  id: string;
  businessName: string;
  entityType: string;
  ownerName: string;
  mobile: string;
  nextDeadline: string;
  daysLeft: number;
  overdueCount: number;
  score: number;
  deadlines: Deadline[];
}

export const DUMMY_DEADLINES: Deadline[] = [
  {
    id: '1', title: 'GSTR-1', form: 'GSTR-1', dueDate: '2026-03-25',
    category: 'gst', penaltyRate: '₹50/day', daysLeft: 7, status: 'warning',
    portalUrl: 'https://gst.gov.in',
  },
  {
    id: '2', title: 'TDS Deposit', form: 'Challan 281', dueDate: '2026-03-15',
    category: 'tds', penaltyRate: '1.5% per month', penaltyAccrued: 450, daysLeft: -3, status: 'overdue',
    portalUrl: 'https://incometax.gov.in',
  },
  {
    id: '3', title: 'PF Deposit', form: 'ECR', dueDate: '2026-03-29',
    category: 'pf', penaltyRate: '12% p.a. + damages', daysLeft: 11, status: 'upcoming',
    portalUrl: 'https://unifiedportal.epfindia.gov.in',
  },
  {
    id: '4', title: 'GSTR-3B', form: 'GSTR-3B', dueDate: '2026-04-02',
    category: 'gst', penaltyRate: '₹50/day', daysLeft: 15, status: 'upcoming',
    portalUrl: 'https://gst.gov.in',
  },
  {
    id: '5', title: 'ESI Deposit', form: 'ESI Challan', dueDate: '2026-03-29',
    category: 'pf', penaltyRate: '12% p.a.', daysLeft: 11, status: 'upcoming',
    portalUrl: 'https://esic.gov.in',
  },
  {
    id: '6', title: 'DIR-3 KYC', form: 'DIR-3 KYC', dueDate: '2025-09-30',
    category: 'mca', penaltyRate: '₹5,000 fixed', penaltyAccrued: 5000, daysLeft: -169, status: 'overdue',
    portalUrl: 'https://mca.gov.in',
  },
];

export const DUMMY_PROFILE: UserProfile = {
  businessName: 'Rajesh Textiles Pvt Ltd',
  gstin: '27AABCR1234K1Z5',
  mobile: '9876543210',
  email: 'rajesh@rajeshtextiles.in',
  entityType: 'pvt-ltd',
  gstStatus: 'regular',
  employeeRange: '20-99',
  states: ['Maharashtra'],
  industry: 'manufacturing',
  turnover: '1.5cr-5cr',
  exportStatus: 'no',
  poshStatus: '10+',
};

export const DUMMY_CLIENTS: ClientBusiness[] = [
  {
    id: 'c1', businessName: 'Rajesh Textiles Pvt Ltd', entityType: 'Pvt Ltd',
    ownerName: 'Rajesh Agarwal', mobile: '9876543210',
    nextDeadline: 'GSTR-1', daysLeft: 4, overdueCount: 2, score: 72,
    deadlines: DUMMY_DEADLINES.slice(0, 3),
  },
  {
    id: 'c2', businessName: 'Kavitha Enterprises', entityType: 'Proprietorship',
    ownerName: 'Kavitha Rao', mobile: '9876543211',
    nextDeadline: 'GSTR-3B', daysLeft: 15, overdueCount: 0, score: 94,
    deadlines: DUMMY_DEADLINES.slice(3, 5),
  },
  {
    id: 'c3', businessName: 'Suresh Foods Pvt Ltd', entityType: 'Pvt Ltd',
    ownerName: 'Suresh Patel', mobile: '9876543212',
    nextDeadline: 'ESI Deposit', daysLeft: 0, overdueCount: 0, score: 85,
    deadlines: DUMMY_DEADLINES.slice(4, 6),
  },
  {
    id: 'c4', businessName: 'Amit Trading Co', entityType: 'Partnership',
    ownerName: 'Amit Gupta', mobile: '9876543213',
    nextDeadline: 'TDS Deposit', daysLeft: -3, overdueCount: 4, score: 51,
    deadlines: DUMMY_DEADLINES,
  },
  {
    id: 'c5', businessName: 'Priya Consulting LLP', entityType: 'LLP',
    ownerName: 'Priya Sharma', mobile: '9876543214',
    nextDeadline: 'GSTR-3B', daysLeft: 15, overdueCount: 0, score: 98,
    deadlines: DUMMY_DEADLINES.slice(3, 4),
  },
];

interface AppState {
  role: 'msme' | 'ca';
  language: 'en' | 'hi';
  profile: UserProfile;
  deadlines: Deadline[];
  clients: ClientBusiness[];
  onboardingStep: number;
  onboardingComplete: boolean;
  setRole: (role: 'msme' | 'ca') => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  markDeadlineFiled: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'msme',
  language: (localStorage.getItem('language') as 'en' | 'hi') || 'en',
  profile: DUMMY_PROFILE,
  deadlines: DUMMY_DEADLINES,
  clients: DUMMY_CLIENTS,
  onboardingStep: 1,
  onboardingComplete: localStorage.getItem('onboarding_complete') === 'true',
  setRole: (role) => set({ role }),
  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },
  setOnboardingStep: (step) => {
    localStorage.setItem('onboarding_step', String(step));
    set({ onboardingStep: step });
  },
  completeOnboarding: () => {
    localStorage.setItem('onboarding_complete', 'true');
    set({ onboardingComplete: true });
  },
  markDeadlineFiled: (id) => set((state) => ({
    deadlines: state.deadlines.map(d =>
      d.id === id ? { ...d, status: 'done' as DeadlineStatus, daysLeft: 0 } : d
    ),
  })),
}));
