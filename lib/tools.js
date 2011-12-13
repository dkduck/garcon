/*globals global __dirname */

if(!global.SC) require('./sc/thoth_sc');

exports.lib_dir = __dirname;
var util = exports.util = require('util');
exports.http = require('http');
exports.url = require('url');
var path = exports.path = require('path');
var fs = exports.fs = require('fs');
exports.qfs = require('./qfs');
exports.cp = require('child_process');
exports.jslint = require('./jslint').JSLINT;
exports.log = util.log;
exports.inspect = util.inspect;
exports.async = require('async');

