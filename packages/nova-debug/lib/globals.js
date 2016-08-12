import Telescope from 'nova-lib';
import Posts from 'nova-posts';
import Comments from 'nova-comments';
import Users from 'nova-users';
import Categories from 'nova-categories';
import Email from 'nova-email';
import Events from 'nova-events';

if (Meteor.isClient) {
  window.Telescope = Telescope;
  window.Posts = Posts;
  window.Comments = Comments;
  window.Users = Users;
  window.Categories = Categories;
  window.NovaEmail = Email;
  window.Events = Events;
} else {
  GLOBAL.Telescope = Telescope;
  GLOBAL.Posts = Posts;
  GLOBAL.Comments = Comments;
  GLOBAL.Users = Users;
  GLOBAL.Categories = Categories;
  GLOBAL.NovaEmail = Email;
  GLOBAL.Events = Events;
}