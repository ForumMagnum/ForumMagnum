/*

Emails

*/

import VulcanEmail from 'meteor/vulcan:email';

/*

Test

*/

VulcanEmail.addEmails({

  test: {
    template: "test",
    path: "/email/test",
    data() {
      return {date: new Date()};
    },
    subject() {
      return "This is a test";
    },
  }

});

/*

Users

*/

VulcanEmail.addEmails({
  
  newUser: {
    template: "newUser",
    path: "/email/new-user/:documentId?",
    subject() {
      return "A new user has been created";
    },
    query: `
      query UsersSingleQuery($documentId: String){
        UsersSingle(documentId: $documentId){
          displayName
          pageUrl
        }
      }
    `
  },

  accountApproved: {
    template: "accountApproved",
    path: "/email/account-approved/:documentId?",
    subject() {
      return "Your account has been approved.";
    },
    query: `
      query UsersSingleQuery($documentId: String){
        UsersSingle(documentId: $documentId){
          displayName
        }
        SiteData{
          title
          url
        }
      }
    `
  }

});

/*

Posts

*/

const postsQuery = `
  query PostsSingleQuery($documentId: String){
    PostsSingle(documentId: $documentId){
      title
      url
      pageUrl
      linkUrl
      htmlBody
      thumbnailUrl
      user{
        pageUrl
        displayName
      }
    }
  }
`

const dummyPost = {title: '[title]', user: {displayName: '[user]'}};

VulcanEmail.addEmails({
  
  newPost: {
    template: "newPost",
    path: "/email/new-post/:documentId?",
    subject(data) {
      const post = _.isEmpty(data) ? dummyPost : data.PostsSingle;
      return post.user.displayName+' has created a new post: '+post.title;
    },
    query: postsQuery
  },
  
  newPendingPost: {
    template: "newPendingPost",
    path: "/email/new-pending-post/:documentId?",
    subject(data) {
      const post = _.isEmpty(data) ? dummyPost : data.PostsSingle;
      return post.user.displayName+' has a new post pending approval: '+post.title;
    },
    query: postsQuery
  },
  
  postApproved: {
    template: "postApproved",
    path: "/email/post-approved/:documentId?",
    subject(data) {
      const post = _.isEmpty(data) ? dummyPost : data.PostsSingle;
      return 'Your post “'+post.title+'” has been approved';
    },
    query: postsQuery
  }
  
});
  
/*

Comments

*/

const commentsQuery = `
  query CommentsSingleQuery($documentId: String){
    CommentsSingle(documentId: $documentId){
      pageUrl
      htmlBody
      post{
        pageUrl
        title
      }
      user{
        pageUrl
        displayName
      }
    }
  }
`    

const dummyComment = {post: {title: '[title]'}, user: {displayName: '[user]'}};

VulcanEmail.addEmails({

  newComment: {
    template: "newComment",
    path: "/email/new-comment/:documentId?",
    subject(data) {
      const comment = _.isEmpty(data) ? dummyComment : data.CommentsSingle;
      return comment.user.displayName+' left a new comment on your post "' + comment.post.title + '"';
    },
    query: commentsQuery
  },

  newReply: {
    template: "newReply",
    path: "/email/new-reply/:documentId?",
    subject(data) {
      const comment = _.isEmpty(data) ? dummyComment : data.CommentsSingle;
      return comment.user.displayName+' replied to your comment on "'+comment.post.title+'"';
    },
    query: commentsQuery
  },

  newCommentSubscribed: {
    template: "newComment",
    path: "/email/new-comment-subscribed/:documentId?",
    subject(data) {
      const comment = _.isEmpty(data) ? dummyComment : data.CommentsSingle;
      return comment.user.displayName+' left a new comment on "' + comment.post.title + '"';
    },
    query: commentsQuery
  }

});
  
