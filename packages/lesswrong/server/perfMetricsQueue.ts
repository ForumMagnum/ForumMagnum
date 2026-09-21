import type { ForumTypeString } from "@/lib/instanceSettings";
import { isDevelopment } from '@/lib/executionEnvironment';
import { environmentDescriptionSetting, performanceMetricLoggingBatchSize } from '@/lib/instanceSettings';
import chunk from 'lodash/chunk';
import { getPgPromiseLib, getAnalyticsConnection } from './analytics/postgresConnection'
import { backgroundTask } from './utils/backgroundTask';

const queuedPerfMetrics = new Map<ForumTypeString, PerfMetric[]>();

export function queuePerfMetric(perfMetric: PerfMetric, forumType: ForumTypeString) {
  let queue = queuedPerfMetrics.get(forumType);
  if (!queue) {
    queue = [];
    queuedPerfMetrics.set(forumType, queue);
  }
  queue.push(perfMetric);
  backgroundTask(flushPerfMetrics(queue, forumType));
}

async function flushPerfMetrics(queue: PerfMetric[], forumType: ForumTypeString) {
  const batchSize = performanceMetricLoggingBatchSize.get(forumType)

  if (queue.length < batchSize) return;

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
   
  const metricsToWrite = queue.splice(0);
  for (const batch of chunk(metricsToWrite, batchSize)) {
    try {
      await insertAndCacheNormalizedDataInBatch(batch, connection);

      const environmentDescription = isDevelopment ? "development" : environmentDescriptionSetting.get(forumType);
      const valuesToInsert = constructPerfMetricBatchInsertQuery(batch, environmentDescription);
      const query = getPgPromiseLib().helpers.insert(valuesToInsert, perfMetricsColumnSet);
      
      await connection?.none(query);
    } catch (err){
      // Filter out noisy connection terminated errors, which happen when the client kills the connection (frequently on NextJS)
      if (!(err instanceof Error) || !err.message.includes('Connection terminated unexpectedly')) {
        //eslint-disable-next-line no-console
        console.error("Error sending events to analytics DB:", err);
      }
    }
  }
}
