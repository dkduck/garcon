var Handler = require('./handler').Handler;
var stylus = require('stylus'),
    nodes = stylus.nodes,
    im = require('imagemagick'),
    path = require('path');

exports.Stylus = Handler.extend({

    handle: function(file, request, callback){
        this._file = file;
        callback();
    },


    _includeMatcher: /(include_slices?)\(([^\)]+)\)/gi,

    finish: function(request, r, cb){
        var filePath = this._file.get('path'),
            processedIncludes = 0,
            matches = [],
            match;

        function parseWithStylus() {
            stylus(r.data)
                .set('paths', [ __dirname ])
                .import('stylus_fn')
                .render(function(err, css) {
                    if (err) {
                        console.log('ERROR while processing stylesheet ' + filePath + ' with stylus');
                        console.log(err);
                    } else {
                        r.data = css;
                    }
                });

            cb(r);
        }


        while (match = this._includeMatcher.exec(r.data)) {
            matches.push(match);
        }

        matches.forEach(function(match) {
            Include.create({
                cssFile: filePath,
                response: r,
                match: match,
                callback: function(err) {
                    processedIncludes += 1;
                    if (processedIncludes === matches.length) parseWithStylus();
                }
            }).process();
        });

        if (!matches.length) {
            if (path.extname(filePath) === '.styl') {
                parseWithStylus();
            } else {
                cb(r);
            }
        }
    }

});

