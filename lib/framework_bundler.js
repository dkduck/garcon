/* 
  Framework bundler is a way of easily wrapping a set of frameworks as one framework
  
*/
var tools = require('./tools');
var Framework = require('./framework').Framework;

exports.FrameworkBundler = Framework.extend({

  frameworkNames: null,
  _frameworks: null,
  path: '',
    
  build: function(callback){
    tools.async.map(this.frameworkNames, function(fwName, cb) {
      var path = tools.path.join(this.path, fwName);
      var fw = Framework.create({
        path: path,
        server: this.server,
        minifyScripts: this.minifyScripts,
        combineOnSave: this.combineOnSave,
        combineScripts: this.combineScripts,
        minifyOnSave: this.minifyOnSave,
        pathsToExclude: [/fixtures\//]
      });
      fw.build(function() { cb(null, fw); });
    }.bind(this), function(err, results) {
      this._frameworks = results;
      callback();
    }.bind(this));
  },
  
  orderedScripts: function(){
    return this._frameworks.getEach('orderedScripts').flatten();
  }.property(),
  
  orderedStylesheets: function(){
    return this._frameworks.getEach('orderedStylesheets').flatten();
  }.property()
  
});
