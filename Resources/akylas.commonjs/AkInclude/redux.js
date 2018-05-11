var redux = function(selector) {
    return new redux.fn.init(selector);
};

// inject(module.exports = redux);
function inject(context, _options) {
    _options = _options || {};
    !this.Titanium && context.Titanium && (Titanium = context.Titanium);
    !this.Ti && context.Ti && (Ti = context.Ti);

    var LANDSCAPE_RIGHT = Ti.UI.LANDSCAPE_RIGHT,
        LANDSCAPE_LEFT = Ti.UI.LANDSCAPE_LEFT,
        UPSIDE_PORTRAIT = Ti.UI.UPSIDE_PORTRAIT,
        PORTRAIT = Ti.UI.PORTRAIT;
    /**
     * Tracks and stores various data for redux, like events, elements, and included files.
     */
    redux.data = {
        propertiesToStyle: ['leftNavButton', 'rightNavButton', 'leftNavButtons', 'rightNavButtons',
            'leftButton', 'rightButton', 'titleView', 'pullView', 'headerView', 'footerView', 'views'
        ].concat(_options.propertiesToStyle),
        types: Object.assignDeep({
            // Contacts: [
            //     'Group', 'Person'
            // ],
            Filesystem: [
                // 'TempDirectory', 'TempFile', 
                'File'
            ],
            // Media: [
            //     'VideoPlayer'
            // ],
            // Audio: [
            // 'Streamer', 'Player', 'Sound',
            // 'Recorder', 'Item', 'MusicPlayer'
            // ],
            Network: [
                // 'BonjourBrowser', 'BonjourService', 'TCPSocket', 
                'HTTPClient'
            ],
            // Platform: [
            //     'UUID'
            // ],
            UI: [
                '2DMatrix',
                // '3DMatrix', 
                'ActivityIndicator', 'AlertDialog', 'Animation', 'Button',
                'ButtonBar',
                'EmailDialog', 'ImageView', 'Label',
                'Notification', 'OptionDialog', 'Picker',
                // 'PickerColumn', 'PickerRow',
                'ProgressBar',
                'ScrollView',
                'ScrollableView', 'SearchBar', 'Slider', 'Switch', 'Tab', 'TabGroup', 'TabbedBar',
                // 'TableView', 'TableViewRow', 'TableViewSection', 
                'TextArea', 'TextField', 'Toolbar', 'View',
                'WebView',
                'Window',
                'ListView', 'ListSection', 'CollectionView', 'CollectionSection',
                'NavigationWindow',
                'VolumeView'
            ]
        },
            _options.types),
        defaults: {
            byID: {},
            byRclass: {},
            byType: {}
        },
        overloads: {
            byID: {},
            byRclass: {},
            byType: {}
        },
        idCounter: 0,
        debug: false
    };

    function mergeObjects(target, source, newObjOverridesDefault) {
        var key, val;
        if (target) {
            for (key in source) {
                if (!source.hasOwnProperty(key))
                    continue;
                val = source[key];
                // Deep merging.
                if (Array.isArray(val) && ((typeof target[key] === 'undefined') || (newObjOverridesDefault === true))) {
                    target[key] = val.slice(0);
                } else if (Object.isObject(val)) {
                    if (!target[key])
                        target[key] = {};
                    mergeObjects(target[key], val, newObjOverridesDefault);
                } else if ((typeof target[key] === 'undefined') || (newObjOverridesDefault === true)) {
                    target[key] = val;
                }
            }
        }
        return target;
    }

    function stylePropFromObj(args, orientation, override, _deleteProp) {
        var shouldDelete = _deleteProp === true, keys, i;
        if (args.rid) {
            keys = args.rid.split(/\s+/);
            for (i = keys.length - 1; i >= 0 ; i--) {
                mergeObjects(args, Object.get(redux.data.defaults.byID, [keys[i], orientation]), override);
            }
            // args.rid.split(/[^ ]+/g).forEachRight(function(value) {
            //     mergeObjects(args, Object.get(defaults, [value, orientation]), override);
            // });
            if (shouldDelete) delete args.rid;
        }

        if (args.rclass) {
            keys = args.rclass.split(/\s+/);
            for (i = keys.length - 1; i >= 0 ; i--) {
                // console.debug('stylePropFromObj', args.rclass, keys[i], Object.get(redux.data.defaults.byRclass, [keys[i], orientation]));
                mergeObjects(args, Object.get(redux.data.defaults.byRclass, [keys[i], orientation]), override);
                // console.debug('stylePropFromObj done', keys[i], args);
            }
            // args.rclass.split(/[^ ]+/g).forEachRight(function(value) {
            //     mergeObjects(args, Object.get(defaults, [value, orientation]), override);
            // });
            if (shouldDelete) delete args.rclass;
        }
        return args;
    }

    /**
     * The core redux functions.
     */
    redux.fn = redux.prototype = {
        /**
         * Returns the objects that match your selector, or the root redux object if you did not provide a selector. Note that only
         * objects created by redux constructors can be selected (ex use new Label() instead of Ti.UI.createLabel()).
         * @param {Object} selector
         */
        init: function(selector) {
            if (!selector) {
                return this;
            }
            this.selector = selector;
            // object
            if (Object.isObject(selector)) {
                this.context = [this[0] = selector];
                this.length = 1;
                return this;
            }
            throw 'Non-object selectors have been turned off in this version of redux for memory reasons.';
        },

        parseOrientationString: function(o) {
            if (o === undefined)
                return 'none';
            if (o === LANDSCAPE_RIGHT)
                return LANDSCAPE_LEFT;
            if (o === UPSIDE_PORTRAIT)
                return PORTRAIT;
            return o;
        },

        /**
         * Turns a string of RJSS into JavaScript that can be safely evaluated. RJSS is a way to customize JavaScript
         * objects quickly, and is primarily used to style your UI elements.
         *
         * @param {String} rjss The raw RJSS contents to parse into executable JavaScript
         * @returns {String} Executable JavaScript
         */
        parseRJSS: function(file, _overloads) {
            // var theFile = Ti.Filesystem.getFile(file + '.compiled.js');

            if (file.endsWith('.compiled.js')) {
                return {
                    data: theFile.read().text,
                    path: theFile.nativePath
                };
            }
            var rjss;
            const theFile = Ti.Filesystem.getFile(file);
            rjss = (theFile.read().text).replace(/[\r\t\n]/g, ' ');
            // });
            if (redux.debug) {
                console.debug('parseRJSS ', file, rjss);
            }
            var result;
            var
                braceDepth = 0,
                inComment = false,
                inSelector = false,
                inAttributeBrace = false,
                inVariable = false,
                inCode = false,
                inIfStatement = false,
                inOrientation = false,
                canStartSelector = true,
                overloads = _overloads === true,
                methodName = (overloads === true) ? 'redux.fn.setOverload' : 'redux.fn.setDefault',
                canBeAttributeBrace = false;
            result = '';
            for (var i = 0, l = rjss.length; i < l; i++) {
                var currentChar = rjss[i];
                if (inComment) {
                    if (currentChar == '/' && rjss[i - 1] == '*') {
                        inComment = false;
                    }
                    continue;
                }
                if (inCode && currentChar !== '@') {
                    result += currentChar;
                    continue;
                }
                switch (currentChar) {
                    case '$':
                    case '_':
                        if (braceDepth == 0 && canStartSelector) {
                            canStartSelector = false;
                            inVariable = true;
                            result += 'this.' + currentChar;
                        } else {
                            result += currentChar;
                        }
                        break;
                    case '@':
                        if (braceDepth === 0) {
                            if (inCode) {
                                inCode = false;
                            } else if (canStartSelector) {
                                canStartSelector = false;
                                inCode = true;
                            }
                        } else {
                            result += currentChar;
                        }
                        break;
                    case ';':
                        if (inVariable) {
                            canStartSelector = true;
                            inVariable = false;
                        }
                        result += currentChar;
                        break;
                    case ' ':
                        result += currentChar;
                        break;
                    case '/':
                        inComment = rjss[i + 1] == '*';
                        result += inComment ? '' : '/';
                        break;
                    case '[':
                        if (braceDepth > 0 || inVariable === true) {
                            result += currentChar;
                        } else {
                            canStartSelector = false;
                            inIfStatement = true;
                            result += 'if (';
                        }
                        break;
                    case '=':
                        if (inIfStatement === true)
                            result += (rjss[i - 1] != '!' && rjss[i - 1] != '<' && rjss[i - 1] !=
                                '>') ?
                                '==' : '=';
                        else
                            result += currentChar;
                        break;
                    case ']':
                        if (braceDepth > 0 || inVariable === true) {
                            result += ']';
                        } else {
                            canStartSelector = true;
                            result += ')';
                            inIfStatement = false;
                            canBeAttributeBrace = true;
                        }
                        break;
                    case '{':
                        if (inVariable === true) {
                            braceDepth += 1;
                        } else if (canBeAttributeBrace) {
                            canBeAttributeBrace = false;
                            inAttributeBrace = true;
                        } else {
                            if (inSelector) {
                                inSelector = false;
                                result += '",';
                            }
                            braceDepth += 1;
                        }
                        result += currentChar;
                        break;
                    case '}':
                        if (inVariable) {
                            braceDepth -= 1;
                            if (braceDepth === 0) {
                                inVariable = false;
                                canStartSelector = true;
                            }

                            result += currentChar;
                            break;
                        }
                        result += currentChar;
                        braceDepth -= 1;
                        switch (braceDepth) {
                            case 0:
                                if (rjss[i + 1] !== '(') {
                                    result += ');';
                                    canStartSelector = true;
                                } else {
                                    inOrientation = true;
                                    result += ',';
                                }
                                break;
                            case -1:
                                inAttributeBrace = false;
                                braceDepth = 0;
                                break;
                        }
                        break;
                    case ')':
                        if (inOrientation === true) {
                            result += ');';
                            inOrientation = false;
                            canStartSelector = true;
                        } else {
                            result += currentChar;
                        }
                        break;
                    case '(':
                        if (inOrientation === true)
                            break;
                    default:
                        canBeAttributeBrace = false;
                        if (braceDepth === 0 && canStartSelector) {
                            canStartSelector = false;
                            inSelector = true;
                            result += (inAttributeBrace ? '' : '\n') + methodName + '("';
                        }
                        result += currentChar;
                        break;
                }
            }
            return {
                data: result,
                path: file.nativePath
            };
        },

        internalIncludeRJSS: function(fileName, overloads) {
            if (fileName.endsWith('.compiled.js')) {
                Ti.include(fileName);
                return;
            }
            var data = redux.fn.parseRJSS(fileName, overloads);
            var parsedRJSS = data.data;
            try {
                (new Function(parsedRJSS)).call(context);
            } catch (e) {
                var error = ' in:';
                // Check each line for errors
                var lines = parsedRJSS.split("\n");
                parsedRJSS.split("\n").forEach(function(line, index) {
                    try {
                        (new Function(line)).call(context);
                    } catch (e2) {
                        e.message = e.message + error + line;
                        e.line = index;
                        e.sourceURL = data.path;
                        e.column = e2.column;
                        throw e;
                    }
                })
            }
        },

        /**
         * Includes and parses one or more RJSS files. Styles will be applied to any elements you create after calling this.
         * @param {Array} arguments One or more RJSS files to include and parse
         */
        includeRJSS: function(...args) {
            args.forEach(redux.fn.internalIncludeRJSS)
        },
        includeOverloadRJSS: function(...args) {
            args.forEach(function(arg){
                redux.fn.internalIncludeRJSS(arg, true);
            });
        },
        /**
         * Adds an event binder that can bind listen events or fire events, similar to how jQuery's events stack works.
         * @param {Object} event
         */
        // addEventBinder: function(event) {
        //     redux.fn.init.prototype[event] = function() {
        //         var action;
        //         if (arguments.length === 0 || !(arguments[0] instanceof Function)) {
        //             action = 'fireEvent';
        //         } else {
        //             action = 'addEventListener';
        //         }
        //         for (var i = 0, l = this.context.length; i < l; i++) {
        //             this.context[i][action](event, arguments[0]);
        //         }
        //         return this;
        //     };
        // },
        /**
         * Set the default properties for any elements matched by the RJSS selector.
         * @param {Object} selector
         * @param {Object} defaults
         * @param {Object} orientation
         */
        setDefault: function(selector, defaults, orientation) {
            orientation = redux.fn.parseOrientationString(orientation);
            var cleanSelector, target, overloads;

            selector.split(',').forEach(function(value) {
                cleanSelector = value.trim();
                switch (cleanSelector.charAt(0)) {
                    case '#':
                        // set by ID
                        target = redux.data.defaults.byID;
                        overloads = redux.data.overloads.byID;
                        cleanSelector = cleanSelector.substring(1);
                        // remove the '#'
                        break;
                    case '.':
                        // set by rclass
                        target = redux.data.defaults.byRclass;
                        overloads = redux.data.overloads.byRclass;
                        cleanSelector = cleanSelector.substring(1);
                        // remove the '.'
                        break;
                    default:
                        // set by element type
                        target = redux.data.defaults.byType;
                        overloads = redux.data.overloads.byType;
                        break;
                }
                !target[cleanSelector] && (target[cleanSelector] = {});

                var selector = target[cleanSelector];
                var theOverloads = Object.get(overloads, [cleanSelector, orientation]);
                stylePropFromObj(defaults, orientation, false, true);
                !selector[orientation] && (selector[orientation] = {});
                // console.debug('setDefault', cleanSelector, defaults);
                mergeObjects(selector[orientation], defaults, true);
                // console.debug('setDefaultDone', cleanSelector, target[cleanSelector][orientation]);
                if (theOverloads) {
                    mergeObjects(selector[orientation], theOverloads, true);
                }
            })
            return this;
        },

        setOverload: function(selector, defaults, orientation) {
            orientation = redux.fn.parseOrientationString(orientation);
            var cleanSelector, target, overloads;

            selector.split(',').forEach(function(value) {
                cleanSelector = value.trim();
                switch (cleanSelector.charAt(0)) {
                    case '#':
                        // set by ID
                        target = redux.data.defaults.byID;
                        overloads = redux.data.overloads.byID;
                        cleanSelector = cleanSelector.substring(1);
                        // remove the '#'
                        break;
                    case '.':
                        // set by rclass
                        target = redux.data.defaults.byRclass;
                        overloads = redux.data.overloads.byRclass;
                        cleanSelector = cleanSelector.substring(1);
                        // remove the '.'
                        break;
                    default:
                        // set by element type
                        target = redux.data.defaults.byType;
                        overloads = redux.data.overloads.byType;
                        break;
                }
                if (!overloads[cleanSelector])
                    overloads[cleanSelector] = {};
                var selector = overloads[cleanSelector];
                if (!selector[orientation]) {
                    //first default
                    selector[orientation] = {}
                }
                var styled = stylePropFromObj(defaults,
                    orientation, false, true)
                mergeObjects(selector[orientation], styled, true);
                if (!Object.get(target, [cleanSelector, orientation])) {
                    target[cleanSelector] = target[cleanSelector] || {};
                    target[cleanSelector][orientation] = Object.deepCopy(styled);
                }
            })
            return this;
        },

        styleTemplate: function(args, orientation, override) {
            return redux.fn.style(undefined, args, orientation, override);
        },
        merge: mergeObjects,
        /**
         * Takes in an object and applies any default styles necessary to it.
         * @param args
         */
        style: function(type, args, orientation, override) {
            args = args || {};
            var i, l;
            if (!args.hasOwnProperty) return args; //Ti proxy object
            if (Array.isArray(args)) {
                return args.map(function(value) {
                    return redux.fn.style(undefined, value, orientation, override);
                });
            }

            if ((typeof args.type === 'string')) {
                if (args.type.indexOf('Ti') === 0) {
                    type = (args.type.split('.').slice(-1))
                } else {
                    type = args.type;
                }
            }
            if (args.hasOwnProperty('properties')) {
                args.properties = redux.fn.style(type, args.properties, orientation, override);
            } else {
                orientation = redux.fn.parseOrientationString(orientation);
                args = stylePropFromObj(args, orientation, override);

                if (type && type !== '' && redux.data.defaults.byType[type]) {
                    mergeObjects(args, redux.data.defaults.byType[type][orientation], override);
                }
            }
            if (Array.isArray(args.childTemplates)) {
                var children = args.childTemplates;
                for (i = 0, l = children.length; i < l; i++) {
                    children[i] = redux.fn.style(undefined, children[i], orientation, override);
                }
            }
            for (i = 0, l = redux.data.propertiesToStyle.length; i < l; i++) {
                var prop = redux.data.propertiesToStyle[i];
                if (args.hasOwnProperty(prop) && args[prop]) {
                    args[prop] = redux.fn.style(undefined, args[prop], orientation, override);
                }
            }
            return args;
        },
        /**
         * Applies the styles from the passed in arguments directly to the passed in object.
         * @param obj Any object or UI element; does not have to be created by redux.
         * @param type The type of the object (Label, ImageView, etc)
         * @param args The construction arguments, such as the rid or rclass
         * @param orientation the orientation
         * @param override should override if exists
         */
        applyStyle: function(obj, type, args, orientation, override) {
            override = override !== false;
            var styles = redux.fn.style(type, args, orientation, override);
            mergeObjects(obj, styles, override);
        },
        /**
         * Applies the styles from the passed in arguments directly to the passed in
         * object.
         * @param obj Any object or UI element; does not have to be created by redux.
         * @param type The type of the object (Label, ImageView, etc)
         * @param args The construction arguments, such as the id or rclass
         */
        applyOrientation: function(obj, orientation, args, override) {
            args = args || {};
            args.rclass = args.rclass || (obj.rclass || undefined)
            args.id = args.id || (obj.id || undefined)
            var type = obj.constructorName || '',
                styles = redux.fn.style(type, args, orientation, override);
            mergeObjects(obj, styles, override);
        },
        /**
         * Adds a natural constructors for all the different things you can create with Ti, like Labels,
         * LoginButtons, HTTPClients, etc. Also allows you to add your own natural constructors.
         *
         * @param context The context to add this constructor to ("this" would be a good thing to pass in here)
         * @param parent The parent namespace (like Ti.UI)
         * @param type The type of the constructor (like Label or Button)
         * @param constructorName The desired constructor name; defaults to type. Generic styles will use this.
         */
        addNaturalConstructor: function(context, parent, type, constructorName) {
            constructorName = constructorName || type;
            context[constructorName] = (function(args) {
                args = redux.fn.style(constructorName, args);
                if (args) args.constructorName = constructorName;
                // _args.push(type);
                // return created object with merged defaults by type
                var obj = parent['create' + type](args);
                // if (obj) obj.constructorName = constructorName;
                return obj;
            }).bind(context);
            /**
             * Shortcut to setting defaults by type. Will only apply to objects you create in
             * the future using redux's constructors.
             * @param {Object} args
             */
            context[constructorName].setDefault = function(args) {
                redux.fn.setDefault(constructorName, args);
            };
        },
        /**
         * Adds a natural constructors for all the different things you can create with Ti, like Labels,
         * LoginButtons, HTTPClients, etc.
         *
         * @param context The context to add this constructor to ("this" would be a good thing to pass in here)
         * @param namespace The namespace under Ti that the object will be created in (like UI, as in Ti.UI)
         * @param type The type of the constructor (like Label or Button)
         * @param constructorName The desired constructor name; defaults to type. Generic styles will use this.
         */
        addTitaniumNaturalConstructor: function(context, namespace, type, constructorName) {
            constructorName = constructorName || type;
            context[constructorName] = function(args) {
                args = redux.fn.style(constructorName, args);
                if (args) args.constructorName = constructorName;
                // return created object with merged defaults by type
                var obj = Ti[namespace]['create' + type](args);
                // obj.constructorName = constructorName;
                return obj;
            };
            /**
             * Shortcut to setting defaults by type. Will only apply to objects you create in
             * the future using redux's constructors.
             * @param {Object} args
             */
            context[constructorName].setDefault = function(args) {
                redux.fn.setDefault(constructorName, args);
            };
        }
    };

    /**
     * Add natural constructors and shortcuts to setting defaults by type.
     */
    for (var i3 in redux.data.types) {
        // iterate over type namespaces (UI, Network, Facebook, etc)
        if (redux.data.types.hasOwnProperty(i3)) {
            for (var j3 = 0, l3 = redux.data.types[i3].length; j3 < l3; j3++) {
                // iterate over types within parent namespace (Label, LoginButton, HTTPClient, etc)
                redux.fn.addTitaniumNaturalConstructor(context, i3, redux.data.types[i3][j3]);
            }
        }
    }

    redux.fn.init.prototype.call = function(functionName, args) {
        for (var i = 0, l = this.length; i < l; i++) {
            this.context[i][functionName](args);
        }
        return this;
    };

    /**
     * Expose the applyStyle function to selector based redux usages -- $(view).applyStyle() etc.
     * @param type
     * @param args
     */
    redux.fn.init.prototype.applyStyle = function(type, args) {
        for (var i = 0, l = this.length; i < l; i++) {
            redux.fn.applyStyle(this.context[i], type, args);
        }
        return this;
    };

    /**
     * Expose the applyOrientation function to selector based redux usages --
     * $(view).applyOrientation() etc.
     * @param type
     * @param args
     * @param override
     */
    redux.fn.init.prototype.applyOrientation = function(orientation, args, override) {
        for (var i = 0, l = this.length; i < l; i++) {
            redux.fn.applyOrientation(this.context[i], orientation, args, override);
        }
        return this;
    };

    /**
     * Expose the applyClass function to selector based redux usages --
     * $(view).applyOrientation() etc.
     * @param type
     * @param args
     * @param override
     */
    redux.fn.init.prototype.applyClass = function(rclass, args, orientation, override) {
        args = args || {};
        args.rclass = rclass;
        for (var i = 0, l = this.length; i < l; i++) {
            redux.fn.applyStyle(this.context[i], undefined, args, orientation, override);
        }
        return this;
    };

    /**
     * Expose the applyId function to selector based redux usages --
     * $(view).applyOrientation() etc.
     * @param type
     * @param args
     * @param override
     */
    redux.fn.init.prototype.applyId = function(rid, args, orientation, override) {
        args = args || {};
        args.rid = rid;
        for (var i = 0, l = this.length; i < l; i++) {
            redux.fn.applyStyle(this.context[i], undefined, args, orientation, override);
        }
        return this;
    };

    /**
     * Includes and parses one or more RJSS files. Styles will be applied to any elements you create after calling this.
     */
    // context.inject = inject;
    // context.includeRJSS = redux.fn.includeRJSS;
    // context.addTitaniumNaturalConstructor = redux.fn.addTitaniumNaturalConstructor;
    // context.addNaturalConstructor = redux.fn.addNaturalConstructor;

    /**
     * Create a shorthand for redux itself -- $ or R, if they are available.
     */
    context['R'] = context['R'] || redux;
    context['redux'] = redux;
    return redux;
}

exports.inject = inject;