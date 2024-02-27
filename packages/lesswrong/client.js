import './client/apolloClient';
import './lib/vulcan-lib';
import './client/start';

// Make sure to register settings before everything else
import './client/publicSettings'

// Then import google analytics and datadog
import './client/ga';
import './client/datadogStart';
import './client/type3';

// Then do the rest
import './client/themeProvider';
import './client/logging';
import './lib/index';
