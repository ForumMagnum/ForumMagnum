import React from 'react';
import PropTypes from 'prop-types';
import warning from 'warning';
import createBroadcast from 'brcast';
import themeListener, { CHANNEL } from './themeListener';
import exactProp from '../utils/exactProp';

/**
 * This component takes a `theme` property.
 * It makes the `theme` available down the React tree thanks to React context.
 * This component should preferably be used at **the root of your component tree**.
 */
class MuiThemeProvider extends React.Component {
  broadcast = createBroadcast();

  // We are not using the React state in order to avoid unnecessary rerender.
  constructor(props, context) {
    super();
    // Get the outer theme from the context, can be null
    this.outerTheme = themeListener.initial(context);
    // Propagate the theme so it can be accessed by the children
    this.broadcast.setState(this.mergeOuterLocalTheme(props.theme));
  }

  getChildContext() {
    const { sheetsManager, disableStylesGeneration } = this.props;
    const muiThemeProviderOptions = this.context.muiThemeProviderOptions || {};

    if (sheetsManager !== undefined) {
      muiThemeProviderOptions.sheetsManager = sheetsManager;
    }

    if (disableStylesGeneration !== undefined) {
      muiThemeProviderOptions.disableStylesGeneration = disableStylesGeneration;
    }

    return {
      [CHANNEL]: this.broadcast,
      muiThemeProviderOptions,
    };
  }

  componentDidMount() {
    // Subscribe on the outer theme, if present
    this.unsubscribeId = themeListener.subscribe(this.context, outerTheme => {
      this.outerTheme = outerTheme;
      // Forward the parent theme update to the children
      this.broadcast.setState(this.mergeOuterLocalTheme(this.props.theme));
    });
  }

  componentDidUpdate(prevProps) {
    // Propagate a local theme update
    if (this.props.theme !== prevProps.theme) {
      this.broadcast.setState(this.mergeOuterLocalTheme(this.props.theme));
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeId !== null) {
      themeListener.unsubscribe(this.context, this.unsubscribeId);
    }
  }

  // Simple merge between the outer theme and the local theme
  mergeOuterLocalTheme(localTheme) {
    // To support composition of theme.
    if (typeof localTheme === 'function') {
      warning(
        this.outerTheme,
        [
          'Material-UI: you are providing a theme function property ' +
            'to the MuiThemeProvider component:',
          '<MuiThemeProvider theme={outerTheme => outerTheme} />',
          'However, no outer theme is present.',
          'Make sure a theme is already injected higher in the React tree ' +
            'or provide a theme object.',
        ].join('\n'),
      );
      return localTheme(this.outerTheme);
    }

    if (!this.outerTheme) {
      return localTheme;
    }

    return { ...this.outerTheme, ...localTheme };
  }

  render() {
    // TODO move the sheetsManager property to a different component.
    // warning(
    //   typeof window !== 'undefined' || this.props.sheetsManager,
    //   [
    //     'Material-UI: you need to provide a sheetsManager to the MuiThemeProvider ' +
    //       'when rendering on the server.',
    //     'If you do not, you might experience a memory leak',
    //   ].join('\n'),
    // );
    return this.props.children;
  }
}

MuiThemeProvider.propTypes = {
  /**
   * You can wrap a node.
   */
  children: PropTypes.node.isRequired,
  /**
   * You can disable the generation of the styles with this option.
   * It can be useful when traversing the React tree outside of the HTML
   * rendering step on the server.
   * Let's say you are using react-apollo to extract all
   * the queries made by the interface server side.
   * You can significantly speed up the traversal with this property.
   */
  disableStylesGeneration: PropTypes.bool,
  /**
   * The sheetsManager is used to deduplicate style sheet injection in the page.
   * It's deduplicating using the (theme, styles) couple.
   * On the server, you should provide a new instance for each request.
   */
  sheetsManager: PropTypes.object,
  /**
   * A theme object.
   */
  theme: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
};

MuiThemeProvider.propTypes = exactProp(MuiThemeProvider.propTypes);

MuiThemeProvider.childContextTypes = {
  ...themeListener.contextTypes,
  muiThemeProviderOptions: PropTypes.object,
};

MuiThemeProvider.contextTypes = {
  ...themeListener.contextTypes,
  muiThemeProviderOptions: PropTypes.object,
};

export default MuiThemeProvider;
