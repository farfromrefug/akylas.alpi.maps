ak.ti.constructors.createAppWindow = function(_args) {
    var bottomToolbarHolder,
        topToolbarHolder,
        realContainer,
        hasContentLoading = false;

    if (!!_args.modal) {
        _args.modal = false;
        _args.customModal = true;
        if (__APPLE__) {
            _args.backgroundColor = 'transparent';
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
                backgroundColor: '#aa000000'
            }
        };
    }

    if (_args.rightNavButtons) {
        _args.rightNavButtons = _.reduce(_args.rightNavButtons, function(memo, value, key, list) {
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

    if (_args.customNavBar === true) {

        var children = [];
        var maxCount = 0;
        var toAdd;
        if (_args.showBackButton) {
            _args.hasBackButton = true;
            children.push({
                type: 'Ti.UI.Button',
                properties: {
                    rclass: 'NBBackButton',
                    title: _args.ownBackButtonTitle || ((_args.modal || _args.customModal) ? $sClose :
                        $sLeft)
                },
                events: {
                    'click': app.debounce(function() {
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
        children.push({
            type: 'Ti.UI.View',
            touchEnabled: false
        });
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
        if (titleView && maxCount > 0) {
            titleView.properties.right = maxCount * $nbButtonWidth;
            titleView.properties.left = maxCount * $nbButtonWidth;
            // } else if (decaleCount < 0) {
            // titleView.properties.padding = [0, -decaleCount * $nbButtonWidth, 0, 0];
        }
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
                childTemplates: (titleView ? [titleView] : []).concat([{
                    type: 'Ti.UI.View',
                    bindId: 'navBarHolder',
                    properties: {
                        layout: 'horizontal',
                        touchPassThrough: true
                    },
                    childTemplates: children
                }])

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

    }

    if (__ANDROID__) {
        var buttons = [];
        if (_args.hasOwnProperty('leftNavButton')) buttons.push(_args.leftNavButton);
        if (_args.hasOwnProperty('rightNavButton')) buttons.push(_args.rightNavButton);
        if (_args.hasOwnProperty('rightNavButtons')) buttons = _.union(buttons, _args.rightNavButtons);
        if (buttons.length > 0) {
            _args.activity = _args.activity || {};
            _args.activity.onCreateOptionsMenu = function(e) {
                var menu = e.menu;
                _.each(buttons, function(view, index, list) {
                    var args = {
                        actionView: view,
                        showAsAction: Ti.Android.SHOW_AS_ACTION_IF_ROOM
                    };
                    menu.add(args);
                });
            };
        }
    }

    var self = new BaseWindow(_args);
    if (self.navWindow && self.window.customNavBar === true) {
        self.window.closeMe = self.closeMe;
        //     self.openWindow = app.composeFunc(self.openWindow, function(_win, _args) {
        //         _win.shouldShowBackButton();
        //     });
        //     self.shouldShowBackButton = function(_backTitle) {
        //         sdebug('shouldShowBackButton', _backTitle);
        //         if (!self.hasBackButton) {
        //             self.container.navBarHolder.add({
        //                 type: 'Ti.UI.Button',
        //                 properties: {
        //                     rclass: 'NBBackButton',
        //                     title: _backTitle || ((self.modal || self.customModal) ? $sClose :
        //                         $sLeft)
        //                 },
        //                 events: {
        //                     'click': app.debounce(function() {
        //                         self.closeMe();
        //                     })
        //                 }
        //             }, 0);
        //         }
        //     };
    }

    if (_args.navWindow === true || _args.canManageWindows === true) {
        self.createManagedWindow = function(_constructor, _args2) {
            _args2 = _args2 || {};
            _args2.manager = self;
            return ak.ti.createFromConstructor(_constructor, _args2);
        };
    }

    // if (_args.showLeftMenuButton === true) {
    //     if (_args.modal === true) {

    //     } else {
    //         if (__APPLE__) {
    //             self.leftNavButton = new Label({
    //                 rid: (_args.leftMenuButtonRid || 'menuBtn')
    //             });
    //             app.onDebounce(self.leftNavButton, 'click', function() {
    //                 app.ui.slidemenu.toggleLeftView();
    //             });
    //         } else {
    //             self.applyProperties({
    //                 homeAsUpIndicator: 'images/menu.png',
    //                 displayHomeAsUp: true,
    //                 onHomeIconItemSelected: function() {
    //                     app.ui.slidemenu.toggleLeftView();
    //                 }
    //             });
    //         }
    //     }

    // }

    if (_args.topToolbar) {
        self.showTopToolbar = function() {
            if (self.container.topToolbarHolder.visible) return;
            sdebug('showTopToolbar');
            self.container.topToolbarHolder.visible = true;
            self.container.topToolbarHolder.animate({
                height: 'SIZE',
                duration: 200
            });
        };
        self.showHideTopToolbar = function() {
            if (self.container.topToolbarHolder.visible === false)
                self.showTopToolbar();
            else
                self.hideTopToolbar();

        };
        self.hideTopToolbar = function() {
            if (self.container.topToolbarHolder.visible === false) return;
            sdebug('hideTopToolbar');
            self.container.topToolbarHolder.animate({
                height: 0,
                duration: 200
            }, function() {
                self.container.topToolbarHolder.visible = false;
            });
        };
        ak.ti.add(self.container, {
            type: 'Ti.UI.View',
            bindId: 'topToolbarHolder',
            properties: {
                rclass: 'TopToolbar' + ((!!_args.dontElevateTopBar || _args.barColor === 'transparent') ?
                    '' : ' ElevatedView'),
                visible: (_args.topToolbarVisible === true),
                height: ((_args.topToolbarVisible === true) ? 'SIZE' : 0)
            },
            childTemplates: [_args.topToolbar]
        });
        delete _args.topToolbarVisible;
        delete _args.topToolbar;
    }

    realContainer = self.container;
    if (_args.centerContainerView) {
        realContainer = _args.centerContainerView;
        delete _args.centerContainerView;
        self.container.add(realContainer);
    }

    if (_args.listViewArgs) {
        self.listView = new ListView(_args.listViewArgs);
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
            templates: _.assign({
                'noitem': app.templates.row.noitem
            }, _args.templates),
            defaultItemTemplate: _args.defaultItemTemplate || 'default',
        };
        if (_args.headerView) {
            args.headerView = _args.headerView;
        } else if (_args.withAd === true) {}
        self.listView = new ListView(args);

        // self.setNoItemSections();
        realContainer.add(self.listView);
        hasContentLoading = true;
    }

    if (_args.bottomToolbar) {
        bottomToolbarHolder = new View({
            bindId: 'bottomToolbarHolder',
            rclass: 'BottomToolbar' + ((!!_args.dontElevateTopBar || _args.barColor === 'transparent') ? '' :
                ' ElevatedView'),
        });
        if (_args.bottomToolbarVisible !== true) {
            bottomToolbarHolder.visible = false;
            bottomToolbarHolder.height = 0;
        }
        self.showBottomToolbar = function() {
            if (bottomToolbarHolder.visible) return;
            sdebug('showBottomToolbar', bottomToolbarHolder.visible);
            self.bottomToolbarVisible = true;
            bottomToolbarHolder.visible = true;
            bottomToolbarHolder.animate({
                cancelRunningAnimations: true,
                height: 'SIZE',
                duration: 200
            });
        };
        self.showHideBottomToolbar = function() {
            if (bottomToolbarHolder.visible === false)
                self.showBottomToolbar();
            else
                self.hideBottomToolbar();

        };
        self.hideBottomToolbar = function() {
            if (bottomToolbarHolder.visible === false) return;
            sdebug('hideBottomToolbar', bottomToolbarHolder.visible);
            bottomToolbarHolder.animate({
                cancelRunningAnimations: true,
                height: 0,
                duration: 200
            }, function() {
                self.bottomToolbarVisible = false;
                bottomToolbarHolder.visible = false;
            });
        };
        if (_args.withAd === true && app.shouldShowAds()) {
            ak.ti.add(bottomToolbarHolder, {
                type: 'AkylasAdmob.View',
                properties: {
                    rclass: 'AdmobView',
                    height: 0,
                    opacity: 0,
                    location: app.currentLocation
                },
                events: {
                    load: function(e) {
                        e.source.animate({
                            height: 'SIZE',
                            opacity: 1,
                            duration: 100
                        });
                    }
                }
            });
        }
        bottomToolbarHolder.add(_args.bottomToolbar);
        delete _args.bottomToolbar;
        self.container.add(bottomToolbarHolder);
    }

    // if (_args.verticalContainer === false && _args.customNavBar === true) {
    //     if (topToolbarHolder) {
    //         self.container.remove(topToolbarHolder);
    //         self.container.add(topToolbarHolder);
    //     }
    //     if (bottomToolbarHolder) {
    //         self.container.remove(bottomToolbarHolder);
    //         self.container.add(bottomToolbarHolder);
    //     }
    // }

    if (self.withLoadingIndicator) {
        var currentRequest;
        self.loadingView = new LoadingView({
            rclassPrefix: _args.LoadingRclassPrefix || 'Loading'
        });
        self.addPropertiesToGC('loadingView');
        self.showLoading = function(_args, _animated) {
            sdebug('showLoading', _args);
            _args = _args || {};
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
                self.loadingView.holder.once('click', function() {
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
            // sdebug('test1', _args);
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

        self.hideLoading = function() {
            sdebug('hideLoading');
            currentRequest = null;
            self.loadingView.animate({
                cancelRunningAnimations: true,
                opacity: 0,
                duration: 200
            }, function(e) {
                if (isClosed) return;
                self.loadingView.stopLoading();
                self.remove(self.loadingView);
            });
        };

        self.cancelRunningRequest = function() {
            if (currentRequest) {
                sdebug('cancelRunningRequest');
                currentRequest.abort();
                currentRequest = null;
                return true;
            }
            return false;
        }
        self.onBack = function(e) {
        if (self.cancelRunningRequest()) {
            return;
        }
        self.closeMe();
    };
    }

    self.setColors = function(_color, _withNavBar, _barColor) {
        sdebug('setColors', _color);
        var colors = app.getContrastColor(_color);
        var params = {};
        if (self.customNavBar && _withNavBar != false) {
            params.tintColor = colors.contrast;
            params.container = {
                titleView: {
                    color: colors.contrast
                }
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

            // self.container.applyProperties(params);
        } else {
            params = {
                barColor: colors.color,
                barTintColor: colors.contrast,
            };
        }

        if (__APPLE__) {
            // sdebug('statusBarStyle', colors.isLight ? 0 : 1);
            params.statusBarStyle = colors.isLight ? 0 : 1;
            params.tintColor = colors.contrast;
        } else if (__ANDROID__) {
            params.navigationBarColor = _barColor || colors.color;
        }

        self.applyProperties(params);
        // if (self.listView) {
        //     self.listView.applyProperties({
        //         selectedBackgroundColor: colors.color,
        //     });
        // }

        _.forEach(self.container.navBarHolder.children, function(child) {
            // sdebug('changing color for', child, colors.contrast);
            // if (child.color) {
            child.color = colors.contrast;
            // } else {
            // child.tintColor = colors.contrast;
            // }
        });

        return colors;
    };

    var isClosed = false;
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
        if (self && self !== null) {
            isClosed = true;
            sdebug('AppWindow GC', self.title);
            if (realContainer) {
                if (realContainer.GC) {
                    realContainer.GC();
                }
                realContainer = null;
            }
            bottomToolbarHolder = null;
            topToolbarHolder = null;
            self = null;
        }
    });
    return self;
};