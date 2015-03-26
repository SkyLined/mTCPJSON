var path = require("path");
var sModuleName = path.basename(__dirname);
module.exports.cServer = require("./cServer.js");
module.exports.fConnect = require("./fConnect.js");
