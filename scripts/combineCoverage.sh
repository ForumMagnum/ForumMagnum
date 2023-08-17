#!/bin/bash

mkdir -p ./combined-coverage
rm -rf ./combined-coverage/*
lcov --add-tracefile unit-coverage/lcov.info -a integration-coverage/lcov.info -o combined-coverage/lcov.info
genhtml combined-coverage/lcov.info -o combined-coverage/lcov-report
