import { logger } from '../../shared/utils/logger';
import config from '../../app/config';

let queue_workers_initialized = false;

export const init_queue_workers = () => {
  if (queue_workers_initialized) {
    return;
  }

  if (!config.QUEUE_WORKERS_ENABLED) {
    logger.info('[queue] workers disabled via QUEUE_WORKERS_ENABLED=false');
    return;
  }

  queue_workers_initialized = true;
  logger.info('[queue] workers initialized');
  void import('./workers/semrush.worker');
  void import('./workers/ahrefs.worker');
};
