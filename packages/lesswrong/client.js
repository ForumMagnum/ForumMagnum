import './client/apolloClient';
import './lib/vulcan-lib';
import './client/start';

// Make sure to register settings before everything else
import './client/publicSettings'

// Then import google analytics and datadog
import './client/ga';
import './client/datadogStart';
import './client/type3';

// Then import google reCaptcha v3
import './client/reCaptchaStart'

// Then do the rest
import './client/autoRefresh';
import './client/scrollRestoration';
import './client/clickableCheckboxLabels';
import './client/themeProvider';
import './client/logging';
import './lib/index';

// Polyfills:
import 'element-closest'
