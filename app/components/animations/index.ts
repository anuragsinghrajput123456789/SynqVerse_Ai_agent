/**
 * Centralized Animation System
 * Provides standardized transition tokens, timing curves, and reduced-motion checks.
 */

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  default: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const durations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
};

export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
