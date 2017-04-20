exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        visible = false,
        itemHandler = app.itemHandler,
        suncalc = app.utils.suncalc,
        geolib = itemHandler.geolib,
        formatter = geolib.formatter,
        initialized = false,
        self = new _context.MapModule(_args),
        animationDuration = 150,
        compassView = new ImageView({
            opacity: 0,
            rclass: 'PCompassImageView'
        }),
        scaleViewRealWidth = -1,
        scaleView = new View({
            height: 40,
            width: '1cm',
            bottom: 5,
            left: $.nbButtonWidth + 10,
            childTemplates: [{
                bindId: 'scale',
                type: 'Ti.UI.View',
                properties: {
                    height: 10,
                    top:11,
                    left: 0,
                    borderColor: $.black,
                    borderPadding: [-2, 0, 0, 0],
                    borderWidth: 2,
                }

            }, {
                bindId: 'label',
                type: 'Ti.UI.Label',
                properties: {
                    top:0,
                    height: '50%',
                    verticalAlign:'bottom',
                    left: 3,
                    width: 'FILL',
                    textAlign: 'left',
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    shadowColor: '#fff',
                    shadowOffset: [0, 0],
                    shadowRadius: 1.5,
                    color: $.black
                }

            }, {
                bindId: 'scale2',
                type: 'Ti.UI.View',
                properties: {
                    height: 10,
                    bottom:11,
                    left: 0,
                    borderColor: $.black,
                    borderPadding: [0, 0, -2, 0],
                    borderWidth: 2,
                }

            }, {
                bindId: 'label2',
                type: 'Ti.UI.Label',
                properties: {
                    bottom:0,
                    height: '50%',
                    verticalAlign:'top',
                    left: 3,
                    width: 'FILL',
                    textAlign: 'left',
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    shadowColor: '#fff',
                    shadowOffset: [0, 0],
                    shadowRadius: 1.5,
                    color: $.black
                }

            }]
        }),
        currentLLFormat = 1,
        view,
        createItemGeoInfoLabel = function(_id, _icon, _right) {
            return {
                type: 'Ti.UI.Label',
                bindId: _id,
                properties: {
                    rclass: 'PositionInfoInfoLabel',
                    visible: false
                },
                childTemplates: [{
                    // bindId: _id + 'icon',
                    type: 'Ti.UI.Label',
                    properties: {
                        rclass: 'PositionInfoInfoIcon',
                        touchEnabled: false,
                        text: _icon,
                        left: !_right ? 0 : undefined,
                        right: !!_right ? 0 : undefined
                    }
                }]
            };
        },
        getView = function() {
            if (!view) {
                view = new View({
                    properties: {
                        rclass: 'PositionInfo',
                        opacity: 0,
                        bubbleParent: false

                    },
                    childTemplates: [{
                            type: 'Ti.UI.View',
                            properties: {
                                layout: 'horizontal',
                                height: 'SIZE',
                            },
                            childTemplates: [
                                createItemGeoInfoLabel('sunrise', String.fromCharCode(0xf112)),
                                createItemGeoInfoLabel('noon', String.fromCharCode(0xf113)),
                                createItemGeoInfoLabel('sunset', String.fromCharCode(0xf110))
                            ]
                        },
                        createItemGeoInfoLabel('latlon', $.sPlace), {
                            type: 'Ti.UI.View',
                            properties: {
                                layout: 'horizontal',
                                height: 'SIZE',
                            },
                            childTemplates: [
                                createItemGeoInfoLabel('altitude', $.sElevation),
                                createItemGeoInfoLabel('heading', $.sCompass),
                                createItemGeoInfoLabel('speed', $.sSpeed),
                            ]
                        }
                    ],
                    events: {
                        singletap: app.debounce(function() {
                            currentLLFormat = (currentLLFormat + 1) % 3;
                            updateFromLocation(settings.currentLocation);
                        }),
                        longpress: function() {
                            var options = ['copy_position'];
                            if (settings.currentLocation.hasOwnProperty('altitude')) {
                                options.push('copy_altitude');
                            }
                            options.push('share');
                            if (__APPLE__) {
                                options.push('open_maps');
                                if (Ti.Platform.canOpenURL('comgooglemaps://')) {
                                    options.push('open_google_maps');
                                }
                            }

                            new OptionDialog({
                                options: _.map(options, function(value,
                                    index) {
                                    return trc(value);
                                }),
                                buttonNames: [trc('cancel')],
                                cancel: 0,
                                tapOutDismiss: true
                            }).on('click', (function(e) {
                                if (!e.cancel) {
                                    var option = options[e.index];
                                    switch (option) {
                                        case 'copy':
                                        case 'copy_position':
                                            if (option === 'copy_altitude') {
                                                data = formatter.latLngString(settings.currentLocation,
                                                    currentLLFormat);
                                            }
                                            Ti.UI.Clipboard.setText(data);
                                            app.showMessage(trc('sent_to_clipboard'));
                                            break;
                                        case 'copy_altitude':
                                            if (option === 'copy_altitude') {
                                                data = formatter.altitude(settings.currentLocation
                                                    .altitude);
                                            }
                                            Ti.UI.Clipboard.setText(data);
                                            app.showMessage(trc('sent_to_clipboard'));
                                            break;
                                        case 'share':
                                            var data = formatter.latLngString(settings.currentLocation,
                                                    0) + '\n' +
                                                ' shared using Alpi Maps';
                                            app.share({
                                                text: data,
                                                image: self.mapView.toImage()
                                            });
                                            break;
                                    }
                                }
                            }).bind(this)).show();
                        }
                    }
                });
                self.parent.childrenHolder.add(view, 0);
            }
            return view;
        };

    function hide() {
        sdebug('PositionInfo', 'show', visible);
        if (visible) {
            visible = false;
            delete self.onLocation;
            view.animate({
                opacity: 0,
                duration: animationDuration
            });
            compassView.animate({
                opacity: 0,
                duration: animationDuration
            });
        }
    }

    function show() {
        sdebug('PositionInfo', 'show', visible);
        if (!visible) {
            visible = true;
            self.onLocation = updateFromLocation;
            getView();
            update();
            view.animate({
                opacity: 1,
                duration: animationDuration
            });
            if (currentHeading !== -1)
                compassView.animate({
                    opacity: 1,
                    duration: animationDuration
                });
            app.showTutorials(['position_share']);
        }
    }

    var currentHeading = 0;
    var currentMpp;
    function updateScaleView(e, _force) {
        var newMpp = Math.round(e.mpp*100)/100;
        if (_force !== true && newMpp === currentMpp) {
            return;
        }
        if (scaleViewRealWidth == -1) {
            scaleViewRealWidth = scaleView.rect.width;
        }
        currentMpp = newMpp;
        // var data = geolib.getMapScale(currentMpp, scaleViewRealWidth);
        // sdebug('updateScaleView', self.mapView.zoom, newMpp, scaleViewRealWidth, data);
        var metersPerCM = geolib.pxPerCM * currentMpp;
        scaleView.applyProperties({
            // scale: {
            //     width: data.width,
            // },
            label: {
                text: geolib.formatter.distance(metersPerCM)
            },
            // scale2: {
            //     width: data.scaleWidth,
            // },
            label2: {
                text: '1:' + app.utils.filesize(metersPerCM * 100, {
                    // exponent: -2,
                    base:10,
                    round: 0
                }).slice(0,-1)
            }
        }, true);
    }

    function updateFromLocation(_location) {
        if (_location === null || !view) {
            return;
        }
        var data = formatter.latLng(_location, currentLLFormat);
        var sundata = suncalc.getTimes(new Date(), _location.latitude, _location.longitude);
        var params = {
            latlon: {
                visible: true,
                text: data.latitude + ' ' + data.longitude
            },
            altitude: {
                visible: !!data.elevation,
                text: data.elevation || ''
            },
            sunrise: {
                visible: true,
                text: moment(sundata.sunrise).format('LT')
            },
            speed: {
                visible: false
            },
            heading: {
                visible: false
            },
            noon: {
                visible: true,
                text: moment(sundata.solarNoon).format('LT')
            },
            sunset: {
                visible: true,
                text: moment(sundata.sunset).format('LT')
            }
        };
        if (_location.hasOwnProperty('speed')) {
            params.speed = {
                visible: true,
                text: formatter.speed(_location.speed)
            };
        }
        if (_location.hasOwnProperty('heading')) {
            var value = _location.heading;
            var distance = Math.abs(value - currentHeading);
            var reverseDistance = 360.0 - distance;
            var shortest = Math.min(distance, reverseDistance);
            var goal = value;
            if (distance < reverseDistance) {
                goal = value;
            } else if (value < 0) {
                goal = value + 360.0;
            } else {
                goal = value - 360.0;
            }
            currentHeading = _.mod(goal, 360);
            var data = geolib.getCompassInfo(currentHeading);
            // view.applyProperties({
            //     headingLabel: {
            //         text: currentHeading.toFixed() + '° ' + data.exact,
            //     }
            // });
            params.heading = {
                visible: true,
                text: currentHeading.toFixed() + '° ' + data.exact
            };
            compassView.animate({
                opacity: 1,
                transform: 'or-' + currentHeading,
                cancelRunningAnimations: true,
                duration: 100
            });
        } else {
            compassView.animate({
                opacity: 0,
                transform: null,
                cancelRunningAnimations: true,
                duration: 100
            });
            currentHeading = -1;
        }

        view.applyProperties(params);
        // setHeading(_location.heading);
        if (!initialized) {
            initialized = true;
            view.animate({
                opacity: 1,
                duration: animationDuration
            });

        }
    }

    function update() {
        if (settings.currentLocation) {
            updateFromLocation(settings.currentLocation);
        }
    }

    function updateAll() {
        update();
        updateScaleView({
            mpp:self.parent.mpp
        }, true);
    }

    Object.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            compassView = null;
            view = null;
            app.off('distance_metric_changed', updateAll);
            Ti.App.off('significanttimechange', update);
        }),
        onInit: function() {
            app.on('distance_metric_changed', updateAll);
            Ti.App.on('significanttimechange', update);
            // self.parent.setMapPadding('positioninfo', {
            //     top: 32,
            //     bottom:32
            // }, 0);
        },
        hideModule: function(_params) {
            _params = _params || {};
            if (!!_params.top) {
                if (visible) {
                    view.animate({
                        opacity: 0,
                        duration: 200
                    })
                }
            }
        },
        onMapReset: function(_params) {
            _params = _params || {};
            if (!!_params.top) {
                if (visible) {
                    view.animate({
                        opacity: 1,
                        duration: 200
                    })
                }
            }
        },
        onModuleAction: function(_params) {
            if (_params.id === 'positioninfo' && !!settings.currentLocation) {
                if (!visible) {
                    show();
                } else {
                    hide();
                }
            } else {
                return false;
            }
            return true;
        },
        onMapRegionChanged: updateScaleView
    });
    _additional.mapPaddedChildren.push(compassView);
    _additional.mapPaddedChildren.push(scaleView);
    return self;
};