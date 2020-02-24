import { Utils } from '../../vulcan-lib';
import * as _ from 'underscore';

Utils.getSequencePostLinks = (sequence, post) => {
  if (sequence && sequence.chapters &&  post ) {
    const { currentChapter, postIndex, chapterIndex } = Utils.getCurrentChapter(sequence, post)
    let currentSequenceLength = sequence.chapters.length;
    let nextPost = null, prevPost = null
    if (postIndex || postIndex === 0) {
      if (postIndex + 1 < currentChapter.posts.length) {
        nextPost = currentChapter.posts[postIndex + 1]
      } else if (chapterIndex + 1 < currentSequenceLength
          && sequence.chapters[chapterIndex + 1].posts.length !== 0) {
        nextPost = sequence.chapters[chapterIndex + 1].posts[0]
      }
      if (postIndex > 0) {
        prevPost = currentChapter.posts[postIndex - 1]
      } else if (chapterIndex > 0) {
        prevPost = sequence.chapters[chapterIndex - 1].posts[sequence.chapters[chapterIndex-1].posts.length - 1]
      }
    }
    return {nextPost: nextPost, prevPost: prevPost, currentChapter: currentChapter, postIndex: postIndex, chapterIndex: chapterIndex}
  }
}

/*
  getCurrentChapter: Given a sequence and a current post, returns the current chapter,
  the index of the current post in the chapter, and the index of the chapter in the sequence
*/
Utils.getCurrentChapter = (sequence, post) => {
  const chapters = sequence.chapters
  if (chapters) {
    let result: any = null
    chapters.forEach((c, i) => { //c: chapter, i: chapterIndex
      const postIndex = _.pluck(c.posts, '_id').indexOf(post._id)
      if (postIndex >= 0) {
        result = {currentChapter: c, postIndex, chapterIndex: i}
      }
    })
    if (result) {
      return result
    } else {
      throw Error("No chapter found in sequence " + sequence._id + "that that includes post: " + post._id)
    }
  } else {
    throw Error("Sequence has no chapters, can't find currentChapter")
  }
}
