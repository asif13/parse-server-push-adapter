"use strict";

// TODO: apn does not support the new HTTP/2 protocal. It is fine to use it in V1,
// but probably we will replace it in the future.
import apn from 'apn';
import Parse from 'parse';
import log from 'npmlog';

const LOG_PREFIX = 'parse-server-push-adapter ApnsToken';

/**
 * Create a new connection to the APN service.
 * @constructor
 * @param {Object|Array} args An argument or a list of arguments to config APNS connection
 * @param {String} args.cert The filename of the connection certificate to load from disk
 * @param {String} args.key The filename of the connection key to load from disk
 * @param {String} args.pfx The filename for private key, certificate and CA certs in PFX or PKCS12 format, it will overwrite cert and key
 * @param {String} args.passphrase The passphrase for the connection key, if required
 * @param {String} args.bundleId The bundleId for cert
 * @param {Boolean} args.production Specifies which environment to connect to: Production (if true) or Sandbox
 * @param {String} args.tokenKey The Path of the apns key which is in p8 format
 * @param {String} args.tokenKeyId  The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
 * @param {String} args.tokenTeamId The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
 */
var apnProvider;

function ApnsToken(args) {

   if (args.tokenKey && args.tokenKeyId && args.tokenTeamId) {
    apnProvider = new apn.Provider({  
     token: {
        key: args.tokenKey,  
        keyId: args.tokenKeyId, 
        teamId: args.tokenTeamId, 
    },
    production: args.production  
    });
    return;
  }

    apnProvider = new apn.Provider({
      cert:args.cert,
      key: args.key,
      pfx: args.pfx,
      passphrase: args.passphrase,
      bundleId:args.bundleId,
      production:args.production,
    });
}

/**
 * Send apns request.
 * @param {Object} data The data we need to send, the format is the same with api request body
 * @param {Array} devices A array of devices
 * @returns {Object} A promise which is resolved immediately
 */
ApnsToken.prototype.send = function(data, devices) {
  let coreData = data.data;
  let expirationTime = data['expiration_time'];
  let notification = generateNotification(coreData, expirationTime);
  let allPromises = [];
    devices.forEach((device) => {
      notification.topic = device.appIdentifier;
      apnProvider.send(notification, device.deviceToken).then((result) => {
        let promise = Promise.resolve({
          transmitted: true,
          device: {
            deviceToken: device.deviceToken,
            deviceType: 'ios'
          },
          result: result
        });
        allPromises.push(promise);
      }, (error) => {
        let promise = Promise.resolve({
          transmitted: false,
          device: {
            deviceToken: device.deviceToken,
            deviceType: 'ios'
          },
          result: { error: error }
        });
        allPromises.push(promise);
      });
    });
    return Promise.all(allPromises);  
}
   
/**
 * Generate the apns notification from the data we get from api request.
 * @param {Object} coreData The data field under api request body
 * @param {number} expirationTime The expiration time in milliseconds since Jan 1 1970
 * @returns {Object} A apns notification
 */
function generateNotification(coreData, expirationTime) {
  let notification = new apn.Notification();
  let payload = {};
  for (let key in coreData) {
    switch (key) {
      case 'alert':
        notification.alert = coreData.alert;
        break;
      case 'badge':
        notification.badge = coreData.badge;
        break;
      case 'sound':
        notification.sound = coreData.sound;
        break;
      case 'content-available':
        notification.setNewsstandAvailable(true);
        let isAvailable = coreData['content-available'] === 1;
        notification.setContentAvailable(isAvailable);
        break;
      case 'mutable-content':
        let isMutable = coreData['mutable-content'] === 1;
        notification.setMutableContent(isMutable);
        break;
      case 'category':
        notification.category = coreData.category;
        break;
      default:
        payload[key] = coreData[key];
        break;
    }
  }
  notification.payload = payload;
  notification.expiry = expirationTime / 1000;
  return notification;
}

ApnsToken.generateNotification = generateNotification;

if (process.env.TESTING) {
}
module.exports = ApnsToken;
export default ApnsToken;
