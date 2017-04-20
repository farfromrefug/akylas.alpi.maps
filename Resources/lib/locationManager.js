function create(_context, _args) {

    var self = new TiEventEmitter(_args),
        __started,
        __headingStarted,
        __watchers,
        __currentPosition,
        __currentHeading,
        __locationServiceEnabled = false,
        __faker,
        __watchersId,
        __needsOneTimestamp = null,
        __gpsLevel = Ti.App.Properties.getInt('gps.level', 1),
        __gpsLevels = [{
            distanceFilter: 3000,
            needeAccuracy: 1000,
            accuracy: Ti.Geolocation.ACCURACY_THREE_KILOMETERS
        }, {
            distanceFilter: 1000,
            needeAccuracy: 100,
            accuracy: Ti.Geolocation.ACCURACY_KILOMETER
        }, {
            distanceFilter: 100,
            needeAccuracy: 40,
            accuracy: Ti.Geolocation.ACCURACY_HUNDRED_METERS
        }, {
            distanceFilter: 10,
            needeAccuracy: 20,
            accuracy: Ti.Geolocation.ACCURACY_BEST
        }, {
            distanceFilter: 1,
            needeAccuracy: 10,
            accuracy: Ti.Geolocation.ACCURACY_BEST
        }],
        __unitM = Ti.App.Properties.getBool('unit_m', true),
        onSuccess = function (e) {
            _.each(__watchers, function (value, key) {
                if (value.successCallback) {
                    value.successCallback(e);
                }
            });
        },
        onError = function (e) {
            _.each(__watchers, function (value, key) {
                if (value.errorCallback) {
                    value.errorCallback(e);
                }
            });
        };
    Object.assign(self, {
        init: function () {
            if (__APPLE__) {
                Ti.Geolocation.showCalibration = true;
                Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS);
            } else if (__ANDROID__) {
                try {
                    Ti.Geolocation.Android.manualMode = true;
                    Ti.Geolocation.Android.preferredProvider = 'gps';
                    Ti.Geolocation.requestLocationPermissions();
                    Ti.Geolocation.Android.addLocationProvider([
                        'passive',
                        'gps',
                        'network'
                    ]);
                } catch (e) {}

            }
        },
        reset: function () {
            __started = false;
            __headingStarted = false;
            __watchers = {};
            __currentPosition = null;
            __watchersId = 0;
            __currentHeading = -1;
            __lastHeadingTimestamp = -1;
            __locationServiceEnabled = Ti.Geolocation.locationServicesEnabled;
        },
        onLocation: function (e) {
            console.log('onLocation', e);
            if (!e || !e.coords || e.success === false || e.error) {
                __currentPosition = null;
                if (e) {
                    onError(e.error || "no location found");
                }
                return;
            }
            __currentPosition = e;
            if (__headingStarted && __currentHeading !== -1) {
                __currentPosition.coords.heading = __currentHeading;
                // } else {
                // __currentPosition.coords.heading = 30;
            }
            // __currentPosition.coords.altitude = 1854;
            sdebug('locationManager', 'onLocation', __needsOneTimestamp, self.getAccuracy(),
                __currentPosition.coords);
            onSuccess(__currentPosition);

            if (__needsOneTimestamp && __needsOneTimestamp < __currentPosition.coords.timestamp && __currentPosition.coords.accuracy <=
                self.getAccuracy()) {
                __needsOneTimestamp = null;
                self.stop();
            }
        },
        onHeading: function (e) {
            if (e.success === false || e.error || __currentPosition === null || e.timestamp <
                __lastHeadingTimestamp) {
                return;
            }
            if (e.heading.magneticHeading !== -1) {
                // sdebug('onHeading', e.heading.magneticHeading);
                __currentHeading = e.heading.magneticHeading;
                __lastHeadingTimestamp = e.timestamp;
                __currentPosition.coords.heading = __currentHeading;
                onSuccess(__currentPosition);
            }

        },
        watchPosition: function (successCallback, errorCallback, options) {
            var id = __watchersId + '';
            __watchersId++;
            __watchers[id] = {
                successCallback: successCallback,
                errorCallback: errorCallback
            };
            // self.start();
            if (__currentPosition !== null) {
                onSuccess(__currentPosition);
            }
            return id;
        },
        clearWatch: function (_id) {
            console.log('clearWatch', _id);
            delete __watchers[_id];
            if (Object.keys(__watchers).length === 0) {
                self.stop();
            }
        },
        getCurrentPosition: function (_forceUpdate) {
            console.log('getCurrentPosition', _forceUpdate, __currentPosition, __started);
            if (__currentPosition && _forceUpdate !== true) {
                onSuccess(__currentPosition);
            } else if (!__started) {
                console.log('not started');
                if (!__currentPosition) {
                    console.log('get lastGeolocation');
                    self.onLocation(Ti.Geolocation.lastGeolocation);
                }
                __needsOneTimestamp = moment().valueOf();
                self.start(false);
            } else {
                console.log('already started');
                Ti.Geolocation.getCurrentPosition(self.onLocation);
            }
        },
        cancelGetCurrentPosition: function () {
            if (__started && __needsOneTimestamp) {
                __needsOneTimestamp = null;
                self.stop();
            }
        },
        getLastPosition: function () {
            return __currentPosition;
        },
        startUpdateHeading: function () {
            // if (__APPLE__) {
            if (!__headingStarted) {
                __headingStarted = true;
                Ti.Geolocation.headingFilter = Ti.App.Properties.getInt('location.headingFilter', 3);
                Ti.Geolocation.on('heading', self.onHeading);
            }

            // }
        },
        stopUpdateHeading: function () {
            // if (__APPLE__) {
            if (__headingStarted) {
                __headingStarted = false;
                Ti.Geolocation.off('heading', self.onHeading);
            }
            // }
        },
        stop: function () {
            if (!__started) {
                return;
            }
            __started = false;
            sdebug('locationManager', 'stop');
            Ti.Geolocation.off('location', self.onLocation);
        },
        start: function (__realStart) {
            if (__started) {
                return;
            }
            sdebug('locationManager', 'start');
            __started = true;
            self.setLevel(__gpsLevel);
            if (__realStart !== false) {
                __needsOneTimestamp = null;
            }

            // self.onLocation(Ti.Geolocation.lastGeolocation);
            Ti.Geolocation.on('location', self.onLocation);
            Ti.Geolocation.getCurrentPosition(self.onLocation);
        },
        setLevel: function (__level) {
            var data = __gpsLevels[__level];
            sdebug('LocationManager', 'setLevel', __level, __gpsLevel, data);
            if (data) {
                if (__level !== __gpsLevel) {
                    __gpsLevel = __level;
                    Ti.App.Properties.setInt('gps.level', __gpsLevel);
                }
                Ti.Geolocation.accuracy = data.accuracy;
                if (__APPLE__) {
                    Ti.Geolocation.distanceFilter = data.distanceFilter;
                } else if (__ANDROID__) {
                    Ti.Geolocation.Android.setLocationRules([{
                        minDistance: data.distanceFilter,
                        maxAge: 300000
                    }]);
                }

            }

        },
        getLevel: function () {
            return __gpsLevel;
        },
        getLevels: function () {
            return __gpsLevels;
        },
        getAccuracy: function () {
            return __gpsLevels[__gpsLevel].needeAccuracy;
        },
        isLocationServicesEnabled: function () {
            return __locationServiceEnabled;
        }
    });

    Ti.Geolocation.on('change', function (e) {
        sdebug('Geolocation change', e.enabled, __locationServiceEnabled);
        if (__locationServiceEnabled !== e.enabled) {
            __locationServiceEnabled = e.enabled;
            self.emit('location_service_state', e);
        }
        if (e.enabled) {
            if (__APPLE__) {
                if (e.authorizationStatus === 0) {
                    Ti.Geolocation.requestLocationPermissions(Ti.Geolocation.AUTHORIZATION_ALWAYS);
                }
            } else {
                if (e.hasPermission === 0) {
                    Ti.Geolocation.requestLocationPermissions();
                }
            }
        }
    });
    Ti.Geolocation.on('state', function (e) {
        self.emit('state', e);
    });
    self.reset();

    return self;
}

exports.create = function (context, _args) {
    return create(context, _args);
};