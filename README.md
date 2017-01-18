# parse-server-push-adapter-token

Push adapter for parse-server with support for ios token based push notifications

### Token based authentication
Parameters need to suppurt this are: 
tokenKey The Path of the apns key which is in p8 format
tokenKeyId  The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
tokenTeamId The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
than initialize the adapter with 
```
var adapter = require('parse-server-push-adapter-token').ParsePushAdapter;

var configuration = {ios: {
      production: false,
      tokenKey: 'apns.p8', 
      tokenKeyId: '****', 
      tokenTeamId: '*****' 
}};

var pushAdapter = new adapter(configuration);

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'apikey',
  masterKey: process.env.MASTER_KEY || 'master', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  push: {
    adapter:pushAdapter
  }
});

```
If you want to use certificate, you can create configuration as :
```
var configuration = {ios: {
       pfx: "***.p12",
       passphrase: '',
      bundleId: "com.***.***",
    }
}
```


### Silent Notifications

If you have migrated from parse.com and you are seeing situations where silent (newsstand-like presentless) notifications are failing to deliver please ensure that your payload is setting the content-available attribute to Int(1) and not "1" This value will be explicitly checked.

### see more logs

You can enable verbose logging with environment variables:

```
VERBOSE=1

or 

VERBOSE_PARSE_SERVER_PUSH_ADAPTER=1
```

This will produce a more verbose output for all the push sending attempts
