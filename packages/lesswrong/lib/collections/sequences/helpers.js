import Sequences from './collection.js';
import { Utils } from 'meteor/vulcan:core';

Sequences.getPageUrl = function(sequence, isAbsolute = false){
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};