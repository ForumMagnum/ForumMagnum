/*
 * This file was originally vendored from https://github.com/jdesboeufs/connect-mongo/blob/master/src/lib/MongoStore.ts
 * It's since been edited to use our `Collection` system
 *
 * Copyright (c) 2017 Jérôme Desboeufs, modifications (c) the LessWrong development team
 * Released under the MIT License, see: https://github.com/jdesboeufs/connect-mongo/blob/master/LICENSE
 */

import * as session from 'express-session';
import { assert } from 'console';
import { loggerConstructor } from '../../../lib/utils/logging';
import SessionsRepo, { UpsertSessionData } from '../../repos/SessionsRepo';
import { backgroundTask } from '@/server/utils/backgroundTask';

const debug = loggerConstructor('connect-mongo');

type ConnectMongoCollection = CollectionBase<"Sessions">;

type RequiredConnectMongoOptions = {
  collection: ConnectMongoCollection;
}

type OptionalConnectMongoOptions = {
  ttl: number;
  touchAfter: number;
  stringify: boolean;
  autoRemove: 'native' | 'interval' | 'disabled';
  autoRemoveInterval: number;
}

type ConcreteConnectMongoOptions = RequiredConnectMongoOptions & OptionalConnectMongoOptions;

export type ConnectMongoOptions = RequiredConnectMongoOptions & Partial<OptionalConnectMongoOptions>;

const noop = () => {}
const identity = <T>(x: T) => x;

export default class MongoStore extends session.Store {
  private collection: ConnectMongoCollection;
  private timer?: NodeJS.Timeout;
  private options: ConcreteConnectMongoOptions;

  constructor({
    ttl = 1209600,
    autoRemove = 'native',
    autoRemoveInterval = 10,
    touchAfter = 0,
    stringify = true,
    ...required
  }: ConnectMongoOptions) {
    super()
    debug('create MongoStore instance');
    const options: ConcreteConnectMongoOptions = {
      ttl,
      autoRemove,
      autoRemoveInterval,
      touchAfter,
      stringify,
      ...required,
    };
    // Check params
    assert(
      !!options.collection,
      'You must provide either mongoUrl|clientPromise|client in options'
    );
    assert(
      !options.autoRemoveInterval || options.autoRemoveInterval <= 71582,
      'autoRemoveInterval is too large. options.autoRemoveInterval is in minutes but not seconds nor mills'
    );
    this.collection = options.collection;
    this.options = options;
    this.collection = options.collection;
    backgroundTask(this.setAutoRemove(this.collection));
  }

  getCollection(): ConnectMongoCollection {
    return this.collection;
  }

  private getTransformFunctions() {
    return {
      serialize: identity,
      unserialize: identity,
    };
  }

  private async setAutoRemove(collection: ConnectMongoCollection): Promise<void> {
    const removeQuery = () => ({
      expires: {
        $lt: new Date(),
      },
    });
    switch (this.options.autoRemove) {
      case 'native':
        debug('Creating MongoDB TTL index');
        break;
      case 'interval':
        debug('create Timer to remove expired sessions');
        this.timer = setInterval(
          () => backgroundTask(collection.rawRemove(removeQuery())),
          this.options.autoRemoveInterval * 1000 * 60
        );
        this.timer.unref();
        break;
      case 'disabled':
      default:
        break;
    }
  }

  /**
   * Get a session from the store given a session ID (sid)
   * @param sid session ID
   */
  get(
    sid: string,
    callback: (err: any, session?: session.SessionData | null) => void
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void (async () => {
      try {
        debug(`MongoStore#get=${sid}`);
        const session = await this.collection.findOne({
          _id: sid,
          $or: [
            { expires: { $exists: false } },
            { expires: { $gt: new Date() } },
          ],
        });
        const s = session && this.getTransformFunctions().unserialize(session.session);
        if (this.options.touchAfter > 0 && session?.lastModified) {
          s.lastModified = session.lastModified;
        }
        this.emit('get', sid);
        callback(null, s === undefined ? null : s);
      } catch (error) {
        callback(error);
      }
    })();
  }

