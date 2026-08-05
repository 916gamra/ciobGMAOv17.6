import { useEffect, useRef } from 'react';
import { PerformanceMonitor } from './performanceMonitor';

/**
 * Custom hook to measure React component mount and re-render performance
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - renderStartTime.current;
    PerformanceMonitor.logMetric(componentName, 'RENDER', duration);

    return () => {
      // Cleanup / unmount if needed
    };
  });
}
