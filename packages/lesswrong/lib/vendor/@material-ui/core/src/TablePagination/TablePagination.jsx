// @inheritedComponent TableCell

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '../styles/withStyles';
import InputBase from '../InputBase';
import MenuItem from '../MenuItem';
import Select from '../Select';
import TableCell from '../TableCell';
import Toolbar from '../Toolbar';
import Typography from '../Typography';
import TablePaginationActions from '../TablePaginationActions';

export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    fontSize: theme.typography.pxToRem(12),
    // Increase the specificity to override TableCell.
    '&:last-child': {
      padding: 0,
    },
  },
  /* Styles applied to the Toolbar component. */
  toolbar: {
    height: 56,
    minHeight: 56,
    paddingRight: 2,
  },
  /* Styles applied to the spacer element. */
  spacer: {
    flex: '1 1 100%',
  },
  /* Styles applied to the caption Typography components if `variant="caption"`. */
  caption: {
    flexShrink: 0,
  },
  /* Styles applied to the Select component `root` class. */
  selectRoot: {
    marginRight: 32,
    marginLeft: 8,
    color: theme.palette.text.secondary,
  },
  /* Styles applied to the Select component `select` class. */
  select: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  /* Styles applied to the Select component `icon` class. */
  selectIcon: {
    top: 1,
  },
  /* Styles applied to the `InputBase` component. */
  input: {
    fontSize: 'inherit',
    flexShrink: 0,
  },
  /* Styles applied to the MenuItem component. */
  menuItem: {},
  /* Styles applied to the internal `TablePaginationActions` component. */
  actions: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: 20,
  },
});

/**
 * A `TableCell` based component for placing inside `TableFooter` for pagination.
 */
class TablePagination extends React.Component {
  // This logic would be better handled on userside.
  // However, we have it just in case.
  componentDidUpdate() {
    const { count, onChangePage, page, rowsPerPage } = this.props;
    const newLastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);
    if (page > newLastPage) {
      onChangePage(null, newLastPage);
    }
  }

  render() {
    const {
      ActionsComponent,
      backIconButtonProps,
      classes,
      colSpan: colSpanProp,
      component: Component,
      count,
      labelDisplayedRows,
      labelRowsPerPage,
      nextIconButtonProps,
      onChangePage,
      onChangeRowsPerPage,
      page,
      rowsPerPage,
      rowsPerPageOptions,
      SelectProps,
      ...other
    } = this.props;

    let colSpan;

    if (Component === TableCell || Component === 'td') {
      colSpan = colSpanProp || 1000; // col-span over everything
    }

    return (
      <Component className={classes.root} colSpan={colSpan} {...other}>
        <Toolbar className={classes.toolbar}>
          <div className={classes.spacer} />
          {rowsPerPageOptions.length > 1 && (
            <Typography variant="caption" className={classes.caption}>
              {labelRowsPerPage}
            </Typography>
          )}
          {rowsPerPageOptions.length > 1 && (
            <Select
              classes={{
                root: classes.selectRoot,
                select: classes.select,
                icon: classes.selectIcon,
              }}
              input={<InputBase className={classes.input} />}
              value={rowsPerPage}
              onChange={onChangeRowsPerPage}
              {...SelectProps}
            >
              {rowsPerPageOptions.map(rowsPerPageOption => (
                <MenuItem
                  className={classes.menuItem}
                  key={rowsPerPageOption}
                  value={rowsPerPageOption}
                >
                  {rowsPerPageOption}
                </MenuItem>
              ))}
            </Select>
          )}
          <Typography variant="caption" className={classes.caption}>
            {labelDisplayedRows({
              from: count === 0 ? 0 : page * rowsPerPage + 1,
              to: Math.min(count, (page + 1) * rowsPerPage),
              count,
              page,
            })}
          </Typography>
          <ActionsComponent
            className={classes.actions}
            backIconButtonProps={backIconButtonProps}
            count={count}
            nextIconButtonProps={nextIconButtonProps}
            onChangePage={onChangePage}
            page={page}
            rowsPerPage={rowsPerPage}
          />
        </Toolbar>
      </Component>
    );
  }
}

TablePagination.propTypes = {
  /**
   * The component used for displaying the actions.
   * Either a string to use a DOM element or a component.
   */
  ActionsComponent: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  /**
   * Properties applied to the back arrow [`IconButton`](/api/icon-button) component.
   */
  backIconButtonProps: PropTypes.object,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  colSpan: PropTypes.number,
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  /**
   * The total number of rows.
   */
  count: PropTypes.number.isRequired,
  /**
   * Customize the displayed rows label.
   */
  labelDisplayedRows: PropTypes.func,
  /**
   * Customize the rows per page label. Invoked with a `{ from, to, count, page }`
   * object.
   */
  labelRowsPerPage: PropTypes.node,
  /**
   * Properties applied to the next arrow [`IconButton`](/api/icon-button) element.
   */
  nextIconButtonProps: PropTypes.object,
  /**
   * Callback fired when the page is changed.
   *
   * @param {object} event The event source of the callback
   * @param {number} page The page selected
   */
  onChangePage: PropTypes.func.isRequired,
  /**
   * Callback fired when the number of rows per page is changed.
   *
   * @param {object} event The event source of the callback
   */
  onChangeRowsPerPage: PropTypes.func,
  /**
   * The zero-based index of the current page.
   */
  page: PropTypes.number.isRequired,
  /**
   * The number of rows per page.
   */
  rowsPerPage: PropTypes.number.isRequired,
  /**
   * Customizes the options of the rows per page select field. If less than two options are
   * available, no select field will be displayed.
   */
  rowsPerPageOptions: PropTypes.array,
  /**
   * Properties applied to the rows per page [`Select`](/api/select) element.
   */
  SelectProps: PropTypes.object,
};

TablePagination.defaultProps = {
  ActionsComponent: TablePaginationActions,
  component: TableCell,
  labelDisplayedRows: ({ from, to, count }) => `${from}-${to} of ${count}`,
  labelRowsPerPage: 'Rows per page:',
  rowsPerPageOptions: [5, 10, 25],
};

export default withStyles(styles, { name: 'MuiTablePagination' })(TablePagination);
