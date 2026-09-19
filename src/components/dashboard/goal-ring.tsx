"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./animated-number";

export function GoalRing({
  value,
  goal,
  size = 140,
}: {
  value: number;
  goal: number;
  size?: number;
}) {
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pctLabel = Math.round(pct * 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--teal)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={value} className="font-num text-2xl font-semibold" />
        <span className="text-[11px] text-muted">{pctLabel}%</span>
      </div>
    </div>
  );
}
