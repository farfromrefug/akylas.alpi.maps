ak.ti.constructors.createFullscreenImageWindow = function(_args) {
    var _photos = _.remove(_args, 'photos'),
        _photoIndex = _.remove(_args, 'photoIndex', 0),
        sourceRect,
        topRect = app.ui.topWindow.rect,
        scaleType = Ti.UI.SCALE_TYPE_ASPECT_FILL,
        optionsVisible = true,
        _fromView = _.remove(_args, 'fromView');

    if (_fromView) {
        scaleType = _fromView.scaleType;
        sourceRect = _fromView.absoluteRect;
    }
    sdebug('_photos', _photos);
    // sdebug('topRect', topRect);

    function scrollViewForPhoto(_index, _photo, _current) {
        // var densityFactor = app.deviceinfo.densityFactor;
        // var left, top,
        //     width = _photo.width,
        //     height = _photo.height,
        //     yScale = topRect.height / height,
        //     xScale = topRect.width / width,
        //     contentWidth = Math.max(_photo.width, topRect.width),
        //     contentHeight = Math.max(_photo.height, topRect.height),
        //     minScale = Math.min(Math.min(xScale, yScale), 1),
        // minScale = __ANDROID__?1:(Math.min(Math.min(xScale, yScale), 1)),
        // maxScale = 1;

        // delta = (contentHeight - topRect.height) / 2 * minScale;
        // if (_current === true) {
        //     var delta = ((topRect.height - (minScale * height)) / 2 - (__APPLE__ ? $.navBarTop : 0)); //because of auto center
        //     left = sourceRect.x / minScale;
        //     top = (sourceRect.y - delta) / minScale;
        //     width = sourceRect.width / minScale;
        //     height = sourceRect.height / minScale;
        //     // sdebug('delta', delta);
        // }
        // sdebug('scrollViewForPhoto', _index, _photo);
        // sdebug('sourceRect', sourceRect);
        // sdebug('topRect', topRect);
        // sdebug('xScale', xScale);
        // sdebug('yScale', yScale);
        // sdebug('contentWidth', contentWidth);
        // sdebug('contentHeight', contentHeight);
        // sdebug('left', left);
        // sdebug('top', top);
        // sdebug('width', width);
        // sdebug('height', height);

        return {
            type: 'Ti.UI.View',
            properties: {
                attribution: app.utilities.photoAttribution(_photo),
                attributionLogo: _photo.attribution && _photo.attribution.logo
            },
            childTemplates: [{
                // type: 'Ti.UI.ScrollView',
                // bindId: 'scrollView',
                // properties: {
                //     contentWidth: contentWidth,
                //     contentHeight: contentHeight,
                //     // backgroundColor: 'yellow',
                //     zoomScale: minScale,
                //     maxZoomScale: maxScale,
                //     minZoomScale: minScale,
                //     // alwaysCenterContent: true,
                //     showHorizontalScrollIndicator: false,
                //     showVerticalScrollIndicator: false,
                //     // bubbleParent:true
                // },
                // childTemplates: [{
                type: 'Akylas.ZoomableImageView',
                bindId: 'imageView',
                properties: Object.assign({
                    // backgroundColor: 'red',
                    // width:'FILL',
                    // height:'FILL',
                    maxZoomScale: __APPLE__?2.0:(2*app.deviceinfo.densityFactor),
                    // minZoomScale: minScale,
                    rclass: 'ImageWindowImageView',
                    // scaleType: scaleType,
                    image: app.getImagePath(_photo.image),
                    // touchEnabled: false
                }, (_current && __APPLE__) ? {
                    left: sourceRect.x,
                    top: sourceRect.y + (__APPLE__ ? $.navBarTop : 0),
                    width: sourceRect.width,
                    height: sourceRect.height
                } : undefined),

                // }],
                events: {
                    scale: function(e) {
                        if (!!e.userInteraction) {
                            setCanPan(false);
                        } else {
                            // sdebug('scale', e.zoomScale, e.source.minZoomScale);
                            // var canSpan = e.zoomScale < (e.source.minZoomScale + 0.02);
                            setCanPan(e.zoomScale < (e.source.minZoomScale + 0.02));
                        }

                    },
                    singletap: function(e) {
                        sdebug('singletap', e);
                        if (optionsVisible) {
                            optionsVisible = false;
                            self.hideBottomToolbar();
                            self.hideTopToolbar();
                        } else {
                            optionsVisible = true;
                            self.showBottomToolbar();
                            self.showTopToolbar();
                        }
                    },
                    //     postlayout: function(e) {
                    //         var newRect = app.ui.topWindow.rect;
                    //         if (!_.isEqual(topRect, newRect)) {
                    //             topRect = newRect;

                    //             // sdebug('newRect', newRect, canPan);
                    //             var width = _photo.width,
                    //                 height = _photo.height,
                    //                 yScale = topRect.height / height,
                    //                 xScale = topRect.width / width,
                    //                 minScale = Math.min(Math.min(xScale, yScale), 1),
                    //                 maxScale = 1,
                    //                 delta = (topRect.height - (minScale * height)) / 2;

                    //             e.source.applyProperties({
                    //                 zoomScale: canPan ? minScale : undefined,
                    //                 maxZoomScale: maxScale,
                    //                 minZoomScale: minScale
                    //             });
                    //         }
                    //     }
                    // }
                    // }, {
                    //     type: 'Ti.UI.Label',
                    //     properties: {
                    //         color: $.white,
                    //         width: 'FILL',
                    //         height: 52,
                    //         bottom: 0,
                    //         padding: {
                    //             left: 10
                    //         },
                    //         font: {
                    //             size: 14
                    //         },
                    //         verticalAlign: 'top',
                    //         backgroundColor: '#000000aa',
                    //         visible: !!_photo.attribution,
                    //         html: app.utilities.photoAttribution(_photo)
                    //     }
                    // }, {
                    //     type: 'Ti.UI.ImageView',
                    //     properties: {
                    //         width: 'SIZE',
                    //         height: 20,
                    //         top: 10,
                    //         left: 10,
                    //         image: _photo.attribution ? (_photo.attribution.logo) : undefined
                }
            }]
        };

    }

    var currentView;

    function getCurrentView() {
        var view = scrollableView.getView(scrollableView.currentPage).imageView;
        if (!currentView) {
            currentView = view;
        }
        return view;
    }

    var scrollableView = new ScrollableView({
        properties: {
            // delaysContentTouches: true,
            panDirection: 'vertical',
            directionalLockEnabled: true,
            verticalBounce: false,
            // canPan: true,
            // delaysContentTouches: true,
            currentPage: _photoIndex,
            views: _.reduce(_photos, function(memo, value, index) {
                memo.push(scrollViewForPhoto(index, value, index === _photoIndex));
                return memo;
            }, [])
        },
        events: {
            panend: function(e) {
                scrollableView.scrollingEnabled = true;
                if (!!canPan) {
                    // sdebug('panend', Math.abs(e.velocity.y), Math.abs(e.translation.y));
                    if (Math.abs(e.velocity.y) > 300 && Math.abs(e.translation.y) > 40) {
                        e.source.animate({
                            transform: ((e.velocity.y > 0) ? 'ot0,100%' :
                                'ot0,-100%'),
                            duration: 200
                                // }, function() {
                        });
                        self.underContainer.animate({
                            opacity: 0,
                            duration: 100
                        });
                        self.closeMe();
                    } else {
                        e.source.animate({
                            transform: null,
                            duration: 100
                        });
                        self.underContainer.animate({
                            opacity: 1,
                            duration: 100
                        });
                    }
                }
            },
            // doubletap: function(e) {
            //     var scrollView = currentView.scrollView;
            //     var current = scrollView.zoomScale;
            //     var max = scrollView.maxZoomScale;
            //     var min = scrollView.minZoomScale;
            //     // sdebug('doubletap', current, min, max);
            //     scrollView.setZoomScale((current > (min + 0.02)) ? min : ((max + min) / 2), {
            //         point: [e.x, e.y],
            //         animated: true
            //     });
            // },
            scrollstart: function(e) {
                setCanPan(false);
            },
            change: function(e) {
                var attribution = e.view.attribution;
                bottomToolbar.label.animate({
                    // label: {
                    opacity: !!attribution ? 1 : 0,
                    html: attribution,
                    duration: 200
                        // }
                });
                // bottomToolbar.applyProperties({
                //     label:{
                //         html: e.view.attribution
                //     }
                // });
                topToolbar.applyProperties({
                    logo: {
                        image: e.view.attributionLogo || null
                    }
                });
            },
            scrollend: function(e) {
                sdebug('scrollend', canPan);
                var view = getCurrentView();
                if (!view) {
                    return;
                }
                if (view !== currentView) {
                    sdebug('view changed');
                    currentView.zoomScale = 0;
                    currentView = view;
                }
                // if (e.bindId === 'scrollableView') {
                setCanPan(view.zoomScale < (view.minZoomScale + 0.02));
                // }
            }

        }
    });

    var topToolbar = _args.topToolbar = new View({
        properties: {
            layout: 'horizontal',
            height: $.navBarHeight,
            bottom: 0
        },
        childTemplates: [{
            type: 'Ti.UI.ImageView',
            bindId: 'logo',
            properties: {
                width: 'SIZE',
                height: 20,
                top: 10,
                left: 10,
                onlyTransitionIfRemote: false,
                transition: {
                    style: Ti.UI.TransitionStyle.FADE,
                    duration: 200
                }
                // image: _photo.attribution ? (_photo.attribution.logo) : undefined
            }
        }, {
            type: 'Ti.UI.View',
        }, {
            type: 'Ti.UI.Button',
            properties: {
                rclass: 'NBBackButton',
                title: $.sClose
            },
            events: {
                'click': app.debounce(function() {
                    self.closeMe();
                })
            }
        }]
    });
    var bottomToolbar = _args.bottomToolbar = new ScrollView({
        properties: {
            width: 'FILL',
            height: 'SIZE',
            maxHeight: 100,
            layout: 'vertical',
            backgroundColor: '#000000aa',
            contentHeight: 'SIZE'
        },
        childTemplates: [{
            type: 'Ti.UI.Label',
            bindId: 'label',
            properties: {
                top: 0,
                padding: {
                    left: 10,
                    right: 10,
                    bottom: 5,
                    top: 5
                },
                color: $.white,
                height: 'SIZE',
                width: 'FILL',
                font: {
                    size: 14
                },
                verticalAlign: 'top',
                transition: {
                    style: Ti.UI.TransitionStyle.FADE,
                    duration: 200
                }
            },
            events: {
                click: app.debounce(function(e) {
                    if (e.link) {
                        app.ui.createAndOpenWindow(
                            'WebWindow', {
                                floating: true,
                                showBackButton: true,
                                url: e.link
                            });
                    }
                })
            }
        }]
    });
    _args.bottomToolbarVisible = _args.topToolbarVisible = optionsVisible;
    var self = new AppWindow(Object.assign(_args, {
        // blurredBackground: true,
        backgroundColor:'transparent',
        underContainerView:{
            type: 'Ti.UI.View',
            bindId: 'underContainer',
            properties:{
                backgroundColor:'black'
            }
        },
        centerContainerView: scrollableView
    }));

    var scrollPanDict = {
        variables: {
            tx: 'translation.y',
            canPan: true,
        },
        expressions: {
            offset: '_tx',
        },
        condition: '_canPan',
        targets: [{
            properties: {
                transform: 'ot0,_offset',
            }
        }, {
            target: self.underContainer,
            properties: {
                opacity: '1-abs(_offset*2.0/' + topRect.height + ')',
            }
        }, {
            target: scrollableView,
            properties: {
                scrollingEnabled: '0',
            }
        }]
    };

    var canPan = false;
    var setCanPanTimer;

    function setCanPan(_value) {
        if (canPan === _value) {
            return;
        }
        if (setCanPanTimer) {
            clearTimeout(setCanPanTimer);
            setCanPanTimer = null;
        }
        if (_value) {
            setCanPanTimer = setTimeout(function() {
                canPan = _value;
                sdebug('setCanPan', canPan);
                scrollPanDict.variables.canPan = canPan;
                scrollableView.on('pan', scrollPanDict);
            }, 200);
            return;
        }

        canPan = _value;

        scrollableView.off('pan', scrollPanDict);
        sdebug('setCanPan', canPan);
        // scrollableView.canPan = _value;
        if (!_value) {
            if (currentView) {
                currentView.animate({
                    transform: null,
                    duration: 100
                });
            }

            self.underContainer.animate({
                opacity: 1,
                duration: 100
            });
        }

        // if (_value) {
        //     _source.on('pan', onPan).on('panend', onPanEnd);
        // } else {
        //     _source.off('pan', onPan).off('panend', onPanEnd);
        // }
    }
    setCanPan(true);

    // self.toDoAfterOpening = function() {
    // self.opacity = 0;
    // if (__APPLE__) {
    self.once('open', function() {
        sdebug('open');
        // _.delay(function() {
        // self.animate({
        //     opacity: 1,
        //     duration: 300
        // });
        // _.delay(function() {
        //     // currentView.opacity = 0.5;
        if (__APPLE__) {
            getCurrentView().animate({
                left: null,
                top: null,
                width: 'FILL',
                height: 'FILL',
                // fullscreen:true,
                // delay:100,
                duration: 300
            });
        }

        // }, 100, 'later');
        // }, 200, 'later');
    });
    // }

    // };

    // self.toDoAfterOpening = function() {

    // };

    // self.on('orientationchange', function(e) {
    //     sdebug(e);
    // });

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        topToolbar = null;
        bottomToolbar = null;
        scrollableView = null;
        currentView = null;
        self = null;
    });
    return self;
};