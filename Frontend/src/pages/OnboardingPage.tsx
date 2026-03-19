import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StepWizard from '@/components/StepWizard';
import { motion } from 'framer-motion';
import { Building2, FileText, Users, MapPin, Factory, TrendingUp, Globe, Heart } from 'lucide-react';
import { useSaveProfile } from '@/hooks/useBusiness';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

interface OptionCardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const OptionCard = ({ label, selected, onClick, icon }: OptionCardProps) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-lg border-2 text-left font-body text-sm font-medium transition-all min-h-[56px] flex items-center gap-3 ${
      selected
        ? 'border-primary bg-primary/5 text-foreground'
        : 'border-border bg-card text-muted-foreground hover:border-primary/40'
    }`}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    {label}
  </button>
);

const OnboardingPage = () => {
  const navigate = useNavigate();
  const saveProfile = useSaveProfile();
  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem('onboarding_step');
    return saved ? parseInt(saved) : 1;
  });
  const [loading, setLoading] = useState(false);

  // Answers
  const [entityType, setEntityType] = useState('');
  const [gstStatus, setGstStatus] = useState('');
  const [employees, setEmployees] = useState('');
  const [states, setStates] = useState<string[]>(['Maharashtra']);
  const [stateSearch, setStateSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [turnover, setTurnover] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [poshStatus, setPoshStatus] = useState('');

  useEffect(() => {
    localStorage.setItem('onboarding_step', String(step));
  }, [step]);

  const canContinue = () => {
    switch (step) {
      case 1: return !!entityType;
      case 2: return !!gstStatus;
      case 3: return !!employees;
      case 4: return states.length > 0;
      case 5: return !!industry;
      case 6: return !!turnover;
      case 7: return !!exportStatus;
      case 8: return !!poshStatus;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const entityTypeMap: Record<string, 'PROPRIETOR' | 'PVT_LTD' | 'LLP' | 'PARTNERSHIP'> = {
        proprietorship: 'PROPRIETOR',
        'pvt-ltd': 'PVT_LTD',
        llp: 'LLP',
        partnership: 'PARTNERSHIP',
      };
      const gstStatusMap: Record<string, 'REGULAR' | 'COMPOSITION' | 'NOT_REGISTERED' | 'PENDING'> = {
        regular: 'REGULAR',
        composition: 'COMPOSITION',
        'not-registered': 'NOT_REGISTERED',
        applied: 'PENDING',
      };
      const employeeMap: Record<string, 'SOLO' | 'SMALL' | 'GROWING' | 'MID' | 'LARGE'> = {
        'Just me (0–1)': 'SOLO',
        '2–9 employees': 'SMALL',
        '10–19 employees': 'GROWING',
        '20–99 employees': 'MID',
        '100+ employees': 'LARGE',
      };
      const industryMap: Record<string, 'TRADING' | 'MANUFACTURING' | 'FOOD' | 'IT_SERVICES' | 'EXPORT_IMPORT' | 'OTHER'> = {
        trading: 'TRADING',
        manufacturing: 'MANUFACTURING',
        food: 'FOOD',
        'it-services': 'IT_SERVICES',
        'export-import': 'EXPORT_IMPORT',
        other: 'OTHER',
      };
      const turnoverMap: Record<string, 'UNDER_20L' | 'L20_1CR5' | 'CR1_5_5' | 'CR5_20' | 'ABOVE_20CR'> = {
        'Under ₹20 lakh': 'UNDER_20L',
        '₹20L – ₹1.5 crore': 'L20_1CR5',
        '₹1.5Cr – ₹5 crore': 'CR1_5_5',
        '₹5Cr – ₹20 crore': 'CR5_20',
        'Above ₹20 crore': 'ABOVE_20CR',
      };

      await saveProfile.mutateAsync({
        name: 'My Business',
        gstin: undefined,
        entityType: entityTypeMap[entityType],
        gstStatus: gstStatusMap[gstStatus],
        employeeRange: employeeMap[employees],
        states,
        industry: industryMap[industry],
        turnoverRange: turnoverMap[turnover],
        isExporter: exportStatus !== 'No',
        hasPoshObligation: poshStatus !== 'No women employees',
      });
      localStorage.setItem('onboarding_complete', 'true');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl text-foreground mb-2">Building your compliance calendar...</h2>
          <p className="font-body text-muted-foreground">Aapka compliance calendar ready ho raha hai</p>
        </motion.div>
      </div>
    );
  }

  const filteredStates = INDIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">What type of business is this?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">This determines which compliance laws apply to you.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'proprietorship', label: 'Sole Proprietorship', icon: <Building2 size={20} /> },
                { val: 'pvt-ltd', label: 'Private Limited Company', icon: <Building2 size={20} /> },
                { val: 'llp', label: 'LLP', icon: <FileText size={20} /> },
                { val: 'partnership', label: 'Partnership Firm', icon: <Users size={20} /> },
              ].map(opt => (
                <OptionCard key={opt.val} label={opt.label} icon={opt.icon} selected={entityType === opt.val} onClick={() => setEntityType(opt.val)} />
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">Are you registered for GST?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">Determines which GST returns you need to file.</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { val: 'regular', label: 'Yes — Regular taxpayer' },
                { val: 'composition', label: 'Yes — Composition scheme' },
                { val: 'not-registered', label: 'No — Not registered' },
                { val: 'applied', label: 'Applied, awaiting registration' },
              ].map(opt => (
                <OptionCard key={opt.val} label={opt.label} selected={gstStatus === opt.val} onClick={() => setGstStatus(opt.val)} />
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">How many employees do you have?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">PF and ESI obligations depend on employee count.</p>
            <div className="grid grid-cols-1 gap-3">
              {['Just me (0–1)', '2–9 employees', '10–19 employees', '20–99 employees', '100+ employees'].map((opt, i) => (
                <OptionCard key={i} label={opt} selected={employees === opt} onClick={() => setEmployees(opt)} />
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">Which states does your business operate in?</h2>
            <p className="font-body text-sm text-muted-foreground mb-4">Select all that apply. Some states have additional compliance requirements.</p>
            <input
              type="text"
              placeholder="Search states..."
              value={stateSearch}
              onChange={e => setStateSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm font-body text-foreground placeholder:text-muted-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
            />
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {filteredStates.map(s => (
                <button
                  key={s}
                  onClick={() => setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-colors min-h-[32px] ${
                    states.includes(s)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">What industry are you in?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">Industry-specific compliances like FSSAI, Factory Act, etc.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'trading', label: 'Trading / Wholesale', icon: <TrendingUp size={20} /> },
                { val: 'manufacturing', label: 'Manufacturing / Factory', icon: <Factory size={20} /> },
                { val: 'food', label: 'Food & Restaurant', icon: <Heart size={20} /> },
                { val: 'it-services', label: 'IT / Services / Consulting', icon: <Globe size={20} /> },
                { val: 'export-import', label: 'Export / Import', icon: <Globe size={20} /> },
                { val: 'other', label: 'Other', icon: <Building2 size={20} /> },
              ].map(opt => (
                <OptionCard key={opt.val} label={opt.label} icon={opt.icon} selected={industry === opt.val} onClick={() => setIndustry(opt.val)} />
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">What is your approximate annual turnover?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">Affects GST audit requirements and TDS thresholds.</p>
            <div className="grid grid-cols-1 gap-3">
              {['Under ₹20 lakh', '₹20L – ₹1.5 crore', '₹1.5Cr – ₹5 crore', '₹5Cr – ₹20 crore', 'Above ₹20 crore'].map((opt, i) => (
                <OptionCard key={i} label={opt} selected={turnover === opt} onClick={() => setTurnover(opt)} />
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">Do you export goods or services outside India?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">Export businesses have additional compliance for LUT, FIRC, etc.</p>
            <div className="grid grid-cols-1 gap-3">
              {['Yes — regularly', 'Yes — occasionally', 'No'].map((opt, i) => (
                <OptionCard key={i} label={opt} selected={exportStatus === opt} onClick={() => setExportStatus(opt)} />
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div>
            <h2 className="font-display text-2xl text-foreground mb-2">Do you have women employees?</h2>
            <p className="font-body text-sm text-muted-foreground mb-6">Organizations with 10+ employees must comply with POSH Act requirements.</p>
            <div className="grid grid-cols-1 gap-3">
              {['Yes — 10 or more', 'Yes — fewer than 10', 'No women employees'].map((opt, i) => (
                <OptionCard key={i} label={opt} selected={poshStatus === opt} onClick={() => setPoshStatus(opt)} />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <StepWizard
      totalSteps={8}
      currentStep={step}
      onBack={() => setStep(Math.max(1, step - 1))}
      onContinue={() => {
        if (step === 8) void handleComplete();
        else setStep(Math.min(8, step + 1));
      }}
      canContinue={canContinue()}
    >
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        {renderStep()}
      </motion.div>
    </StepWizard>
  );
};

export default OnboardingPage;
