#!/bin/bash

UNIT=${1:-unit-coverage/lcov.info}
INT=${2:-integration-coverage/lcov.info}
OUT=${3:-combined-coverage/lcov.info}
HTML=${4:-combined-coverage/lcov-report}

mkdir -p ./combined-coverage
rm -rf ./combined-coverage/*
lcov --add-tracefile $UNIT -a $INT -o $OUT
genhtml $OUT -o $HTML
