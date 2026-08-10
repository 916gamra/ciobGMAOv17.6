// src/core/intelligence/AdaptiveUI.ts
import { createLogger } from '@/core/logging/Logger';
import { systemMonitor, SystemMonitor } from '@/core/windows/SystemMonitor';

const logger = createLogger('AdaptiveUIEngine');

export interface UserBehaviorData {
  count: number;
  totalTime: number;
  averageTime: number;
}

export interface UIConfiguration {
  enableAnimations: boolean;
  enableShadows: boolean;
  maxItemsPerPage: number;
  enableVirtualScrolling: boolean;
  cacheSize: number;
}

/**
 * Adaptive UI Engine
 * 
 * تكييف الواجهة بناءً على الأداء والاستخدام
 * 
 * Features:
 * - Dynamic Rendering
 * - Responsive Layout
 * - Smart Caching
 * - Performance Optimization
 */
export class AdaptiveUIEngine {
  private userBehavior: Map<string, UserBehaviorData> = new Map();

  constructor(private sysMonitor: SystemMonitor) {}

  /**
   * تسجيل سلوك المستخدم
   */
  recordUserAction(action: string, duration: number): void {
    const data = this.userBehavior.get(action) || {
      count: 0,
      totalTime: 0,
      averageTime: 0,
    };

    data.count++;
    data.totalTime += duration;
    data.averageTime = data.totalTime / data.count;

    this.userBehavior.set(action, data);
  }

  /**
   * الحصول على توصيات الأداء
   */
  getPerformanceRecommendations(): string[] {
    const metrics = this.sysMonitor.getMetrics();
    const recommendations: string[] = [];

    if (metrics.cpu > 70) {
      recommendations.push('تقليل عدد الصفوف المعروضة لتقليل العبء على المعالج (Reduce row count to decrease CPU usage)');
      recommendations.push('تفعيل التمرير الافتراضي السريع لتسريع رندر الصفحة (Enable Virtual Scrolling for faster rendering)');
    } else {
      recommendations.push('أداء المعالج ممتاز ومستقر (CPU performance is excellent and stable)');
    }

    if (metrics.memory > 75) {
      recommendations.push('تقليل حجم ذاكرة الكاش لتوفير مساحة الذاكرة العشوائية (Reduce Cache size to free up RAM)');
      recommendations.push('تفعيل التحميل الكسول للمكونات البعيدة (Enable Lazy Loading for distant components)');
    } else {
      recommendations.push('مستوى استهلاك الذاكرة في الحدود الآمنة (Memory usage is in safe thresholds)');
    }

    if (metrics.disk > 90) {
      recommendations.push('القرص ممتلئ! يرجى حذف ملفات الأرشيف والنسخ الاحتياطية القديمة (Disk is full! Delete old archives/backups)');
      recommendations.push('ضغط قواعد البيانات القديمة وجردها لتوفير المساحة (Compress and archive old database entries)');
    }

    return recommendations;
  }

  /**
   * تكييف الواجهة
   */
  adaptUI(): UIConfiguration {
    const metrics = this.sysMonitor.getMetrics();
    const config: UIConfiguration = {
      enableAnimations: metrics.cpu < 50,
      enableShadows: metrics.cpu < 60,
      maxItemsPerPage: metrics.memory > 80 ? 10 : 50,
      enableVirtualScrolling: metrics.memory > 70,
      cacheSize: Math.max(100, Math.floor(1000 - metrics.memory * 10)),
    };

    logger.debug('UI adapted', config);

    return config;
  }

  /**
   * الحصول على إحصائيات السلوك
   */
  getUserBehaviorStats() {
    const stats: Record<string, UserBehaviorData> = {};

    for (const [action, data] of this.userBehavior) {
      stats[action] = data;
    }

    return stats;
  }
}

export const adaptiveUIEngine = new AdaptiveUIEngine(systemMonitor);