var Include = SC.Object.extend({

    cssFile: null,
    response: null,
    match: null,
    callback: null,

    process: function() {
        var match = this.match,
            params = this._parseIncludeArguments();

        im.identify(params.file, function(err, output) {
            if (err) return this.callback(err);

            var imgWidth = params.dim.width = output.width,
                imgHeight = params.dim.height = output.height;

            this._format = output.format;
            if (params.rect.width) {
                params.rect.right = imgWidth - (params.rect.left + params.rect.width);
            } else {
                params.rect.width = imgWidth - (params.rect.left + params.rect.right);
            }
            if (params.rect.height) {
                params.rect.bottom = imgHeight - (params.rect.top + params.rect.height);
            } else {
                params.rect.height = imgHeight - (params.rect.top + params.rect.bottom);
            }

            if (match[1] === 'include_slices') {
                if (!params.rect.top && !params.rect.bottom) {
                    this._slices = [ 'left', 'middle', 'right' ];
                    params.fill.y = imgHeight;
                } else {
                    this._slices = [ 'top-left', 'top', 'top-right', 'left', 'middle', 'right', 'bottom-left', 'bottom', 'bottom-right' ];
                }
            } else {
                this._slices = [ 'middle' ];
                params.fill.x = params.rect.width;
                params.fill.y = params.rect.height;
            }

            this._slices.forEach(this._createSlice.bind(this));

        }.bind(this));
    },

    _parseIncludeArguments: function() {
        var params, rectKeys, args, argParts, id, i;

        params = this._params = {
            file: '',
            dim: { width: 0, height: 0 },
            rect: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 },
            offset: { x: 0, y: 0 },
            fill: { x: 1, y: 1 },
            repeat: 'no-repeat',
            skip: []
        };
        rectKeys = Object.keys(params.rect);

        args = this.match[2].split(',').map(function(arg) {
            return arg.trim();
        });
        if (!args.length) return;

        params.file = path.normalize(path.join(path.dirname(this.cssFile), args[0].match(/[^"']+/)[0]));
        for (i = 1; i < args.length; i += 1) {
            argParts = args[i].split(/\s+/);
            id = argParts[0];
            if (rectKeys.indexOf(id) >= 0) {
                if (argParts[1]) params.rect[id] = parseInt(argParts[1]);
            } else if (id === 'skip') {
                params.skip = argParts.slice(1);
            } else if (id === 'offset') {
                if (argParts[1]) params.offset.x = parseInt(argParts[1]);
                if (argParts[2]) params.offset.y = parseInt(argParts[2]);
            } else if (id.indexOf('repeat') >= 0) {
                params.repeat = id;
            } else if (id === 'fill') {
                if (argParts[1]) params.fill.x = parseInt(argParts[1]);
                if (argParts[2]) params.fill.y = parseInt(argParts[2]);
            }
        }
        return params;
    },

    _createSlice: function(slice) {
        var params = this._params,
            rect = params.rect,
            fill = params.fill,
            dim = params.dim,
            base64 = '',
            proc, width, height, x, y;

        switch (slice) {
            case 'top-left':
                x = y = 0;
                width = rect.left;
                height = rect.top;
                break;
            case 'top':
                x = rect.left;
                y = 0;
                width = fill.x;
                height = rect.top;
                break;
            case 'top-right':
                x = dim.width - rect.right;
                y = 0;
                width = rect.right;
                height = rect.top;
                break;
            case 'left':
                x = 0;
                y = rect.top;
                width = rect.left;
                height = fill.y;
                break;
            case 'middle':
                x = rect.left;
                y = rect.top;
                width = fill.x;
                height = fill.y;
                break;
            case 'right':
                x = dim.width - rect.right;
                y = rect.top;
                width = rect.right;
                height = fill.y;
                break;
            case 'bottom-left':
                x = 0;
                y = dim.height - rect.bottom;
                width = rect.left;
                height = rect.bottom;
                break;
            case 'bottom':
                x = rect.left;
                y = dim.height - rect.bottom;
                width = fill.x;
                height = rect.bottom;
                break;
            case 'bottom-right':
                x = dim.width - rect.right;
                y = dim.height - rect.bottom;
                width = rect.right;
                height = rect.bottom;
                break;
        }

        if (params.skip.indexOf(slice) >= 0) {
            this._finishSlice('skip', '');
        } else {
            proc = im.convert([ params.file, '-crop', '%@x%@+%@+%@'.fmt(width, height, x, y), '-' ]);
            proc.on('data', function(chunk) {
                var buffer = new Buffer(chunk, 'binary');
                base64 += buffer.toString('base64');
            });
            proc.on('end', function() {
                this._finishSlice(slice, base64);
            }.bind(this));
        }
    },

    _finishSlice: function(slice, base64) {
        var match = this.match,
            params = this._params,
            res = this.response,
            encodedImages, sliceNames, dataURLs;

        sliceNames = this._sliceNames = this._sliceNames || [];
        dataURLs = this._dataURLs = this._dataURLs || [];
        sliceNames.push(slice);
        dataURLs.push('image/%@;base64,%@'.fmt(this._format.toLowerCase(), base64));
        if (sliceNames.length < this._slices.length) return;
        if (match[1] === 'include_slice') {
            encodedImages = '"%@"'.fmt(dataURLs[0]);
            res.data = res.data.replace(match[0], 'bg_slice(%@, %@ %@, %@)'.fmt(params.repeat, params.offset.x, params.offset.y, encodedImages));
        } else {
            encodedImages = dataURLs.map(function(str) { return '"%@"'.fmt(str); }).join(' ');
            res.data = res.data.replace(match[0], 'bg_slices(%@ %@ %@ %@, %@, %@)'.fmt(
                params.rect.left, params.rect.top, params.rect.right, params.rect.bottom, sliceNames.join (' '), encodedImages
            ));
        }
        this.callback();
    }

});




//            var bgValue = new stylus.nodes.Expression();
//            bgValue.push(new stylus.nodes.Literal('black'));
//            var fgValue = new stylus.nodes.Expression();
//            fgValue.push(new stylus.nodes.Literal('red'));
//            var block = new stylus.nodes.Block();
//
//            var bgColor = new stylus.nodes.Property(
//                [new stylus.nodes.Ident('background-color')],
//                bgValue
//            );
//            var color = new stylus.nodes.Property(
//                [new stylus.nodes.Ident('color')],
//                fgValue
//            );
//            block.push(bgColor);
//            block.push(color);
//            return block;

