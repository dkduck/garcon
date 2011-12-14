var tools = require('../tools');
var Handler = require("./handler").Handler;

exports.Join = Handler.extend({
  
  data: null,
  
  handle: function(file,request,callback){
    var data = [],
        files;

    var callHandlerSet = function(f, cb){
      if (f.children) {
        f.handler.handle(f, request, function(d) {
          data.push(d.data);
          cb();
        });
      } else {
        f.content(function(err, d) {
          if (err) throw err;
          data.push(d ? d : '');
          cb();
        });
      }
    };

    files = file.children? file.children: [file];
    tools.async.forEachSeries(files, callHandlerSet, function(err) {
      this.data = data.length ? data.join('\n') : '';
      callback(true);
    }.bind(this));
  },
  
  finish: function(request,r,callback){
    r.data = this.data;
    //tools.log('finish of join handler, returning with data: ' + tools.inspect(r));
    callback(r);
  }
});



/*
sharedHandlers.add('join', function() {
  var that = {};
    
  that.handle = function(file, request, callback) {
    var data = [],
        files, count;
        
    if (file.children === null) {
      files = [file];
    } else {
      files = file.children;
    }
    
    count = files.length;
    
    if (count === 0) {
      callback({ data: '' });
      
    } else {
      files.forEach(function(file, i) {
        var next = that.next ? that.next : file.handler;
                
        next.handle(file, request, function(d) {
          data[i] = d.data;
          count -= 1;
          if (count === 0) {
            callback({ data: data.join('\n') });
          }
        });
      });
    }
  };

  return that;
});
*/