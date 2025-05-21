import PriorityBucketQueue, { RequestData } from '@/lib/requestPriorityQueue';
import { renderRequest, type RenderRequestParams, type RenderResult } from './renderPage';
import { addStartRenderTimeToPerfMetric, setAsyncStoreValue } from '@/server/perfMetrics';
import { getClientIP } from '@/server/utils/getClientIP';
import { maxRenderQueueSize, queuedRequestTimeoutSecondsSetting } from '@/lib/publicSettings';
import moment from 'moment';
import { getPathFromReq, trySetResponseStatus } from '../utils/httpUtil';
import { isAnyTest } from '@/lib/executionEnvironment';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { getIpFromRequest } from '../datadog/datadogMiddleware';
import { captureEvent } from '@/lib/analyticsEvents';

interface RenderPriorityQueueSlot extends RequestData {
  callback: () => Promise<void>;
  renderRequestParams: RenderRequestParams;
}

let inFlightRenderCount = 0;
const requestPriorityQueue = new PriorityBucketQueue<RenderPriorityQueueSlot>();

/**
 * We (maybe) have a problem where too many concurrently rendering requests cause our servers to fall over
 * To solve this, we introduce a queue for incoming requests, such that we have a maximum number of requests being rendered at the same time
 * See {@link maybeStartQueuedRequests} for the part that kicks off requests when appropriate
 */
export function queueRenderRequest(params: RenderRequestParams): Promise<RenderResult> {
  return new Promise((resolve) => {
    requestPriorityQueue.enqueue({
      ip: getClientIP(params.req) ?? "unknown",
      userAgent: params.userAgent ?? 'sus-missing-user-agent',
      userId: params.user?._id,
      callback: async () => {
        let result: RenderResult;
        addStartRenderTimeToPerfMetric();
        try {
          result = await renderRequest(params);
        } finally {
          inFlightRenderCount--;
        }
        resolve(result);
        maybeStartQueuedRequests();
      },
      renderRequestParams: params,
    });

    maybeStartQueuedRequests();
  });
}


function maybeStartQueuedRequests() {
  while (inFlightRenderCount < maxRenderQueueSize.get() && requestPriorityQueue.size() > 0) {
    let requestToStartRendering = requestPriorityQueue.dequeue();
    if (requestToStartRendering.request) {
      const { preOpPriority, request } = requestToStartRendering;
      const { startTime, res } = request.renderRequestParams;
      
      const queuedRequestTimeoutSeconds = queuedRequestTimeoutSecondsSetting.get();
      const maxRequestAge = moment().subtract(queuedRequestTimeoutSeconds, 'seconds').toDate();
      if (maxRequestAge > startTime) {
        trySetResponseStatus({ response: res, status: 429 });
        res.end();
        continue;
      }

      // If the request that we're kicking off is coming from the queue, we want to track this in the perf metrics
      setAsyncStoreValue('requestPerfMetric', (incompletePerfMetric) => {
        if (!incompletePerfMetric) return;
        return {
          ...incompletePerfMetric,
          queue_priority: preOpPriority
        }
      });

      inFlightRenderCount++;
      void request.callback();
    }
  }
}

export function initRenderQueueLogging() {
  if (!isAnyTest && performanceMetricLoggingEnabled.get()) {
    setInterval(logRenderQueueState, 5000)
  }
}

function logRenderQueueState() {
  if (requestPriorityQueue.size() > 0) {
    const queueState = requestPriorityQueue.getQueueState().map(([{ renderRequestParams }, priority]) => {
      return {
        userId: renderRequestParams.user?._id,
        ip: getIpFromRequest(renderRequestParams.req),
        userAgent: renderRequestParams.userAgent,
        url: getPathFromReq(renderRequestParams.req),
        startTime: renderRequestParams.startTime,
        priority
      }
    })

    captureEvent("renderQueueState", {
      queueState: queueState.map(q => ({
        ...q,
        userId: q.userId ?? null,
        userAgent: q.userAgent ?? null,
        startTime: q.startTime.toISOString(),
      })) as JsonArray,
    });
  }
}
