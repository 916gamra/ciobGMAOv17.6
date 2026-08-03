/// <reference types="vite/client" />
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: {
    message?: string;
    stack?: string;
  };
}

export class AppLogger {
  private context: string;
  private logLevel: LogLevel = import.meta.env.PROD ? LogLevel.INFO : LogLevel.DEBUG;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        timestamp: new Date(),
        level,
        context: this.context,
        message,
        data
      };

      this.output(entry);
      this.persist(entry);
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | unknown, data?: any): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, {
      ...data,
      error: {
        message: errorObj?.message,
        stack: errorObj?.stack
      }
    });
  }

  fatal(message: string, error?: Error | unknown, data?: any): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.FATAL, message, {
      ...data,
      error: {
        message: errorObj?.message,
        stack: errorObj?.stack
      }
    });

    // In a real environment, trigger critical alert systems immediately (e.g. Sentry/Datadog)
    this.sendToServer({
      level: LogLevel.FATAL,
      message,
      context: this.context,
      data
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private output(entry: LogEntry): void {
    const color = this.getColorForLevel(entry.level);
    console.log(
      `%c[${entry.level}] ${entry.context}: ${entry.message}`,
      `color: ${color}; font-weight: bold;`,
      entry.data || ''
    );
  }

  private persist(entry: LogEntry): void {
    // NOTE: This will be connected to our Dexie local database for offline audit logging
    // For now we dispatch a custom event that our DB listener can catch
    const event = new CustomEvent('app:log', { detail: entry });
    window.dispatchEvent(event);
  }

  private sendToServer(data: any): void {
    // Mock server reporting
    console.warn('CRITICAL ALERT SENT TO SERVER:', data);
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#888888';
      case LogLevel.INFO:
        return '#0ea5e9';
      case LogLevel.WARN:
        return '#f59e0b';
      case LogLevel.ERROR:
        return '#ef4444';
      case LogLevel.FATAL:
        return '#7c2d12';
      default:
        return '#000000';
    }
  }
}

export const createLogger = (context: string) => new AppLogger(context);
