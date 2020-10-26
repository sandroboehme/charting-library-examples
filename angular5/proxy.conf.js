const PROXY_CONFIG = {
  "/api": {
    "target": "https://api.binance.com",
    "secure": false,
    "pathRewrite": {
      "^/api/https://api.binance.com": ""
    },
    "changeOrigin": true,
    "logLevel": "debug",
    "bypass": function(req, res, proxyOptions) {
      console.log('req: ', req);
      console.log('proxyOptions: ', proxyOptions);
    }
  }
}
module.exports = PROXY_CONFIG;
