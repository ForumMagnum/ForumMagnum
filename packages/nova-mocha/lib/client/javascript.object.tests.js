/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */
import {chai} from 'meteor/practicalmeteor:chai';

import Telescope from 'meteor/nova:lib';
import Posts from "meteor/nova:posts";
import React from 'react';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';

describe('Javascript Object', function () {
    it('Useful methods', function () {

        // Get the last item.
        chai.assert.equal(_.last([]), null);
        chai.assert.equal(_.last([1, 2, 3]), 3);

        // Remove the last item.

        // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
        // method: pop()
        //Return value
        //The removed element from the array; undefined if the array is empty.
        let array = [1, 0, 2];
        chai.assert.equal(array instanceof Array, true);
        const lastItem = array.pop();
        chai.assert.equal(lastItem, 2);
        chai.assert.equal(array instanceof Array, true);
    });

    it('Lodash methods', function () {
        // Get the last item.
        let arrays = [[1, 2], [3, 4]];
        let topicIds = _.flatten(arrays);
    });

    it('Remove object by id', function () {
        let arrays = [{_id: '123', name: "first"}, {_id: "234", name: "second"}];
        chai.assert.equal(arrays.length, 2);
        let messageId = "234";
        let removedFlash = _.filter(overlayFlashes.flashes, {_id: messageId});
        chai.assert.equal(removedFlash.name, "second");
        chai.assert.equal(arrays.length, 1);
    }); it('Remove object by id', function () {
        let arrays = [{_id: '123', name: "first"}, {_id: "234", name: "second"}];
        chai.assert.equal(arrays.length, 2);
        let messageId = "234";
        let removedFlash = _.filter(overlayFlashes.flashes, {_id: messageId});
        chai.assert.equal(removedFlash.name, "second");
        chai.assert.equal(arrays.length, 1);
    });
});