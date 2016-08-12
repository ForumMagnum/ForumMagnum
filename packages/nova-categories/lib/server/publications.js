import Posts from 'nova-posts';
import Users from 'nova-users';
import Categories from "../collection.js";

Meteor.publish('categories', function() {
  
  const currentUser = this.userId && Users.findOne(this.userId);

  if(Users.canDo(currentUser, "posts.view.approved.all")){
    
    var categories = Categories.find();
    var publication = this;

    categories.forEach(function (category) {
      var childrenCategories = Categories.getChildren(category);
      var categoryIds = [category._id].concat(_.pluck(childrenCategories, "_id"));
      var cursor = Posts.find({$and: [{categories: {$in: categoryIds}}, {status: Posts.config.STATUS_APPROVED}]});
      // Counts.publish(publication, category.getCounterName(), cursor, { noReady: true });
    });

    return categories;
  }
  return [];
});