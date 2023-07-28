import { unflattenComments } from '../lib/utils/unflatten';
import chai from 'chai';

type MinimalComment = {
  _id: string
  parentCommentId: string|null
  topLevelCommentId: string
}

describe("unflatten comments", () => {
  it('unflattens comments', () => {
    // C
    // |\
    // C C
    chai.assert.deepEqual(
      unflattenComments<MinimalComment>([
        {_id:"1", parentCommentId:null, topLevelCommentId:"1"},
        {_id:"2", parentCommentId:"1", topLevelCommentId:"1"},
        {_id:"3", parentCommentId:"1", topLevelCommentId:"1"},
      ], {
        usePlaceholders: true
      }),
      [{
        _id:"1",
        item: {_id:"1", parentCommentId:null, topLevelCommentId:"1"},
        children: [
          {
            _id: "2",
            item: {_id:"2", parentCommentId:"1", topLevelCommentId:"1"},
            children: [],
          },
          {
            _id: "3",
            item: {_id:"3", parentCommentId:"1", topLevelCommentId:"1"},
            children: [],
          },
        ],
      }]
    );
    // _
    // |\
    // C C
    chai.assert.deepEqual(
      unflattenComments<MinimalComment>([
        {_id:"2", parentCommentId:"1", topLevelCommentId:"1"},
        {_id:"3", parentCommentId:"1", topLevelCommentId:"1"},
      ], {
        usePlaceholders: true
      }),
      [{
        _id:"1",
        item: null,
        children: [
          {
            _id: "2",
            item: {_id:"2", parentCommentId:"1", topLevelCommentId:"1"},
            children: [],
          },
          {
            _id: "3",
            item: {_id:"3", parentCommentId:"1", topLevelCommentId:"1"},
            children: [],
          },
        ],
      }]
    );
    // 1_
    //  |\
    // 2_ C3
    //  |
    // 4C
    chai.assert.deepEqual(
      unflattenComments<MinimalComment>([
        {_id:"3", parentCommentId:"1", topLevelCommentId:"1"},
        {_id:"4", parentCommentId:"2", topLevelCommentId:"1"},
      ], {
        usePlaceholders: true
      }),
      [{
        _id:"1",
        item: null,
        children: [
          {
            _id: "3",
            item: {_id:"3", parentCommentId:"1", topLevelCommentId:"1"},
            children: [],
          },
          {
            _id: "2",
            item: null,
            children: [
              {
                _id: "4",
                item: {_id:"4", parentCommentId:"2", topLevelCommentId:"1"},
                children: [],
              }
            ],
          },
        ],
      }]
    );
  });
});
