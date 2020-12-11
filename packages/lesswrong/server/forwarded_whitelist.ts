import dns from 'dns';
import process from 'process';
import { DatabaseServerSetting } from './databaseSettings';

var whitelist: Partial<Record<string,boolean>> = {};
const forwardedWhitelistSetting = new DatabaseServerSetting<Array<string>>('forwardedWhitelist', [])
const forwardedWhitelist = forwardedWhitelistSetting.get()

if(forwardedWhitelist) {
  Object.values(forwardedWhitelist).forEach((hostname: string) => {
    dns.resolve(hostname, "ANY", (err, records: any) => {
      if(!err) {
        records.forEach((rec: any) => {
          whitelist[rec.address] = true;
          //eslint-disable-next-line no-console
          console.info("Adding " + hostname + ": " + rec.address + " to whitelist.");
        });
      }
    });
  });
}

export const ForwardedWhitelist = {
  getClientIP: (req) => {
    // From: https://stackoverflow.com/a/19524949
    const ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress || 
      req.connection.socket.remoteAddress
    
    return ip
  }
}
