import { logger } from '../utils/logger';
import { ahrefs_worker } from './workers/ahrefs.worker';
import { semrush_worker } from './workers/semrush.worker';

let queue_workers_initialized = false;

export const init_queue_workers = () => {
  if (queue_workers_initialized) {
    return;
  }
  queue_workers_initialized = true;
  logger.info('[queue] workers initialized');
  void semrush_worker;
  void ahrefs_worker;
};
