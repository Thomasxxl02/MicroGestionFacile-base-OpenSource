/**
 * Service de logging centralisé avec analyse d'erreurs
 * Conforme aux bonnes pratiques de gestion d'erreurs
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class LoggerService {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 500; // Garder en mémoire pour debugging

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
  }

  private store(entry: LogEntry): void {
    this.logs.push(entry);
    // Éviter une croissance infinie
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, context);
    this.store(entry);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${entry.timestamp}] ${message}`, context);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.INFO, message, context);
    this.store(entry);
    console.info(`[${entry.timestamp}] ${message}`, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.WARN, message, context);
    this.store(entry);
    console.warn(`[${entry.timestamp}] ⚠️ ${message}`, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createEntry(LogLevel.ERROR, message, context, error);
    this.store(entry);
    console.error(`[${entry.timestamp}] ❌ ${message}`, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    });
  }

  /**
   * Récupère tous les logs pour export (debugging/support)
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Exporte les logs en JSON pour envoi à support
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Vide les logs (après export par ex.)
   */
  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new LoggerService();
