var fConnect = require("./fConnect.js");

fConnect(function (oError, oConnection) {
  if (oError) {
    console.log("connection: error (" + oError.toString() + ")");
  } else {
    console.log("connection: connected (" + oConnection.toString() + ")");
    oConnection.on("error", function (oError) {
      console.log("connection: error (" + oError.toString() + ")");
    });
    oConnection.on("message", function (oError, xMessage) {
      if (oError) {
        console.log("connection: message error (" + oError.toString() + ")");
      } else {
        console.log("connection: message (" + JSON.stringify(xMessage) + ")");
        if (xMessage === "disconnect") {
          oConnection.fDisconnect();
        }
      }
    });
    oConnection.on("disconnect", function () {
      console.log("connection: disconnected (" + oConnection.toString() + ")");
    });
    function fSendMessageAndShowResult(xMessage) {
      oConnection.fSendMessage(xMessage, function(oError) {
        if (oError) {
          console.log("connection: send message error (" + oError.toString() + ")");
        } else {
          console.log("connection: message sent");
        }
      });
    };
    fSendMessageAndShowResult({"from": "client", "to": "server"});
    console.log("YOU CAN NOW TYPE MESSAGES, WHICH WILL BE SEND TO THE SERVER WHEN YOU PRESS ENTER.");
    console.log("Enter an empty line to disconnect from the server.");
    process.stdin.resume(); // Wait for stdin, so user can type commands
    process.stdin.on("data", function (oBuffer) {
      sMessage = oBuffer.toString("utf8").replace(/[\r\n]*$/, "");
      if (sMessage == "") {
        oConnection.fDisconnect();
      } else {
        fSendMessageAndShowResult(sMessage);
      };
    });
    oConnection.on("disconnect", function () {
      process.stdin.pause(); // Stop waiting for stdin, so program can exit
    });
  };
});
