import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import ComplianceScore from '@/components/ComplianceScore';
import { Share2, Download } from 'lucide-react';
import { useHealthScore } from '@/hooks/useHealthScore';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

interface AnimatedBarProps {
  score: number;
  color: string;
  bgColor: string;
  delay: number;
}

const AnimatedBar = ({ score, color, bgColor, delay }: AnimatedBarProps) => {
  const [width, setWidth] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setWidth(score);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          setTimeout(() => setWidth(score), delay);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [score, delay, hasAnimated]);

  return (
    <div ref={ref} className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

const HealthScorePage = () => {
  const { data, isLoading, error, refetch } = useHealthScore();
  const score = data?.data;
  const categories = [
    { name: 'GST Compliance', score: score?.gst || 0, color: 'hsl(var(--pill-gst))', bgColor: 'hsl(var(--pill-gst) / 0.15)' },
    { name: 'TDS Compliance', score: score?.tds || 0, color: 'hsl(var(--pill-tds))', bgColor: 'hsl(var(--pill-tds) / 0.15)' },
    { name: 'PF/ESI Compliance', score: score?.pfEsi || 0, color: 'hsl(var(--pill-pf))', bgColor: 'hsl(var(--pill-pf) / 0.15)' },
    { name: 'MCA/ROC Compliance', score: score?.mca || 0, color: 'hsl(var(--pill-mca))', bgColor: 'hsl(var(--pill-mca) / 0.15)' },
    { name: 'Industry-specific', score: score?.industry || 0, color: 'hsl(var(--pill-industry))', bgColor: 'hsl(var(--pill-industry) / 0.15)' },
  ];

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
      <div className="max-w-4xl mx-auto">
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="font-display text-2xl md:text-3xl text-foreground mb-8">
          Compliance Health Score
        </motion.h1>

        {/* Main score */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="rounded-lg border border-border bg-card p-8 text-center mb-8">
          <ComplianceScore score={score?.overall || 0} size={200} />
          <p className="font-body text-sm text-muted-foreground mt-4">
            {score?.totalFiled || 0}% of deadlines filed on time in last 90 days
          </p>
        </motion.div>

        {/* Breakdown */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="rounded-lg border border-border bg-card p-6 mb-8">
          <h2 className="font-body font-semibold text-foreground mb-4">Score breakdown</h2>
          <div className="space-y-4">
            {categories.map((cat, index) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-body font-medium text-foreground">{cat.name}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold" style={{ color: cat.color }}>{cat.score}%</span>
                </div>
                <AnimatedBar score={cat.score} color={cat.color} bgColor={cat.bgColor} delay={index * 100} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="rounded-lg border border-border bg-card p-6 mb-8">
          <h2 className="font-body font-semibold text-foreground mb-3">Improvement tips</h2>
          <div className="space-y-3">
              {(score?.improvementTips || []).map((tip: string) => (
                <div key={tip} className="flex items-start gap-3 p-3 rounded-md bg-warning/5 border border-warning/20">
                  <span className="text-lg">💡</span>
                  <p className="text-sm font-body text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>

        {/* Share */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
          className="rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="font-body font-semibold text-foreground mb-2">Share your compliance score</h2>
          <p className="text-sm font-body text-muted-foreground mb-4">
            Penalties you avoided: ₹{(score?.penaltySaved || 0).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-body font-medium rounded-md bg-primary text-primary-foreground hover:bg-saffron-dark transition-colors min-h-[44px]">
              <Share2 size={16} /> Share Score
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-body font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors min-h-[44px]">
              <Download size={16} /> Download Badge
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default HealthScorePage;
