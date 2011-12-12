/*globals __dirname */
var tools = require('../tools');
var Handler = require('./handler').Handler;
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var cleanCSS = require('clean-css');


exports.Minify = Handler.extend({
  
  _type: null,
  
  handle: function(file,request,callback){
    var isCss = file.get('isStylesheet');
    var isJs = file.get('isScript');
    if(isCss) this._type = "css";
    if(isJs) this._type = "js";
    this._file = file;

    callback();
  },
  
  finish: function(request,r,callback){
    var ast;

    console.log('Minifying %@'.fmt(this._file.path));
    if (this._type === 'css') {
      r.data = cleanCSS.process(r.data);
    } else if (this._type === 'js') {
      ast = jsp.parse(r.data);
      ast = pro.ast_mangle(ast, { defines: {} });
      ast = pro.ast_squeeze(ast);
      r.data = pro.gen_code(ast);
    }
    callback(r);
  }
  
});

/*

sharedHandlers.add('minify', function() {
  var that = {};
  
  that.handle = function(file, request, callback) {
    that.next.handle(file, request, function(response) {
      var data = '',
          min, fileType;
      
      if (file.isStylesheet()) fileType = 'css';
      if (file.isScript()) fileType = 'js';
      min = l.spawn('java', ['-jar', l.path.join(__dirname, '..', 'bin', 'yuicompressor-2.4.2.jar'), '--type', fileType]);
      
      min.stdout.addListener('data', function(newData) {
        data += newData;
      });
      
      min.stderr.addListener('data', function(data) {
        l.sys.print(data);
      });
      
      min.addListener('exit', function(code) {        
        if (code !== 0) {
          l.sys.puts('ERROR: Minifier exited with code ' + code);
        } else {
          response.data = data;
        }
        
        callback(response);
      });
      
      min.stdin.write(response.data);
      min.stdin.end();
    });
  };
  
  return that;
});
*/