  /**
   * Upsert a session into the store given a session ID (sid) and session (session) object.
   * @param sid session ID
   * @param session session object
   */
  async set(
    sid: string,
    session: session.SessionData,
    callback: (err: any) => void = noop,
  ): Promise<void> {
    try {
      debug(`MongoStore#set=${sid}`);
      // Removing the lastModified prop from the session object before update
      // @ts-ignore
      if (this.options.touchAfter > 0 && session?.lastModified) {
        // @ts-ignore
        delete session.lastModified;
      }
      const expires = (session?.cookie?.expires) 
        ? new Date(session.cookie.expires) 
        // If there's no expiration date specified, it is
        // browser-session cookie or there is no cookie at all,
        // as per the connect docs.
        //
        // So we set the expiration to two-weeks from now
        // - as is common practice in the industry (e.g Django) -
        // or the default specified in the options.
        : new Date(Date.now() + (this.options.ttl * 1000));
      
      const lastModified =  (this.options.touchAfter > 0) 
        ? new Date() 
        : null;
      
      const s: UpsertSessionData = {
        _id: sid,
        session: this.getTransformFunctions().serialize(session),
        expires,
        lastModified
      };

      const rawResp = await new SessionsRepo().upsertSession(s);

      if (rawResp > 0) {
        this.emit('create', sid)
      } else {
        this.emit('update', sid)
      }
      this.emit('set', sid);
    } catch (error) {
      return callback(error);
    }
    return callback(null);
  }

  async touch(
    sid: string,
    session: session.SessionData & { lastModified?: Date },
    callback: (err: any) => void = noop,
  ): Promise<void> {
    try {
      debug(`MongoStore#touch=${sid}`);
      const updateFields: {
        lastModified?: Date
        expires?: Date
        session?: session.SessionData
      } = {};
      const touchAfter = this.options.touchAfter * 1000;
      const lastModified = session.lastModified
        ? session.lastModified.getTime()
        : 0;
      const currentDate = new Date();

      // If the given options has a touchAfter property, check if the
      // current timestamp - lastModified timestamp is bigger than
      // the specified, if it's not, don't touch the session
      if (touchAfter > 0 && lastModified > 0) {
        const timeElapsed = currentDate.getTime() - lastModified;
        if (timeElapsed < touchAfter) {
          debug(`Skip touching session=${sid}`);
          return callback(null);
        }
        updateFields.lastModified = currentDate;
      }

      if (session?.cookie?.expires) {
        updateFields.expires = new Date(session.cookie.expires);
      } else {
        updateFields.expires = new Date(Date.now() + (this.options.ttl * 1000));
      }
      const rawResp = await this.collection.rawUpdateOne(
        { _id: sid },
        { $set: updateFields },
      );
      if (rawResp === 0) {
        return callback(new Error('Unable to find the session to touch'));
      } else {
        this.emit('touch', sid, session);
        return callback(null);
      }
    } catch (error) {
      return callback(error);
    }
  }

  /**
   * Get all sessions in the store as an array
   */
  async all(
    callback: (
      err: any,
      obj?:
        | session.SessionData[]
        | { [sid: string]: session.SessionData }
        | null
    ) => void
  ): Promise<void> {
    try {
      debug('MongoStore#all()');
      const sessions = await this.collection.find({
        $or: [
          { expires: { $exists: false } },
          { expires: { $gt: new Date() } },
        ],
      }).fetch();
      const results: session.SessionData[] = [];
      for await (const session of sessions) {
        results.push(this.getTransformFunctions().unserialize(session.session));
      }
      this.emit('all', results);
      callback(null, results);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Destroy/delete a session from the store given a session ID (sid)
   * @param sid session ID
   */
  async destroy(sid: string, callback: (err: any) => void = noop): Promise<void> {
    debug(`MongoStore#destroy=${sid}`);
    try {
      await this.collection.rawRemove({ _id: sid });
      this.emit('destroy', sid)
      callback(null)
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Get the count of all sessions in the store
   */
  async length(callback: (err: any, length: number) => void): Promise<void> {
    debug('MongoStore#length()');
    try {
      const length = await this.collection.find({}).count();
      callback(null, length);
    } catch (e) {
      callback(e, -1);
    }
  }

  /**
   * Delete all sessions from the store.
   */
  async clear(callback: (err: any) => void = noop): Promise<void> {
    debug('MongoStore#clear()');
    try {
      await this.collection.rawRemove({});
      callback(null);
    } catch (e) {
      callback(e);
    }
  }
}
