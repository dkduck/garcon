var tools = require('../tools');
var Handler = require('./handler').Handler;
var stylus = require('stylus');

exports.Stylus = Handler.extend({

    handle: function(file, request, callback){
        this._file = file;
        callback();
    },

    finish: function(request, r, callback){
        stylus(r.data).render(function(err, css) {
            if (err) {
                tools.util.puts('ERROR while processing stylesheet ' + this._file.get('path') + ' with stylus');
                console.log(err);
            } else {
                r.data = css;
            }
        }.bind(this));
        callback(r);
    }
});

