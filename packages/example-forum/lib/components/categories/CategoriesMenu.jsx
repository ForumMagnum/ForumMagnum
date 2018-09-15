import { Components, registerComponent, withList, Utils, withCurrentUser } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withRouter } from 'react-router';
import { Categories } from '../../modules/categories/index.js';
import { withApollo } from 'react-apollo';

/*

Category menu item

*/
const CategoryMenuItem = ({ category, active, expanded }) => <span className={`category-menu-item ${active ? 'category-menu-item-active' : ''}`}>{category.name}</span>;

class CategoriesMenu extends PureComponent {

  /*

  Menu item for the "All Categories" link

  */
  getResetCategoriesItem = () => {

    const resetCategoriesQuery = _.clone(this.props.router.location.query);
    delete resetCategoriesQuery.cat;

    const menuItem = {
      to: { pathname: Utils.getRoutePath('posts.list'), query: resetCategoriesQuery },
      itemProps: { 
        eventKey: 0,
        className: 'category-menu-item category-menu-item-all dropdown-item',
      },
      component: <FormattedMessage id="categories.all" />,
    };

    return menuItem;
  }

  /*

  Menu items for categoeries

  */
  getCategoriesItems = () => {
    const categories = this.props.results || [];

    // check if a category is currently active in the route
    const currentCategorySlug = this.props.router.location.query && this.props.router.location.query.cat;
    const currentCategory = Categories.findOneInStore(this.props.client.store, { slug: currentCategorySlug });
    const parentCategories = Categories.getParents(currentCategory, this.props.client.store);

    // decorate categories with active and expanded properties
    const categoriesClone = categories.map((category, index) => {

      const query = _.clone(this.props.router.location.query);
      query.cat = category.slug;

      const active = currentCategory && category.slug === currentCategory.slug;
      const expanded = parentCategories && _.contains(_.pluck(parentCategories, 'slug'), category.slug);

      return {
        to: { pathname: Utils.getRoutePath('posts.list'), query },
        component: <CategoryMenuItem/>,
        itemProps: {
          active,
          className: 'dropdown-item',
        },
        componentProps: { // will be passed to component defined above
          _id: category._id,
          parentId: category.parentId,
          category,
          index,
          currentUser: this.props.currentUser,
          active,
          expanded,
        }
      };
    });

    // add `childrenItems` on each item in categoriesClone
    const nestedCategories = Utils.unflatten(categoriesClone, { idProperty: 'componentProps._id', parentIdProperty: 'componentProps.parentId', childrenProperty: 'childrenItems' });

    return nestedCategories;
  }

  /*

  Get all menu items

  */
  getMenuItems = () => {
    const menuItems = [this.getResetCategoriesItem(), ...this.getCategoriesItems()];
    return menuItems;
  };

  render() {

    return (
      <div>
        {this.props.loading ? (
          <Components.Loading />
        ) : (
          <Components.Dropdown
            variant="default"
            className="categories-list btn-secondary"
            labelId={'categories'}
            id="categories-dropdown"
            menuItems={this.getMenuItems()}
          />
        )}
      </div>
    );
  }
}

CategoriesMenu.propTypes = {
  results: PropTypes.array,
};

const options = {
  collection: Categories,
  queryName: 'categoriesListQuery',
  fragmentName: 'CategoriesList',
  limit: 0,
  pollInterval: 0,
};

registerComponent('CategoriesMenu', CategoriesMenu, withRouter, withApollo, [withList, options], withCurrentUser);
