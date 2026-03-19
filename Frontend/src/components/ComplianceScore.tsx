import { useState, useEffect, useRef } from 'react';

interface ComplianceScoreProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

const ComplianceScore = ({ score, size = 160, showLabel = true }: ComplianceScoreProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // SVG dimensions
  const strokeWidth = size > 100 ? 10 : size > 50 ? 6 : 4;
  const radius = 54 * (size / 128);
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;

  // Colors based on score
  const getColor = (value: number) => {
    if (value >= 80) return '#1B6B3A'; // Forest green
    if (value >= 60) return '#D4820A'; // Amber
    return '#C0392B'; // Red
  };

  const color = getColor(score);
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Needs Work' : 'At Risk';

  // Count-up animation
  useEffect(() => {
    if (!isAnimated) return;

    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out timing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (score - startValue) * easeOut);

      setDisplayScore(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score, isAnimated]);

  // Intersection Observer for triggering animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isAnimated) {
          setIsAnimated(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isAnimated]);

  // Handle reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setDisplayScore(score);
      setIsAnimated(true);
    }
  }, [score]);

  const viewBox = size > 100 ? '0 0 128 128' : '0 0 64 64';
  const center = size > 100 ? 64 : 32;
  const actualRadius = size > 100 ? 54 : 27;
  const actualStroke = size > 100 ? 10 : 5;
  const actualCircumference = 2 * Math.PI * actualRadius;
  const actualProgress = (displayScore / 100) * actualCircumference;

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={viewBox}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={actualRadius}
            fill="none"
            stroke="#E8E4DF"
            strokeWidth={actualStroke}
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={actualRadius}
            fill="none"
            stroke={color}
            strokeWidth={actualStroke}
            strokeLinecap="round"
            strokeDasharray={actualCircumference}
            strokeDashoffset={actualCircumference - actualProgress}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold"
            style={{
              color,
              fontSize: size > 100 ? '2rem' : size > 50 ? '1rem' : '0.75rem',
            }}
          >
            {displayScore}
          </span>
          {size > 50 && (
            <span
              className="font-body text-muted-foreground"
              style={{ fontSize: size > 100 ? '0.75rem' : '0.625rem' }}
            >
              /100
            </span>
          )}
        </div>
      </div>
      {showLabel && size > 100 && (
        <span className="text-sm font-body font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
};

export default ComplianceScore;
