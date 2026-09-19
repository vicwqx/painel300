"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";

export function AnimatedNumber({
  value,
  suffix = "",
  decimals = 0,
  className,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const rendered = useTransform(motionValue, (v) => v.toFixed(decimals) + suffix);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1, ease: "easeOut" });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return rendered.on("change", (v) => {
      if (spanRef.current) spanRef.current.textContent = v;
    });
  }, [rendered]);

  return (
    <motion.span ref={spanRef} className={className}>
      0{suffix}
    </motion.span>
  );
}
