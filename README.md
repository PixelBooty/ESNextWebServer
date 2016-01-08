ES6WebServer
============

The first open source ecmaNext web server for nodejs.

Work in progress
================

This server started with EMCA6 but has moved to EMCA7 for use of async methods.
Note that this is currently under heavy development. The server is stable however lacking in a few features.
Live speed testing has shown that when using the server as intended it is one of the fastest web servers.
This server has been used in a few production environments including our own web server http://www.adaptivelite.com.

Install
=======
npm install esnextws
Note: You will have to have babel setup in your project with polyfill to run this server.
To do this you must include the following npm packages to your project:
* babel,
* babel-cli
* babel-core
* babel-polyfill
* babel-preset-es2015
* babel-preset-stage-# you must have at-least stage-2 to run async methods.
And then in your package JSON you must have the following lines.
"babel": {
  "presets": [
    "es2015",
    "stage-#"
  ]
}
You must also put the following in your file before you require the npm.
require("babel-core/register");
require("babel-polyfill");
This has been tested with babel 6 only.

Running
=======
require("babel-core/register");
require("babel-polyfill");
require( "esnextws" ).init( config, services );

Where services are an array of locations of servers to boot.

Configuration Options
==============
* port: Port to run the web server on.
* adminHost: Host on server that is allowed to see the admin.
Unix based OS only:
* uid: User id or name that will persist the server.
* gid: Group id or name that will persist the server.

Road map
========

1. Finish Admin host.
2. Working example services and hosts.
3. More MimeTypes.
