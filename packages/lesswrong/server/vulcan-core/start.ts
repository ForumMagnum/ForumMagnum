import { onStartup } from '../../lib/executionEnvironment';
import { startSyncedCron } from '../cronUtil';

onStartup(function() {
  startSyncedCron();
});

