import { performanceMetricLoggingEnabled } from "../../lib/publicSettings";
import { asyncLocalStorage, closePerfMetric, openPerfMetric } from "../perfMetrics";
import type AbstractRepo from "./AbstractRepo";

type Constructor<TResult, TParams extends any[] = any[]> = new (
  ...params: TParams
) => TResult;

function wrapWithPerfMetrics(method: Function, repoName: string, methodName: string) {
  return function (this: AnyBecauseHard, ...args: AnyBecauseHard[]) {
    // Most other places we might try to put this check would cause us to run into the problem that the database settings haven't loaded yet (so .get() would throw an error)
    // But if we're already calling a (wrapped) repo method, presumably we're talking to a database, which means the settings should have loaded by now
    if (!performanceMetricLoggingEnabled.get()) {
      return method.apply(this, args);
    }

    const asyncContext = asyncLocalStorage.getStore();

    let parentTraceIdField;
    if (asyncContext) {
      parentTraceIdField = { parent_trace_id: asyncContext.get('context')?.perfMetric?.trace_id }
    } else {
      parentTraceIdField = {};
    }

    const opName = `${repoName}.${methodName}`;

    const startedDbRepoMetric = openPerfMetric({
      op_type: 'db_repo_method',
      op_name: opName,
      ...parentTraceIdField
    });

    const results = method.apply(this, args);
    // Not all methods on Repos return promises.
    // The naive method of accomplishing this would just be `const results = await method.apply(...)`
    // But this would require this closure to be an async function
    // Since this function is wrapping functions in Repos, it needs to not accidentally cause them to return promises if they weren't already doing so
    // That would break anything which called those functions and expected a sensible result (rather than a promise)
    if (results instanceof Promise) {
      return results.then(res => {
        closePerfMetric(startedDbRepoMetric);
        return res;
      });
    }

    return results;
  };
}

function wrapMethods<T extends Constructor<AbstractRepo<DbObject>>>(targetClass: T) {
  const methodNames = Object.getOwnPropertyNames(targetClass.prototype);

  methodNames.forEach(methodName => {
      const originalMethod = targetClass.prototype[methodName];

      if (typeof originalMethod === 'function' && methodName !== 'constructor') {
        targetClass.prototype[methodName] = wrapWithPerfMetrics(originalMethod, targetClass.name, methodName);
      }
  });
}

export function RecordPerfMetrics<T extends Constructor<AbstractRepo<DbObject>>>(value: T, _: ClassDecoratorContext) {
  wrapMethods(value);
  return value;
}
