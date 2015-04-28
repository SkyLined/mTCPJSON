var mTCPJSON = require("./index");

var uMessages = 3,
    uReceivedClientMessages = 0,
    uReceivedServerMessages = 0;

var oServer = new mTCPJSON.cServer();
oServer.on("connect", function (oConnection) {
  oServer.fStop(); // After one connection is made, the server is no longer needed
  oConnection.on("message", function (oError, xMessage) {
    if (oError) throw oError;
    ++uReceivedClientMessages;
    fCheckDone(oConnection);
  });
  for (var u = 0; u < uMessages; u++) {
    var dxMessage = {
        "sGreeting": "Hello, client!",
        "sLargeBuffer": new Array(80000).join("A"),
        "uCounter": u,
    };
    oConnection.fSendMessage(dxMessage, function (oError) {
      if (oError) throw oError;
    });
  };
});

mTCPJSON.fConnect(function (oError, oConnection) {
  if (oError) throw oError;
  oConnection.on("message", function (oError, xMessage) {
    if (oError) throw oError;
    ++uReceivedServerMessages;
    fCheckDone(oConnection);
  });
  for (var u = 0; u < uMessages; u++) {
    var dxMessage = {
        "sGreeting": "Hello, server!",
        "sLargeBuffer": new Array(80000).join("A"),
        "uCounter": u,
    };
    oConnection.fSendMessage(dxMessage, function (oError) {
      if (oError) throw oError;
    });
  };
});

function fCheckDone(oConnection) {
  if (uReceivedClientMessages == uMessages && uReceivedServerMessages == uMessages) {
    console.log("test successful");
    oConnection.fDisconnect(); // After all message are received, the connection is no longer needed
  };
};
