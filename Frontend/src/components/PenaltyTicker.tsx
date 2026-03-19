import { useEffect, useState, useRef } from 'react';

interface PenaltyTickerProps {
  dailyRate: number;
  daysOverdue: number;
  filingName: string;
  autoIncrement?: boolean; // For landing page hero
}

const PenaltyTicker = ({ dailyRate, daysOverdue, filingName, autoIncrement = true }: PenaltyTickerProps) => {
  const baseAmount = dailyRate * daysOverdue;
  const [displayAmount, setDisplayAmount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Count-up animation with ease-out timing
  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic timing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (baseAmount - startValue) * easeOut;

      setDisplayAmount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - start pulse and live increment
        setIsPulsing(true);
        if (autoIncrement) {
          intervalRef.current = setInterval(() => {
            setDisplayAmount(prev => prev + dailyRate / 86400); // increment per second
          }, 1000);
        }
      }
    };

    requestAnimationFrame(animate);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasAnimated, baseAmount, dailyRate, autoIncrement]);

  // Intersection Observer to trigger animation when visible
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setDisplayAmount(baseAmount);
      setHasAnimated(true);
      setIsPulsing(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, baseAmount]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border-2 border-destructive bg-destructive/5 p-4 md:p-6"
    >
      <p className="text-sm font-body font-medium text-destructive mb-1">
        {filingName} — overdue by {daysOverdue} days
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-body text-muted-foreground">Penalty so far:</span>
        <span
          className={`font-mono text-2xl md:text-3xl font-semibold text-destructive ${
            isPulsing ? 'animate-pulse-penalty' : ''
          }`}
        >
          ₹{Math.floor(displayAmount).toLocaleString('en-IN')}
        </span>
        <span className="text-sm text-destructive/70 font-body">and counting...</span>
      </div>
    </div>
  );
};

export default PenaltyTicker;
