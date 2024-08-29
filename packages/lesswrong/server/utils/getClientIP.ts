
export function getClientIP(req: AnyBecauseTodo): string|undefined {
  // From: https://stackoverflow.com/a/19524949 (which contains incorrect sample code!)
  const ip = (req.headers['x-forwarded-for'] || '').split(',').shift().trim() || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress || 
    req.connection.socket?.remoteAddress
  
  return ip ?? null;
}
