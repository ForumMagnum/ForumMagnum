import { getSetting, addCallback } from 'meteor/vulcan:core';
import winston from 'winston';
import timber from 'timber';

function initializeTimber() {
  getSetting('timber.apiKey');
  const transport = new timber.transports.HTTPS(getSetting('timber.apiKey'));
  timber.install(transport);

  winston.remove(winston.transports.Console);
  winston.add(winston.transports.Console, { formatter: timber.formatters.Winston });

  winston.log('info',"Initializing Timber & Winston");
}

addCallback('graphql.init.before', initializeTimber)
