import { Mongo } from 'meteor/mongo';
import { wrapAsync } from './executionEnvironment';

export const MongoCollection = Mongo.Collection;

/**
 * @summary Allow mongodb aggregation
 * @param {Array} pipelines mongodb pipeline
 * @param {Object} options mongodb option object
 */
MongoCollection.prototype.aggregate = function(pipelines, options) {
  var coll = this.rawCollection();
  return wrapAsync(coll.aggregate.bind(coll))(pipelines, options);
};
