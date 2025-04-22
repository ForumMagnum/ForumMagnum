import jssGlobal from 'jss-plugin-global';
import jssNested from 'jss-plugin-nested';
import jssCamelCase from 'jss-plugin-camel-case';
import jssDefaultUnit from 'jss-plugin-default-unit';
import jssVendorPrefixer from 'jss-plugin-vendor-prefixer';
import jssPropsSort from 'jss-plugin-props-sort';

// Subset of jss-preset-default with only the plugins the Material-UI
// components are using.
function jssPreset() {
  return {
    plugins: [
      jssGlobal(),
      jssNested(),
      jssCamelCase(),
      jssDefaultUnit(),
      jssVendorPrefixer(),
      jssPropsSort(),
    ],
  };
}

export default jssPreset;
