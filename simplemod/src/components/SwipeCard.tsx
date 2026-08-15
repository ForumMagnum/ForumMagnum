'use client';

import React from 'react';
import { motion, useMotionValue, useTransform, type PanInfo, type Variants } from 'framer-motion';

export type SwipeDirection = 1 | -1;

const SWIPE_COMMIT_THRESHOLD = 140;

export const cardVariants: Variants = {
  enter: { scale: 0.96, y: 16, opacity: 0 },
  center: { scale: 1, y: 0, x: 0, opacity: 1 },
  exit: (direction: SwipeDirection) => ({
    x: direction * 800,
    rotate: direction * 18,
    opacity: 0,
    transition: { duration: 0.28, ease: 'easeIn' },
  }),
};

const SwipeCard = ({ children, onSwipe, disabled = false, busy = false, leftStamp, rightStamp }: {
  children: React.ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  disabled?: boolean;
  busy?: boolean;
  leftStamp: string;
  rightStamp: string;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-10, 10]);
  const rightStampOpacity = useTransform(x, [40, SWIPE_COMMIT_THRESHOLD], [0, 1]);
  const leftStampOpacity = useTransform(x, [-SWIPE_COMMIT_THRESHOLD, -40], [1, 0]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_COMMIT_THRESHOLD) {
      onSwipe(1);
    } else if (info.offset.x < -SWIPE_COMMIT_THRESHOLD) {
      onSwipe(-1);
    }
  };

  return (
    <motion.div
      className={busy ? 'swipe-card swipe-card-busy' : 'swipe-card'}
      drag={disabled ? false : 'x'}
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <motion.div className="swipe-stamp swipe-stamp-right" style={{ opacity: rightStampOpacity }}>
        {rightStamp}
      </motion.div>
      <motion.div className="swipe-stamp swipe-stamp-left" style={{ opacity: leftStampOpacity }}>
        {leftStamp}
      </motion.div>
      {children}
    </motion.div>
  );
};

export default SwipeCard;
