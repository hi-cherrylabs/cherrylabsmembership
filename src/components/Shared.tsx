import { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export const ScrollOption = ({
  children,
  containerRef,
}: {
  children: ReactNode;
  containerRef: RefObject<HTMLDivElement>;
  key?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    container: containerRef,
    offset: ['start 95%', 'start 10%'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.92, 1, 1, 0.98]);

  return (
    <motion.div ref={ref} style={{ scale, opacity: 1 }} className="w-full origin-center">
      {children}
    </motion.div>
  );
};

export const MiniLoader = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
    transition={{ duration: 0.4 }}
    className="relative z-20 flex flex-col items-center justify-center h-[50vh]"
  >
    <div className="relative w-10 h-10 flex items-center justify-center">
      <motion.div
        animate={{ x: [-8, 8, -8], y: [-4, 4, -4] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-2.5 h-2.5 rounded-full bg-pink-400 mix-blend-multiply"
      />
      <motion.div
        animate={{ x: [8, -8, 8], y: [-4, 4, -4] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute w-2.5 h-2.5 rounded-full bg-violet-500 mix-blend-multiply"
      />
      <motion.div
        animate={{ y: [8, -8, 8], x: [0, 0, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        className="absolute w-2.5 h-2.5 rounded-full bg-green-500 mix-blend-multiply"
      />
    </div>
  </motion.div>
);
