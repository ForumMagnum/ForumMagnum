import { registerFragment } from 'meteor/vulcan:core';

// note: fragment used by default on CategoriesList & PostsList fragments
registerFragment(`
  fragment CategoriesMinimumInfo on Category {
    # example-forum
    _id
    name
    slug
  }
`);

registerFragment(`
  fragment CategoriesList on Category {
    # example-forum
    ...CategoriesMinimumInfo
    description
    order
    image
    parentId
    parent {
      ...CategoriesMinimumInfo
    }
  }
`);
