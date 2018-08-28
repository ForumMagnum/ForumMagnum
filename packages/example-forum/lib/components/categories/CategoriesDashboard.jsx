/*

Show a dashboard of all categories

http://docs.vulcanjs.org/core-components.html#Datatable

*/

import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { FormattedMessage } from 'meteor/vulcan:i18n';

import { Categories } from '../../modules/categories';

const CategoriesDashboard = () =>

  <div className="categories-dashboard">
    
    <h3><FormattedMessage id='categories'/></h3>

    <Components.Datatable 
      collection={Categories}
      columns={['name', 'description', 'order', 'slug']}
      showEdit={true}
      showNew={true}
    />
  
  </div>

registerComponent('CategoriesDashboard', CategoriesDashboard);