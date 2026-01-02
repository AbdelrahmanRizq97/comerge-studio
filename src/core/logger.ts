import { logger, consoleTransport } from 'react-native-logs';

export type StudioLogger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  extend: (extension: string) => Pick<StudioLogger, 'debug' | 'info' | 'warn' | 'error'>;
  enable: (extension?: string) => boolean;
  disable: (extension?: string) => boolean;
  getExtensions: () => string[];
  setSeverity: (level: string) => string;
  getSeverity: () => string;
  patchConsole: () => void;
};

export const log: StudioLogger = logger.createLogger({
    levels: {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    },
    severity: "debug",
    transport: consoleTransport,
    transportOptions: {
      colors: {
        info: "blueBright",
        warn: "yellowBright",
        error: "redBright",
      },
    },
    async: true,
    dateFormat: "time",
    printLevel: true,
    printDate: true,
    fixedExtLvlLength: false,
    enabled: true,
  }
) as unknown as StudioLogger;


