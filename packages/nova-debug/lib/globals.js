import TelescopeImport from 'nova-lib';
import PostsImport from 'nova-posts';
import CommentsImport from 'nova-comments';
import UsersImport from 'nova-users';
import CategoriesImport from 'nova-categories';

if (Meteor.isClient) {
  window.Telescope = TelescopeImport;
  window.Posts = PostsImport;
  window.Comments = CommentsImport;
  window.Users = UsersImport;
  window.Categories = CategoriesImport;
} else {
  GLOBAL.Telescope = TelescopeImport;
  GLOBAL.Posts = PostsImport;
  GLOBAL.Comments = CommentsImport;
  GLOBAL.Users = UsersImport;
  GLOBAL.Categories = CategoriesImport;
}