/** Ring-buffer logger for service worker (max 1000 lines). */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

const MAX_LOG_LINES = 1000;

export class RingBufferLogger {
  private readonly lines: string[] = [];

  log(level: LogLevel, message: string): void {
    const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
    this.lines.push(line);
    if (this.lines.length > MAX_LOG_LINES) {
      this.lines.splice(0, this.lines.length - MAX_LOG_LINES);
    }
  }

  debug(message: string): void {
    this.log("debug", message);
  }

  info(message: string): void {
    this.log("info", message);
  }

  warn(message: string): void {
    this.log("warn", message);
  }

  error(message: string): void {
    this.log("error", message);
  }

  getText(): string {
    return this.lines.join("\n");
  }

  lineCount(): number {
    return this.lines.length;
  }

  clear(): void {
    this.lines.length = 0;
  }
}

let singleton: RingBufferLogger | null = null;

export function getLogger(): RingBufferLogger {
  if (!singleton) {
    singleton = new RingBufferLogger();
  }
  return singleton;
}

export function resetLoggerForTests(): void {
  singleton = null;
}
