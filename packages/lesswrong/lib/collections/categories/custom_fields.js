import { Categories } from "meteor/example-forum";
import ReactDOMServer from 'react-dom/server';
import { Components } from 'meteor/vulcan:core';
import React from 'react';


Categories.addField([
  /**
    URL (Overwriting original schema)
  */

  {
      fieldName: "parentId",
      fieldSchema: {
        hidden: true,
      }
  },
  {
      fieldName: "image",
      fieldSchema: {
        hidden: true,
      }
  },
  {
    fieldName: "deleted",
    fieldSchema: {
      type: Boolean,
      order: 120,
      default: false,
      control: 'checkbox',
      editableBy: ['members'],
      insertableBy: ['members'],
    }
  },
])
