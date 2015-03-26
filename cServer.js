module.exports = cServer;

var mEvents = require("events"),
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
  oThis.uIPVersion = dxOptions.uIPVersion || 4;
  oThis.sHostname = dxOptions.sHostname || mOS.hostname();
  oThis.uPort = dxOptions.uPort || 28876;
  oThis.uConnectionKeepAlive = dxOptions.uConnectionKeepAlive;
  oThis.oServerSocket = mNet.createServer();
  oThis.bServing = false;
  oThis.bAcceptConnections = true; // will be set to false when fStop is called.
  oThis.oServerSocket.on("error", function cServer_on_oServerSocket_error(oError) {
    oThis.emit("error", oError); // pass-through
  });
  oThis.oServerSocket.on("listening", function cServer_on_oServerSocket_listening() {
    oThis.bServing = true;
    oThis.emit("start"); // pass-through
  });
  oThis.oServerSocket.on("close", function cServer_on_oServerSocket_close() {
    oThis.bServing = false;
    oThis.oServerSocket = null;
    oThis.emit("stop");
  });
  oThis.oServerSocket.on("connection", function cServer_on_oServerSocket_connection(oSocket) {
    if (oThis.bAcceptConnections) {
      if (oThis.uConnectionKeepAlive) {
        oSocket.setKeepAlive(true, oThis.uConnectionKeepAlive);
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
  oThis.oServerSocket.listen({
    "address": oThis.sHostname,
    "port": oThis.uPort,
    "exclusive": false,
  });
}
mUtil.inherits(cServer, mEvents.EventEmitter);

cServer.prototype.fStop = function cServer_fClose(bDisconnect) {
  var oThis = this;
  oThis.bAcceptConnections = false;
  oThis.oServerSocket.close();
}
