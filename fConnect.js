module.exports = fConnect;

var mNet = require("net"),
    mOS = require("os"),
    dxSettings = require("./dxSettings.js"),
    cConnection = require("./cConnection");

function fConnect(fCallback, dxOptions) {
  // dxOptions: uIPVersion, sHostname, uPort, uConnectionKeepAlive (ms)
  // callback args: oError, oConnection
  dxOptions = dxOptions || {};
  var uIPVersion = dxOptions.uIPVersion || dxSettings.uIPVersion;
  var sHostname = dxOptions.sHostname || mOS.hostname();
  var uPort = dxOptions.uPort || dxSettings.uPort;
  var uConnectionKeepAlive = dxOptions.uConnectionKeepAlive;
  var oSocket = mNet.connect({"host": sHostname, "port": uPort, "family": uIPVersion});
  if (uConnectionKeepAlive) {
    oSocket.setKeepAlive(true, uConnectionKeepAlive);
  }
  function cClient_fConnect_on_oSocket_error(oError) {
    fCallback(oError, undefined);
  }
  oSocket.on("error", cClient_fConnect_on_oSocket_error);
  oSocket.on("connect", function() {
    oSocket.removeListener("error", cClient_fConnect_on_oSocket_error);
    fCallback(undefined, new cConnection(oSocket));
  });
}
