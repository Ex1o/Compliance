import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/store/auth.store';
import { useBusinessProfile } from '@/hooks/useBusiness';
import { businessService } from '@/services/business.service';
import { paymentsService } from '@/services/payments.service';
import { User, Bell, ListChecks, CreditCard, Users, FileText, Building2, Briefcase, Factory, Calculator, Receipt, Copy, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const sections = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'compliance', label: 'Compliance Scope', icon: ListChecks },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'ca-access', label: 'CA Access', icon: Users },
  { id: 'language', label: 'Language', icon: Globe },
];

const complianceCategories = [
  { id: 'gst', name: 'GST filings', icon: Receipt, badgeColor: 'bg-[#E24B4A]' },
  { id: 'tds', name: 'TDS / TCS', icon: FileText, badgeColor: 'bg-[#378ADD]' },
  { id: 'pf', name: 'PF / EPFO', icon: Users, badgeColor: 'bg-[#639922]' },
  { id: 'esi', name: 'ESI / ESIC', icon: Users, badgeColor: 'bg-[#639922]' },
  { id: 'mca', name: 'MCA / ROC filings', icon: Building2, badgeColor: 'bg-[#7F77DD]' },
  { id: 'income-tax', name: 'Income Tax', icon: Calculator, badgeColor: 'bg-[#D4820A]' },
  { id: 'professional-tax', name: 'Professional Tax', icon: Briefcase, badgeColor: 'bg-[#6B7280]' },
  { id: 'industry', name: 'Industry-specific', icon: Factory, badgeColor: 'bg-[#E05C00]' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useAppStore();
  const { user } = useAuthStore();
  const { data: profileData, isLoading: profileLoading } = useBusinessProfile();
  const profile = profileData?.data;
  const { data: notificationData } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: businessService.getNotificationPreferences,
  });
  const notificationPrefs = notificationData?.data || {};
  const updatePrefs = useMutation({
    mutationFn: businessService.updateNotificationPreferences,
    onSuccess: () => toast.success('Preferences saved'),
  });
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: paymentsService.getCurrentSubscription,
  });
  const sub = subscriptionData?.data;
  const [activeSection, setActiveSection] = useState('profile');

  // Notifications state
  const [whatsapp, setWhatsapp] = useState(true);
  const [sms, setSms] = useState(false);
  const [emailDigest, setEmailDigest] = useState(false);
  const [reminder7days, setReminder7days] = useState(true);
  const [reminder3days, setReminder3days] = useState(true);
  const [reminderDueDate, setReminderDueDate] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:00 AM');

  // Compliance scope state
  const [complianceToggles, setComplianceToggles] = useState<Record<string, boolean>>({
    gst: true, tds: true, pf: true, esi: true, mca: true, 'income-tax': true, 'professional-tax': true, industry: true
  });

  // CA Access state
  const [caMobile, setCaMobile] = useState('');
  const [copied, setCopied] = useState(false);
  const caInviteLink = 'compliancewala.in/ca-invite/abc123';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(caInviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = () => {
    if (caMobile.length === 10) {
      toast.success('Invite sent to CA via WhatsApp');
      setCaMobile('');
    }
  };

  const updateNotificationField = (key: string, value: boolean | string) => {
    updatePrefs.mutate({ ...notificationPrefs, [key]: value });
  };

  const handleUpgrade = async (plan: 'GROWTH' | 'CA_PARTNER') => {
    const res = await paymentsService.createSubscription(plan);
    const { subscriptionId, keyId, amount } = res.data;
    const rzp = new (window as any).Razorpay({
      key: keyId,
      subscription_id: subscriptionId,
      name: 'ComplianceWala',
      description: `${plan} Plan Subscription`,
      image: '/logo.png',
      currency: 'INR',
      amount,
      theme: { color: '#E05C00' },
      prefill: {
        contact: user?.mobile || '',
      },
      handler: () => {
        toast.success('Subscription activated! Reloading...');
        setTimeout(() => window.location.reload(), 2000);
      },
      modal: {
        ondismiss: () => toast.info('Payment cancelled'),
      },
    });
    rzp.open();
  };

  const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description?: string }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <span className="text-sm font-body font-medium text-foreground">{label}</span>
        {description && <p className="text-xs font-body text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        className={`relative w-11 h-6 rounded-full transition-colors min-h-[24px] shrink-0 ml-4 ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={onChange}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          checked ? 'bg-primary border-primary' : 'border-border'
        }`}
      >
        {checked && <Check size={12} className="text-primary-foreground" />}
      </div>
      <span className="text-sm font-body text-foreground">{label}</span>
    </label>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="font-display text-2xl md:text-3xl text-foreground mb-6">
          Settings
        </motion.h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Section nav */}
          <nav className="md:w-52 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-body font-medium transition-colors whitespace-nowrap min-h-[44px] ${
                    activeSection === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}>
                  <s.icon size={16} />
                  {s.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 rounded-lg border border-border bg-card p-6">
            {activeSection === 'profile' && (
              <div>
                <h2 className="font-body font-semibold text-foreground mb-4">My Profile</h2>
                {profileLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-warm-100 rounded-lg" />
                    <div className="h-48 bg-warm-100 rounded-lg" />
                  </div>
                ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Business Name', value: profile?.name || '-' },
                    { label: 'GSTIN', value: profile?.gstin || '-', mono: true },
                    { label: 'Entity Type', value: profile?.entityType || '-' },
                    { label: 'Industry', value: profile?.industry || '-' },
                    { label: 'State', value: profile?.states?.join(', ') || '-' },
                    { label: 'Turnover', value: profile?.turnoverRange || '-' },
                    { label: 'Employee Range', value: profile?.employeeRange || '-' },
                  ].map(field => (
                    <div key={field.label}>
                      <p className="text-xs font-body font-medium text-muted-foreground mb-1">{field.label}</p>
                      <p className={`text-sm text-foreground ${field.mono ? 'font-mono' : 'font-body'}`}>{field.value}</p>
                    </div>
                  ))}
                </div>
                )}
                <button onClick={() => navigate('/onboarding')} className="mt-6 px-4 py-2 text-sm font-body font-medium rounded-md border border-border hover:bg-muted transition-colors min-h-[44px]">
                  Edit Profile
                </button>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h2 className="font-body font-semibold text-foreground mb-4">Reminder preferences</h2>
                <div className="divide-y divide-border">
                  <Toggle
                    checked={notificationPrefs.whatsapp ?? whatsapp}
                    onChange={() => {
                      const value = !(notificationPrefs.whatsapp ?? whatsapp);
                      setWhatsapp(value);
                      updateNotificationField('whatsapp', value);
                    }}
                    label="WhatsApp reminders"
                    description="Receive reminders on WhatsApp before each deadline"
                  />
                  <Toggle
                    checked={notificationPrefs.sms ?? sms}
                    onChange={() => {
                      const value = !(notificationPrefs.sms ?? sms);
                      setSms(value);
                      updateNotificationField('sms', value);
                    }}
                    label="SMS fallback"
                    description="Send SMS if WhatsApp delivery fails"
                  />
                  <Toggle
                    checked={notificationPrefs.emailDigest ?? emailDigest}
                    onChange={() => {
                      const value = !(notificationPrefs.emailDigest ?? emailDigest);
                      setEmailDigest(value);
                      updateNotificationField('emailDigest', value);
                    }}
                    label="Weekly email digest"
                    description="Summary of upcoming deadlines every Monday"
                  />
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-body font-semibold text-foreground mb-4">Reminder timing</h3>
                  <div className="space-y-3">
                    <Checkbox
                      checked={notificationPrefs.reminder7days ?? reminder7days}
                      onChange={() => {
                        const value = !(notificationPrefs.reminder7days ?? reminder7days);
                        setReminder7days(value);
                        updateNotificationField('reminder7days', value);
                      }}
                      label="7 days before deadline"
                    />
                    <Checkbox
                      checked={notificationPrefs.reminder3days ?? reminder3days}
                      onChange={() => {
                        const value = !(notificationPrefs.reminder3days ?? reminder3days);
                        setReminder3days(value);
                        updateNotificationField('reminder3days', value);
                      }}
                      label="3 days before deadline"
                    />
                    <Checkbox
                      checked={notificationPrefs.reminderDueDate ?? reminderDueDate}
                      onChange={() => {
                        const value = !(notificationPrefs.reminderDueDate ?? reminderDueDate);
                        setReminderDueDate(value);
                        updateNotificationField('reminderDueDate', value);
                      }}
                      label="On the due date"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-body font-semibold text-foreground mb-2">Preferred reminder time</h3>
                  <select
                    id="reminder-time"
                    value={notificationPrefs.reminderTime ?? reminderTime}
                    onChange={e => {
                      setReminderTime(e.target.value);
                      updateNotificationField('reminderTime', e.target.value);
                    }}
                    className="px-3 py-2 rounded-md border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
                  >
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                  </select>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => updatePrefs.mutate({ ...notificationPrefs })}
                    className="px-6 py-2.5 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'compliance' && (
              <div>
                <h2 className="font-body font-semibold text-foreground mb-2">Compliance Scope</h2>
                <p className="text-sm font-body text-muted-foreground mb-6">
                  These are the compliance categories active for your business profile. Toggle any category off to stop tracking it.
                </p>
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  {complianceCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between py-3 px-4 bg-card">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${cat.badgeColor}`} />
                        <cat.icon size={18} className="text-muted-foreground" />
                        <span className="text-sm font-body font-medium text-foreground">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => setComplianceToggles(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                        role="switch"
                        aria-checked={complianceToggles[cat.id]}
                        className={`relative w-11 h-6 rounded-full transition-colors min-h-[24px] ${complianceToggles[cat.id] ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${complianceToggles[cat.id] ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-body text-muted-foreground mt-4 italic">
                  Changing your compliance scope regenerates your deadline calendar.
                </p>
              </div>
            )}

            {activeSection === 'billing' && (
              <div>
                <h2 className="font-body font-semibold text-foreground mb-4">Billing & Plan</h2>

                {/* Current Plan Card */}
                <div className="rounded-lg border border-border p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 text-xs font-body font-semibold rounded-full bg-muted text-muted-foreground">
                      {sub?.plan || 'FREE'}
                    </span>
                  </div>
                  <p className="text-sm font-body text-foreground mb-2">Status: {sub?.status || 'TRIAL'}</p>
                  <p className="text-sm font-body text-muted-foreground mb-2">
                    Next billing: {sub?.currentPeriodEnd ? String(sub.currentPeriodEnd).slice(0, 10) : 'N/A'}
                  </p>
                  <ul className="text-sm font-body text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      Access to 3 upcoming deadline reminders
                    </li>
                  </ul>
                  <div className="space-y-3">
                    <button onClick={() => void handleUpgrade('GROWTH')} className="w-full px-4 py-3 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px]">
                      Upgrade to Growth — ₹699/mo
                    </button>
                    <button onClick={() => void handleUpgrade('CA_PARTNER')} className="w-full px-4 py-3 text-sm font-body font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-forest-dark transition-colors min-h-[44px]">
                      Upgrade to CA Partner — ₹2,499/mo
                    </button>
                  </div>
                </div>

                {/* Invoice History */}
                <div>
                  <h3 className="text-sm font-body font-semibold text-foreground mb-3">Invoice history</h3>
                  <div className="rounded-lg border border-border p-6 text-center">
                    <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-body text-muted-foreground">
                      No invoices yet. Upgrade to a paid plan to see your billing history here.
                    </p>
                  </div>
                </div>

                {/* Cancel subscription link - hidden for free plan */}
                {/* <button className="mt-6 text-sm font-body text-destructive hover:underline">
                  Cancel subscription
                </button> */}
              </div>
            )}

            {activeSection === 'ca-access' && (
              <div>
                <h2 className="font-body font-semibold text-foreground mb-2">Share access with your CA</h2>
                <p className="text-sm font-body text-muted-foreground mb-6">
                  Your Chartered Accountant can view your compliance calendar and mark filings on your behalf.
                </p>

                {/* Send invite section */}
                <div className="mb-6">
                  <label htmlFor="ca-mobile" className="text-xs font-body font-medium text-muted-foreground mb-2 block">
                    CA's mobile number
                  </label>
                  <div className="flex gap-3">
                    <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-border text-sm font-body text-muted-foreground">
                      +91
                    </div>
                    <input
                      id="ca-mobile"
                      type="tel"
                      value={caMobile}
                      onChange={e => setCaMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter CA's mobile"
                      className="flex-1 px-3 py-2 rounded-r-md border border-l-0 border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
                    />
                    <button
                      onClick={handleSendInvite}
                      disabled={caMobile.length !== 10}
                      className="px-4 py-2 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Invite
                    </button>
                  </div>
                </div>

                {/* Share link section */}
                <div className="mb-6">
                  <p className="text-xs font-body text-muted-foreground mb-2">Or share this link with your CA:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={caInviteLink}
                      className="flex-1 px-3 py-2 rounded-md border border-border bg-muted text-sm font-mono text-muted-foreground min-h-[44px]"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 text-sm font-body font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors min-h-[44px] flex items-center gap-2"
                    >
                      {copied ? <Check size={16} className="text-secondary" /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Empty state - No CA linked */}
                <div className="rounded-lg border border-border p-6 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-body font-medium text-foreground mb-1">No CA linked yet</p>
                  <p className="text-xs font-body text-muted-foreground">Invite your CA above.</p>
                </div>

                {/* Future state - CA linked (commented out)
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-body font-medium text-foreground">CA Priya Sharma</p>
                      <p className="text-xs font-body text-muted-foreground">+91 9876543210</p>
                      <p className="text-xs font-body text-muted-foreground">Linked on 15 Jan 2026</p>
                    </div>
                    <button className="text-sm font-body text-destructive hover:underline">
                      Remove Access
                    </button>
                  </div>
                </div>
                */}
              </div>
            )}

            {activeSection === 'language' && (
              <div>
                <h2 className="font-body font-semibold text-foreground mb-2">Language / भाषा</h2>
                <p className="text-sm font-body text-muted-foreground mb-6">
                  Choose your preferred language for the interface.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      toast.success('Language set to English');
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      language === 'en'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇮🇳</span>
                      <div className="text-left">
                        <p className="text-sm font-body font-medium text-foreground">English</p>
                        <p className="text-xs font-body text-muted-foreground">Default language</p>
                      </div>
                    </div>
                    {language === 'en' && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                        <Check size={14} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setLanguage('hi');
                      toast.success('भाषा हिंदी में बदल गई');
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      language === 'hi'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🇮🇳</span>
                      <div className="text-left">
                        <p className="text-sm font-body font-medium text-foreground">हिंदी (Hindi)</p>
                        <p className="text-xs font-body text-muted-foreground">Hindi interface</p>
                      </div>
                    </div>
                    {language === 'hi' && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                        <Check size={14} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>
                </div>

                <p className="text-xs font-body text-muted-foreground mt-6 italic">
                  Note: Hindi translation is coming soon. Currently, only the interface labels will change.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
