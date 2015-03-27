var cServer = require("./cServer.js"),
    fConnect = require("./fConnect.js");

function startServer(fCallback) {
  var oServer = new cServer();
  oServer.on("error", function (oError) {
    console.log("Server:error (oError =", oError, ")");
  });
  oServer.on("start", function () {
    console.log("Server:start");
    fCallback(oServer);
  });
  oServer.on("connect", function (oServerSideConnection) {
    console.log("Server:connect (oConnection = " + oServerSideConnection.toString() + ")");
    oServerSideConnection.on("error", function () {
      console.log("Server>Connection:error");
    });
    oServerSideConnection.on("message", function (oError, xMessage) {
      console.log("Server>Connection:message (oError =", oError, ", xMessage =", xMessage, ")");
    });
    oServerSideConnection.on("disconnect", function () {
      console.log("Server>Connection:disconnect");
    });
  });
  oServer.on("disconnect", function (oServerSideConnection) {
    console.log("Server:disconnect (oConnection = " + oServerSideConnection.toString() + ")");
  });
  oServer.on("stop", function () {
    console.log("Server:stop");
  });
};

function connect(dxOptions, fCallback) {
  fConnect(dxOptions, function (oError, oClientSideConnection) {
    if (oError) {
      console.log("fConnect:error", oError);
    } else {
      console.log("fConnect:connected (oConnection = " + oClientSideConnection.toString() + ")");
      oClientSideConnection.on("error", function (oError) {
        console.log("Client>Connection:error (oError =", oError, ")");
      });
      oClientSideConnection.on("message", function (oError, xMessage) {
        console.log("Client>Connection:message (oError =", oError, ", xMessage =", xMessage, ")");
      });
      oClientSideConnection.on("disconnect", function () {
        console.log("Client>Connection:disconnect");
      });
      fCallback(oClientSideConnection);
    }
  });
};

var oMessage = {"sGreeting": "Hello, world!", "sLargeBuffer": new Array(80000).join("A")};
var uMessages = 3;

startServer(function(oServer) {
  connect(oServer, function(oClientSideConnection) {
    var uReceivedMessage = 0;
    oClientSideConnection.on("message", function (oError, xMessage) {
      // After all message are received, the connection is no longer needed
      if (++uReceivedMessage == uMessages) {
        oClientSideConnection.fDisconnect();
      }
    });
    for (var u = 0; u < uMessages; u++) {
      oMessage.uCounter = u;
      oClientSideConnection.fSendMessage(oMessage, function (bError) {
        console.log("Client>Connection.fSendMessage:callback (bError =" + bError + ")");
      });
    }
  });
  oServer.on("connect", function (oServerSideConnection) {
    // After the connection is made, the server is no longer needed
    oServer.fStop();
    var uReceivedMessage = 0;
    oServerSideConnection.on("message", function (oError, xMessage) {
      // After all message are received, the connection is no longer needed
      if (++uReceivedMessage == uMessages) {
        oServerSideConnection.fDisconnect();
      }
    });
    for (var u = 0; u < uMessages; u++) {
      oMessage.uCounter = u;
      oServerSideConnection.fSendMessage(oMessage, function (bError) {
        console.log("Server>Connection.fSendMessage:callback (bError =" + bError + ")");
      });
    }
  });
});
