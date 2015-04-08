var cServer = require("./cServer.js");

var oMessage = {"sGreeting": "Hello, world!", "sLargeBuffer": new Array(80000).join("A")};
var uMessages = 3;
var oServer = new cServer();
oServer.on("start", function () {
  console.log("server: started");
});
oServer.on("connect", function (oConnection) {
  console.log("connection: connected (" + oConnection.toString() + ")");
  oConnection.on("error", function (oError) {
    console.log("connection: error (" + oError.toString() + ")");
  });
  oConnection.on("message", function (oError, xMessage) {
    if (oError) {
      console.log("connection: message error (" + oError.toString() + ")");
    } else {
      console.log("connection: message (" + JSON.stringify(xMessage) + ")");
      switch (xMessage) {
        case "disconnect":
          oConnection.fDisconnect();
          break;
        case "stop":
          oServer.fStop();
          break;
        case "stop+disconnect":
          oServer.fStop(true);
          break;
      }
    }
  });
  oConnection.on("disconnect", function () {
    console.log("connection: disconnected (" + oConnection.toString() + ")");
  });
  oConnection.fSendMessage({"from": "server", "to": "client"}, function(oError) {
    if (oError) {
      console.log("connection: message from server to client: error (" + oError.toString() + ")");
    } else {
      console.log("connection: message from server to client: sent");
    }
  });
});
oServer.on("stop", function () {
  console.log("server: stopped");
});
