import { motion, AnimatePresence } from 'motion/react';

export default function Toast({ message }: { message: string | null }) {
  return (
    <div className="fixed bottom-8 left-0 right-0 z-[60] flex justify-center px-6 pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="px-5 py-3 bg-black/85 backdrop-blur-xl text-white text-sm font-bold rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.25)] border border-white/10"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
