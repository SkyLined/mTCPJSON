module.exports = cServer;

var mDNS = require("dns"),
    mEvents = require("events"),
    mNet = require("net"),
    mOS = require("os"),
    mUtil = require("util"),
    cConnection = require("./cConnection");

function cServer(dxOptions) {
  if (this.constructor != arguments.callee) return new arguments.callee(dxOptions);
  // options: uIPVersion, sHostname, uPort, uConnectionKeepAlive
  // emits: error, start, connect, disconnect, stop
  var oThis = this;
  dxOptions = dxOptions || {};
  var uIPVersion = dxOptions.uIPVersion || 4,
      sHostname = dxOptions.sHostname || mOS.hostname(),
      uPort = dxOptions.uPort || 28876,
      uConnectionKeepAlive = dxOptions.uConnectionKeepAlive;
 oThis._sToString = "TCP" + uIPVersion + "@" + sHostname + ":" + uPort;
 oThis._oServerSocket = mNet.createServer();
  oThis._bAcceptConnections = true; // will be set to false when fStop is called.
  oThis._oServerSocket.on("error", function cServer_on_oServerSocket_error(oError) {
    oThis.emit("error", oError); // pass-through
  });
  oThis._oServerSocket.on("listening", function cServer_on_oServerSocket_listening() {
    oThis.emit("start"); // pass-through
  });
  oThis._oServerSocket.on("close", function cServer_on_oServerSocket_close() {
    oThis._oServerSocket = null;
    oThis.emit("stop");
  });
  oThis._oServerSocket.on("connection", function cServer_on_oServerSocket_connection(oSocket) {
    if (oThis._bAcceptConnections) {
      if (uConnectionKeepAlive) {
        oSocket.setKeepAlive(true, uConnectionKeepAlive);
      }
      var oConnection = new cConnection(oSocket);
      oThis.emit("connect", oConnection);
      oConnection.on("disconnect", function () {
        oThis.emit("disconnect", oConnection);
      });
    } else {
      oSocket.close();
    }
  });
  mDNS.lookup(sHostname, {"family": uIPVersion}, function (oError, sAddress, uFamily) {
    if (oError) {
      oThis.emit("error", oError);
    } else if (uFamily != uIPVersion) {
      oThis.emit("error", new Error("requested address for IPv" + uIPVersion + ", got IPv" + uFamily));
    } else {
      oThis._oServerSocket.listen({
        "address": sAddress,
        "port": uPort,
        "exclusive": true,
      });
    }
  });
}
mUtil.inherits(cServer, mEvents.EventEmitter);

cServer.prototype.toString = function cServer_toString() {
  var oThis = this;
  return oThis._sToString;
};

cServer.prototype.fStop = function cServer_fClose(bDisconnect) {
  var oThis = this;
  oThis._bAcceptConnections = false;
  oThis._oServerSocket.close();
}
