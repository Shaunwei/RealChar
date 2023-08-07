/**
 * src/utils/urlUtils.js
 * url related utils.
 *
 * created by pycui on 08/07/23
 */

export const getHostName = () => {
    var currentHost = window.location.host;
    var parts = currentHost.split(':');
    var hostname = parts[0];
    // Local deployment uses 8000 port by default.
    var newPort = '8000';

    if (!(hostname === 'localhost' || isIP(hostname))) {
      // Remove www. from hostname
      hostname = hostname.replace('www.', '');
      hostname = 'api.' + hostname;
      newPort = window.location.protocol === 'https:' ? 443 : 80;
    }
    var newHost = hostname + ':' + newPort;
    return newHost;
};
