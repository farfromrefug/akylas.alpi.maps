import { EventEmitter } from 'events'

export interface Heading {
    magneticHeading: number
    trueHeading?: number
    accuracy: number
    timestamp?: number
    // x: number
    // y: number
    // z: number
}
export interface Acceleration {
    x: number
    y: number
    z: number
}

export interface HeadingEvent extends TiEvent {
    heading: Heading
    success: boolean
    error?: Error
}

export interface Location {
    latitude: number
    longitude: number
    accuracy?: number
    timestamp?: number
    altitudeAccuracy?: number
    altitude?: number
    heading?: number
    speed?: number
    floor?: number
}

export interface LocationEvent extends TiEvent {
    olderCoords?: Location[]
    coords?: Location
    heading?: Heading
    success: boolean
    error?: Error
}

export interface AccelerometerEvent extends TiEvent {
    user: Acceleration
    gravity: Acceleration
    timestamp?: number
}

export interface GyroscopeEvent extends TiEvent {
    yaw:number
    pitch:number
    roll:number
    timestamp?: number
}
export interface MotionEvent extends TiEvent {
    gyroscope:  number[]
    timestamp?: number
}

export interface Watcher {
    successCallback?: (e: LocationEvent) => void
    errorCallback?: (e: LocationEvent) => void
}

