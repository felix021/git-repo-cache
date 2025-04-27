#!/bin/bash

cd `dirname $0`
ncc build index.js --license licenses.txt
