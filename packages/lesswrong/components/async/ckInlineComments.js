export const ckInlineComments = {
  addComment( data ) {
    console.log("comment added", data)
    // newCkCommentNotification({comment: data, postId: documentId, userId})
    return Promise.resolve();
  },

  updateComment( data ) {
    console.log( 'Comment updated', data );

    // Write a request to your database here. The returned `Promise`
    // should be resolved when the request has finished.
    return Promise.resolve();
  },

  removeComment( commentId ) {
    console.log( 'Comment removed', commentId );

    // Write a request to your database here. The returned `Promise`
    // should be resolved when the request has finished.
    return Promise.resolve();
  },
}