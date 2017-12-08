import { MapModule } from './MapModule'
export class MapActionButtons extends MapModule {
    visibleMultipleAction = null
    visible = true
    view: View
    constructor(_context, _args, _additional) {
        super(_args);
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
        }]
        var rightButtons = [{
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
        }]
        this.view = new View({
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
                    height: $.navBarHeight,
                    width: 'SIZE',
                    left: 0
                },
                childTemplates: _.reduce(leftButtons, (memo, value) => {
                    memo.push(this.createButton(false, value.id, value.text));
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
                    height: $.navBarHeight,
                    // top: 60,
                    right: 0
                },
                childTemplates: _.reduce(rightButtons, (memo, value) => {
                    memo.push(this.createButton(true, value.id, value.text));
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
        })
        _additional.mapTopToolbarChildren.push(this.view);
    }
    createButton(_right, _id, _text, _args?) {
        return {
            type: 'Ti.UI.Button',
            properties: Object.assign({
                rclass: 'MapActionButton',
                callbackId: _id,
                title: _text
            }, _args)
        };
    }

    animateButtonIn(e) {
        var callbackId = _.get(e, 'source.callbackId');
        if (callbackId) {
            e.source.animate({
                transform: 'ots1.1',
                duration: 100
            });
        }
    }

    animateButtonOut(e) {
        var callbackId = _.get(e, 'source.callbackId');
        if (callbackId) {
            e.source.animate({
                cancelRunningAnimations: true,
                transform: null,
                duration: 100
            });
        }
    }
    showhide(_duration) {
        this.visible = !this.visible;

        this.view.animate({
            // transform: visible ? null : '0t0,-100%',
            // opacity: visible ? 1 : 0,
            height: this.visible ? ($.navBarHeight + $.navBarTop) : 0,
            duration: _duration || 150
        });
    }

    hide(_duration) {
        // hideCurrentMultipleAction();
        if (this.visible) {
            // self.parent.setMapFakePadding('mapactions', {
            //     top: -($.navBarHeight + $.navBarTop),
            // });
            this.showhide(_duration);
        }
    }

    show(_duration) {
        if (!this.visible) {
            // self.parent.removeMapFakePadding('mapactions');
            this.showhide(_duration);
        }
    }
    onInit() {
        this.parent.setMapPadding('navbar', {
            top: $.navBarTop + $.navBarHeight
        }, 0);
    }
    GC() {
        super.GC();
        this.view = null;
    }
    hideModule(_params) {
        _params = _params || {};
        if (!!_params.top) {
            this.hide(_params.duration);
        }

    }
    onWindowOpen(_enabled) {
        app.showTutorials(['menu']);
    }
    onMapReset(_params) {
        _params = _params || {};
        if (!!_params.top) {
            this.show(_params.duration);
        }
    }
    onMapHolderPress(e) {
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
                this.parent.runMethodOnModules('spreadModuleAction', {
                    id: callbackId
                });
            }
        }
        // hideCurrentMultipleAction();
    }
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

}
export function create(_context, _args, _additional) {
    return new MapActionButtons(_context, _args, _additional);
};