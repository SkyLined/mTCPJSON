mTCPJSON
===============

Module with classes to send and receive data as JSON over TCP.

Getting Started
---------------
1. Install mTCPJSON via NPM.
  
  `npm install mtcpjson`
  
  Optionally: rename `mtcpjson` to `mTCPJSON`: npm is unable to handle the
  complexity of uppercase characters in a module name. Node.js on Windows does
  not have this problem, so renaming the folder is not required for you to use
  the module.
  
2. Require mTCPJSON in your project.
  
  `var mTCPJSON = require("mTCPJSON");`

3. Instantiate a cServer to accept connections and send/receive data.
  ```
  var oTCPJSONServer = new mTCPJSON.cServer();
  oTCPJSONServer.on("connect", fHandleConnection);
  function fHandleConnection(oTCPJSONConnection) {
    oTCPJSONConnection.on("message", function (oError, xData) {
      if (oError) {
        // Handle oError
      } else {
        // Process xData
      }
    });
    oTCPJSONConnection.fSendMessage("Anything that can be stringified", function (oError) {
      if (oError) {
        // Failed to send (connection was closed).
      };
    });
  };
  ```

4. Create a cConnection to a server and send/receive data.
  ```
  new mTCPJSON.fConnect(fHandleConnection);
  ```
  (See step 3 above for an example implementation of `fHandleConnection`).

Notes
-----
A ''client'' instantiates a connection to a ''server'' by calling `fConnect` and
a ''server'' accepts connections from ''clients'' by instantiating a `cServer`
instance. A successfully established connection results in a `cConnection`
instance for both the ''client'' and the ''server''. From that point on, both
the ''client'' and ''server'' can send and receive JSON messages as equals.

`cConnection.fSendMessage` is used to send a message that consist of one value
converted to a string using `JSON.stringify`. `cConnection` instances emit one
`message` event for each such message received, with two arguments. The first
argument is an `Error` object when an invalid message was received or
`undefined` if the message was valid. If the message was valid, the second
argument is the value that was sent, reconstructed from the data in the message
using `JSON.parse`.

Protocol
--------
The protocol used to transmit data is simple and robust. Each message sent
starts with a string that represents the length of the JSON data in the message,
followed by a semi colon. This is followed by the actual JSON data and another
semicolon. Messages that are larger than the maximum transfer unit (MTU) of the
network are broken into smaller chunks. However, to reduce the risk of a sender
swamping a receiver with data, there is a limit of 1Mb on the size of the JSON
data that can be transmitted in one message.

Example:
  ```
  14;"Hello, World";
  ```
Where `"Hello, World"` is of course 14 characters long. If a message is received
that is not in accordance with the protocol, the receiver emits an "error"
event.

API
-----
### `class cServer`
Can be used to accept connections, through which you can send values as JSON.

#### Constructors:
##### `[new] mTCPJSON.cServer([Object dxOptions]);`
Where `dxOptions` is an optional object that can have the following properties:
- `Number uIPVersion`: IP version to use (valid values: 4 (default), 6).
- `String sHostname`: Network device to bind to (default: computer name, use
             `localhost` if you want to accept connections only from scripts
             running on the same machine).
- `Number uPort`: port number to send to (default: 28876).
- `Number uConnectionKeepAlive`: Enable sending [TCP keep-alive]
          (http://en.wikipedia.org/wiki/Keepalive#TCP_keepalive)
          packets every `uConnectionKeepAlive` milliseconds.

#### Events:
##### `error`, parameter: `Error oError`
Emitted when there is a network error.
##### `start`
Emitted when the `cServer` instance is ready to receive connections.
##### `connect`, parameter: `cConnection oConnection`
Emitted when a connection to the server is established.
##### `stop`
Emitted when the `cServer` instance has stopped receiving connections. This
can happen when there is a network error or after you tell the sender to stop.

#### Methods:
##### `undefined fStop(bDisconnect)`
Stop the `cServer` instance. If `bDisconnect` is `false`, the server stops
accepting new connections and will wait for existing connections to close. If
`bDisconnect` is true, the server will also disconnect all existing connections.
The server will emit a `stop` event as soon as it no longer accepts new
connections and there are no more open connections.

### `undefined fConnect(Function fCallback[, Object dxOptions])
Where `dxOptions` is an optional object that can have the following properties:
- `Number uIPVersion`: IP version to use (valid values: 4 (default), 6).
- `String sHostname`: Target computer (default: connect to local computer).
- `Number uPort`: port number to connect to (default: 28876).
- `Number uConnectionKeepAlive`: Enable sending [TCP keep-alive]
          (http://en.wikipedia.org/wiki/Keepalive#TCP_keepalive)
          packets every `uConnectionKeepAlive` milliseconds.
`fConnect` attempts to establish a connection of a `cServer` instance using the
provided `dxOptions`. `fCallback(Error oError, cConnection oConnection)` is
called when a connection cannot be established (`oError` will contain details)
or when a connection has been established (`oError` will be `undefined` and
`oConnection` will contain a `cConnection` instance).

### `class cConnection`
Represent connections through which data can be transmitted as JSON messages.
Instances of `cConnection` are emitted through the `connect` event of `cServer`
instances, and passed to the callback of the `fConnect` function.

#### Events:
##### `error`, parameter: `Error oError`
Emitted when there is a network error.
##### `message`, parameters: `Error oError`, `Any xData`
Emitted when the `cConnection` instance has received a message. If the message
was invalid, `oError` will contain a description of the problem. Otherwise,
`oError` will be `undefined` and `xData` will contain the data sent by the
`cConnection` instance on the other end of the connection.
##### `disconnect`
Emitted when the `cConnection` instance has stopped receiving messages. This
happens when there is a network error or after you tell the connection to
disconnect.

#### Methods:
##### `undefined fSendMessage(Any xMessage, Function fCallback)`
Convert the data in `xMessage` to string using `JSON.stringify` and send it to
through the connection. `fCallback(Error oError)` is called when the message
has been sent (`oError` == `undefined`) or if there was an error (`oError` will
contain details). 
##### `undefined fDisconnect()`
Disconnect the `cConnection` instance.

--------------------------------------------------------------------------------

### License
This code is licensed under [CC0 v1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
