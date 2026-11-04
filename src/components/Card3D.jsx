import React, { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

export const Card3D = ({
  children,
  className = "",
  style = {},
  index = 0,
  isStacked = false,
  ...props
}) => {
  const cardRef = useRef(null);
  const [isPressed, setIsPressed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Pointer position tracking (-0.5 to 0.5)
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // Snappy spring config matching the physics in the video
  const springConfig = { damping: 20, stiffness: 260, mass: 0.4 };
  const smoothX = useSpring(px, springConfig);
  const smoothY = useSpring(py, springConfig);

  // 3D rotations and elevations
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const liftZ = useTransform(smoothY, [-0.5, 0.5], [35, 10]);

  // Dynamic light reflection coordinates
  const glareX = useTransform(smoothX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(smoothY, [-0.5, 0.5], ["0%", "100%"]);

  const handlePointerMove = (e) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

    if (clientX === undefined || clientY === undefined) return;

    px.set((clientX - rect.left) / rect.width - 0.5);
    py.set((clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp = () => {
    setIsPressed(false);
    px.set(0);
    py.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full [touch-action:pan-y]"
    >
      <motion.div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
          ...style,
        }}
        // 3D drag & press response inspired by video
        whileTap={{
          scale: 0.98,
          z: 30,
          rotateX: 6,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        className={`relative rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-lg will-change-transform [backface-visibility:hidden] ${className}`}
        {...props}
      >
        {/* Specular Glare Layer */}
        <motion.div
          className="pointer-events-none absolute -inset-full rounded-3xl mix-blend-overlay transition-opacity duration-300"
          style={{
            opacity: isPressed ? 0.35 : 0.15,
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.2) 30%, transparent 65%)`,
          }}
        />

        {/* Ambient Dynamic Shadow Layer below card */}
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10 rounded-3xl transition-shadow duration-300"
          style={{
            boxShadow: isPressed
              ? "0 30px 45px -12px rgba(15, 23, 42, 0.25)"
              : "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
          }}
        />

        {/* Foreground Content: Kept at minimal translateZ to avoid text blur on mobile */}
        <div
          style={{
            transform: "translateZ(1px)",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            textRendering: "geometricPrecision",
          }}
          className="relative z-10 w-full select-none"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default Card3D;