/* eslint-disable no-restricted-globals */

import React from 'react';
import warning from 'warning';
import classNames from 'classnames';
import EventListener from 'react-event-listener';
import debounce from 'debounce'; // < 1kb payload overhead when lodash/debounce is > 3kb.
import { getNormalizedScrollLeft, detectScrollType } from 'normalize-scroll-left';
import animate from '../internal/animate';
import ScrollbarSize from './ScrollbarSize';
import TabIndicator, { TabIndicatorProps } from './TabIndicator';
import TabScrollButton from './TabScrollButton';
import { StandardProps } from '..';
import { ButtonBaseProps } from '../ButtonBase/ButtonBase';
import { withTheme } from '@/components/themes/useTheme';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';

export interface TabsProps
  extends StandardProps<ButtonBaseProps, TabsClassKey, 'onChange' | 'action' | 'component'> {
  action?: (actions: TabsActions) => void;
  centered?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
  indicatorColor?: 'secondary' | 'primary';
  onChange?: (event: React.ChangeEvent<{}>, value: any) => void;
  scrollable?: boolean;
  scrollButtons?: 'auto' | 'on' | 'off';
  TabIndicatorProps?: Partial<TabIndicatorProps>;
  textColor?: 'secondary' | 'primary' | 'inherit' | string;
  value: any;
  width?: string;
}

export interface TabsActions {
  updateIndicator(): void;
}

export type TabsClassKey =
  | 'root'
  | 'flexContainer'
  | 'scroller'
  | 'fixed'
  | 'scrollable'
  | 'centered'
  | 'scrollButtons'
  | 'scrollButtonsAuto'
  | 'indicator';


export const styles = defineStyles("MuiTabs", theme => ({
  /* Styles applied to the root element. */
  root: {
    overflow: 'hidden',
    minHeight: 48,
    WebkitOverflowScrolling: 'touch', // Add iOS momentum scrolling.
  },
  /* Styles applied to the flex container element. */
  flexContainer: {
    display: 'flex',
  },
  /* Styles applied to the flex container element if `centered={true}` & `scrollable={false}`. */
  centered: {
    justifyContent: 'center',
  },
  /* Styles applied to the tablist element. */
  scroller: {
    position: 'relative',
    display: 'inline-block',
    flex: '1 1 auto',
    whiteSpace: 'nowrap',
  },
  /* Styles applied to the tablist element if `scrollable={false}`. */
  fixed: {
    overflowX: 'hidden',
    width: '100%',
  },
  /* Styles applied to the tablist element if `scrollable={true}`. */
  scrollable: {
    overflowX: 'scroll',
  },
  /* Styles applied to the `ScrollButtonComponent` component. */
  scrollButtons: {},
  /* Styles applied to the `ScrollButtonComponent` component if `scrollButtons="auto"`. */
  scrollButtonsAuto: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  /* Styles applied to the `TabIndicator` component. */
  indicator: {},
}), {stylePriority: -10});

type TabsPropsWithHoCs = TabsProps & WithStylesProps<typeof styles> & {theme: ThemeType}
type TabsState = {
  indicatorStyle: AnyBecauseTodo
  scrollerStyle: {
    marginBottom: number,
  },
  showLeftScroll: boolean,
  showRightScroll: boolean,
  mounted: boolean,
};
class Tabs extends React.Component<TabsPropsWithHoCs, TabsState> {
  valueToIndex = new Map();
  tabsRef: AnyBecauseTodo

  handleResize = debounce(() => {
    this.updateIndicatorState(this.props);
    this.updateScrollButtonState();
  }, 166); // Corresponds to 10 frames at 60 Hz.

  handleTabsScroll = debounce(() => {
    this.updateScrollButtonState();
  }, 166); // Corresponds to 10 frames at 60 Hz.

  state: TabsState = {
    indicatorStyle: {},
    scrollerStyle: {
      marginBottom: 0,
    },
    showLeftScroll: false,
    showRightScroll: false,
    mounted: false,
  };

