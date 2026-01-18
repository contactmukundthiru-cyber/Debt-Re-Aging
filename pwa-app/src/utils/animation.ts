/**
 * Animation and transition utilities
 */

/**
 * CSS transition presets
 */
export const transitions = {
  // Speed
  fast: 'all 150ms ease-out',
  normal: 'all 200ms ease-out',
  slow: 'all 300ms ease-out',

  // Specific properties
  opacity: 'opacity 200ms ease-out',
  transform: 'transform 200ms ease-out',
  colors: 'background-color 200ms, border-color 200ms, color 200ms',

  // Bounce effect
  bounce: 'all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Spring effect
  spring: 'all 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Smooth
  smooth: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Easing functions
 */
export const easings = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Cubic bezier curves
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',

  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Animation keyframe definitions
 */
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,

  slideInUp: `
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,

  slideInDown: `
    @keyframes slideInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,

  slideInLeft: `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  slideInRight: `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  scaleIn: `
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,

  bounce: `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }
      50% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }
  `,

  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `,

  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
};

/**
 * Animation class definitions for Tailwind-like usage
 */
export const animations = {
  fadeIn: 'fadeIn 200ms ease-out forwards',
  fadeOut: 'fadeOut 200ms ease-out forwards',
  slideInUp: 'slideInUp 300ms ease-out forwards',
  slideInDown: 'slideInDown 300ms ease-out forwards',
  slideInLeft: 'slideInLeft 300ms ease-out forwards',
  slideInRight: 'slideInRight 300ms ease-out forwards',
  scaleIn: 'scaleIn 200ms ease-out forwards',
  pulse: 'pulse 2s infinite',
  spin: 'spin 1s linear infinite',
  bounce: 'bounce 1s infinite',
  shake: 'shake 500ms ease-in-out',
  shimmer: 'shimmer 2s infinite linear',
} as const;

/**
 * Creates a staggered animation delay for list items
 */
export function staggeredDelay(index: number, baseDelay = 50): string {
  return `${index * baseDelay}ms`;
}

/**
 * Creates animation style object for React
 */
export function createAnimationStyle(
  animation: keyof typeof animations,
  delay?: number
): React.CSSProperties {
  return {
    animation: animations[animation],
    animationDelay: delay ? `${delay}ms` : undefined,
  };
}

/**
 * Creates a fade transition class for conditional rendering
 */
export function fadeTransitionClasses(isVisible: boolean): string {
  return isVisible
    ? 'opacity-100 transition-opacity duration-200'
    : 'opacity-0 transition-opacity duration-200';
}

/**
 * Creates a slide transition class
 */
export function slideTransitionClasses(
  isVisible: boolean,
  direction: 'up' | 'down' | 'left' | 'right' = 'up'
): string {
  const transforms: Record<string, string> = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
  };

  return isVisible
    ? 'opacity-100 transform translate-x-0 translate-y-0 transition-all duration-300'
    : `opacity-0 transform ${transforms[direction]} transition-all duration-300`;
}

/**
 * Creates a scale transition class
 */
export function scaleTransitionClasses(isVisible: boolean): string {
  return isVisible
    ? 'opacity-100 scale-100 transition-all duration-200'
    : 'opacity-0 scale-95 transition-all duration-200';
}

/**
 * Request Animation Frame helper with automatic cleanup
 */
export function animationFrame(callback: FrameRequestCallback): () => void {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}

/**
 * Creates a smooth scroll animation
 */
export function smoothScrollTo(
  element: HTMLElement | null,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'start' }
): void {
  element?.scrollIntoView(options);
}

/**
 * Creates a smooth scroll to top animation
 */
export function scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
  window.scrollTo({ top: 0, behavior });
}

/**
 * Animate a value over time
 */
export function animateValue(
  start: number,
  end: number,
  duration: number,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  const startTime = performance.now();

  function update(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = start + (end - start) * eased;

    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      onComplete?.();
    }
  }

  const id = requestAnimationFrame(update);
  return () => cancelAnimationFrame(id);
}

/**
 * Wait for transition to complete
 */
export function waitForTransition(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      element.removeEventListener('transitionend', handler);
      resolve();
    };
    element.addEventListener('transitionend', handler);
  });
}

/**
 * Wait for animation to complete
 */
export function waitForAnimation(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      element.removeEventListener('animationend', handler);
      resolve();
    };
    element.addEventListener('animationend', handler);
  });
}
