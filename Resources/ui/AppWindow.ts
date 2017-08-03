declare class Container extends View {
    titleView: View
    topToolbarHolder: View
    navBarHolder: View
    navBar: View
}

declare class AppWindow extends BaseWindow {
    manager:MainWindow
    showLeftMenuButton: boolean
    customNavBar: boolean
    androidDontUseNavWindow: boolean
    customModal: boolean
    createManagedWindow(constructor, args)
    showTopToolbar()
    hideTopToolbar()
    showHideTopToolbar()
    showBottomToolbar()
    hideBottomToolbar()
    showHideBottomToolbar()
    setColors(color, _withNavBar?: boolean, _barColor?: string)
    showError(err)
    updateTitle(title: string, subtitle?: string)
    runPromise<T>(p: Promise<T>): Promise<T>
    cancelRunningRequest()
    topToolbarVisible: boolean
    bottomToolbarVisible: boolean
    withLoadingIndicator: boolean
    container: Container
    window: AppWindow
    listView: AppListView
    loadingView: LoadingView
    headerTemplate: any
    headerView: any
    onLogin?()
    onLogout?()
}

ak.ti.constructors.createAppWindow = function (_args:WindowParams) {
    var bottomToolbarHolder,
        realContainer,
        hasContentLoading = false;

    if (!!_args.modal) {
        _args.customModal = true;
        _args.modal = false;
        _.defaults(_args, {
            winOpeningArgs: {
                from: {
                    transform: 'ot0,100%',
                },
                to: {
                    transform: null,
                },
                duration: 300
            },
            winClosingArgs: {
                transform: 'ot0,100%',
                duration: 200
            }
        });
    }

    if (_args.blurredBackground === true) {
        _args.underContainerView = {
            type: 'Ti.UI.View',
            bindId: 'underContainer',
            properties: __APPLE__ ? {
                backgroundImage: app.getBluredScreenshot({
                    // tint: '#00000000',
                    filters: [{
                        radius: 1
                    }]
                })
            } : {
                    backgroundColor: '#000000aa'
                }
        };
    }

    let updateTitle = function (title) {
        if (self.customNavBar) {
            self.container.applyProperties({
                titleView: {
                    html: title
                }
            });
        } else {
            self.title = title;
        }
    }

    if (_args.subtitle) {
        _args.backButtonTitle = '';
        _args.titleView = {
            type: 'Ti.UI.Label',
            touchEnabled: false,
            // textAlign: 'center',
            // backgroundColor:'brown',
            height: 'FILL',
            width: 'FILL',
            bindId: 'titleView',
            multiLineEllipsize: Ti.UI.TEXT_ELLIPSIZE_TAIL,
            color: $.white,
            font: { size: 14 },
            html: '<b>' + _args.title + '</b><br><small><font color="lightgray">' + _args.subtitle + '</small></font>'
        }

        updateTitle = function (title, subtitle?) {
            console.log('updateTitle', self.customNavBar, self.container.titleView, title, subtitle);
            (self.customNavBar ? self.container : self).applyProperties({
                titleView: {
                    html: (subtitle ? ('<b>' + title + '</b><br><small><font color="lightgray">' + subtitle + '</small></font>') : title)
                }
            });
        }
    }

    if (_args.rightNavButtons) {
        _args.rightNavButtons = _.reduce(_args.rightNavButtons, function (memo, value: any, key, list) {
            if (!value.hasOwnProperty || value.hasOwnProperty('type')) {
                memo.push(value);
            } else {
                memo.push({
                    type: 'Ti.UI.Button',
                    properties: {
                        rclass: 'NavBarRightButton',
                        title: value.icon
                    },
                    events: {
                        'click': app.debounce(value.callback)
                    }
                });
            }

            return memo;

        }, []);
    }



    if (!!_args.customNavBar) {
        console.log('customNavBar', _args.showLeftMenuButton);
        var children = [];
        var maxCount = 0;
        var toAdd;
        if (_args.showBackButton && !_args.showLeftMenuButton) {
            _args.hasBackButton = true;
            children.push({
                type: 'Ti.UI.Button',
                properties: {
                    rclass: 'NBBackButton',
                    title: _args.ownBackButtonTitle || ((_args.modal || _args.customModal) ? $.sClose :
                        $.sLeft)
                },
                events: {
                    'click': app.debounce(function () {
                        self.closeMe();
                    })
                }
            });
            delete _args.showBackButton;
        }
        _args.navBarHidden = true;
        if (_args.hasOwnProperty('leftNavButton')) {
            toAdd = _.remove(_args, 'leftNavButton');
            // decaleCount += 1;
            children.push(toAdd);
        } else if (!!_args.showLeftMenuButton) {
            let leftNavButton = new Button({
                rid: (_args.leftMenuButtonRid || 'menuBtn')
            });
            app.onDebounce(leftNavButton, 'click', function () {
                app.ui.slidemenu.toggleLeftView();
            });
            delete _args.showLeftMenuButton;
            children.push(leftNavButton);
        }
        var customTitleView = !!_args.titleView;
        var titleView = _args.titleView || ((_args.title && _args.title.length > 0) ? {
            type: 'Ti.UI.Label',
            bindId: 'titleView',
            properties: {
                rclass: 'NBTitle',
                width: 'FILL',
                html: _args.title
            }
        } : undefined);
        // children.push(titleView);
        maxCount = children.length;
        if (titleView) {
            children.push(titleView);
        } else {
            children.push({
                type: 'Ti.UI.View',
                touchEnabled: false
            });
        }

        if (_args.hasOwnProperty('rightNavButton')) {
            children.push(_.remove(_args, 'rightNavButton'));
            // decaleCount -= 1;

        }
        if (_args.hasOwnProperty('rightNavButtons')) {
            toAdd = _.remove(_args, 'rightNavButtons');
            // decaleCount -= toAdd.length;
            children = children.concat(toAdd);
        }
        maxCount = Math.max(maxCount, children.length - maxCount - 1);
        // if (!customTitleView) {
        // if (titleView && maxCount > 0) {
        // let props = titleView.properties || titleView;
        // props.right = maxCount * $.nbButtonWidth;
        // props.left = maxCount * $.nbButtonWidth;
        // } else if (decaleCount < 0) {
        // titleView.properties.padding = [0, -decaleCount * $.nbButtonWidth, 0, 0];
        // }
        // }

        _args.topToolbarVisible = true;
        var view = {
            type: 'Ti.UI.View',
            bindId: 'navBar',
            properties: {
                rclass: 'NavBar',
                backgroundColor: _args.barColor,
                // layout:'vertical',
                height: 'SIZE',
                touchPassThrough: !(_args.barColor && _args.barColor !== 'transparent')
            },
            childTemplates: [{
                type: 'Ti.UI.View',
                properties: {
                    rclass: 'NavBarHolder',
                    height: _args.barHeight,
                    touchPassThrough: true
                },
                childTemplates: [{
                    type: 'Ti.UI.View',
                    bindId: 'navBarHolder',
                    properties: {
                        layout: 'horizontal',
                        // backgroundColor:'yellow',
                        touchPassThrough: true
                    },
                    childTemplates: children
                }]

            }]
        };
        if (_args.topToolbar) {
            _args.topToolbar = {
                type: 'Ti.UI.View',
                layout: 'vertical',
                height: 'SIZE',
                childTemplates: [view, _args.topToolbar]
            };
        } else {
            _args.topToolbar = view;
        }
        delete _args.titleView;
        delete _args.leftNavButton;
        delete _args.leftNavButtons;
        delete _args.rightNavButton;
        delete _args.rightNavButtons;
    }

    if (__ANDROID__) {
        var buttons = [];
        if (_args.hasOwnProperty('leftNavButton')) buttons.push(_args.leftNavButton);
        if (_args.hasOwnProperty('rightNavButton')) buttons.push(_args.rightNavButton);
        if (_args.hasOwnProperty('rightNavButtons')) buttons = _.union(buttons, _args.rightNavButtons);
        if (buttons.length > 0) {
            _args.activity = _args.activity || {};
            _args.activity.onCreateOptionsMenu = function (e) {
                var menu = e.menu;
                _.each(buttons, function (view, index, list) {
                    var args = {
                        actionView: view,
                        showAsAction: Ti.Android.SHOW_AS_ACTION_IF_ROOM
                    };
                    menu.add(args);
                });
            };
        }
    }

    let self: AppWindow = <AppWindow>new BaseWindow(_args);
    self.updateTitle = updateTitle;
    if (self.navWindow && self.window.customNavBar === true) {
        self.window.closeMe = self.closeMe;
    }

    if (_args.navWindow === true || _args.canManageWindows === true) {
        self.createManagedWindow = function (_constructor, _args2) {
            _args2 = _args2 || {};
            _args2.manager = self;
            return ak.ti.createFromConstructor(_constructor, _args2);
        };
    }

    if (_args.showLeftMenuButton === true) {
        console.log('showLeftMenuButton');
        if (_args.modal === true) {

        } else {
            if (__APPLE__) {
                self.leftNavButton = new Button({
                    rid: (_args.leftMenuButtonRid || 'menuBtn')
                });
                app.onDebounce(self.leftNavButton as View, 'click', function () {
                    app.ui.slidemenu.toggleLeftView();
                });
            } else {
                self.applyProperties({
                    homeAsUpIndicator: 'images/menu.png',
                    displayHomeAsUp: true,
                    onHomeIconItemSelected: function () {
                        app.ui.slidemenu.toggleLeftView();
                    }
                });
            }
        }

    }

    if (_args.topToolbar) {
        self.showTopToolbar = function () {
            if (self.container.topToolbarHolder.visible) return;
            self.container.topToolbarHolder.visible = true;
            self.container.topToolbarHolder.animate({
                height: 'SIZE',
                duration: 300
            });
        };
        self.showHideTopToolbar = function () {
            if (self.container.topToolbarHolder.visible === false)
                self.showTopToolbar();
            else
                self.hideTopToolbar();

        };
        self.hideTopToolbar = function () {
            if (self.container.topToolbarHolder.visible === false) return;
            self.container.topToolbarHolder.animate({
                height: 0,
                duration: 300
            }, function () {
                self.container.topToolbarHolder.visible = false;
            });
        };
        ak.ti.add(self.container, {
            type: 'Ti.UI.View',
            bindId: 'topToolbarHolder',
            properties: {
                rclass: 'TopToolbar',
                visible: (_args.topToolbarVisible === true),
                height: ((_args.topToolbarVisible === true) ? 'SIZE' : 0)
            },
            childTemplates: [_args.topToolbar]
        }, 0);
        delete _args.topToolbarVisible;
        delete _args.topToolbar;
    }

    realContainer = self.container;
    if (_args.centerContainerView) {
        realContainer = _args.centerContainerView;
        delete _args.centerContainerView;
        ak.ti.add(self.container, realContainer);
    }

    if (_args.listViewArgs) {
        self.listView = new AppListView(_args.listViewArgs);
        realContainer.add(self.listView);
    } else if (_args.templates) {
        self.headerTemplate = ak.ti.style({
            type: 'Ti.UI.Label',
            properties: {
                rclass: 'LVHeader'
            }
        });

        var args = {
            rid: _args.listViewId,
            isCollection: _args.useCollection,
            canEdit: _args.canEdit,
            rclass: _args.listViewClass,
            templates: Object.assign({
                'noitem': app.templates.row.noitem
            }, _args.templates),
            defaultItemTemplate: _args.defaultItemTemplate || 'default',
            headerView: undefined
        };
        if (_args.headerView) {
            args.headerView = _args.headerView;
        } else if (_args.withAd === true) { }
        self.listView = new AppListView(args);

        // self.setNoItemSections();
        realContainer.add(self.listView);
        hasContentLoading = true;
    } else {
        if (_args.withAd === true) {
            ak.ti.add(self.container, {
                type: 'AkylasAdmob.View',
                // bindId: 'admob',
                properties: {
                    rclass: 'AdmobView'
                }
            });
        }
    }

    if (_args.bottomToolbar) {
        bottomToolbarHolder = new View({
            rclass: 'BottomToolbar',
            bindId: 'bottomToolbarHolder'
        });
        let height = bottomToolbarHolder.height;
        if (_args.bottomToolbarVisible !== true) {
            bottomToolbarHolder.visible = false;
            bottomToolbarHolder.height = 0;
        }
        self.showBottomToolbar = function () {
            if (self.bottomToolbarVisible) return;
            sdebug('showBottomToolbar', self.bottomToolbarVisible);
            bottomToolbarHolder.cancelAllAnimations();
            self.bottomToolbarVisible = true;
            bottomToolbarHolder.visible = true;
            bottomToolbarHolder.animate({
                height: height,
                duration: 300
            });
        };
        self.showHideBottomToolbar = function () {
            if (bottomToolbarHolder.visible === false)
                self.showBottomToolbar();
            else
                self.hideBottomToolbar();

        };
        self.hideBottomToolbar = function () {
            if (self.bottomToolbarVisible === false) return;
            self.bottomToolbarVisible = false;
            sdebug('hideBottomToolbar', self.bottomToolbarVisible);
            bottomToolbarHolder.cancelAllAnimations();
            bottomToolbarHolder.animate({
                height: 0,
                duration: 300
            }, function () {
                if (!self.bottomToolbarVisible) {
                    bottomToolbarHolder.visible = false;
                }
            });
        };
        ak.ti.add(bottomToolbarHolder, _args.bottomToolbar);
        delete _args.bottomToolbar;
        self.container.add(bottomToolbarHolder);
    }

    if (self.withLoadingIndicator) {
        var loadingShowing = false;
        var currentRequest;
        self.loadingView = new LoadingView(_args.loadingViewArgs);
        self.addPropertiesToGC('loadingView');
        self.showLoading = function (_args, _animated?) {
            if (!self || loadingShowing) {
                return;
            }
            _args = _args || {};
            loadingShowing = true;
            if (currentRequest) {
                currentRequest.abort();
                currentRequest = null;
            }
            currentRequest = _.remove(_args, 'request');
            if (currentRequest) {
                // sdebug('we have a request');
                _args.sublabel = {
                    text: trc('click_to_cancel')
                }
                self.loadingView.holder.once('click', function () {
                    // sdebug('test');
                    if (currentRequest) {
                        currentRequest.abort();
                        currentRequest = null;
                    }
                });
            } else {
                _args.sublabel = {
                    text: ''
                }
            }
            self.loadingView.startLoading(_args);
            self.add(self.loadingView);
            if (_animated !== false) {
                self.loadingView.animate({
                    from: {
                        opacity: 0
                    },
                    to: {
                        opacity: 1
                    },
                    duration: 200
                });
            }
        };

        self.hideLoading = function () {
            if (!self || !loadingShowing) {
                return;
            }
            loadingShowing = false;
            sdebug('app hideLoading');
            currentRequest = null;
            if (self.listView && self.listView.doneLoading) {
                self.listView.doneLoading();
            }
            self.loadingView.animate({
                opacity: 0,
                duration: 200
            }, function (e) {

                if (isClosed) return;
                sdebug('app hideLoading done');
                self.loadingView.stopLoading();
                self.remove(self.loadingView);
            });
        };
        self.cancelRunningRequest = function () {
            if (currentRequest) {
                sdebug('cancelRunningRequest');
                currentRequest.abort();
                currentRequest = null;
                return true;
            }
            return false;
        }
    }

    self.showError = function (err) {
        app.emit('error', { silent: true, error: err });
    }

    self.runPromise = function (promise) {
        self.showLoading && self.showLoading();
        return promise.then(function (result) {
            if (!isClosed) {
                self.hideLoading && self.hideLoading();
            }
            return result;
        }, err => {
            if (!isClosed) {
                self.hideLoading && self.hideLoading();
            }
            throw err;
        });
    };

    self.setColors = function (_color, _withNavBar, _barColor) {
        var colors = app.getContrastColors(_color);

        var params: any = {};

        if (self.customNavBar && _withNavBar != false) {
            params.container = {
                topToolbarHolder: {
                    backgroundColor: colors.color
                },
                bottomToolbarHolder: {
                    backgroundColor: colors.color
                },
                titleView: {
                    color: colors.contrast
                },
                navBar: undefined
            };
            if (self.isOpened) {
                self.container.navBar.animate({
                    backgroundColor: colors.color,
                    duration: 300
                });
            } else {
                params.container.navBar = {
                    backgroundColor: colors.color
                };
            }

            _.forEach(self.container.navBarHolder.children, function (child: Label) {
                child.color = colors.contrast;
            });
        } else {
            params = {
                barColor: colors.color,
                barTintColor: colors.contrast
            };
        }
        if (__APPLE__) {
            params.statusBarStyle = colors.isLight ? 1 : 0;
        } else if (__ANDROID__) {
            params.navigationBarColor = _barColor || colors.color;
        }
        console.log('setColors', params);
        self.applyProperties(params);



        return colors;
    };

    var needsLogin = !!_args.needsLoginEvents;
    var onLogin, onLogout;

    if (needsLogin) {
        self.onLogin = function () { };
        self.onLogout = function () { };

        onLogin = function () {
            self.onLogin();
        }

        onLogout = function () {
            self.onLogout();
        }
        app.api.on('loggedin', onLogin);
        app.api.on('loggedout', onLogout);
    }

    var isClosed = false;
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        if (self && self !== null) {
            isClosed = true;
            sdebug('AppWindow GC', self.title);
            if (needsLogin) {
                app.api.off('loggedin', onLogin);
                app.api.off('loggedout', onLogout);
            }
            if (realContainer) {
                if (realContainer.GC) {
                    realContainer.GC();
                }
                realContainer = null;
            }
            bottomToolbarHolder = null;
            self = null;
        }
    });
    return self;
};