import { addStaticRoute } from '../vulcan-lib/staticRoutes';
import { getUserFromReq } from '../vulcan-lib/apollo-server/getUserFromReq';

// Debug endpoint which, if you load it while logged in as an admin, echoes
// back the HTTP headers you used to request it. Used for debugging header
// changes while requests pass through load-balancers etc on prod, and in
// particular for headers like X-Forwarded-For.
addStaticRoute('/admin/debugHeaders', async (query,req,res,next) => {
  const user = getUserFromReq(req);
  if (!user) {
    res.statusCode = 403;
    res.end("Not logged in");
    return;
  }
  if (!user.isAdmin) {
    res.statusCode = 403;
    res.end("Not an admin");
    return;
  }
  
  const headers = JSON.stringify(req.headers);
  const otherIPsources =
    `req.socket.remoteAddress: ${JSON.stringify(req?.socket?.remoteAddress)}\n`
    +`req.connection.remoteAddress: ${JSON.stringify(req?.connection?.remoteAddress)}\n`
  res.end(`${JSON.stringify(req.headers)}\n${otherIPsources}`);
});
