import later from '@breejs/later';
import { CronHistories } from '../../../server/collections/cronHistories/collection';
import { isDevelopment } from '@/lib/executionEnvironment';

// A package for running jobs synchronized across multiple processes
export const SyncedCron: any = {
  _entries: {},
  running: false,
}

// Use localtime for evaluating schedules. This configures the 'later' library
// in a global, side-effectful way. This works out okay because all usages of
// this library are in this file.
later.date.localTime();

function log(message: string) {
  if (!isDevelopment) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

var scheduleEntry = function(entry: any) {
  var schedule = entry.schedule(later.parse);
  entry._timer =
    SyncedCron._laterSetInterval(SyncedCron._entryWrapper(entry), schedule);

  log('Scheduled "' + entry.name + '" next run @'
    + later.schedule(schedule).next(1));
}

// add a scheduled job
// SyncedCron.add({
//   name: String, //*required* unique name of the job
//   schedule: function(laterParser) {},//*required* when to run the job
//   job: function() {}, //*required* the code to run
// });
SyncedCron.add = async function(entry: {
  name: string,
  schedule: (parser: any) => any,
  job: () => void,
  persist?: boolean,
}) {

  if (entry.persist === undefined) {
    entry.persist = true;
  }

  // check
  if (!this._entries[entry.name]) {
    this._entries[entry.name] = entry;

    // If cron is already running, start directly.
    if (this.running) {
      scheduleEntry(entry);
    }
  }
}

// Start processing added jobs
SyncedCron.start = function() {
  var self = this;

  // Schedule each job with later.js
  Object.values(self._entries).forEach(function(entry) {
    scheduleEntry(entry);
  });
  self.running = true;
}

// Return the next scheduled date of the first matching entry or undefined
SyncedCron.nextScheduledAtDate = function(jobName: string) {
  var entry = this._entries[jobName];

  if (entry)
    return later.schedule(entry.schedule(later.parse)).next(1);
}

// Remove and stop the entry referenced by jobName
SyncedCron.remove = function(jobName: string) {
  var entry = this._entries[jobName];

  if (entry) {
    if (entry._timer)
      entry._timer.clear();

    delete this._entries[jobName];
    log('Removed "' + entry.name + '"');
  }
}

// Pause processing, but do not remove jobs so that the start method will
// restart existing jobs
SyncedCron.pause = function() {
  if (this.running) {
    Object.values(this._entries).forEach(function(entry: any) {
      entry._timer.clear();
    });
    this.running = false;
  }
}

// Stop processing and remove ALL jobs
SyncedCron.stop = function() {
  Object.entries(this._entries).forEach(function([name, entry]) {
    SyncedCron.remove(name);
  });
  this.running = false;
}

const isDuplicateKeyError = (error: Error & {code?: number | string}) =>
  error.code === '23505'; // pg duplicate key error code - note it's a string

// The meat of our logic. Checks if the specified has already run. If not,
// records that it's running the job, runs it, and records the output
SyncedCron._entryWrapper = function(entry: any) {
  var self = this;

  return async function(intendedAt: Date) {
    intendedAt = new Date(intendedAt.getTime());
    intendedAt.setMilliseconds(0);

    var jobHistory: any;

    if (entry.persist) {
      jobHistory = {
        intendedAt: intendedAt,
        name: entry.name,
        startedAt: new Date()
      };

      // If we have a dup key error, another instance has already tried to run
      // this job.
      try {
        jobHistory._id = await CronHistories.rawInsert(jobHistory, {quiet: true});
      } catch(e) {
        if (isDuplicateKeyError(e)) {
          log('Not running "' + entry.name + '" again.');
          return;
        }

        throw e;
      };
    }

    // run and record the job
    try {
      log('Starting "' + entry.name + '".');
      var output = entry.job(intendedAt,entry.name); // <- Run the actual job

      log('Finished "' + entry.name + '".');
      if(entry.persist) {
        await CronHistories.rawUpdateOne({_id: jobHistory._id}, {
          $set: {
            finishedAt: new Date(),
            result: output
          }
        });
      }
    } catch(e) {
      log('Exception "' + entry.name +'" ' + ((e && e.stack) ? e.stack : e));
      if(entry.persist) {
        await CronHistories.rawUpdateOne({_id: jobHistory._id}, {
          $set: {
            finishedAt: new Date(),
            error: (e && e.stack) ? e.stack : e
          }
        });
      }
    }
  };
}

// for tests
SyncedCron._reset = async function() {
  this._entries = {};
  await CronHistories.rawRemove({});
  this.running = false;
}

// ---------------------------------------------------------------------------
// The following two functions are lifted from the later.js package, however
// I've made the following changes:
// - Use Meteor.setTimeout and Meteor.clearTimeout
// - Added an 'intendedAt' parameter to the callback fn that specifies the precise
//   time the callback function *should* be run (so we can co-ordinate jobs)
//   between multiple, potentially laggy and unsynced machines

// From: https://github.com/bunkat/later/blob/master/src/core/setinterval.js
SyncedCron._laterSetInterval = function(fn: any, sched: any) {

  var t = SyncedCron._laterSetTimeout(scheduleTimeout, sched),
      done = false;

  /**
  * Executes the specified function and then sets the timeout for the next
  * interval.
  */
  function scheduleTimeout(intendedAt: Date) {
    if(!done) {
      try {
        fn(intendedAt);
      } catch(e) {
        log('Exception running scheduled job ' + ((e && e.stack) ? e.stack : e));
      }

      t = SyncedCron._laterSetTimeout(scheduleTimeout, sched);
    }
  }

  return {
    // Clears the timeout.
    clear: function() {
      done = true;
      t.clear();
    }

  };

};

// From: https://github.com/bunkat/later/blob/master/src/core/settimeout.js
SyncedCron._laterSetTimeout = function(fn: any, sched: any) {
  var s = later.schedule(sched)
  var t: any;
  scheduleTimeout();

  // Schedules the timeout to occur. If the next occurrence is greater than the
  // max supported delay (2147483647 ms) than we delay for that amount before
  // attempting to schedule the timeout again.
  function scheduleTimeout() {
    var now = Date.now();
    // @ts-ignore
    var next: any = s.next(2, now);

    // don't schedlue another occurence if no more exist synced-cron#41
    if (! next[0])
      return;

    var diff = next[0].getTime() - now,
        intendedAt = next[0];

    // minimum time to fire is one second, use next occurrence instead
    if(diff < 1000) {
      diff = next[1].getTime() - now;
      intendedAt = next[1];
    }

    if(diff < 2147483647) {
      t = setTimeout(function() { fn(intendedAt); }, diff);
    }
    else {
      t = setTimeout(scheduleTimeout, 2147483647);
    }
  }

  return {
    // Clears the timeout.
    clear: function() {
      clearTimeout(t);
    }
  };
};
