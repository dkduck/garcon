var tools = require('./tools');
var File = require('./file').File;
var walk = require('walk');

exports.Scanner = SC.Object.extend({

  framework: null,
  callback: null,
  path: null,

  _files: null,

  init: function(){
    var walker;

    this._files = [];
    walker = walk.walk(this.path, { followLinks: true });
    walker.on('file', this._addFile.bind(this));
    walker.on('end', this._finished.bind(this));
  },

  _addFile: function(root, stats, next) {
    var fw = this.framework,
        path = tools.path.join(root, stats.name);
    if (!fw.shouldExcludeFile(path)) this._files.push(File.create({ path: path, framework: fw }));
    next();
  },

  _finished: function() {
    this.callback(this._files);
  }
  
});

/*

Framework.prototype.scanFiles = function(callback) {
  var Scanner = function(framework, callback) {
    var that = this;
    
    that.count = 0;
    
    that.files = [];
        
    that.callbackIfDone = function() {
      if (that.count <= 0) callback(that.files);
    };

    that.scan = function(path) {      
      that.count += 1;
      
      l.fs.stat(path, function(err, stats) {
        that.count -= 1;
        
        if (err) throw err;
        
        if (stats.isDirectory()) {
          that.count += 1;
          l.fs.readdir(path, function(err, subpaths) {
            that.count -= 1;
            
            if (err) throw err;
            
            subpaths.forEach(function(subpath) {
              if (subpath[0] !== '.') {
                that.scan(l.path.join(path, subpath));
              }
            });
            
            that.callbackIfDone();
          });
          
        } else {
          if (!framework.shouldExcludeFile(path)) {
            that.files.push(new File({ path: path, framework: framework }));
          }
        }

        that.callbackIfDone();
      });
    };
  };
  
  return new Scanner(this, callback).scan(this.path);
};
*/