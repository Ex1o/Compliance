import { motion } from 'framer-motion';
import { 
  Calendar, MessageSquare, Shield, ExternalLink, Users, Bell,
  Star, ChevronDown, Check, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PenaltyTicker from '@/components/PenaltyTicker';
import { useAppStore } from '@/lib/store';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

const LandingPage = () => {
  const { language, setLanguage } = useAppStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Which compliances does ComplianceWala cover?',
      a: 'We cover GST (GSTR-1, GSTR-3B, GSTR-9, PMT-06), TDS/TCS (24Q, 26Q, Form 16), PF/EPFO, ESI/ESIC, MCA/ROC filings (AOC-4, MGT-7, DIR-3 KYC), Income Tax advance tax and ITR deadlines, Professional Tax for all states, and industry-specific deadlines including FSSAI, Factory Act, POSH, and FEMA. Total coverage: 80+ compliance obligations, personalised to your business.'
    },
    {
      q: 'Do I need to install an app?',
      a: 'No. WhatsApp reminders are delivered directly to your existing WhatsApp — no new app installation needed. You can also access your compliance dashboard via our web app on any browser.'
    },
    {
      q: 'How does the CA Partner plan work?',
      a: 'CAs sign up for the CA Partner plan (₹2,499/mo) and invite their MSME clients. Each client completes an 8-question profile. The CA sees all client deadlines in one dashboard, can mark filings on their behalf, and clients receive WhatsApp reminders automatically.'
    },
    {
      q: 'Is my financial data secure?',
      a: "Yes. We do not store your financial transactions or tax returns — only your business profile (entity type, industry, states) and your deadline filing history. All data is encrypted at rest and in transit. We are compliant with India's DPDPA 2023."
    },
    {
      q: 'What if the government extends a deadline?',
      a: 'Our system monitors government portals (GSTN, MCA, EPFO, ESIC) every 4 hours. When a deadline is extended, we update your calendar within 2 hours and send a WhatsApp alert immediately.'
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. Cancel anytime from Settings → Billing & Plan. No lock-in, no cancellation fees. Your data is available for 90 days after cancellation.'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl text-foreground">
            Compliance<span className="text-primary">Wala</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {['Features', 'Pricing', 'CA Partners', 'Blog'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="text-xs font-body font-medium px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Toggle language"
            >
              {language === 'en' ? 'हिंदी' : 'EN'}
            </button>
            <Link
              to="/onboarding"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px] items-center"
            >
              Start Free — No Card Needed
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <h1 className="font-display text-4xl md:text-[56px] md:leading-[1.1] text-foreground mb-6">
                {language === 'en'
                  ? 'Never pay a penalty for missing a deadline again.'
                  : 'Deadline miss karne ki penalty ab kabhi nahi.'}
              </h1>
              <p className="text-lg md:text-xl font-body text-muted-foreground mb-8 max-w-lg">
                {language === 'en'
                  ? 'WhatsApp reminders before every GST, TDS, PF, ESI and ROC deadline. See your exact penalty if you miss one.'
                  : 'GST, TDS, PF ka reminder WhatsApp pe — deadline miss karo toh penalty bhi dikhata hai.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center px-6 py-3 text-base font-body font-semibold rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px]"
                >
                  Start Free for 30 Days
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-1 px-4 py-3 text-base font-body font-medium text-primary hover:text-saffron-dark transition-colors min-h-[44px]">
                  See how it works <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
              <PenaltyTicker dailyRate={50} daysOverdue={12} filingName="GSTR-3B" />
            </motion.div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-y border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <p className="font-body font-semibold text-foreground">Trusted by 3,500+ MSMEs across India</p>
            <div className="flex items-center gap-6 text-sm font-body text-muted-foreground">
              {['Delhi', 'Mumbai', 'Bengaluru', 'Jaipur', 'Surat'].map(city => (
                <span key={city}>{city}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm font-body">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-primary text-primary" />)}
              <span className="ml-1 text-muted-foreground">4.9/5 from 240 reviews</span>
            </div>
          </div>
        </section>

        {/* Pain section - Dark background */}
        <section className="bg-[#1A1A1A]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
            <p className="text-sm font-body font-semibold uppercase tracking-wider text-primary text-center mb-12">
              THE COST OF MISSING A DEADLINE
            </p>
            <div className="grid md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-white/20">
              {[
                {
                  stat: '₹50',
                  sub: 'every day — GST late filing penalty (GSTR-3B)',
                  desc: 'Missing even one GST return costs ₹50 per day minimum, plus 18% annual interest on unpaid tax.'
                },
                {
                  stat: '₹100',
                  sub: 'every day — ROC / MCA filing delay',
                  desc: 'Missing your AOC-4 or annual return attracts ₹100 per day from the original due date. No cap.'
                },
                {
                  stat: '12%',
                  sub: 'per annum — PF/ESI non-payment',
                  desc: 'Late PF deposits attract 12% p.a. interest plus damages of 5–25% of the unpaid amount.'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="text-center px-4 md:px-8"
                >
                  <p className="font-display text-5xl md:text-6xl text-white mb-2">{item.stat}</p>
                  <p className="font-body font-semibold text-white/90 mb-4 text-sm">{item.sub}</p>
                  <p className="text-sm font-body text-white/60">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <p className="text-sm font-body font-semibold uppercase tracking-wider text-muted-foreground text-center mb-4">
              HOW IT WORKS
            </p>
            <h2 className="font-display text-3xl md:text-[40px] text-foreground text-center mb-16">
              Set up once. Never miss a deadline again.
            </h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting dashed line (desktop) */}
              <div className="hidden md:block absolute top-6 left-[20%] right-[20%] border-t-2 border-dashed border-primary/40" />
              {[
                {
                  step: 1,
                  title: 'Answer 8 questions about your business',
                  desc: 'We build a personalised compliance calendar covering only the deadlines that apply to your specific business type, state, and industry.'
                },
                {
                  step: 2,
                  title: 'WhatsApp reminders arrive automatically',
                  desc: '7 days before, 3 days before, and on the due date — with the exact penalty amount if you miss it. No app to check.'
                },
                {
                  step: 3,
                  title: 'Mark as filed in one tap',
                  desc: 'Your compliance health score improves with every on-time filing. Share it with your bank or CA as proof of good standing.'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="text-center relative"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-display font-bold text-xl relative z-10">
                    {item.step}
                  </div>
                  <h3 className="font-body font-semibold text-foreground text-lg mb-3">{item.title}</h3>
                  <p className="text-sm font-body text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">
              Everything you need to stay compliant
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Calendar,
                  title: 'Personalised calendar',
                  desc: 'Only the deadlines that apply to you — not all 1,400. Built from your business profile.'
                },
                {
                  icon: Bell,
                  title: 'Live penalty ticker',
                  desc: 'See exactly how much penalty is accumulating in real time. The number that stops you from procrastinating.'
                },
                {
                  icon: MessageSquare,
                  title: 'WhatsApp-native',
                  desc: "Reminders delivered on WhatsApp. Your clients don't need to install anything."
                },
                {
                  icon: ExternalLink,
                  title: 'Direct portal links',
                  desc: 'Every deadline card links directly to the correct government filing portal. One tap to file.'
                },
                {
                  icon: Users,
                  title: 'CA partner dashboard',
                  desc: 'Your CA sees all client deadlines in one view. Marks filings on your behalf. Saves them 3 hours a week.'
                },
                {
                  icon: Shield,
                  title: 'Extension alerts',
                  desc: 'When the government extends a deadline, you know within 2 hours. No more guessing from WhatsApp forwards.'
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="p-6 rounded-2xl bg-card border border-[#E8E4DF] card-hover"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon size={20} className="text-primary" />
                  </div>
                  <h3 className="font-body font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm font-body text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">
              Trusted by MSMEs across India
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  initials: 'RA',
                  avatarBg: 'bg-amber-100 text-amber-700',
                  name: 'Rajesh Agarwal',
                  role: 'Textile trader · Surat',
                  quote: 'Ek baar ₹4,200 ki penalty lagi thi GST late filing se. Tab se ComplianceWala use kar raha hoon — kabhi miss nahi hua.'
                },
                {
                  initials: 'PS',
                  avatarBg: 'bg-green-100 text-green-700',
                  name: 'CA Priya Sharma',
                  role: 'Chartered Accountant · Pune',
                  quote: '30 clients ke saare deadlines ek jagah. Meri team ka 3 ghante roz bachte hain sirf client follow-up se.'
                },
                {
                  initials: 'SM',
                  avatarBg: 'bg-blue-100 text-blue-700',
                  name: 'Sunita Mehta',
                  role: 'Director · Bengaluru',
                  quote: 'The ROC filing reminder saved me ₹15,000 last quarter. Worth 10x the subscription price.'
                },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="p-6 rounded-2xl bg-background border border-[#E8E4DF]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center font-body font-semibold text-sm`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs font-body text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className="fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm font-body text-foreground italic">"{t.quote}"</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="border border-border rounded-lg overflow-hidden bg-card"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 md:p-5 text-left text-sm md:text-base font-body font-medium text-foreground hover:bg-muted/50 transition-colors min-h-[56px]"
                    aria-expanded={openFaq === i}
                  >
                    {faq.q}
                    <ChevronDown
                      size={18}
                      className={`shrink-0 ml-4 text-muted-foreground transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFaq === i ? 'auto' : 0,
                      opacity: openFaq === i ? 1 : 0
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm font-body text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-12">Simple pricing</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  name: 'Free', price: '₹0', period: '/month', borderColor: 'border-border',
                  features: ['GST + TDS + PF/ESI deadlines', 'WhatsApp reminders for 3 upcoming', 'Basic dashboard'],
                  cta: 'Start Free', ctaStyle: 'border border-border text-foreground hover:bg-muted',
                },
                {
                  name: 'Growth', price: '₹699', period: '/month', borderColor: 'border-primary', badge: 'Most Popular',
                  features: ['All deadlines incl. MCA, FSSAI', 'Unlimited WhatsApp reminders', 'Penalty calculator', 'Direct portal links', 'Compliance health score'],
                  cta: 'Start 30-day Free Trial', ctaStyle: 'bg-primary text-primary-foreground hover:bg-saffron-dark',
                },
                {
                  name: 'CA Partner', price: '₹2,499', period: '/month', borderColor: 'border-secondary',
                  features: ['Manage up to 50 clients', 'Bulk filing dashboard', 'Client-wise reports', 'White-label WhatsApp alerts'],
                  cta: 'Try CA Partner Plan', ctaStyle: 'bg-secondary text-secondary-foreground hover:bg-forest-dark',
                },
              ].map((plan, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className={`relative p-6 rounded-lg border-2 ${plan.borderColor} bg-card card-hover flex flex-col`}>
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-body font-semibold rounded-full bg-primary text-primary-foreground">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="font-body font-semibold text-foreground text-lg mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-display text-4xl text-foreground">{plan.price}</span>
                    <span className="text-sm font-body text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm font-body text-muted-foreground">
                        <Check size={16} className="text-secondary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/onboarding" className={`w-full px-4 py-3 text-sm font-body font-semibold rounded-md text-center transition-colors min-h-[44px] flex items-center justify-center ${plan.ctaStyle}`}>
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-display text-lg text-foreground mb-2">Compliance<span className="text-primary">Wala</span></p>
              <p className="text-sm font-body text-muted-foreground">Never miss a compliance deadline again.</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'CA Partners'] },
              { title: 'Company', links: ['About', 'Blog', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Refund Policy'] },
            ].map(section => (
              <div key={section.title}>
                <p className="text-sm font-body font-semibold text-foreground mb-3">{section.title}</p>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body text-muted-foreground">
            <p>Made in India 🇮🇳 for Indian MSMEs</p>
            <p>© 2026 ComplianceWala Technologies Pvt Ltd</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
