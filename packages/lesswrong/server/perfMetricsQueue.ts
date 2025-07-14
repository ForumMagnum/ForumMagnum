import { isDevelopment } from '@/lib/executionEnvironment';
import { environmentDescriptionSetting } from '@/lib/instanceSettings';
import chunk from 'lodash/chunk';
import { performanceMetricLoggingBatchSize } from '@/lib/instanceSettings';
import { pgPromiseLib, getAnalyticsConnection } from './analytics/postgresConnection'

const queuedPerfMetrics: PerfMetric[] = [];

export function queuePerfMetric(perfMetric: PerfMetric) {
  queuedPerfMetrics.push(perfMetric);
  void flushPerfMetrics();
}

async function flushPerfMetrics() {
  const batchSize = performanceMetricLoggingBatchSize.get()

  if (queuedPerfMetrics.length < batchSize) return;

  const { refreshSettingsCaches } = await import('./loadDatabaseSettings');
  await refreshSettingsCaches();

  const connection = getAnalyticsConnection();
  if (!connection) return;

  // I really needed to break an import cycle involving `analyticsEvents.tsx` and `Table.ts`
  // This seemed like the least-bad place to do it.
  // TODO: If you can figure out a better way, please do.
  const {
    constructPerfMetricBatchInsertQuery,
    insertAndCacheNormalizedDataInBatch,
    perfMetricsColumnSet
  } = await import('@/server/perfMetricsWriter/perfMetricsWriter');
   
  const metricsToWrite = queuedPerfMetrics.splice(0);
  for (const batch of chunk(metricsToWrite, batchSize)) {
    try {
      await insertAndCacheNormalizedDataInBatch(batch, connection);

      const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get();
      const valuesToInsert = constructPerfMetricBatchInsertQuery(batch, environmentDescription);
      const query = pgPromiseLib.helpers.insert(valuesToInsert, perfMetricsColumnSet);
      
      await connection?.none(query);
    } catch (err){
      //eslint-disable-next-line no-console
      console.error("Error sending events to analytics DB:");
      //eslint-disable-next-line no-console
      console.error(err);
    }
  }
}
