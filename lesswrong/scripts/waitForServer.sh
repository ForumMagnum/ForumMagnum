#!/bin/bash
# Repeatedly try to download localhost:3000, until successful.

while ! curl --silent -o /dev/null http://localhost:3000/robots.txt
do
  sleep 1
done


