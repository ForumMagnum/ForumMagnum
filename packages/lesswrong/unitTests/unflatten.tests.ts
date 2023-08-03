import { CommentTreeNode, unflattenComments, groupCommentThread } from '../lib/utils/unflatten';
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

describe("groups comments along a single-reply thread", () => {
  it('groups them when branching near the end', () => {
    /*
     * A
     * |
     * +-B
     *   |
     *   +-C
     *     |
     *     +-D
     *     | |
     *     | +-E
     *     | |
     *     | +-F
     *     |
     *     +-G
     */
    {
      const comments = unflattenComments([
        {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
        {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
        {_id: "C", parentCommentId: "B", topLevelCommentId: "A"},
        {_id: "D", parentCommentId: "C", topLevelCommentId: "A"},
        {_id: "E", parentCommentId: "D", topLevelCommentId: "A"},
        {_id: "F", parentCommentId: "D", topLevelCommentId: "A"},
        {_id: "G", parentCommentId: "C", topLevelCommentId: "A"},
      ]);
      
      chai.assert.deepEqual(
        groupCommentThread((commentId) => true, comments[0].item!, comments[0].children),
        {
          groupedComments: [
            {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
            {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
            {_id: "C", parentCommentId: "B", topLevelCommentId: "A"},
          ],
          childComments: [
            findCommentSubtree("D", comments),
            findCommentSubtree("G", comments),
          ],
        }
      )
    }
  }),
  it('groups a chain', () => {
    /*
     * A
     * |
     * +-B
     *   |
     *   +-C
     */
    {
      const comments = unflattenComments([
        {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
        {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
        {_id: "C", parentCommentId: "B", topLevelCommentId: "A"},
      ]);
      
      chai.assert.deepEqual(
        groupCommentThread((commentId) => true, comments[0].item!, comments[0].children),
        {
          groupedComments: [
            {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
            {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
          ],
          childComments: [
            findCommentSubtree("C", comments),
          ],
        }
      );
    }
  }),
  it("doesn't group if too shallow", () => {
    /*
     * A
     * |
     * +-B
     * |
     * +-C
     */
    {
      const comments = unflattenComments([
        {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
        {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
        {_id: "C", parentCommentId: "A", topLevelCommentId: "A"},
      ]);
      
      chai.assert.deepEqual(
        groupCommentThread((commentId) => true, comments[0].item!, comments[0].children),
        null
      );
    }
  });
  it('respects isGroupable', () => {
    /*
     * A
     * |
     * +-B
     *   |
     *   +-[C] <--not groupable
     *      |
     *      +-D
     */
    {
      const comments = unflattenComments([
        {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
        {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
        {_id: "C", parentCommentId: "B", topLevelCommentId: "A"},
        {_id: "D", parentCommentId: "C", topLevelCommentId: "A"},
      ]);
      
      chai.assert.deepEqual(
        groupCommentThread((commentId) => commentId !== 'C', comments[0].item!, comments[0].children),
        {
          groupedComments: [
            {_id: "A", parentCommentId: null, topLevelCommentId: "A"},
            {_id: "B", parentCommentId: "A", topLevelCommentId: "A"},
          ],
          childComments: [
            findCommentSubtree("C", comments),
          ],
        }
      );
    }
  });
});

function findCommentSubtree(id: string, tree: CommentTreeNode<MinimalComment>[]): CommentTreeNode<MinimalComment>|null {
  for (let root of tree) {
    if (root._id === id)
      return root;
    const foundInSubtree = findCommentSubtree(id, root.children);
    if (foundInSubtree) return foundInSubtree;
  }
  return null;
}

