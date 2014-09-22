#!/bin/bash
processId=$(cat process.pid 2> /dev/null )

#server Name
serverName=$(pwd)
serverName=${serverName##*/}
serverName=${serverName%-server}

if [ "$processId" != "" ]; then
  processRun=$(ps aux | grep -E "$processId.*node.*shared/bootstrap.js" | grep -v grep)
  if [ "$processRun" != "" ]; then
    echo "" >> server.log
    echo "=========================" >> server.log
    date >> server.log
    echo "=========================" >> server.log
    kill -SIGINT $processId
    echo "Server ($serverName) has shut down."
  else
    echo "Process for ($serverName) not found to exit."
  fi
else
  echo "Not pid file found for server ($serverName)."
fi
