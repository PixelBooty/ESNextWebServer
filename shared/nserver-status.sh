#!/bin/bash
processId=$(cat process.pid 2> /dev/null )

#server Name
serverName=$(pwd)
serverName=${serverName##*/}
serverName=${serverName%-server}

if [ "$processId" != "" ]; then
  processRun=$(ps aux | grep -E "$processId.*node.*shared/bootstrap.js" | grep -v grep)
  if [ "$processRun" != "" ]; then
    echo "Server ($serverName) is running on pid $processId."
  else
    echo "Server $serverName not running."
  fi
else
  echo "Server $serverName not running."
fi
