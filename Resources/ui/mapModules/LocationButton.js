exports.create = function (_context, _args, _additional) {
    var mapChildren = _additional.mapChildren,
        settings = _args.settings,
        animatingInterval = null,
        intervalIndex = 0,
        hasCompass = Ti.Geolocation.hasCompass,
        // timeoutTimer = null,
        photoBtVisible = false,
        button = new Label({
            properties: {
                rclass: 'FloatingAction',
                color: $.white,
                selectedColor: $.gray,
                bottom: 0,
                zIndex: 101,
                transition: {
                    style: Ti.UI.TransitionStyle.FADE
                }
            }
        }),
        view = new View({
            bottom: 56,
            right: 8,
            width: 'SIZE',
            height: 'SIZE',
            clipChildren: false,
            bubbleParent: false,
            childTemplates: [{
                bindId: 'photoBtn',
                type: 'Ti.UI.Label',
                properties: {
                    backgroundColor: '#00000066',
                    font: {
                        family: $.iconicfontfamily,
                        size: 22
                    },
                    callbackId: 'take_photo',
                    textAlign: 'center',
                    color: $.white,
                    selectedColor: $.gray,
                    verticalAlign: 'top',
                    padding: {
                        top: 15
                    },
                    bottom: 0,
                    height: 48,
                    width: 48,
                    borderRadius: 24,
                    text: app.icons.camera
                }
            }, button],
            events: {
                singletap: function (e) {
                    if (e.source !== button) {
                        self.runAction(e.source.callbackId);
                        return true;
                    }
                    var enabled = settings.enabledGPS;

                    var current = self.mapView.userTrackingMode;
                    sdebug('location singletap', enabled, current, searching, app.locationManager.isLocationServicesEnabled());
                    if (current === 1) {
                        self.parent.updateUserLocation();
                    } else {
                        self.mapView.applyProperties({
                            userTrackingMode: 1
                        });
                    }
                    if (!enabled) {
                        if (!app.locationManager.isLocationServicesEnabled()) {
                            handleGPSDisabled();
                        } else {
                            // startLoading();
                            if (searching) {
                                //already searching. Thus we must be waiting for better accuracy
                                //let's stop it
                                stopLoading();
                                app.locationManager.cancelGetCurrentPosition();
                            } else {
                                app.locationManager.getCurrentPosition(true);
                            }
                        }

                    }
                    return true;
                },
                doubletap: function (e) {
                    if (!hasCompass || e.source !== button || !settings.currentLocation) {
                        return false;
                    }
                    sdebug('location doubletap');
                    var enabled = settings.enabledGPS;
                    // if (!enabled) {
                    //     return true;
                    // }
                    if (!settings.updateBearing) {
                        app.locationManager.startUpdateHeading();
                    } else {
                        app.locationManager.stopUpdateHeading();
                    }
                    return true;

                },
                longpress: function (e) {
                    sdebug('location longpress test', e.source);
                    if (e.source !== button) {
                        return false;
                    }
                    sdebug('location longpress', settings.enabledGPS, app.locationManager.isLocationServicesEnabled());
                    if (!settings.enabledGPS && !app.locationManager.isLocationServicesEnabled()) {
                        handleGPSDisabled();
                    } else {
                        sdebug('longpress button', settings.enabledGPS);
                        app.emit('enabled_gps', {
                            enabled: !settings.enabledGPS
                        });
                    }
                    return true;
                },
            }
        }),
        searching = false,
        self = new _context.MapModule(_args);

    function updateButton() {
        var enabled = settings.enabledGPS && app.locationManager.isLocationServicesEnabled();
        // sdebug('updateButton', settings.enabledGPS, app.locationManager.isLocationServicesEnabled(), enabled);
        var args = {
            backgroundColor: enabled ? $.cTheme.main : app.colors.red.color
        };
        if (!searching) {
            args.text = !!settings.currentLocation ? (settings.updateBearing ? $.sCompass : $.sGps) :
                $.sGpsOff;
        }

        button.applyProperties(args);
    }

    function onInterval() {
        if (searching) {
            button.text = (intervalIndex % 2 === 0) ? $.sGps : $.sGps2;
            intervalIndex++;
        }

    }

    function startLoading() {

        if (!searching && !settings.updateBearing) {
            sdebug('startLoading');
            searching = true;
            // if (timeoutTimer !== null) {
            //     clearTimeout(timeoutTimer);
            //     timeoutTimer = null;
            // }
            // timeoutTimer = setTimeout(stopLoading, 10000);
            animatingInterval = setInterval(onInterval, 500);
            onInterval();
        }
    }

    function stopLoading() {
        sdebug('stopLoading');
        // if (searching) {
        searching = false;
        // }
        if (animatingInterval) {
            clearInterval(animatingInterval);
            animatingInterval = null;
        }
        updateButton();
    }

    function onLocation() {
        delete self.onLocation;
        if (!photoBtVisible) {
            photoBtVisible = true;
            view.photoBtn.animate({
                height: 96
            });
        }
        // stopLoading();
    }

    function onLocManagerState(e) {
        sdebug('onLocManagerState', e);
        if (e.monitor === 'location') {
            if (!!e.state) {
                startLoading();
            } else {
                stopLoading();
            }
        } else { // heading
            settings.updateBearing = e.state;
            if (settings.updateBearing) {
                self.mapView.userTrackingMode = 1;
                self.parent.updateUserLocation();
            } else {
                self.mapView.bearing = 0;
            }
            updateButton();
        }
    }

    function handleGPSDisabled() {
        var GPSenabled = Ti.Geolocation.locationServicesEnabled;
        if (__APPLE__) {
            var authorization = Ti.Geolocation.locationServicesAuthorization;
            if (!GPSenabled) {
                app.emit('error', {
                    message: trc('location_service_disabled')
                });
            } else {
                var canOpenSettings = app.deviceinfo.SDKVersion >= 8;
                if (!canOpenSettings) {
                    app.showAlert({
                        textAlign: 'left',
                        message: trc('location_service_disabled_desc'),
                        title: trc('location_service_disabled')
                    });
                } else {
                    app.confirmAction({
                        textAlign: 'left',
                        buttonNames: [trc('no_thanks'), trc('settings')],
                        message: trc('location_service_disabled_desc'),
                        title: trc('location_service_disabled')
                    }, function () {
                        Ti.Platform.openURL(Ti.App.iOS.applicationOpenSettingsURL);
                    });
                }
            }

        } else {
            var hasPermission = Ti.Geolocation.hasLocationPermissions();
            if (!hasPermission) {
                Ti.Geolocation.requestLocationPermissions();
            } else {
                if (!GPSenabled) {
                    app.emit('error', {
                        message: trc('location_service_disabled')
                    });
                }
            }
        }
    }

    Object.assign(self, {
        onInit: function () {
            app.locationManager.on('state', onLocManagerState);

        },
        GC: app.composeFunc(self.GC, function () {
            app.locationManager.off('state', onLocManagerState);
            view = null;
            button = null;
        }),
        onMapReset: function (_params) {
            _params = _params || {};
            if (!!_params.bottom) {
                view.animate({
                    opacity: 1,
                    duration: 200
                });
            }
        },
        hideModule: function (_params) {
            _params = _params || {};
            if (!!_params.bottom) {
                view.animate({
                    opacity: 0,
                    duration: 200
                });
            }

        },
        onLocation: onLocation,
        onGPSEnabled: function (_enabled) {
            sdebug('onGPSEnabled', _enabled);
            if (_enabled) {
                app.showTutorials(['follow_heading']);
                self.mapView.userTrackingMode = 1;
                updateButton();
            } else {
                if (settings.updateBearing) {
                    app.locationManager.stopUpdateHeading();
                }
                stopLoading();
            }
        },
        onGeolocStatusChange: function (_enabled) {
            if (!_enabled) {
                if (settings.updateBearing) {
                    app.locationManager.stopUpdateHeading();
                }
                stopLoading();
            }
        },
        onWindowOpen: function (_enabled) {
            sdebug('onWindowOpen', _enabled);
            updateButton();
            app.showTutorials(['locationbutton']);
            if (_enabled) {
                startLoading();
            }
        },
        onSetUserFollow: updateButton
    });

    mapChildren.push(view);
    return self;
};