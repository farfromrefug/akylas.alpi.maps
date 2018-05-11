export function create(_args) {
    function debounce(e, t, n) {
        var r;
        return function () {
            var i = this,
                s = arguments;
            clearTimeout(r);
            if (n && !r) e.apply(i, s);
            r = setTimeout(function () {
                r = null;
                if (!n) e.apply(i, s)
            }, t)
        }
    }
    var navWindow = null,
        currentTitleView = null,
        currentLeftButton = null,
        currentRightButton = null,
        currentStackIndex = 0,
        windowsParams = [],
        fakeCurrentWindowTitle,
        rootWindow = null,
        titleHolderClass = _args.titleHolderClass || 'NBTitleHolder',
        leftHolderClass = _args.leftHolderClass || 'NBLeftHolder',
        rightHolderClass = _args.rightHolderClass || 'NBRightHolder',
        backButtonClass = _args.backButtonClass || 'NBBackButton',
        backButtonSymbolClass = _args.backButtonSymbolClass || 'NBBackButtonSymbol',
        titleLabelClass = _args.titleLabelClass || 'NBTitle',
        transitionIn = (_args.transition || {
            style: Ti.UI.TransitionStyle.SWIPE_DUAL_FADE
        }),
        transitionInLeft = _args.transitionLeft || transitionIn,
        transitionInRight = _args.transitionRight || transitionIn,
        useNavTransition = _args.useNavTransition !== false,
        transitionOut = _.clone(transitionIn),
        transitionOutLeft = _.clone(transitionInLeft),
        transitionOutRight = _.clone(transitionInRight);

    var visible = true;

    var customChildrenOnTop = _args.customChildrenOnTop === true;

    var childTemplates = [{
        type: 'Ti.UI.View',
        bindId: 'titleHolder',
        properties: {
            rclass: titleHolderClass
        },
        childTemplates: [_args.titleView]
    }, {
        type: 'Ti.UI.View',
        bindId: 'leftButtonViewHolder',
        properties: {
            rclass: leftHolderClass,
        }
    }, {
        type: 'Ti.UI.View',
        bindId: 'rightButtonViewHolder',
        properties: {
            rclass: rightHolderClass
        }
    }];
    if (_args.customChildren) {
        if (Array.isArray(_args.customChildren)) {
            if (customChildrenOnTop === true) {
                childTemplates = childTemplates.concat(_args.customChildren);
            } else {
                childTemplates = _args.customChildren.concat(childTemplates);
            }
        } else {
            if (customChildrenOnTop === true) {
                childTemplates.push(_args.customChildren);
            } else {
                childTemplates.unshift(_args.customChildren);
            }
        }
    }

    var self: NavigationBar = new View({
        type: 'Ti.UI.View',
        properties: {
            top: 0
        },
        childTemplates: [{
            bindId: 'actualNavbar',
            type: 'Ti.UI.View',
            properties: _args,
            childTemplates: childTemplates
        }]
    }) as NavigationBar;
    // if (_args.inModal === true) {
    self.actualNavbar.height = (self.actualNavbar.height as number) + $.navBarTop;
    self.titleHolder.top = self.titleHolder.top || 0 + $.navBarTop;
    self.leftButtonViewHolder.top = self.leftButtonViewHolder.top || 0 + $.navBarTop;
    self.rightButtonViewHolder.top = self.rightButtonViewHolder.top || 0 + $.navBarTop;
    // }
    self.height = self.actualNavbar.height;

    function createBackButton(_title) {
        var result = new Label({
            properties: {
                bubbleParent: false,
                rclass: backButtonClass,
                html: _title,
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                properties: {
                    rclass: backButtonSymbolClass
                }
            }],
            events: {
                'click': self.onBackButton
            }
        });
        return result;
    }

    function transitionViews(_holder, _out, _in, _params) {
        _holder.transitionViews(_out || null, _in || null, _params);
    }

    transitionOut.reverse = transitionOutLeft.reverse = transitionOutRight.reverse = true;

    function onOpenWindow(_event) {
        if (_event.stackIndex === 0) return;
        currentStackIndex = _event.stackIndex;
        var transition = prepareTransition(_event.transition);
        var win = _event.window;
        console.debug('onOpenWindow', navWindow.title, win.title, transition, visible);
        self.setMyVisibility(win.cNavBarHidden !== true, true, _event.transition.duration);

        var currentWindow = navWindow.currentWindow;
        var newLeftButton = win.leftNavButton || currentWindow.backButton;
        if (!newLeftButton) {
            newLeftButton = createBackButton(currentWindow.backButtonTitle || currentWindow.title);
        }
        var newRightButton = win.rightNavButton || null;
        var newTitleView = win.titleView || new Label({
            rclass: titleLabelClass,
            html: win.title
        });
        transitionViews(self.titleHolder, currentTitleView, newTitleView, transition);
        transitionViews(self.leftButtonViewHolder,
            currentLeftButton, newLeftButton, transition);
        transitionViews(self.rightButtonViewHolder,
            currentRightButton, newRightButton, transitionInRight);

        windowsParams.push({
            backButton: newLeftButton,
            rightButton: newRightButton,
            titleView: newTitleView
        });
        currentTitleView = newTitleView;
        currentLeftButton = newLeftButton;
        currentRightButton = newRightButton;
    }

    var TRSWIPE = Ti.UI.TransitionStyle.SWIPE;
    var TRMODERN = Ti.UI.TransitionStyle.MODERN_PUSH;
    var TRSWIPE_DUAL_FADE = Ti.UI.TransitionStyle.SWIPE_DUAL_FADE;

    function prepareTransition(_transition, _reverse?) {
        if (useNavTransition) {
            if (_transition.style === TRSWIPE || _transition.style === TRMODERN) {
                //modern push replace by dual fade
                _transition.style = TRSWIPE_DUAL_FADE;
            }
        }
        else {
            if (_reverse === true) {
                _transition = _.clone(transitionOut);
            }
            else {
                _transition = _.clone(transitionIn);
            }
        }

        _transition.duration = _transition.duration * 0.6;
        _transition.reverse = _reverse === true;
        return _transition;
    }

    function onCloseWindow(_event) {
        console.debug('onCloseWindow', _event.stackIndex, _event.window.title);
        var transition = prepareTransition(_event.transition, true);
        currentStackIndex = _event.stackIndex;
        var winParams = windowsParams[currentStackIndex] || {};
        var newLeftButton = winParams.leftButton || winParams.backButton;
        var newRightButton = winParams.rightButton;
        var newTitleView = winParams.titleView;
        transitionViews(self.titleHolder, currentTitleView, newTitleView, transition);
        transitionViews(self.leftButtonViewHolder, currentLeftButton, newLeftButton, transition);
        transitionViews(self.rightButtonViewHolder, currentRightButton, newRightButton, transitionOutRight);
        windowsParams = windowsParams.slice(0, _event.stackIndex + 1);
        currentTitleView = newTitleView;
        currentLeftButton = newLeftButton;
        currentRightButton = newRightButton;
        self.setMyVisibility(_event.window.cNavBarHidden !== true, true, _event.transition.duration);
    }

    function onRealBackButton(e) {
        var win = null;
        if (navWindow !== null) {
            win = navWindow.currentWindow;
        } else {
            win = rootWindow;
        }
        if (win === null) return;
        console.debug('onBackButton', e.source.html, win.title);
        if (win.closeMe) {
            win.closeMe();
        } else {
            app.ui.closeWindow(win);
        }
    };
    Object.assign(self, {
        getTopWindow: function () {
            if (navWindow !== null) {
                return navWindow.currentWindow;
            } else {
                return rootWindow;
            }
        },
        setFakeCurrentWindowTitle: function (_title) {
            return navWindow.currentWindow.title;
        },
        setRootWindow: function (_window) {
            rootWindow = _window;
            self.setMyVisibility(_window.cNavBarHidden !== true, false);
            // sinfo('setRootWindow', _window.title);

            windowsParams = [{
                backButton: (_window.backButton || _window.showBackButton ? (createBackButton(
                    _window.ownBackButtonTitle)) : undefined),
                leftButton: _window.leftNavButton,
                rightButton: _window.rightNavButton,
                titleView: _window.titleView
            }];
            var params = windowsParams[0];

            if (params.titleView) {
                if (currentTitleView && params.titleView != currentTitleView) self.titleHolder.remove(
                    currentTitleView);
                currentTitleView = params.titleView;
                self.titleHolder.add(currentTitleView);
            } else {
                if (currentTitleView) self.titleHolder.remove(currentTitleView);
                params.titleView = currentTitleView = new Label({
                    rclass: titleLabelClass,
                    html: _window.title
                });
                self.titleHolder.add(currentTitleView);
            }
            if (params.leftButton || params.backButton) {
                if (currentLeftButton && params.leftButton != currentLeftButton) {
                    self.leftButtonViewHolder.remove(currentLeftButton);
                }
                currentLeftButton = params.leftButton || params.backButton;
                self.leftButtonViewHolder.add(currentLeftButton);
            }
            if (params.rightButton) {
                if (currentRightButton && params.rightButton != currentRightButton) {
                    self.rightButtonViewHolder.remove(currentRightButton);
                }
                currentRightButton = params.rightButton;
                self.rightButtonViewHolder.add(currentRightButton);
            }
        },
        setNavWindow: function (_navWindow) {
            if (navWindow !== null) {
                navWindow.removeEventListener('openWindow', onOpenWindow);
                navWindow.removeEventListener('closeWindow', onCloseWindow);
            }
            // console.debug('setNavWindow', _navWindow.title);
            // console.debug('_navWindow.currentWindow', _navWindow.currentWindow);
            navWindow = _navWindow;

            if (self.onstackchange) {
                navWindow.onstackchange = self.onstackchange;
            }
            navWindow.addEventListener('openWindow', onOpenWindow);
            navWindow.addEventListener('closeWindow', onCloseWindow);
            self.setRootWindow(_navWindow.currentWindow);
        },
        // leftButton: function() {
        //     return currentLeftButton;
        // },
        // onstackchange: function(_event) {
        //     self.setMyVisibility(_event.window.cNavBarHidden !== true, true);
        // },
        setMyVisibility: function (_visible, _animated, _duration) {
            if (_visible === visible) return;
            visible = _visible;
            if (_animated === true) {
                self.animate({
                    height: _visible ? self.actualNavbar.height : 0,
                    duration: _duration || 150
                });
            } else {
                self.height = _visible ? self.actualNavbar.height : 0;
            }
        },
        onRealBackButton: function (e) {
            var win = null;
            if (navWindow !== null) {
                win = navWindow.currentWindow;
            } else {
                win = rootWindow;
            }
            if (win === null) return;
            // console.debug('onBackButton', e.source.html, win.title);
            if (win.closeMe) {
                win.closeMe();
            } else {
                app.ui.closeWindow(win);
            }
        },
        onBackButton: debounce(onRealBackButton, 500, true)
    });

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        windowsParams = null;
        navWindow = null;
        self = null;
    });
    return self;
};