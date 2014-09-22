#!/bin/bash
function startServerProcessN(){
  echo "Server ($serverName) starting."
  node --harmony $(pwd)/shared/bootstrap.js
}

#process running?
processId=$(cat process.pid 2> /dev/null )

#server Name
serverName=$(pwd)
serverName=${serverName##*/}
serverName=${serverName%-server}

#Check if running
if [ "$processId" = "" ]; then
  startServerProcessN
else
  processRun=$(ps aux | grep -E "$processId.*node.*shared/bootstrap.js" | grep -v grep)
  if [ "$processRun" = "" ]; then
    startServerProcessN
  else
    echo "Server ($serverName) already started with pid, if this is a false start please kill process $processId"
    echo "Use command 'kill -SIGINT $processId'"
  fi
fi
