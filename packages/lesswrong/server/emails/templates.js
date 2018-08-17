import VulcanEmail from 'meteor/vulcan:email';

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
`;

VulcanEmail.addEmails({
  newPost: {
    template: "newPost",
    path: "/email/new-post/:documentId",
    subject(data) {
      const post = _.isEmpty(data) ? dummyPost : data.PostsSingle;
      return post.user.displayName+' has created a new post: '+post.title;
    },
    query: postsQuery
  }
})


VulcanEmail.addTemplates({
  wrapper: Assets.getText("server/emails/templates/wrapper.handlebars"),
  newPost: Assets.getText("server/emails/templates/newPost.handlebars"),
});