export class LocationManager extends EventEmitter {
    __started = false
    __headingStarted = false
    __watchers: { [k: string]: Watcher }
    __currentPosition?: LocationEvent
    __currentHeading?: Heading
    __locationServiceEnabled = false
    __lastHeadingTimestamp: number
    __faker
    __watchersId = 0
    __needsOneTimestamp = null
    __gpsLevel = Ti.App.Properties.getInt('gps.level', 1)
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
    }]
    __unitM = Ti.App.Properties.getBool('unit_m', true)
    constructor(_args?) {
        super();
        Ti.Geolocation.on('change', (e) => {
            sdebug('Geolocation change', e.enabled, this.__locationServiceEnabled);
            if (this.__locationServiceEnabled !== e.enabled) {
                this.__locationServiceEnabled = e.enabled;
                this.emit('location_service_state', e);
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
        Ti.Geolocation.on('state',  (e) => {
            this.emit('state', e);
        });
        this.reset();
    }
    onSuccess = (e) => {
        for (let key in this.__watchers) {
            let value = this.__watchers[key];
            if (value.successCallback) {
                value.successCallback(e);
            }
        }
    }
    onError = (e) => {
        for (let key in this.__watchers) {
            let value = this.__watchers[key];
            if (value.errorCallback) {
                value.errorCallback(e);
            }
        };
    }
    init() {
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
            } catch (e) { }

        }
    }
    reset() {
        this.__started = false;
        this.__headingStarted = false;
        this.__watchers = {};
        this.__currentPosition = null;
        this.__watchersId = 0;
        this.__currentHeading = null;
        this.__lastHeadingTimestamp = -1;
        this.__locationServiceEnabled = Ti.Geolocation.locationServicesEnabled;
    }
    onLocation = (e: LocationEvent) => {
        // console.log('onLocation', e);
        if (!e || !e.coords || e.success === false || e.error) {
            this.__currentPosition = null;
            if (e) {
                this.onError(e.error || "no location found");
            }
            return;
        }
        this.__currentPosition = e;
        if (this.__headingStarted && this.__currentHeading) {
            this.__currentPosition.coords.heading = this.__currentHeading.magneticHeading;
            this.__currentPosition.heading = this.__currentHeading;
            // } else {
            // __currentPosition.coords.heading = 30;
        }
        // __currentPosition.coords.altitude = 1854;
        // sdebug('locationManager', 'onLocation', this.__needsOneTimestamp, this.getAccuracy(),
            // this.__currentPosition.coords);
        this.onSuccess(this.__currentPosition);

        if (this.__needsOneTimestamp && this.__needsOneTimestamp < this.__currentPosition.coords.timestamp && this.__currentPosition.coords.accuracy <=
            this.getAccuracy()) {
            this.__needsOneTimestamp = null;
            this.stop();
        }
    }
    onHeading = (e: HeadingEvent) => {
        if (e.success === false || e.error || this.__currentPosition === null || e.timestamp <
            this.__lastHeadingTimestamp) {
            return;
        }
        sdebug('onHeading', e.heading);
        // if (e.heading.magneticHeading !== -1) {
            this.__currentHeading = e.heading;
            this.__lastHeadingTimestamp = e.timestamp;
            this.__currentPosition.coords.heading = e.heading.magneticHeading;
            this.__currentPosition.heading = this.__currentHeading;
            this.onSuccess(this.__currentPosition);
        // }

    }
    watchPosition = (successCallback, errorCallback?, options?) => {
        var id = this.__watchersId + '';
        this.__watchersId++;
        this.__watchers[id] = {
            successCallback: successCallback,
            errorCallback: errorCallback
        };
        // self.start();
        if (this.__currentPosition !== null) {
            this.onSuccess(this.__currentPosition);
        }
        return id;
    }
    clearWatch = (_id) => {
        console.log('clearWatch', _id);
        delete this.__watchers[_id];
        if (Object.keys(this.__watchers).length === 0) {
            self.stop();
        }
    }
    getCurrentPosition = (_forceUpdate) => {
        console.log('getCurrentPosition', _forceUpdate, this.__currentPosition, this.__started);
        if (this.__currentPosition && _forceUpdate !== true) {
            this.onSuccess(this.__currentPosition);
        } else if (!this.__started) {
            console.log('not started');
            if (!this.__currentPosition) {
                console.log('get lastGeolocation');
                this.onLocation(Ti.Geolocation.lastGeolocation);
            }
            this.__needsOneTimestamp = moment().valueOf();
            this.start(false);
        } else {
            console.log('already started');
            Ti.Geolocation.getCurrentPosition(this.onLocation);
        }
    }
    cancelGetCurrentPosition = () => {
        if (this.__started && this.__needsOneTimestamp) {
            this.__needsOneTimestamp = null;
            this.stop();
        }
    }
    getLastPosition() {
        return this.__currentPosition;
    }
    startUpdateHeading(filter = 3) {
        // if (__APPLE__) {
        if (!this.__headingStarted) {
            this.__headingStarted = true;
            Ti.Geolocation.headingFilter = Ti.App.Properties.getInt('location.headingFilter', filter);
            Ti.Geolocation.on('heading', this.onHeading);
        }

        // }
    }
    stopUpdateHeading() {
        // if (__APPLE__) {
        if (this.__headingStarted) {
            this.__headingStarted = false;
            Ti.Geolocation.off('heading', this.onHeading);
        }
        // }
    }
    stop() {
        if (!this.__started) {
            return;
        }
        this.__started = false;
        sdebug('locationManager', 'stop');
        Ti.Geolocation.off('location', this.onLocation);
    }
    isStarted() {
        return this.__started;
    }    
    start(__realStart?) {
        if (this.__started) {
            return;
        }
        sdebug('locationManager', 'start');
        this.__started = true;
        this.setLevel(this.__gpsLevel);
        if (__realStart !== false) {
            this.__needsOneTimestamp = null;
        }

        // self.onLocation(Ti.Geolocation.lastGeolocation);
        Ti.Geolocation.on('location', this.onLocation);
        Ti.Geolocation.getCurrentPosition(this.onLocation);
    }
    setLevel(level) {
        if (level !== this.__gpsLevel) {
            this.__gpsLevel = level;
            Ti.App.Properties.setInt('gps.level', this.__gpsLevel);
        }
        var data = this.__gpsLevels[level];
        this.setLevelData(data);
    }
    setLevelData(data:{accuracy:number, distanceFilter:number, needeAccuracy?:number}) {
        if (data) {
            
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

    }
    getLevel() {
        return this.__gpsLevel;
    }
    getLevels() {
        return this.__gpsLevels;
    }
    getAccuracy() {
        return this.__gpsLevels[this.__gpsLevel].needeAccuracy;
    }
    isLocationServicesEnabled() {
        return this.__locationServiceEnabled;
    }
}