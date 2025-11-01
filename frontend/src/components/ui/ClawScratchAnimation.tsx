import React, { useEffect, useState } from 'react';

interface ClawScratchAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
  className?: string;
}

export function ClawScratchAnimation({
  trigger,
  onComplete,
  className = ''
}: ClawScratchAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);

      // Animation duration is 0.76s (0.6s + 0.16s delay for last scratch)
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [trigger, isAnimating, onComplete]);

  if (!isAnimating) return null;

  return (
    <div className={`claw-scratch-container ${className}`}>
      <div className="claw-scratch claw-scratch-1" />
      <div className="claw-scratch claw-scratch-2" />
      <div className="claw-scratch claw-scratch-3" />
    </div>
  );
}

interface ScratchMarksOverlayProps {
  className?: string;
}

export function ScratchMarksOverlay({ className = '' }: ScratchMarksOverlayProps) {
  return (
    <div className={`scratch-marks-overlay ${className}`}>
      <div className="scratch-mark scratch-mark-1" />
      <div className="scratch-mark scratch-mark-2" />
      <div className="scratch-mark scratch-mark-3" />
    </div>
  );
}