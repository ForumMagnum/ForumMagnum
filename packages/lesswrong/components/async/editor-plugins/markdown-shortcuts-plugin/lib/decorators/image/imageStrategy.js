'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var createImageStrategy = function createImageStrategy() {
  var findImageEntities = function findImageEntities(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges(function (character) {
      var entityKey = character.getEntity();
      return entityKey !== null && contentState.getEntity(entityKey).getType() === 'IMG';
    }, callback);
  };
  return findImageEntities;
};

exports.default = createImageStrategy;