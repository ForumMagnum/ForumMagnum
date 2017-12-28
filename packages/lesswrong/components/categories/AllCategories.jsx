import { Components, registerComponent, withList} from 'meteor/vulcan:core';
import { Categories } from 'meteor/example-forum';
import React from 'react';
import { Error404 } from 'meteor/vulcan:core';
import { Link } from 'react-router';

const AllCategories = (props) => {
  return (
    <div>
      {props.results && props.results.map(
        (category, index) => <div><Link to={"/categories/" + category._id}>{category.name}</Link></div>
          )}
        </div>
      )
};

AllCategories.displayName = "AllCategories";

const categoryListOptions = {
  collection: Categories,
  queryName: 'newPostCategories',
  fragmentName: 'allCategories',
};

registerComponent('AllCategories', AllCategories, [withList, categoryListOptions]);
