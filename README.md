ES6WebServer
============

The first open source ecma6 web server for nodejs.

Work in progress
================

Note that this is currently under heavy development. The server is stable however lacking in many features.
Live speed testing has shown that when using the server as intended it is one of the fastest web servers.
That being said if you like the idea feel free to watch and ask for features.

Setup
=====
To use the admin add the host you want to the process.config.adminHost.
To configure the port to run set process.config.port.
To have the system switch user/group set process.config.uid and/or process.config.gid.
To change the password for these you can set process.config.adminUser and process.config.adminPassword.
These settings can be applied in your bootstrap.js, or start.es.js.

Road map
========

1. Admin host.
2. Simplified database connection.
3. Working example host.