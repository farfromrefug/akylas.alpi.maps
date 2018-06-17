import { MapModule } from './MapModule'
export class LocationButton extends MapModule {
    settings
    view: View & {
        photoBtn:View
    }
    button: Label
    constructor(_context, _args, _additional) {
        super(_args);
        this.settings = _args.settings
        this.button = new Label({
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
        });
        this.view = new View({
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
            }, this.button],
            events: {
                singletap: e => {
                    if (e.source !== this.button) {
                        //for photo button
                        this.runAction(e.source.callbackId);
                        return true;
                    }
                    var enabled = this.settings.enabledGPS;

                    var current = this.mapView.userTrackingMode;
                    var isLocationServicesEnabled = app.locationManager.isLocationServicesEnabled();
                    console.debug('location singletap', enabled, current, this.searching, isLocationServicesEnabled);
                    if (current === 1) {
                        this.parent.updateUserLocation();
                    } else {
                        this.mapView.applyProperties({
                            userTrackingMode: 1
                        });
                    }
                    if (!enabled) {
                        if (!isLocationServicesEnabled) {
                            this.handleGPSDisabled();
                        } else {
                            // startLoading();
                            if (this.searching) {
                                //already searching. Thus we must be waiting for better accuracy
                                //let's stop it
                                this.stopLoading();
                                app.locationManager.cancelGetCurrentPosition();
                            } else {
                                app.locationManager.getCurrentPosition(true);
                            }
                        }

                    }
                    return true;
                },
                doubletap: e => {
                    if (!this.hasCompass || e.source !== this.button || !this.settings.currentLocation) {
                        return false;
                    }
                    console.debug('location doubletap');
                    var enabled = this.settings.enabledGPS;
                    // if (!enabled) {
                    //     return true;
                    // }
                    if (!this.settings.updateBearing) {
                        app.locationManager.startUpdateHeading();
                    } else {
                        app.locationManager.stopUpdateHeading();
                    }
                    return true;

                },
                longpress: e => {
                    console.debug('location longpress test', e.source);
                    if (e.source !== this.button) {
                        return false;
                    }
                    console.debug('location longpress', this.settings.enabledGPS, app.locationManager.isLocationServicesEnabled());
                    if (!this.settings.enabledGPS && !app.locationManager.isLocationServicesEnabled()) {
                        this.handleGPSDisabled();
                    } else {
                        console.debug('longpress button', this.settings.enabledGPS);
                        app.emit('enabled_gps', {
                            enabled: !this.settings.enabledGPS
                        });
                    }
                    return true;
                },
            }
        }) as View & {
            photoBtn:View
        };
        _additional.mapChildren.push(this.view);

    }
    animatingInterval = null
    intervalIndex = 0
    hasCompass = Ti.Geolocation.hasCompass
    // timeoutTimer = null,
    photoBtVisible = false

    searching = false

    updateButton = () => {
        var enabled = this.settings.enabledGPS && app.locationManager.isLocationServicesEnabled();
        // console.debug('updateButton', settings.enabledGPS, app.locationManager.isLocationServicesEnabled(), enabled);
        var args: TiDict = {
            backgroundColor: enabled ? $.cTheme.main : app.colors.red.color
        };
        if (!this.searching) {
            args.text = !!this.settings.currentLocation ? (this.settings.updateBearing ? $.sCompass : $.sGps) :
                $.sGpsOff;
        }
        this.button.applyProperties(args);
    }

    onInterval = () => {
        if (this.searching) {
            this.button.text = (this.intervalIndex % 2 === 0) ? $.sGps : $.sGps2;
            this.intervalIndex++;
        }
    }

    startLoading = () => {
        if (!this.searching && !this.settings.updateBearing) {
            console.debug('startLoading');
            this.searching = true;
            this.animatingInterval = setInterval(this.onInterval, 500);
            this.onInterval();
        }
    }

    stopLoading = () => {
        console.debug('stopLoading');
        // if (searching) {
        this.searching = false;
        // }
        if (this.animatingInterval) {
            clearInterval(this.animatingInterval);
            this.animatingInterval = null;
        }
        this.updateButton();
    }

    onLocation = () => {
        delete this.onLocation;
        if (!this.photoBtVisible) {
            this.photoBtVisible = true;
            this.view.photoBtn.animate({
                height: 96
            });
        }
        // stopLoading();
    }

    onLocManagerState = (e) => {
        console.debug('onLocManagerState', e);
        if (e.monitor === 'location') {
            if (!!e.state) {
                this.startLoading();
            } else {
                this.stopLoading();
            }
        } else { // heading
            this.settings.updateBearing = e.state;
            if (this.settings.updateBearing) {
                this.mapView.applyProperties({
                    userTrackingMode: 1
                });
                this.parent.updateUserLocation();
            } else {
                this.mapView.bearing = 0;
            }
            this.updateButton();
        }
    }

    handleGPSDisabled = () => {
        var hasPermission = Ti.Geolocation.hasLocationPermissions();
        if (!hasPermission) {
            Ti.Geolocation.requestLocationPermissions(e => {
                this.handleGPSDisabled();
            });
            return;
        }
        var GPSenabled = Ti.Geolocation.locationServicesEnabled;
        console.log('handleGPSDisabled', GPSenabled);
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
            // Ti.Geolocation.Android.checkLocationSettings(null, e => {
            //     console.log('checkLocationSettings', e);
            //     if (e.code === 0) {
            //         if (this.searching) {
            //             //already searching. Thus we must be waiting for better accuracy
            //             //let's stop it
            //             this.stopLoading();
            //             app.locationManager.cancelGetCurrentPosition();
            //         } else {
            //             app.locationManager.getCurrentPosition(true);
            //         }
            //     }
            // });
            var isGpsProviderEnabled = Ti.Geolocation.Android.isProviderEnabled('gps');
            var isNetworkProviderEnabled = Ti.Geolocation.Android.isProviderEnabled('network');

            if(!isGpsProviderEnabled && !isNetworkProviderEnabled) {
                app.confirmAction({
                    'title': trc('location_permission'),
                    'message': trc('location_permission_desc')
                }, function() {
                    var intent = Ti.Android.createIntent({
                        action: 'android.settings.LOCATION_SOURCE_SETTINGS',
                    });
                    try {
                        Ti.Android.currentActivity.startActivity(intent);
                    } catch (e) {
                        Ti.API.debug(e);
                    }
                });
            }

        }
    }
    onInit() {
        app.locationManager.on('state', this.onLocManagerState);
    }
    GC() {
        super.GC();
        app.locationManager.off('state', this.onLocManagerState);
        this.view = null;
        this.button = null;
    }
    onMapReset(_params) {
        _params = _params || {};
        if (!!_params.bottom) {
            this.view.animate({
                opacity: 1,
                duration: 200
            });
        }
    }
    hideModule(_params) {
        _params = _params || {};
        if (!!_params.bottom) {
            this.view.animate({
                opacity: 0,
                duration: 200
            });
        }

    }
    onGPSEnabled(_enabled) {
        console.debug('onGPSEnabled', _enabled);
        if (_enabled) {
            app.showTutorials(['follow_heading']);
            this.mapView.applyProperties({
                userTrackingMode: 1
            });
            this.updateButton();
        } else {
            if (this.settings.updateBearing) {
                app.locationManager.stopUpdateHeading();
            }
            this.stopLoading();
        }
    }
    onGeolocStatusChange(_enabled) {
        if (!_enabled) {
            if (this.settings.updateBearing) {
                app.locationManager.stopUpdateHeading();
            }
            this.stopLoading();
        }
    }
    onWindowOpen(_enabled) {
        // console.debug('onWindowOpen', _enabled);
        this.updateButton();
        app.showTutorials(['locationbutton']);
        if (_enabled) {
            this.startLoading();
        }
    }
    onSetUserFollow = () => this.updateButton()
}
export function create(_context, _args, _additional) {
    return new LocationButton(_context, _args, _additional);
};