  componentDidMount() {
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ mounted: true });
    this.updateIndicatorState(this.props);
    this.updateScrollButtonState();

    if (this.props.action) {
      this.props.action({
        updateIndicator: this.handleResize,
      });
    }
  }

  componentDidUpdate(prevProps: TabsPropsWithHoCs, prevState: TabsState) {
    // The index might have changed at the same time.
    // We need to check again the right indicator position.
    this.updateIndicatorState(this.props);
    this.updateScrollButtonState();

    if (this.state.indicatorStyle !== prevState.indicatorStyle) {
      this.scrollSelectedIntoView();
    }
  }

  componentWillUnmount() {
    this.handleResize.clear();
    this.handleTabsScroll.clear();
  }

  getConditionalElements = () => {
    const { classes, scrollable, scrollButtons, theme } = this.props;
    const conditionalElements: AnyBecauseTodo = {};
    conditionalElements.scrollbarSizeListener = scrollable ? (
      <ScrollbarSize
        onLoad={this.handleScrollbarSizeChange}
        onChange={this.handleScrollbarSizeChange}
      />
    ) : null;

    const showScrollButtons = scrollable && (scrollButtons === 'auto' || scrollButtons === 'on');

    conditionalElements.scrollButtonLeft = showScrollButtons ? (
      <TabScrollButton
        direction={theme && theme.direction === 'rtl' ? 'right' : 'left'}
        onClick={this.handleLeftScrollClick}
        visible={this.state.showLeftScroll}
        className={classNames(classes.scrollButtons, {
          [classes.scrollButtonsAuto]: scrollButtons === 'auto',
        })}
      />
    ) : null;

    conditionalElements.scrollButtonRight = showScrollButtons ? (
      <TabScrollButton
        direction={theme && theme.direction === 'rtl' ? 'left' : 'right'}
        onClick={this.handleRightScrollClick}
        visible={this.state.showRightScroll}
        className={classNames(classes.scrollButtons, {
          [classes.scrollButtonsAuto]: scrollButtons === 'auto',
        })}
      />
    ) : null;

    return conditionalElements;
  };

  getTabsMeta = (value: AnyBecauseTodo, direction: AnyBecauseTodo) => {
    let tabsMeta;
    if (this.tabsRef) {
      const rect = this.tabsRef.getBoundingClientRect();
      // create a new object with ClientRect class props + scrollLeft
      tabsMeta = {
        clientWidth: this.tabsRef.clientWidth,
        scrollLeft: this.tabsRef.scrollLeft,
        scrollLeftNormalized: getNormalizedScrollLeft(this.tabsRef, direction),
        scrollWidth: this.tabsRef.scrollWidth,
        left: rect.left,
        right: rect.right,
      };
    }

    let tabMeta;
    if (this.tabsRef && value !== false) {
      const children = this.tabsRef.children[0].children;

      if (children.length > 0) {
        const tab = children[this.valueToIndex.get(value)];
        warning(tab, `Material-UI: the value provided \`${value}\` is invalid`);
        tabMeta = tab ? tab.getBoundingClientRect() : null;
      }
    }
    return { tabsMeta, tabMeta };
  };

  handleLeftScrollClick = () => {
    this.moveTabsScroll(-this.tabsRef.clientWidth);
  };

  handleRightScrollClick = () => {
    this.moveTabsScroll(this.tabsRef.clientWidth);
  };

  handleScrollbarSizeChange = ({ scrollbarHeight }: {
    scrollbarHeight: number
  }) => {
    this.setState({
      scrollerStyle: {
        marginBottom: -scrollbarHeight,
      },
    });
  };

  moveTabsScroll = (delta: number) => {
    const { theme } = this.props;

    const multiplier = theme.direction === 'rtl' ? -1 : 1;
    const nextScrollLeft = this.tabsRef.scrollLeft + delta * multiplier;
    // Fix for Edge
    const invert = theme.direction === 'rtl' && detectScrollType() === 'reverse' ? -1 : 1;
    this.scroll(invert * nextScrollLeft);
  };

  scrollSelectedIntoView = () => {
    const { theme, value } = this.props;
    const { tabsMeta, tabMeta } = this.getTabsMeta(value, theme.direction);

    if (!tabMeta || !tabsMeta) {
      return;
    }

    if (tabMeta.left < tabsMeta.left) {
      // left side of button is out of view
      const nextScrollLeft = tabsMeta.scrollLeft + (tabMeta.left - tabsMeta.left);
      this.scroll(nextScrollLeft);
    } else if (tabMeta.right > tabsMeta.right) {
      // right side of button is out of view
      const nextScrollLeft = tabsMeta.scrollLeft + (tabMeta.right - tabsMeta.right);
      this.scroll(nextScrollLeft);
    }
  };

  scroll = (value: number) => {
    animate('scrollLeft', this.tabsRef, value);
  };

  updateScrollButtonState = () => {
    const { scrollable, scrollButtons, theme } = this.props;

    if (scrollable && scrollButtons !== 'off') {
      const { scrollWidth, clientWidth } = this.tabsRef;
      const scrollLeft = getNormalizedScrollLeft(this.tabsRef, theme.direction);

      const showLeftScroll =
        theme.direction === 'rtl' ? scrollWidth > clientWidth + scrollLeft : scrollLeft > 0;

      const showRightScroll =
        theme.direction === 'rtl' ? scrollLeft > 0 : scrollWidth > clientWidth + scrollLeft;

      if (
        showLeftScroll !== this.state.showLeftScroll ||
        showRightScroll !== this.state.showRightScroll
      ) {
        this.setState({ showLeftScroll, showRightScroll });
      }
    }
  };

  updateIndicatorState(props: TabsPropsWithHoCs) {
    const { theme, value } = props;

    const { tabsMeta, tabMeta } = this.getTabsMeta(value, theme.direction);
    let left = 0;

    if (tabMeta && tabsMeta) {
      const correction =
        theme.direction === 'rtl'
          ? tabsMeta.scrollLeftNormalized + tabsMeta.clientWidth - tabsMeta.scrollWidth
          : tabsMeta.scrollLeft;
      left = Math.round(tabMeta.left - tabsMeta.left + correction);
    }

    const indicatorStyle = {
      left,
      // May be wrong until the font is loaded.
      width: tabMeta ? Math.round(tabMeta.width) : 0,
    };

    if (
      (indicatorStyle.left !== this.state.indicatorStyle.left ||
        indicatorStyle.width !== this.state.indicatorStyle.width) &&
      !isNaN(indicatorStyle.left) &&
      !isNaN(indicatorStyle.width)
    ) {
      this.setState({ indicatorStyle });
    }
  }

  render() {
    const {
      action,
      centered,
      children: childrenProp,
      classes,
      className: classNameProp,
      fullWidth,
      indicatorColor,
      onChange,
      scrollable,
      scrollButtons,
      TabIndicatorProps = {},
      textColor,
      theme,
      value,
      ...other
    } = this.props;

    warning(
      !centered || !scrollable,
      'Material-UI: you can not use the `centered={true}` and `scrollable={true}` properties ' +
        'at the same time on a `Tabs` component.',
    );

    const className = classNames(classes.root, classNameProp);
    const flexContainerClassName = classNames(classes.flexContainer, {
      [classes.centered]: centered && !scrollable,
    });
    const scrollerClassName = classNames(classes.scroller, {
      [classes.fixed]: !scrollable,
      [classes.scrollable]: scrollable,
    });

    const indicator = (
      <TabIndicator
        className={classes.indicator}
        color={indicatorColor}
        {...TabIndicatorProps}
        style={{
          ...this.state.indicatorStyle,
          ...TabIndicatorProps.style,
        }}
      />
    );

    this.valueToIndex = new Map();
    let childIndex = 0;
    const children = React.Children.map(childrenProp, child => {
      if (!React.isValidElement(child)) {
        return null;
      }

      warning(
        child.type !== React.Fragment,
        [
          "Material-UI: the Tabs component doesn't accept a Fragment as a child.",
          'Consider providing an array instead.',
        ].join('\n'),
      );

      const childValue = (child.props as any).value === undefined
        ? childIndex
        : (child.props as AnyBecauseHard).value as any;
      this.valueToIndex.set(childValue, childIndex);
      const selected = childValue === value;

      childIndex += 1;
      return React.cloneElement(child, {
        fullWidth,
        indicator: selected && !this.state.mounted && indicator,
        selected,
        onChange,
        textColor,
        value: childValue,
      } as any);
    });

    const conditionalElements = this.getConditionalElements();

    return (
      <div className={className} {...other}>
        <EventListener target="window" onResize={this.handleResize} />
        {conditionalElements.scrollbarSizeListener}
        <div className={classes.flexContainer}>
          {conditionalElements.scrollButtonLeft}
          <div
            className={scrollerClassName}
            style={this.state.scrollerStyle}
            ref={ref => {
              this.tabsRef = ref;
            }}
            role="tablist"
            onScroll={this.handleTabsScroll}
          >
            <div className={flexContainerClassName}>{children}</div>
            {this.state.mounted && indicator}
          </div>
          {conditionalElements.scrollButtonRight}
        </div>
      </div>
    );
  }
}

(Tabs as any).defaultProps = {
  centered: false,
  fullWidth: false,
  indicatorColor: 'secondary',
  scrollable: false,
  scrollButtons: 'auto',
  textColor: 'inherit',
};

export default withTheme(withStyles(styles, Tabs));
