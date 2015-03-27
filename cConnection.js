module.exports = cConnection;

var guMaxMessageLength = 1000000; // bytes

var mEvents = require("events"),
    mUtil = require("util");

function cConnection(oSocket) {
  if (this.constructor != arguments.callee) return new arguments.callee(oSocket);
  // emits: error, message, disconnect
  var oThis = this;
  
  oThis._oSocket = oSocket;
  var uIPVersion = {"IPv4": 4, "IPv6": 6}[oSocket.remoteFamily],
      sHostname = oSocket.remoteAddress,
      uPort = oSocket.remotePort;
  if (!uIPVersion) throw new Error("Unknown protocol " + oSocket.remoteFamily);
  oThis._sToString = "TCP" + uIPVersion + "@" + sHostname + ":" + uPort;
  oThis._bAcceptMessages = true;
  
  oThis._afPendingCallbacks = [];
  oThis._oSocket.on("error", function cConnection_on_oSocket_error(oError) {
    oThis.emit("error", oError); // pass-through
    oThis._oSocket.close();
  });
  var sBuffer = "";
  oThis._oSocket.on("data", function(oMessage) {
    if (oThis._bAcceptMessages) {
      sBuffer += oMessage.toString();
      sBuffer = cConnection_fsParseMessages(oThis, sBuffer) || "";
    }
  });
  oThis._oSocket.on("close", function(bError) {
    oThis._afPendingCallbacks.forEach(function (fCallback) {
      fCallback(false);
    });
    oThis.emit("disconnect");
  });
}
mUtil.inherits(cConnection, mEvents.EventEmitter);

cConnection.prototype.toString = function cConnection_toString() {
  var oThis = this;
  return oThis._sToString;
};
cConnection.prototype.fSendMessage = function cConnection_fSendMessage(xMessage, fCallback) {
  var oThis = this;
  var sMessage = JSON.stringify(xMessage);
  if (sMessage.length > guMaxMessageLength) {
    throw new Error("Message is too large to send");
  }
  if (fCallback) oThis._afPendingCallbacks.push(fCallback);
  var sData = sMessage.length + ";" + sMessage + ";";
  oThis._oSocket.write(sData, function () {
    if (fCallback) {
      oThis._afPendingCallbacks.splice(oThis._afPendingCallbacks.indexOf(fCallback), 1);
      fCallback(true);
    }
  });
}
cConnection.prototype.fDisconnect = function cConnection_fDisconnect() {
  var oThis = this;
  oThis._bAcceptMessages = false;
  oThis._oSocket.end();
}

function cConnection_fsParseMessages(oThis, sBuffer) {
  while (sBuffer) {
    var sLength = sBuffer.substr(0, guMaxMessageLength + 1),
        uLengthEndIndex = sLength.indexOf(";"),
        bInvalidMessageLength = false,
        bValidMessageLength = false,
        uMessageLength;
    if (uLengthEndIndex == -1) {
      bInvalidMessageLength = sLength.length > guMaxMessageLength.toString().length;
    } else {
      var sLength = sLength.substr(0, uLengthEndIndex);
      bInvalidMessageLength = sLength.length > guMaxMessageLength.toString().length;
      if (!bInvalidMessageLength) {
        try {
          uMessageLength = JSON.parse(sLength);
          bInvalidMessageLength = uMessageLength.constructor != Number || uMessageLength <= 0 || uMessageLength > guMaxMessageLength;
        } catch (oError) {
          bInvalidMessageLength = true;
        }
      }
    }
    if (bInvalidMessageLength) {
      // The remote is not making any sense, disconnect.
      oThis.emit("message", new Error("Invalid message length: " + JSON.stringify(sLength + sBuffer.charAt(uLengthEndIndex))), undefined);
      oThis.fDisconnect();
      return;
    } else if (uMessageLength == undefined) {
      // The message length has not been received entirely yet.
      return sBuffer;
    } else {
      var uMessageStartIndex = uLengthEndIndex + 1,
          uMessageEndIndex = uMessageStartIndex + uMessageLength;
      if (sBuffer.length < uMessageEndIndex + 1) {
        // The message length has been received entirely but the message only partially
        return sBuffer;
      } else {
        sMessage = sBuffer.substr(uMessageStartIndex, uMessageEndIndex - uMessageStartIndex);
        if (sBuffer.charAt(uMessageEndIndex) != ";") {
          oThis.emit("message", new Error("Message is missing semi-colon: " + JSON.stringify(sMessage + sBuffer.charAt(uMessageEndIndex))), undefined);
          oThis.fDisconnect();
          return;
        } else {
          try {
            var xMessage = JSON.parse(sMessage);
          } catch (oJSONError) {
            var oError = oJSONError;
          }
          sBuffer = sBuffer.substr(uMessageEndIndex + 1);
          oThis.emit("message", oError, xMessage);
        }
      }
    }
  }
}
