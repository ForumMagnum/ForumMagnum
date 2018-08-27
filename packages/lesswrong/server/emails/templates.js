import VulcanEmail from 'meteor/vulcan:email';
import Handlebars from 'handlebars';
import moment from 'moment';

const postsQuery = `
  query PostsSingleQuery($documentId: String){
    PostsSingle(documentId: $documentId){
      title
      url
      pageUrl
      linkUrl
      postedAt
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
      if(!data || !data.PostsSingle)
        throw "Missing post when rendering newPost email";
      const post = data.PostsSingle;
      return post.title;
    },
    query: postsQuery
  }
})

Handlebars.registerHelper('formatPostDate', function(date) {
  return moment(new Date(date)).format("MMM D, YYYY");
});


VulcanEmail.addTemplates({
  wrapper: Assets.getText("server/emails/templates/wrapper.handlebars"),
  newPost: Assets.getText("server/emails/templates/newPost.handlebars"),
});
