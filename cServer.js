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
  // emits: error, start, connect, stop
  var oThis = this;
  dxOptions = dxOptions || {};
  var uIPVersion = dxOptions.uIPVersion || 4,
      sHostname = dxOptions.sHostname || mOS.hostname(),
      uPort = dxOptions.uPort || 28876,
      uConnectionKeepAlive = dxOptions.uConnectionKeepAlive,
      sId = "JSON@TCP" + uIPVersion + "@" + sHostname + ":" + uPort;
  Object.defineProperty(oThis, "sId", {"get": function () { return sId; }});
  var bStarted = false;
  Object.defineProperty(oThis, "bStarted", {"get": function () { return bStarted; }});
  oThis._oServerSocket = mNet.createServer();
  Object.defineProperty(oThis, "bStopped", {"get": function () { return oThis._oServerSocket == null; }});
  oThis._doConnections = {};
  oThis._oServerSocket.on("error", function cServer_on_oServerSocket_error(oError) {
    oThis.emit("error", oError); // pass-through
  });
  oThis._oServerSocket.on("listening", function cServer_on_oServerSocket_listening() {
    bStarted = true;
    oThis.emit("start");
  });
  oThis._oServerSocket.on("connection", function cServer_on_oServerSocket_connection(oSocket) {
    if (uConnectionKeepAlive) {
      oSocket.setKeepAlive(true, uConnectionKeepAlive);
    };
    var oConnection = new cConnection(oSocket);
    oThis._doConnections[oConnection.sId] = oConnection;
    oConnection.on("disconnect", function () {
      delete oThis._doConnections[oConnection.sId];
      if (oThis._oServerSocket == null && Object.keys(oThis._doConnections).length == 0) {
        oThis.emit("stop"); // stop is emitted when no more connections are accepted and no connections are open.
      };
    });
    oThis.emit("connect", oConnection);
  });
  oThis._oServerSocket.on("close", function cServer_on_oServerSocket_close() {
    oThis._oServerSocket = null;
    if (Object.keys(oThis._doConnections).length == 0) {
      oThis.emit("stop"); // stop is emitted when no more connections are accepted and no connections are open.
    };
  });
  // Wait a tick before looking up the hostname, so the caller has time to add
  // an event listener for the "error" event that this may throw.
  process.nextTick(function() {
    mDNS.lookup(sHostname, {"family": uIPVersion}, function (oError, sAddress, uFamily) {
      if (oError) {
        oThis.emit("error", oError);
      } else if (uFamily != uIPVersion) {
        oThis.emit("error", new Error("requested address for IPv" + uIPVersion + ", got IPv" + uFamily));
      } else {
        oThis._oServerSocket && oThis._oServerSocket.listen({
          "address": sAddress,
          "port": uPort,
          "exclusive": true,
        });
      };
    });
  });
}
mUtil.inherits(cServer, mEvents.EventEmitter);

cServer.prototype.toString = function cServer_toString() {
  var oThis = this;
  return oThis.sId;
};

cServer.prototype.fStop = function cServer_fStop(bDisconnect) {
  var oThis = this;
  if (oThis._oServerSocket == null) throw new Error("The server is already stopped");
  oThis._oServerSocket.close();
  if (bDisconnect) for (var sId in oThis._doConnections) {
    oThis._doConnections[sId].fDisconnect();
  };
};
