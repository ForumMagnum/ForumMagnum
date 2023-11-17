//import dns from 'dns';
//import { DatabaseServerSetting } from './databaseSettings';

/*const forwardedWhitelistSetting = new DatabaseServerSetting<Array<string>>('forwardedWhitelist', [])

const computeForwardedWhitelist = () => {
  var whitelist: Partial<Record<string,boolean>> = {};
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
}*/

export const getForwardedWhitelist = () => ({
  getClientIP: (req: AnyBecauseTodo) => {
    // From: https://stackoverflow.com/a/19524949 (which contains incorrect sample code!)
    const ip = (req.headers['x-forwarded-for'] || '').split(',').shift().trim() || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress || 
      req.connection.socket.remoteAddress
    
    return ip
  }
})
