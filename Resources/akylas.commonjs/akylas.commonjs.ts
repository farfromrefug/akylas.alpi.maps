
const toRequire = [Ti.UI.createWindow, Ti.UI.createNavigationWindow];
declare var akPath;
akPath = function (name: string, _dir?: string) {
    // return '/' + __dirname + '/AkInclude/' + (_dir ? _dir : '') + name;
    return __dirname + '/AkInclude/' + (_dir ? _dir : '') + name;
}
declare var akRequire;
akRequire = function (name: string) {
    const path = akPath(name);
    console.log('akRequire', path);
    return require(path);
}

declare var akInclude;
akInclude = function (name: string) {
    console.log('akInclude', name, __dirname);
    Ti.include(akPath(name) + '.js');
}

declare var debounce;
debounce = function (func: Function, wait: number, immediate?: Boolean) {
    var r;
    return function () {
        var i = this,
            s = arguments;
        clearTimeout(r);
        if (immediate && !r) func.apply(i, s);
        r = setTimeout(function () {
            r = null;
            if (!immediate) func.apply(i, s)
        }, wait)
    }
}

// See if an array contains an object
Object.assignDeep = function (source: Object, ...targets): Object {
    let target, srcValue, dstValue;
    for (var index = 0; index < targets.length; index++) {
        target = targets[index];
        for (let key in target) {
            srcValue = source[key];
            dstValue = target[key];
            if (Object.isObject(srcValue) && typeof Object.isObject(dstValue)) {
                Object.assignDeep(srcValue, dstValue);
            } if (Array.isArray(srcValue) && Array.isArray(dstValue)) {
                Array.prototype.push.apply(source[key], dstValue);
            } else {
                source[key] = dstValue;
            }
        }
    }
    return source;
}
Object.defaults = function (source: Object, ...targets): Object {
    let target, srcValue, dstValue;
    for (var index = 0; index < targets.length; index++) {
        target = targets[index];
        for (var key in target) {
            if (!source.hasOwnProperty(key)) {
                source[key] = target[key];
            }
        }
    }
    return source;
}

Object.deepCopy = function (source: Object): Object {
    return JSON.parse(JSON.stringify(source));
}

Object.get = function (source: Object, keys: string[]) {
    let result = source, key;
    for (var index = 0; index < keys.length; index++) {
        key = keys[index];
        if (!result.hasOwnProperty(key)) {
            return;
        }
        result = result[key];
    }
    return result;
}


Object.isObject = function (obj) {
    return !!obj && (typeof obj === 'object' && obj.toString() == '[object Object]');
}

// if (!('toJSON' in Error.prototype)) {
Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
        const alt = {};
        // console.log('error to json', this, JSON.stringify(this), Object.keys(this));

        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);
        // this.callstack && alt.callstack = this.callstack;
        return alt;
    },
    configurable: true,
    writable: true
});
// }

Object.bindAssign = function (source: Object, ...targets): Object {
    let target, srcValue, dstValue;
    for (let index = 0; index < targets.length; index++) {
        target = targets[index];
        for (let key in target) {
            dstValue = target[key];
            if (typeof dstValue === 'function') {
                source[key] = dstValue.bind(source)
            } else {
                source[key] = dstValue
            }
        }
    }
    return source;
}

// akRequire('babelHelpers');
// if (Ti.App.deployType !== 'production') {
//     akRequire('sourceMap/SourceMap').install();
// }

export function load(_context, _config: TiDict) {
    _context['exports'] = {};
    for (var key in _config) {
        this.config[key] = _config[key];
    }

    var modulesDir = this.config.modulesDir;
    var underscoreFile = this.config.underscore;
    if (underscoreFile) {
        try {
            _context._ = require((modulesDir || '') + underscoreFile);
        } catch (e) {
            Ti.API.error('Could not load ' + (modulesDir || '') + underscoreFile);
            return;
        }
    }
    if (this.config['userCoreJS'] !== false) {
        // if (!Promise) {
        console.log('deleting function prototype');
        //make sure we are not restarting (android) and thus core would be already required
        delete Function.prototype.bind; // so that we use corejs one and get the sourcemap
        // }
        akRequire('core');
        Promise = akRequire('yaku.core');
        Ti.API.debug('load commonjs ' + Function.prototype.bind + " " + !!Promise);
        // Promise.enableLongStackTrace();
        // Promise.onUnhandledRejection = function(reason) {
        //     console.error(reason);
        // };
    }

    _context.ak = akRequire('akylas.global').init(_context, this.config);
};

export var config = {
    // underscore: 'underscore',
    modulesDir: 'lib/'
}

export function loadExtraWidgets(_context) {
    if (_context.ak.ti) {
        var isApple = Ti.Platform.osname === 'ipad' || Ti.Platform.osname === 'iphone';
        if (isApple) {

            (function () {
                ak.ti.loadCreators(['/' + __dirname + '/AkWidgets/Notification.js']);
            }).call(_context);
        }
    }
};

export function createApp(_context, _args: { commonjsOptions?: any }): AK.App {
    _args = _args || {};
    // _args.modules = _args.modules || {};
    // _args.modules.commonjs = this;
    this.load(_context, _args.commonjsOptions);
    delete _args.commonjsOptions;
    return akRequire('App').init(_context, _args);
};
