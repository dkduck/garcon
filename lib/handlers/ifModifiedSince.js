var tools = require("../tools");
var Handler = require('./handler').Handler;

exports.IfModifiedSince = Handler.extend({

  maxMtimeMS: 0,
  unmodified: true,
  cache: null,
  first: true,

  handle: function(file,request,callback){
    //tools.util.log('ifModifiedSince handle for ' + file.get('path'));
    var files = file.get('isDirectory')? file.children: [file],
        numFiles = files.length;
    //tools.log('number of files to check for modification: ' + numFiles);

    this.unmodified = true;
    this._file = file;
    if (numFiles < 1) return callback(true);

    tools.async.forEach(files, function(file, cb) {

      if (file.get('isVirtual')) return cb();
      tools.fs.stat(file.get('path'), function(err, stats) {
        //tools.log('non virtual file, count: ' + count);
        if (err) {
          tools.util.puts('WARNING: ' + err.message);
        } else {
          if (stats.mtime.getTime() > this.maxMtimeMS) {
            this.maxMtimeMS = stats.mtime.getTime();
            this.unmodified = false;
          }
        }
        cb();
      }.bind(this));

    }.bind(this), function() {
      if (!this.unmodified) this.cache = null;
      callback(this.unmodified);
    }.bind(this));
  },
  
  finish: function(request, r, callback){
    //tools.util.log('ifModifiedSince finish for ' + this._file.get('path'));
    if (this.first || !request || request.headers['if-modified-since'] === undefined || this.maxMtimeMS > Date.parse(request.headers['if-modified-since'])) {
      this.first = false;
      if (r.data === undefined && this.cache) {
        r.data = this.cache;
      } else {
        this.cache = r.data;
      }
      r.lastModified = this.maxMtimeMS === 0 ? undefined : new Date(this.maxMtimeMS);
    } else {
      r.status = 304;
    }
    callback(r);
  }
});

/*

sharedHandlers.add('ifModifiedSince', function() {
  var that = {};
  
  that.handle = function(file, request, callback) {
    var files, scanner;
    
    var Scanner = function(files, callback) {
      var that = this;
      
      that.count = files.length;
      
      that.maxMtime = 0;
      
      that.callbackIfDone = function() {
        if (that.count <= 0) callback(that.maxMtime);
      };
      
      that.scan = function() {
        files.forEach(function(file) {
          if (file.isVirtual) {
            that.count -= 1;
            that.callbackIfDone();
          } else {
            l.fs.stat(file.path, function(err, stats) {
              that.count -= 1;
              if (err) {
                l.sys.puts('WARNING: ' + err.message);
                that.callbackIfDone();
              } else {
                if (stats.mtime > that.maxMtime) {
                  that.maxMtime = stats.mtime;
                }
                that.callbackIfDone();
              }
            });
          }
        });
        that.callbackIfDone();
      };
    };
    
    if (file.isDirectory()) {
      files = file.children;
    } else {
      files = [file];
    }
    
    scanner = new Scanner(files, function(mtime) {
      if (!request || request.headers['if-modified-since'] === undefined || mtime > Date.parse(request.headers['if-modified-since'])) {
        that.next.handle(file, request, function(response) {
          response.lastModified = mtime === 0 ? undefined : mtime;
          callback(response);
        });
      } else {
        callback({ status: 304 });
      }
    });
    
    scanner.scan();
  };

  return that;
});
*/