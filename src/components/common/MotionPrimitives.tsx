import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

export const luxuryEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const popUpContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const popUpItemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.96,
    filter: 'blur(8px)'
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: luxuryEase
    }
  }
};

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: luxuryEase }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: luxuryEase }
  }
};

export const modalDialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.93,
    y: 16,
    filter: 'blur(6px)'
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.42,
      ease: luxuryEase
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    filter: 'blur(4px)',
    transition: {
      duration: 0.22,
      ease: luxuryEase
    }
  }
};

export interface PopUpContainerProps extends HTMLMotionProps<'div'> {
  className?: string;
  children: React.ReactNode;
}

export const PopUpContainer: React.FC<PopUpContainerProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <motion.div
      variants={popUpContainerVariants}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface PopUpItemProps extends HTMLMotionProps<'div'> {
  className?: string;
  children: React.ReactNode;
}

export const PopUpItem: React.FC<PopUpItemProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <motion.div
      variants={popUpItemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface AnimatedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  backdropClassName?: string;
  containerClassName?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  backdropClassName = 'fixed inset-0 z-50 bg-[#2B1218]/45 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto',
  containerClassName = 'relative w-full max-w-2xl bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#E5DACB] overflow-hidden my-auto'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={backdropClassName}
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) {
              onClose();
            }
          }}
        >
          <motion.div
            variants={modalDialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={containerClassName}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface AnimatedModalDialogProps extends HTMLMotionProps<'div'> {
  className?: string;
  children: React.ReactNode;
}

export const AnimatedModalDialog: React.FC<AnimatedModalDialogProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <motion.div
      variants={modalDialogVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

