
declare global {
    class FullscreenImageWindowContainer extends Container {

    }
    class FullscreenImageWindow extends AppWindow {
        container: FullscreenImageWindowContainer
    }

    interface FullscreenImageWindowParams extends WindowParams {
        photos: Photo[]
        photoIndex: number
        fromView: ImageView
    }

    interface Photo {
        image: string
        attribution?: {
            logo?: string,
            author?: string,
            description?: string,
            link?: string
            author_link?: string
        }
    }
}

function photoAttribution(_photo: Photo) {
    var attribution;
    if (!!_photo.attribution) {
        attribution = '';
        var attr = _photo.attribution;
        if (attr.author) {
            attribution += attr.author;
            if (attr.author_link) {
                attribution = '<a href="' + attr.author_link + '">' + attribution + '</a>';
            }
        }
        if (attr.description) {
            attribution += '<br>' + attr.description;

        }
        if (attr.link) {
            attribution += '<br>' + '<a href="' + attr.link + '">' + attr.link + '</a>';

        }
    }
    return attribution;
}

export function create(_args?: FullscreenImageWindowParams) {
    var _photos = _.remove(_args, 'photos'),
        _photoIndex = _.remove(_args, 'photoIndex', 0),
        sourceRect,
        topRect = app.ui.topWindow.rect,
        scaleType: string | number = Ti.UI.SCALE_TYPE_ASPECT_FILL,
        optionsVisible = false,
        _fromView = _.remove(_args, 'fromView');

    if (_fromView) {
        scaleType = _fromView.scaleType;
        sourceRect = _fromView.absoluteRect;
    }
    console.debug('_photos', _photos);

    function scrollViewForPhoto(_index: number, _photo: Photo, _current) {
        console.log('scrollViewForPhoto', _photo.image);
        return new View({
            type: 'Ti.UI.View',
            properties: {
                attribution: photoAttribution(_photo),
                attributionLogo: _photo.attribution && _photo.attribution.logo
            },
            childTemplates: [{
                type: 'Akylas.ZoomableImageView',
                bindId: 'imageView',
                properties: _.assign({
                    maxZoomScale: __APPLE__ ? 2.0 : (2 * app.deviceinfo.densityFactor),
                    rclass: 'ImageWindowImageView',
                    image: app.getImagePath(_photo.image),
                }, (sourceRect && _current && __APPLE__) ? {
                    left: sourceRect.x,
                    top: sourceRect.y + (__APPLE__ ? $.navBarTop : 0),
                    width: sourceRect.width,
                    height: sourceRect.height
                } : undefined),
                events: {
                    scale: function (e) {
                        if (!!e.userInteraction) {
                            setCanPan(false);
                        } else {
                            setCanPan(e.zoomScale < (e.source.minZoomScale + 0.02));
                        }

                    },
                    singletap: function (e) {
                        console.debug('singletap', e);
                        if (optionsVisible) {
                            optionsVisible = false;
                            self.hideBottomToolbar();
                            self.hideTopToolbar();
                        } else {
                            optionsVisible = true;
                            self.showBottomToolbar();
                            self.showTopToolbar();
                        }
                    }
                }
            }]
        });

    }

    var currentView;

    function getCurrentView() {
        var view = scrollableView.getView(scrollableView.currentPage).imageView;
        console.log('getCurrentView', scrollableView.currentPage, scrollableView.views.length, view);
        if (!currentView) {
            currentView = view;
        }
        return view;
    }

    var scrollableView = new ScrollableView({
        properties: {
            panDirection: 'vertical',
            directionalLockEnabled: true,
            verticalBounce: false,
            currentPage: _photoIndex,
            views: _.reduce(_photos, function (memo, value, index) {
                memo.push(scrollViewForPhoto(index, value, index === _photoIndex));
                return memo;
            }, [])
        },
        events: {
            panend: function (e) {
                scrollableView.scrollingEnabled = true;
                if (!!canPan) {
                    // console.debug('panend', Math.abs(e.velocity.y), Math.abs(e.translation.y));
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
            //     // console.debug('doubletap', current, min, max);
            //     scrollView.setZoomScale((current > (min + 0.02)) ? min : ((max + min) / 2), {
            //         point: [e.x, e.y],
            //         animated: true
            //     });
            // },
            scrollstart: function (e) {
                setCanPan(false);
            },
            change: function (e) {
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
            scrollend: function (e) {
                console.debug('scrollend', canPan);
                var view = getCurrentView();
                if (view !== currentView) {
                    console.debug('view changed');
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
            type: 'Ti.UI.Button',
            properties: {
                rclass: 'NBBackButton',
                title: $.sClose
            },
            events: {
                'click': function () {
                    console.log('on close clicked');
                    self.closeMe();
                }
            }
        }, {
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
                title: '\ue25a'
            },
            events: {
                'click': function () {
                    console.log('on share clicked');
                    app.share({
                        image: getCurrentView().image
                    });
                }
            }
        }]
    });

    var argsBottomToolbar = _args.bottomToolbar;

    var scrollViewArgs: any = {
        properties: {
            width: 'FILL',
            height: 'SIZE',
            maxHeight: 100,
            layout: 'vertical',
            backgroundColor: '#aa000000',
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
                click: app.debounce(function (e) {
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
    }
    if (argsBottomToolbar) {
        scrollViewArgs.childTemplates.push({
            rclass: 'BottomToolbar',
            childTemplates: argsBottomToolbar
        });
    }
    var bottomToolbar = _args.bottomToolbar = new ScrollView(scrollViewArgs) as ScrollView & {
        label: Label
    };
    _args.bottomToolbarVisible = _args.topToolbarVisible = optionsVisible;
    var self: FullscreenImageWindow = new AppWindow(_.assign(_args, {
        backgroundColor: 'transparent',
        underContainerView: {
            type: 'Ti.UI.View',
            bindId: 'underContainer',
            properties: {
                backgroundColor: 'black'
            }
        },
        centerContainerView: scrollableView
    })) as FullscreenImageWindow;

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
            setCanPanTimer = setTimeout(function () {
                canPan = _value;
                console.debug('setCanPan', canPan);
                scrollPanDict.variables.canPan = canPan;
                scrollableView.on('pan', scrollPanDict);
            }, 200);
            return;
        }

        canPan = _value;

        scrollableView.off('pan', scrollPanDict);
        console.debug('setCanPan', canPan);
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
    }
    setCanPan(true);

    self.once('open', function () {

        if (__APPLE__) {
            console.log('animating current View', getCurrentView());
            getCurrentView().animate({
                left: null,
                top: null,
                width: 'FILL',
                height: 'FILL',
                duration: 300
            });
        }
    });
    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        topToolbar = null;
        bottomToolbar = null;
        scrollableView = null;
        currentView = null;
        self = null;
    });
    return self;
};