import { InteractionManager } from 'react-native';
import RNFS from 'react-native-fs';
import { consoleTransport, fileAsyncTransport, logger } from 'react-native-logs';
import Share from 'react-native-share';

import appConf from '~/framework/util/appConf';

export namespace Log {
  const logFileName = 'appe.log';
  export const logFilePath = `${RNFS.DocumentDirectoryPath}/${logFileName}`;

  let log;

  export async function init() {
    if (appConf.isDebugEnabled) {
      try {
        // initialize logger
        log = logger.createLogger({
          async: true,
          asyncFunc: InteractionManager.runAfterInteractions,
          levels: {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
          },
          transport: [consoleTransport, fileAsyncTransport],
          transportOptions: {
            colors: {
              debug: 'white',
              info: 'blueBright',
              warn: 'yellowBright',
              error: 'redBright',
            },
            fileName: logFileName,
            FS: RNFS,
            mapLevels: {
              debug: 'log',
              info: 'info',
              warn: 'warn',
              error: 'error',
            },
          },
        });
        // Patch standard console.* statements
        log?.patchConsole();
        // Clear log if needed
        try {
          const logFileStats = await RNFS.stat(logFilePath);
          if (logFileStats) {
            const today = new Date();
            const creationDate = new Date(logFileStats.ctime);
            if (today.toDateString() !== creationDate.toDateString()) clear();
          }
        } catch (e) {
          console.error('Unable to retrieve log file stats: ', (e as Error).message);
        }
      } catch (e) {
        console.error('Unable to initialize logger: ', (e as Error).message);
      }
    }
  }

  export function clear() {
    RNFS.unlink(logFilePath);
  }

  export async function contentsAsArray(): Promise<string[]> {
    const logs: string[] = [];

    try {
      const contents = await RNFS.readFile(logFilePath);
      const lines = contents.split('\n');

      let currentLog = '';
      const timeRegex = /^\d{2}:\d{2}:\d{2}/;

      lines.forEach(line => {
        if (timeRegex.test(line)) {
          if (currentLog) {
            logs.push(currentLog.trim());
          }
          currentLog = line;
        } else {
          currentLog += '\n' + line;
        }
      });

      if (currentLog) logs.push(currentLog.trim());
      logs.reverse();
    } catch (e) {
      console.error('Unable to read log: ', (e as Error).message);
    } finally {
      return logs;
    }
  }

  export function pause() {
    log?.disable();
  }

  export function resume() {
    log?.enable();
  }

  export async function share() {
    try {
      const logFileExists = await RNFS.exists(Log.logFilePath);
      if (!logFileExists) {
        console.error('Log file does not exist!');
        return;
      }
      await Share.open({
        title: 'Share log file',
        url: `file://${Log.logFilePath}`,
      });
    } catch (e) {
      console.error('Unable to share log file: ', (e as Error).message);
    }
  }
}
