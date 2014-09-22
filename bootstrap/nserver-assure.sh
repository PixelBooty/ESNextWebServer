#!/bin/bash
processId=$(cat process.pid 2> /dev/null )

#server Name
serverName=$(pwd)
serverName=${serverName##*/}
serverName=${serverName%-server}

if [ "$processId" != "" ]; then
  processRun=$(ps aux | grep -E "$processId.*node.*shared/bootstrap.js" | grep -v grep)
  if [ "$processRun" = "" ]; then
    echo "pid not running process"
    ./shared/nserver-start.sh
  fi
else
  echo "no pid"
  ./shared/nserver-start.sh
fi
