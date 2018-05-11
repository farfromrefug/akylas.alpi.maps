
const constructors = ['Ti.UI.createNavigationWindow', 'Ti.UI.createWindow'];
export function create(_args) {
    _args = _args || {};

    function defaults(obj, args) {
        if (typeof obj.hasOwnProperty === 'function' && typeof obj.setPropertiesAndFire !== 'function') {
            _.defaults(obj, args);
        } else {
            for (const key in args) {
                if (obj[key] !== undefined) {
                    delete args[key];
                }
            }
            obj.applyProperties(args);
        }
    }

    if (_args.modal === true) {
        if (_args.navWindow === true) {
            _args.navBarHidden = true;
            if (_args.window.navBarHidden !== true) {
                var showBackButton = _args.window.showBackButton !== false;
                var ownBackButtonTitle = _args.window.ownBackButtonTitle || $.sClose;
                defaults(_args.window, {
                    homeAsUpIndicator: (_args.modal === true) ? 'images/close.png' : null
                });
                if (showBackButton === true) {
                    _args.window.shouldShowBackButton(ownBackButtonTitle);
                    delete _args.showBackButton;
                }

            }
        } else if (_args.navBarHidden !== true) {
            defaults(_args, {
                showBackButton: true,
                ownBackButtonTitle: $.sClose,
                homeAsUpIndicator: (_args.modal === true) ? 'images/close.png' : null
            });
        }
    }

    var self: BaseWindow = new this[(!!_args.animatedWindow && 'AnimatedWindow') ||
        (!!_args.navWindow && 'NavigationWindow') || 'Window'](_args);
    // var navWindow;
    var indicator;
    // currentTopWindow;

    var children = [];
    if (_args.underContainerView) {
        children = children.concat(_args.underContainerView);
        delete _args.underContainerView;
    }

    if (_args.containerView) {
        var object = _args.containerView;
        delete _args.containerView;
        object.bindId = 'container';
        children.push(object);
    } else {
        children.push({
            type: _args.containerType || 'Ti.UI.View',
            bindId: 'container',
            properties: _args.containerProps || {
                rclass: _args.containerClass,
                height: 'FILL',
                width: 'FILL',
                touchPassThrough: true,
                layout: ((_args.verticalContainer === false) ? 'absolute' : 'vertical')
            }
        });
    }
    ak.ti.add(self, children);

    // self.createNavBar = function() {
    //     self.navBar = new NavigationBar({
    //         rclass: _args.navBarRClass,
    //         rid: _args.navBarRid,
    //         customChildren: _args.navBarChildren,
    //         inModal: self.modal
    //     });
    //     _.extend(self, {
    //         setNavBarVisibility: function(_visible, _animated) {
    //             self.navBar.setMyVisibility(_visible, _animated);
    //         }
    //     });
    //     if (self.navWindow && self.navWindow.window) {
    //         if (self.verticalContainer === false) {
    //             self.navWindow.parent.top = self.navBar.height;
    //         }
    //         self.navBar.setNavWindow(self.navWindow);
    //     } else if (_args.navWindow !== true) {
    //         self.navBar.setRootWindow(self);
    //     }

    //     self.container.add(self.navBar, 0);
    // };

    // if (_args.navBar === true) {
    //     self.createNavBar();
    // }

    if (_args.navWindow === true) {
        let selfNav = self as NavWindow;
        // var window = _args.window;
        // self.navWindow = new NavigationWindow({
        //     rid: _args.ridNavWindow,
        //     title: self.title + '_NAVWINDOW',
        //     window: window,
        //     swipeToClose: _args.navSwipeToClose,
        //     height: 'FILL'
        // });
        _args.window.manager = self;
        // currentTopWindow = _args.window;
        // window = null;

        // var container = new View({
        //     rid: _args.ridNavContainer || 'navContainer'
        // });
        // container.add(self.navWindow);
        // // if (self.navBar) {
        // //     if (_args.verticalContainer === false) {
        // //         container.top = self.navBar.height;
        // //     }
        // //     self.navBar.setNavWindow(self.navWindow);
        // // }

        // self.container.add(container);
        selfNav.navOpenWindow = function (_win: AppWindow | TiDict, _args?: TiDict) {
            if (_.isPlainObject(_win)) {
                _win = new AppWindow(_win as TiDict);
            }
            let theWin = _win as AppWindow;
            _args = _args || {};
            var manager: NavWindow = (_args.manager || self) as NavWindow;
            console.debug('navOpenWindow', app.ui.androidNav, theWin.showLeftMenuButton, theWin.androidDontUseNavWindow,
                _args);

            if (!!theWin.modal || !!theWin.customModal || (!!app.ui.androidNav && theWin.showLeftMenuButton !== true) ||
                (__ANDROID__ && (!!theWin.androidDontUseNavWindow || !!_args.androidDontUseNavWindow))) {
                if (manager) {
                    var currentWindow = Ti.UI.topWindow;
                    // if (!currentWindow && manager.navBar) {
                    //     currentWindow = manager.navBar.getTopWindow();
                    // }

                    if (theWin.shouldShowBackButton && !(theWin.modal && !!theWin.navWindow)) {
                        theWin.shouldShowBackButton(currentWindow ? (currentWindow.backButtonTitle ||
                            currentWindow.title) : undefined);
                    }
                    delete _args.winManager;
                    delete theWin.winManager;
                    // _win.modal = currentWindow?currentWindow.modal:manager.modal;

                    // if (manager.navBar && !_win.navBar && _win.createNavBar) {
                    //     _win.createNavBar();
                    // }
                    // if (__ANDROID__) {
                    //     _win.openedFromWindow = currentWindow;
                    //     currentTopWindow = _win;
                    // }
                }
            } else {
                _args.winManager = self;
                // _args.winManager = self.navWindow;
            }
            theWin.manager = manager;
            app.ui.openWindow(_win, _args);
            // currentTopWindow = _win;
        };

        // self.onCloseAndroidNavWindow = function(_win) {
        //important when we fake the opening of a window on android
        // if (currentTopWindow == _win) {
        //     currentTopWindow = _win.openedFromWindow;
        // }
        // console.debug('onCloseAndroidNavWindow', _win.title, currentTopWindow.title);
        // };
        selfNav.createManagedWindow = function (_constructor: string, _args2?: TiDict) {
            _args2 = _args2 || {};
            _args2.manager = self;
            return ak.ti.createFromConstructor(_constructor, _args2);
        };
        selfNav.createAndOpenWindow = function (_constructor: string, _args?: TiDict, _winArgs?: TiDict) {
            var win = selfNav.createManagedWindow(_constructor, _args);
            selfNav.navOpenWindow(win, _winArgs);
            return win;
        };

        selfNav.closeToRootWindow = function () {
            console.debug('closeToRootWindow');
            if (__ANDROID__) {
                selfNav.window.closeWindowsInFront();
                // var androidToClose = [];
                // var rootWindow = self.window;
                // if (currentTopWindow != rootWindow) {
                //     var parentWindow = currentTopWindow;
                //     while (parentWindow && parentWindow != rootWindow) {
                //         androidToClose.push(parentWindow);
                //         parentWindow = parentWindow.openedFromWindow;
                //     }
                // }
                // console.debug('androidToClose', _.map(androidToClose, 'title'));
                // _.each(androidToClose, function(win) {
                //     win.closeMe();
                // });
                // currentTopWindow = rootWindow;
            }

            selfNav.closeAllWindows();
            // self.navWindow.closeAllWindows();
            // currentTopWindow = self.window;
        };
    }

    if (_args.withLoadingIndicator === true) {
        indicator = new View({
            properties: {},
            childTemplates: [{
                type: 'Ti.UI.ActivityIndicator',
                properties: {
                    rid: 'loadingIndicator'
                }
            }]
        });
        self.showLoading = function () {
            self && self.add(indicator);
        };

        self.hideLoading = function () {
            self && self.remove(indicator);
        };
    }

    self.shouldShowBackButton = function (_backTitle) {
        if (!self.leftNavButton) {
            if (__APPLE__) {
                self.leftNavButton = ak.ti.style({
                    type: 'Ti.UI.Button',
                    properties: {
                        rclass: 'NBBackButton',
                        title: _backTitle || trc('close')
                    },
                    events: {
                        'click': app.debounce(function () {
                            self.closeMe();
                        })
                    }
                });
            } else {
                defaults(self, {
                    homeAsUpIndicator: (_args.modal === true) ? 'images/close.png' : null,
                    displayHomeAsUp: true,
                    onHomeIconItemSelected: app.debounce(function () {
                        self.closeMe();
                    })
                });
            }
        }
    };
    if (_args.showBackButton === true) {
        self.shouldShowBackButton(_args.ownBackButtonTitle);
    }

    self.closeMe = function (_args?) {
        app.ui.closeWindow(self, _args);
    };
    self.openMe = function (_args?) {
        app.ui.openWindow(self, _args);
    };
    if (__ANDROID__) {
        self.onBack = function () {
            if (self.exitOnBack === true) {
                app.closeApp();
            } else {
                self.closeMe();
            }
        };
    }

    self.isOpened = false;
    self.on('open', function () {
        if (self.onOpen) {
            setTimeout(function () {
                self.onOpen(!self.isOpened);
            }, 5); //slight delay because on android open is sent to soon

        }
        self.isOpened = true;
    });

    self.onClose = app.composeFunc(self.onClose, function () {
        self && self.isOpened = false;
        // console.debug('onClose', self.title, !!self.manager, !!self.openedFromWindow);
        // if (self.manager && self.openedFromWindow) {
        //     self.manager.onCloseAndroidNavWindow(self);
        //     delete self.openedFromWindow;
        // }
    });

    var propertiesToGC = ['navBar', 'window', 'listView'];
    self.addPropertiesToGC = function (key) {
        if (propertiesToGC.indexOf(key) === -1) {
            propertiesToGC.push(key);
        }
    };

    var toIgnore = ['manager', 'winManager', 'navWindow'];
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        if (self && self !== null) {
            console.debug('BaseWindow GC', self.title);
            propertiesToGC.forEach(function (key, index, list) {
                var value = self[key];
                if (value && value !== null) {
                    var ignored = toIgnore.indexOf(key) !== -1;
                    if (!ignored && typeof value.GC === 'function') {
                        console.debug('BaseWindow GC', 'property GC:', key);
                        value.GC();
                        self[key] = null;
                    } else if (ignored) {
                        console.debug('BaseWindow GC', 'property to null:', key);
                        self[key] = null;
                    }
                }
            });
            indicator = null;
            self = null;
            // currentTopWindow = null;
        }
    });
    return self;
};