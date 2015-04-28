module.exports = cConnection;

var cConnection_fsParseMessages = require("./cConnection_fsParseMessages"),
    mEvents = require("events"),
    dxSettings = require("./dxSettings"),
    mUtil = require("util");

function cConnection(oSocket) {
  if (this.constructor != arguments.callee) throw new Error("This is a constructor, not a function");
  // emits: error, message, disconnect
  var oThis = this;
  var uIPVersion = {"IPv4": 4, "IPv6": 6}[oSocket.remoteFamily],
      sHostname = oSocket.remoteAddress,
      uPort = oSocket.remotePort;
  if (!uIPVersion) throw new Error("Unknown protocol " + oSocket.remoteFamily);
  var sId = "JSON@TCP" + uIPVersion + "@" + sHostname + ":" + uPort;
  Object.defineProperty(oThis, "sId", {"get": function () { return sId; }});
  oThis._oSocket = oSocket;
  Object.defineProperty(oThis, "bConnected", {"get": function () { return oThis._oSocket != null; }});
  
  oThis._afPendingCallbacks = [];
  oThis._oSocket.on("error", function cConnection_on_oSocket_error(oError) {
    oThis.emit("error", oError); // pass-through
  });
  var sBuffer = "";
  oThis._oSocket.on("data", function(oMessage) {
    sBuffer += oMessage.toString();
    sBuffer = cConnection_fsParseMessages(oThis, sBuffer) || "";
  });
  oThis._oSocket.on("close", function(bError) {
    oThis._oSocket = null;
    var oError = new Error("The connection is disconnected");
    oThis._afPendingCallbacks.filter(function (fCallback) {
      process.nextTick(function() {
        fCallback(oError);
      });
      return false;
    });
    oThis.emit("disconnect");
  });
};
mUtil.inherits(cConnection, mEvents.EventEmitter);

cConnection.prototype.toString = function cConnection_toString() {
  var oThis = this;
  return oThis.sId;
};
cConnection.prototype.fSendMessage = function cConnection_fSendMessage(xMessage, fCallback) {
  var oThis = this;
  if (oThis._oSocket == null) {
    fCallback(new Error("The connection is disconnected"));
  } else {
    var sMessage = JSON.stringify(xMessage);
    if (sMessage.length > dxSettings.uMaxMessageLength) {
      throw new Error("Message is too large to send");
    }
    if (fCallback) oThis._afPendingCallbacks.push(fCallback);
    var sData = sMessage.length + ";" + sMessage + ";";
    oThis._oSocket.write(sData, function () {
      if (fCallback) {
        oThis._afPendingCallbacks.splice(oThis._afPendingCallbacks.indexOf(fCallback), 1);
        fCallback();
      };
    });
  };
};
cConnection.prototype.fDisconnect = function cConnection_fDisconnect() {
  var oThis = this;
  oThis._oSocket && oThis._oSocket.end();
};

