#!/bin/bash

npm install -g nsp

if [ -f npm-shrinkwrap.json ]; then
  nsp check -o summary npm-shrinkwrap.json
else
  nsp check -o summary package.json
fi
