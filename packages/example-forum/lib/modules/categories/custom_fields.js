/*

Custom fields on Posts collection

*/

import { Posts } from '../../modules/posts/index.js';
import { getCategoriesAsOptions } from './schema.js';
import { Utils } from 'meteor/vulcan:core';

Posts.addField([
  {
    fieldName: 'categoriesIds',
    fieldSchema: {
      type: Array,
      control: 'checkboxgroup',
      optional: true,
      insertableBy: ['members'],
      editableBy: ['members'],
      viewableBy: ['guests'],
      options: props => {
        return getCategoriesAsOptions(props.data.CategoriesList);
      },
      query: `
        CategoriesList{
          _id
          name
          slug
          order
        }
      `,
      resolveAs: {
        fieldName: 'categories',
        type: '[Category]',
        resolver: Utils.generateIdResolverMulti(
          {collectionName: 'Categories', fieldName: 'categoriesIds'}
        ),
        addOriginalField: true,
      }
    }
  },
  {
    fieldName: 'categoriesIds.$',
    fieldSchema: {
      type: String,
      optional: true
    }
  }
]);
