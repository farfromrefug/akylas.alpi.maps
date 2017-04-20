exports.create = function(_context, _args, _additional) {
    var leftButtons = [{
            id: 'menu',
            text: $.sMenu
                // }, {
                //     id: 'positioninfo',
                //     text: $.sSubtitles
                // }, {
                // id: 'tilesources',
                // text: $.sMap
        }, {
            id: 'search',
            text: $.sSearch
        }],
        itemHandler = app.itemHandler,
        rightButtons = [{
            //     id: 'weather',
            //     text: app.icons.weather
            // }, {
            id: 'geofeature',
            text: app.icons.nature
        }, {
            id: 'list',
            text: $.sList
        }, {
            id: 'direction',
            text: $.sRouting
        }],
        visibleMultipleAction = null;

    // function createMultipleActionButton(_right, _id, _buttons, _args) {
    //     return {
    //         type: 'Ti.UI.View',
    //         properties: Object.assign({
    //             rclass: 'NavBarButton',
    //             layout: 'horizontal'
    //         }, _args),
    //         childTemplates: _.reduce(_buttons, function(memo, value) {
    //             memo.push({
    //                 type: 'Ti.UI.Label',
    //                 properties: {
    //                     rclass: 'MapActionLabel',
    //                     isMultipleActionTrigger: value.isMultipleActionTrigger,
    //                     callbackId: value.id,
    //                     text: value.text,
    //                     color: value.color
    //                 }
    //             });
    //             return memo;
    //         }, [])
    //     };
    // }

    function createButton(_right, _id, _text, _args) {
        return {
            type: 'Ti.UI.Button',
            properties: Object.assign({
                rclass: 'MapActionButton',
                callbackId: _id,
                title: _text
            }, _args)
        };
    }

    function animateButtonIn(e) {
        var callbackId = _.get(e, 'source.callbackId');
        if (callbackId) {
            e.source.animate({
                transform: 'ots1.1',
                duration: 100
            });
        }
    }

    function animateButtonOut(e) {
        var callbackId = _.get(e, 'source.callbackId');
        if (callbackId) {
            e.source.animate({
                cancelRunningAnimations: true,
                transform: null,
                duration: 100
            });
        }
    }
    var visible = true,
        view = new View({
            properties: {
                height: $.navBarTop + $.navBarHeight,
                top: 0,
                width: 'FILL',
                backgroundColor: $.cTheme.main,
                // layout:'horizontal',
                borderColor: '#00000033',
                // borderWidth: 2,
                borderPadding: [-1, -1, 0, -1]
                    // touchPassThrough: true
            },
            // childTemplates: [
            // // createButton(false, 'menu', $.sMenu, {
            // //     width:45
            // // }), 
            // {
            //     bindId: 'holder',
            //     properties: {
            //         top: $.navBarTop,
            //         touchPassThrough: true
            //     },
            childTemplates: [{
                type: 'Ti.UI.View',
                bindId: 'leftHolder',
                properties: {
                    touchPassThrough: true,
                    layout: 'horizontal',
                    bottom: 0,
                    height:$.navBarHeight,
                    width: 'SIZE',
                    left: 0
                },
                childTemplates: _.reduce(leftButtons, function(memo, value) {
                    memo.push(createButton(false, value.id, value.text));
                    return memo;
                }, [])
            }, {
                type: 'Ti.UI.View',
                bindId: 'rightHolder',
                properties: {
                    touchPassThrough: true,
                    layout: 'horizontal',
                    bottom: 0,
                    width: 'SIZE',
                    height:$.navBarHeight,
                    // top: 60,
                    right: 0
                },
                childTemplates: _.reduce(rightButtons, function(memo, value) {
                        memo.push(createButton(true, value.id, value.text));
                        return memo;
                    }, [])
                    // }, [createMultipleActionButton(true, 'geofeatures',
                    //     _.reduce(geofeatures, function(memo, feature, type) {
                    //         if (feature.geofeature !== false) {
                    //             memo.push({
                    //                 id: type,
                    //                 text: feature.icon,
                    //                 color: feature.color
                    //             });
                    //         }

                //         return memo;
                //     }, [{
                //         id: 'geo_search',
                //         isMultipleActionTrigger: true,
                //         text: $.sSearch
                //     }]))])
            }],
            //     }
            // ],

            // events: {
            //     click: app.debounce(function(e) {
            //         var callbackId = _.get(e, 'source.callbackId');
            //         if (callbackId) {
            //             sdebug(callbackId);
            //             if (callbackId === 'menu') {
            //                 app.ui.slidemenu.toggleLeftView();
            //             } else {
            //                 self.parent.runModuleAction({
            //                     id: callbackId
            //                 });
            //             }
            //         }
            //     }),
            //     // touchstart: animateButtonIn,
            //     // touchend: animateButtonOut,
            //     // touchcancel: animateButtonOut
            // }
        }),
        self = new _context.MapModule(_args);
    _additional.mapTopToolbarChildren.push(view);

    // function hideCurrentMultipleAction() {
    //     if (visibleMultipleAction != null) {
    //         visibleMultipleAction.animate({
    //             duration: 100,
    //             width: $.mapActionBtnWidth
    //         });
    //         visibleMultipleAction = null;
    //     }
    // }

    function showhide(_duration) {
        visible = !visible;

        view.animate({
            // transform: visible ? null : '0t0,-100%',
            // opacity: visible ? 1 : 0,
            height: visible ? ($.navBarHeight + $.navBarTop) : 0,
            duration: _duration || 150
        });
    }

    function hide(_duration) {
        // hideCurrentMultipleAction();
        if (visible) {
            // self.parent.setMapFakePadding('mapactions', {
            //     top: -($.navBarHeight + $.navBarTop),
            // });
            showhide(_duration);
        }
    }

    function show(_duration) {
        if (!visible) {
            // self.parent.removeMapFakePadding('mapactions');
            showhide(_duration);
        }
    }

    Object.assign(self, {
        onInit: function() {
            self.parent.setMapPadding('navbar', {
                top: $.navBarTop + $.navBarHeight
            }, 0);
        },
        GC: app.composeFunc(self.GC, function() {
            // visibleMultipleAction = null;
        }),
        hideModule: function(_params) {
            _params = _params || {};
            if (!!_params.top) {
                hide(_params.duration);
            }

        },
        onWindowOpen: function(_enabled) {
            app.showTutorials(['menu']);
        },
        onMapReset: function(_params) {
            _params = _params || {};
            if (!!_params.top) {
                show(_params.duration);
            }
        },
        onMapHolderPress: app.debounce(function(e) {
            var callbackId = _.get(e, 'source.callbackId');
            if (callbackId) {
                sdebug(callbackId);
                if (callbackId === 'menu') {
                    app.ui.slidemenu.toggleLeftView();
                // } else if (callbackId === 'take_photo') {
                //     self.runAction('take_photo');
                //     // self.parent.runMethodOnModules('spreadModuleAction', {
                //     //     id: 'photo',
                //     //     command: callbackId
                //     // });
                } else {
                    self.parent.runMethodOnModules('spreadModuleAction', {
                        id: callbackId
                    });
                }
            }
            // hideCurrentMultipleAction();
        }),
        // onMapHolderLongPress: function(e) {
        //     var source = e.source;
        //     var callbackId = source.callbackId;
        //     if (callbackId) {
                // sdebug('longpress', callbackId);
                //         if (source.isMultipleActionTrigger === true) {
                //             if (visibleMultipleAction !== null) {
                //                 visibleMultipleAction.animate({
                //                     duration: 100,
                //                     width: $.mapActionBtnWidth
                //                 });
                //             }
                //             var parent = source.parent;
                //             if (visibleMultipleAction !== parent) {
                //                 visibleMultipleAction = parent;
                //                 visibleMultipleAction.animate({
                //                     duration: 100,
                //                     width: 'SIZE'
                //                 });
                //             } else {
                //                 visibleMultipleAction = null;
                //             }

                //         } else {
                //             sdebug(callbackId);
                // self.parent.runMethodOnModules('spreadLongModuleAction', {
                    // id: callbackId
                // });
                //             hideCurrentMultipleAction();
                //         }
        //     }
        // },
        // onMapPress: function() {
        //     if (visibleMultipleAction != null) {
        //         hideCurrentMultipleAction();
        //         return true;
        //     } else {
        //         visible = !visible;
        //         view.holder.animate({
        //             opacity: visible ? 1 : 0,
        //             duration: 200
        //         });
        //     }

        // },
        // onAnnotationPress: function() {
        //     if (visibleMultipleAction != null) {
        //         hideCurrentMultipleAction();
        //         return true;
        //     }
        // }

    });
    return self;
};