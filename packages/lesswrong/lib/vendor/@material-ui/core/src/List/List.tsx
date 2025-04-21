import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { StandardProps } from '..';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';

export interface ListProps
  extends StandardProps<React.HTMLAttributes<HTMLUListElement>, ListClassKey> {
  component?: React.ComponentType<ListProps>;
  dense?: boolean;
  disablePadding?: boolean;
  subheader?: React.ReactElement<any>;
}

export type ListClassKey = 'root' | 'padding' | 'dense' | 'subheader';

export const styles = defineStyles("MuiList", theme => ({
  /* Styles applied to the root element. */
  root: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    position: 'relative',
  },
  /* Styles applied to the root element if `disablePadding={false}`. */
  padding: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  /* Styles applied to the root element if `dense={true}` & `disablePadding={false}`. */
  dense: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  /* Styles applied to the root element if a `subheader` is provided. */
  subheader: {
    paddingTop: 0,
  },
}), {stylePriority: -10});

class List extends React.Component<ListProps> {
  getChildContext() {
    return {
      dense: this.props.dense,
    };
  }

  render() {
    const {
      children,
      classes,
      className: classNameProp,
      component: Component,
      dense,
      disablePadding,
      subheader,
      ...other
    } = this.props;
    const className = classNames(
      classes.root,
      {
        [classes.dense]: dense && !disablePadding,
        [classes.padding]: !disablePadding,
        [classes.subheader]: subheader,
      },
      classNameProp,
    );

    return (
      <Component className={className} {...other}>
        {subheader}
        {children}
      </Component>
    );
  }
}

List.defaultProps = {
  component: 'ul',
  dense: false,
  disablePadding: false,
};

List.childContextTypes = {
  dense: PropTypes.bool,
};

export default withStyles(styles, List);
