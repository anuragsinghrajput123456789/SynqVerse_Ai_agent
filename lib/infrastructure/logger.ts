/**
 * Reusable Structured Logger Infrastructure
 * Thread-safe, PII-sanitized, formatted logging with correlation request ID support.
 */

import { maskTextPii } from '../pii';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
}

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel = process.env.NODE_ENV === 'test' ? 'error' : 'info';

  public setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[this.minLevel];
  }

  private sanitizeMessage(msg: string): string {
    return maskTextPii(msg).maskedText;
  }

  private formatOutput(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const safeMsg = this.sanitizeMessage(message);
    const reqId = context?.requestId ? ` [${context.requestId}]` : '';
    const mod = context?.module ? ` [${context.module}]` : '';

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        message: safeMsg,
        ...context,
      });
    }

    const levelIndicator = level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${levelIndicator}${reqId}${mod}: ${safeMsg}`;
  }

  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatOutput('debug', message, context));
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatOutput('info', message, context));
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatOutput('warn', message, context));
    }
  }

  public error(message: string, error?: unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorMsg =
        error instanceof Error
          ? error.stack || error.message
          : typeof error === 'string'
          ? error
          : error !== undefined
          ? JSON.stringify(error)
          : '';
      const fullMessage = errorMsg ? `${message} | Error: ${errorMsg}` : message;
      console.error(this.formatOutput('error', fullMessage, context));
    }
  }

  public child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

export class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  public debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.defaultContext, ...context });
  }

  public info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.defaultContext, ...context });
  }

  public warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.defaultContext, ...context });
  }

  public error(message: string, error?: unknown, context?: LogContext): void {
    this.parent.error(message, error, { ...this.defaultContext, ...context });
  }
}

export const logger = new Logger();
