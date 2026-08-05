"use client";

/**
 * Shared motion vocabulary for the app. Everything here is built on
 * framer-motion but degrades to a plain, motion-free render when the visitor
 * has asked their OS to reduce motion — so the polish never fights
 * accessibility. Keep the easing and timing in one place so the whole product
 * moves with a single, recognisable rhythm.
 */

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

/** The product's one expressive easing curve — mirrors --ease-out-soft in CSS. */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_SOFT },
  },
};

const staggerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT_SOFT },
  },
};

type DivMotionProps = HTMLMotionProps<"div"> & { children?: ReactNode };

/** A single element that eases up into place on mount. */
export function Reveal({ children, ...rest }: DivMotionProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as object)}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={revealVariants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container that reveals its {@link StaggerItem} children in a gentle cascade.
 * Uses whileInView-free mount animation so above-the-fold content lands
 * immediately and predictably.
 */
export function Stagger({ children, ...rest }: DivMotionProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as object)}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerVariants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A child of {@link Stagger}. Renders inert when reduced motion is requested. */
export function StaggerItem({ children, ...rest }: DivMotionProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as object)}>{children}</div>;
  return (
    <motion.div variants={staggerItemVariants} {...rest}>
      {children}
    </motion.div>
  );
}

/** A pressable surface with a subtle spring on hover and press. */
export function Pressable({ children, ...rest }: DivMotionProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(rest as object)}>{children}</div>;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
