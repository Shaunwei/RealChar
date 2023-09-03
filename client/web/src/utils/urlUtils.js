/**
 * src/utils/urlUtils.js
 * url related utils.
 *
 * created by pycui on 08/07/23
 */
import { isIP } from 'is-ip';

export const getHostName = () => {
  if (process.env.REACT_APP_API_HOST) {
    return process.env.REACT_APP_API_HOST;
  }
  var currentHost = window.location.host;
  var parts = currentHost.split(':');
  var hostname = parts[0];
  // Local deployment uses 8000 port by default.
  var newPort = '8000';
  if (process.env.REACT_APP_ENABLE_MULTION) {
    // TODO: Multion doesn't allow custom port yet. Remove this once it's supported.
    newPort = '8001';
  }

  if (!(hostname === 'localhost' || isIP(hostname))) {
    // Remove www. from hostname
    hostname = hostname.replace('www.', '');
    hostname = 'api.' + hostname;
    newPort = window.location.protocol === 'https:' ? 443 : 80;
  }
  var newHost = hostname + ':' + newPort;
  return newHost;
};
