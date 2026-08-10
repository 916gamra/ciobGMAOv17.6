// src/core/logging/Logger.ts
import { db } from '@/core/db';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  stack?: string;
}

export class Logger {
  private context: string;
  private isDev = import.meta.env.DEV;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;

  constructor(context: string) {
    this.context = context;
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
    const errObj = error instanceof Error ? error : new Error(String(error || ''));
    this.log(LogLevel.ERROR, message, {
      ...data,
      error: {
        message: errObj?.message,
        stack: errObj?.stack,
        name: errObj?.name,
      },
    });
  }

  fatal(message: string, error?: Error | unknown, data?: any): void {
    const errObj = error instanceof Error ? error : new Error(String(error || ''));
    this.log(LogLevel.FATAL, message, {
      ...data,
      error: {
        message: errObj?.message,
        stack: errObj?.stack,
        name: errObj?.name,
      },
    });

    // Flush immediately for fatal errors
    this.flush();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: this.context,
      message,
      data,
    };

    this.outputToConsole(entry);
    this.addToBuffer(entry);
    this.persistToDatabase(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    if (!this.isDev) return;

    const color = this.getColorForLevel(entry.level);
    const style = `color: ${color}; font-weight: bold;`;

    console.log(
      `%c[${entry.level}] ${entry.context}: ${entry.message}`,
      style,
      entry.data || ''
    );
  }

  private getColorForLevel(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '#888888',
      [LogLevel.INFO]: '#0ea5e9',
      [LogLevel.WARN]: '#f59e0b',
      [LogLevel.ERROR]: '#ef4444',
      [LogLevel.FATAL]: '#7c2d12',
    };
    return colors[level];
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private async persistToDatabase(entry: LogEntry): Promise<void> {
    try {
      if (db && db.logs) {
        await db.logs.add({
          timestamp: entry.timestamp,
          level: entry.level,
          context: entry.context,
          message: entry.message,
          data: entry.data
        });
      }
    } catch (error) {
      console.error('Failed to persist log', error);
    }
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
      if (isTauri) {
        try {
          const fsModuleName = '@tauri' + '-apps/api/fs';
          const pathModuleName = '@tauri' + '-apps/api/path';
          // @ts-ignore
          const { writeTextFile, BaseDirectory } = await import(/* @vite-ignore */ fsModuleName);
          // @ts-ignore
          const { appDataDir } = await import(/* @vite-ignore */ pathModuleName);
          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `logs-${timestamp}.jsonl`;

          const content = this.logBuffer
            .map(entry => JSON.stringify(entry))
            .join('\n');

          await writeTextFile(filename, content, {
            dir: BaseDirectory.AppData,
            append: true,
          });
        } catch (tauriError) {
          console.error('Tauri FS writing failed', tauriError);
        }
      } else {
        if (this.isDev) {
          console.log('[Logger Flush] Logs flushed:', this.logBuffer);
        }
      }
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs', error);
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = new Logger('GMAO');
export { Logger as AppLogger };
