import { getSetting } from '../lib/vulcan-lib';
import dns from 'dns';
import process from 'process';

var whitelist = {};

if(getSetting("forwardedWhitelist")) {
  Object.values(getSetting("forwardedWhitelist")).forEach((hostname: string) => {
    dns.resolve(hostname, "ANY", (err, records: any) => {
      if(!err) {
        records.forEach((rec) => {
          whitelist[rec.address] = true;
          //eslint-disable-next-line no-console
          console.info("Adding " + hostname + ": " + rec.address + " to whitelist.");
        });
      }
    });
  });
}

export const ForwardedWhitelist = {
  getClientIP: (connection) => {
    if(whitelist[connection.clientAddress]) {
      let forwarded = connection.httpHeaders["x-forwarded-for"].trim().split(/\s*,\s*/);
      return forwarded[forwarded.length - (parseInt(process.env['HTTP_FORWARDED_COUNT']||"") || 0) - 1];
    } else {
      return connection.clientAddress;
    }
  }
}
