
import { MapModule, ContentModule } from './mapModules/MapModule'
declare global {

    class MapWindow extends AppWindow {
        childrenHolder: View
        mapTopToolbar: View
        // mpp: number
        getMpp(): number
        setMapFakePadding(name: string, args: TiDict)
        setRegion(_region: MapRegion, _deltaFactor: number, _animated: boolean, _deltaScreen?)
        updateCamera(_params, _deltaScreen?)
        setHighlightPoint(_value)
        getAroundData()
        updateMapItem(_mapItem, _item, _changes)
        setMapFakePadding(_key: string, _padding, _duration?: number)
        removeMapFakePadding(_key: string, _duration?: number)
        ignoreFakePadding(_key: string, _duration?: number)
        unignoreFakePadding(_key: string, _duration?: number)
        getMapFakePadding(_key: string)
        setMapPadding(_key: string, _padding, _duration?: number)
        removeMapPadding(_key: string, _duration?: number)
        getMapPadding(_key: string)
        getMapCurrentPadding()
        removeAnnotations(ids)
        updateUserLocation(_force?: boolean)
        mapViewSnapshot()
        runMethodOnModules(...args)
        runGetMethodOnModules(...args)
        runGetSingleMethodOnModules(...args)
        runReduceMethodOnModules(...args)
        getModule(id: string): MapModule
        getContentModules(): { [key: string]: MapModule }
        showDebugText(_text: string)
    }


    type MapCoordinates = { latitude: number, longitude: number }
    type MapRegion = { sw: MapCoordinates | number[], ne: MapCoordinates | number[] }
    type Region = { sw: MapCoordinates, ne: MapCoordinates }
    type ObjectPadding = { left?: number, right?: number, top?: number, bottom?: number }
    type Padding = ObjectPadding | number[] | number


    interface MapTileSourceKeys {
        layer: Provider
        minZoom?: number
        maxZoom?: number
        opacity?: number
        zIndex?: number
        autoHd?: boolean
        cacheable?: boolean
        visible?: boolean
        source?: string
        url: string
        id: string
    }

    class MapTileSource extends Ti.Proxy implements MapTileSourceKeys {
        layer: Provider
        minZoom?: number
        maxZoom?: number
        opacity?: number
        zIndex?: number
        autoHd?: boolean
        cacheable?: boolean
        visible?: boolean
        source?: string
        url: string
        id: string
    }


    interface TiLocation {
        latitude?: number
        longitude?: number
        altitude?: number
        heading?: number
    }
    class MapAnnotation extends Titanium.Proxy {
        image?: string
        minZoom?: number
        maxZoom?: number
        visible?: boolean
        latitude: number
        longitude: number
        altitude?: number
        item?: Item
    }
    class MapCluster extends MapAnnotation {
        annotations: MapAnnotation[]
        getAnnotation(index: number): MapAnnotation
        addAnnotation(annotations: MapAnnotation | MapAnnotation[])
        removeAnnotation(annotations: MapAnnotation | MapAnnotation[])
        removeAllAnnotations()
    }
    class MapRoute extends MapAnnotation {
        points: TiLocation[]
    }

    interface MapUpdateCamParams {
        region?: Region,
        centerCoordinate?: MapCoordinates,
        focusOffset?: [number, number],
        zoom?: number,
        animated?: boolean
    }
    class MapView extends View {
        defaultCalloutTemplate: string
        region: MapRegion
        bearing: number
        padding: Padding
        centerCoordinate: MapCoordinates
        clusters: MapCluster[]
        routes: MapRoute[]
        annotations: MapAnnotation[]
        selectedAnnotation: MapAnnotation
        mapType: number
        calloutUseTemplates: boolean
        userTrackingMode: number
        zoom: number
        addAnnotation(annotations: MapAnnotation | MapAnnotation[])
        selectAnnotation(annotation: MapAnnotation)
        removeAnnotation(annotations: MapAnnotation | MapAnnotation[])
        addTileSource(sources: MapTileSource | MapTileSource[])
        removeTileSource(sources: MapTileSource | MapTileSource[])
        addCluster(clusters: MapCluster | MapCluster[])
        removeCluster(clusters: MapCluster | MapCluster[])
        addRoute(routes: MapRoute | MapRoute[])
        removeRoute(routes: MapRoute | MapRoute[])
        zoomIn(point: MapCoordinates | titanium.Point)
        coordinateForPoints(points: Array<titanium.Point | number[]>): MapCoordinates[]
        removeAllAnnotations()
        updateCamera(params: MapUpdateCamParams)
    }

    interface MapRegionChangedEvent extends TiEvent {
        region: MapRegion
        zoom: number
        mpp: number
        idle: boolean
    }
}

export function create(_args) {
    function getAllModules() {
        return _.values(modules).concat(_.values(contentModules));
    }

    function runMethodOnModules(...args) {
        var method: string, mods: MapModule[];
        var result = false;
        if (_.isBoolean(args[0])) {
            mods = (!!args[0]) ? _.values(contentModules) : _.values(modules);
            args.splice(0, 1);
        } else {
            mods = getAllModules();
        }
        method = args[0];
        args.splice(0, 1);
        _.forEachRight(mods, function (module: MapModule) {
            const func: Function = module[method];
            if (func) {
                // sdebug(module.id, method, _.keys(args[0]));
                if (func.apply(module, args)) {
                    result = true;
                    return false;
                }
            }
        });
        return result;
    }

    function runGetSingleMethodOnModules(...args) {
        var method: string, mods: MapModule[];
        var result;
        if (_.isBoolean(args[0])) {
            mods = (!!args[0]) ? _.values(contentModules) : _.values(modules);
            args.splice(0, 1);
        } else {
            mods = getAllModules();
        }
        method = args[0];
        args.splice(0, 1);
        _.forEachRight(mods, function (module: MapModule) {
            const func: Function = module[method];
            if (func) {
                var localResult = func.apply(module, args);
                if (localResult) {
                    result = localResult;
                    return false;
                }
            }
        });
        return result;
    }

    function runGetMethodOnModules(...args) {
        var method: string, mods: MapModule[];
        if (_.isBoolean(args[0])) {
            mods = (!!args[0]) ? _.values(contentModules) : _.values(modules);
            args.splice(0, 1);
        } else {
            mods = getAllModules();
        }
        method = args[0];
        args.splice(0, 1);
        return _.reduceRight(mods, function (memo, module: MapModule) {
            const func: Function = module[method];
            if (func) {
                var result = func.apply(module, args);
                if (result) {
                    memo.push(result);
                }
            }
            return memo;
        }, []);
    }

    function runReduceMethodOnModules(...args) {
        var method: string, mods: MapModule[];
        if (_.isBoolean(args[0])) {
            mods = (!!args[0]) ? _.values(contentModules) : _.values(modules);
            args.splice(0, 1);
        } else {
            mods = getAllModules();
        }
        method = args[0];
        args.splice(0, 1);
        return _.reduceRight(mods, function (memo, module: MapModule) {
            const func: Function = module[method];
            if (func) {
                func.apply(module, [memo].concat(args));
            }
            return memo;
        }, {});
    }

    function mergeAdd(a, b) {
        return (a || 0) + (b || 0);
    }

    function mergeRemove(a, b) {
        return (a || 0) - (b || 0);
    }

    function mergeRemoveMax(a, b) {
        return Math.max((a || 0) - (b || 0), 0);
    }

    function updatePadding(_duration) {
        var mapPadding = _.reduce(mapPaddings, function (memo, padding) {
            _.merge(memo, padding, mergeAdd);
            return memo;
        }, {});
        if (!_.isEqual(mapPadding, currentMapPadding)) {
            currentMapPadding = mapPadding;
            mapView.padding = mapPadding;
        }
        // sdebug('mapPadding', mapPadding);

        // mapView.padding = currentPadding;
        // sdebug('fakePaddings', fakePaddings);
        currentPadding = _.merge(_.reduce(_.omit(fakePaddings, ignoredPaddings), function (memo, padding) {

            _.merge(memo, padding, mergeAdd);
            return memo;
        }, {}), mapPadding, mergeRemove);
        // sdebug('currentPadding', currentPadding);
        // mapView.childrenHolder.animate(Object.assign({
        //     duration: _duration
        // }, currentPadding));

        // runMethodOnModules('onMapPadding', currentPadding, _duration);
    }

    function getModule(value) {
        return modules[value] || contentModules[value];
    }

    function getContentModulesKeys() {
        return _.keys(contentModules);
    }

    function getContentModules() {
        return contentModules;
    }

    function loadModule(_id, _index, _isContent) {
        // console.debug('loadModule', _id, _index, _isContent);
        var enabledKey = 'module_' + _id + '_enabled';
        var moduleJS = require((_isContent ? '/contentModules' : '/ui/mapModules') + '/' + _id);
        if (!moduleJS) {
            return;
        }
        var module = moduleJS.create(this, {
            index: _index,
            id: _id,
            settings: settings
        }, moduleParams);

        if (!Ti.App.Properties.hasProperty(enabledKey)) {
            if (!module.shouldBeEnabledByDefault || module.shouldBeEnabledByDefault()) {
                sdebug('module should be enabled by default: ', _id);
                Ti.App.Properties.setBool(enabledKey, true);
            }
        }
        var enabled = Ti.App.Properties.getBool(enabledKey, false);
        // sdebug('module', _id, 'enabled', enabled);
        if (!enabled) {
            return;
        }

        var lang = moduleJS.lang && moduleJS.lang[ak.locale.currentLanguage];
        if (lang) {
            ak.locale.appendLanguage(this, lang);
        }

        if (enabled) {
            if (_isContent) {
                contentModules[_id] = module;
            } else {
                modules[_id] = module;
            }
        }
        return module;
    }

    var itemHandler = app.itemHandler,
        highlightingPoint = false,
        // currentAnnots = [],
        // maxAnnots = 250,
        moduleParams = {
            mapChildren: [],
            mapPaddedChildren: [],
            mapBottomToolbarChildren: [],
            underContainerChildren: [],
            mapTopToolbarChildren: [],
            mapArgs: {},
            clusters: {},
        },

        // children = [],
        mapPaddings = {},
        fakePaddings = {},
        ignoredPaddings = [],
        currentPadding = {},
        currentMapPadding = {},
        // window = _.remove(_args, 'window'),
        settings = {
            enabledGPS: app.locationManager.isLocationServicesEnabled() && Ti.App.Properties.getBool('enabled_gps',
                false),
            userFollow: true,
            updateBearing: false,
            currentLocation: null
        },
        firstFollow = true,
        contentModules: { [k: string]: ContentModule } = {},
        modules: { [k: string]: MapModule } = {},
        justUnselectedMarker = false,
        cancelClick = false,
        region = Ti.App.Properties.hasProperty('last_region') ?
            Ti.App.Properties.getObject('last_region') : undefined,
        currentRegion,
        currentMpp = 0,
        currentZoom = 0,
        currentTilt = 0,
        hideDebugTimer,
        debugView;

    console.time('mapModules');
    app.mapModules.forEach(function (value, index) {
        // sdebug('test mapModules', value, index);
        console.time('mapModule ' + value);
        loadModule(value, index, false);
        console.timeEnd('mapModule ' + value);
    });
    app.contentModules.forEach(function (value, index) {
        // sdebug('test contentModules', value, index);
        console.time('contentModule ' + value);
        loadModule(value, index, true);
        console.timeEnd('contentModule ' + value);
    });
    console.timeEnd('mapModules');
    
    var mapView = new MapView({
        properties: Object.assign(moduleParams.mapArgs, {
            rclass: 'AppMapView',
            region: region,
            clusters: _.values(moduleParams.clusters).reverse(),
            bubbleParent: false,
            defaultCalloutTemplate: 'default',
            calloutUseTemplates: true
        }),
        events: {
            regionchanged: function (e) {
                if (!e.idle && _.isEqual(e.region, currentRegion)) {
                    return;
                }
                currentRegion = e.region;
                currentMpp = e.mpp;
                currentZoom = e.zoom;
                currentTilt = e.tilt;
                // sdebug('regionchanged', e);
                if (!!e.idle) {
                    if (highlightingPoint) {
                        highlightingPoint = false;
                        runMethodOnModules('onHighlightingPoint');
                    }
                    Ti.App.Properties.setObject('last_region', e.region);
                }

                runMethodOnModules('onMapRegionChanged', e as MapRegionChangedEvent);
            },

            longpress: function (e) {
                sdebug('longpress map');
                if (e.hasOwnProperty('latitude')) {
                    runMethodOnModules('onMapLongPress', e);
                }
            },
            poi: function (e) {
                sdebug('poi click', e);
                runMethodOnModules('onPOIPress', e);
            },
            click: function (e) {
                // console.log('on click', e);
                if (cancelClick) {
                    sdebug('canceled click');
                    cancelClick = false;
                    return;
                }
                var shouldBeVisible = true;
                if (e.hasOwnProperty('route')) {
                    runMethodOnModules('onRoutePress', e);
                } else if (e.cluster) {
                    runMethodOnModules('onClusterPress', e);
                } else if (e.hasOwnProperty('annotation')) {
                    runMethodOnModules('onAnnotationPress', e);
                } else if (!e.hasOwnProperty('latitude')) {
                    runMethodOnModules('onMapHolderPress', e);
                } else {
                    sdebug('map click', e.latitude, e.longitude);
                    shouldBeVisible = runMethodOnModules('onMapPress', e) || justUnselectedMarker;

                }

            },
            selected: function (e) {
                var overlay = e.annotation || e.route;
                var item = overlay && overlay.item;
                var desc = overlay && overlay.type;
                console.debug('selected', item);
                runMethodOnModules('onMapMarkerSelected', e, item, desc);
            },
            usertracking: function (e) {
                sdebug('usertracking', e.mode);
                var newUserFollow = e.mode !== 0;
                if (newUserFollow !== settings.userFollow) {
                    settings.userFollow = newUserFollow;
                    runMethodOnModules('onSetUserFollow', newUserFollow);
                }
            },
            error: function (e) {
                console.log('mapView error', e.code, e.error, e.message);
                app.emit('error', {
                    message: e.error
                });
            }
        }
    });

    _args = Object.assign(_args || {}, {
        underContainerView: {
            bindId: 'underContainer',
            childTemplates: moduleParams.underContainerChildren
        },
        containerView: {
            type: 'Ti.UI.View',
            bindId: 'mapHolder',
            properties: {
                rclass: 'AppMapHolder'
            },
            childTemplates: [
                mapView, {
                    // type: 'Ti.UI.View',
                    // properties: {
                    //     rclass: 'AppMapViewChildrenHolder'
                    // },
                    // childTemplates: [{
                    type: 'Ti.UI.View',
                    properties: {
                        rclass: 'AppMapViewChildrenHolder',
                        // elevation: 1000,
                        layout: 'vertical'
                    },
                    childTemplates: [{
                        type: 'Ti.UI.View',
                        bindId: 'mapTopToolbar',
                        properties: {
                            height: 'SIZE',
                            rclass: 'AppMapViewChildrenHolder',
                            clipChildren: false,
                            bubbleParent: true,
                            // layout: 'vertical',
                            zIndex: 1,
                        },
                        childTemplates: moduleParams.mapTopToolbarChildren,
                        // events: {

                        // }
                    }, {
                        type: 'Ti.UI.View',
                        bindId: 'childrenHolder',
                        properties: {
                            rclass: 'AppMapViewChildrenHolder',
                            clipChildren: false,
                            height: 'FILL',
                            bubbleParent: true,
                        },
                        childTemplates: moduleParams.mapPaddedChildren,
                        events: {
                            postlayout: function (e) {
                                var parentRect = mapView.rect;
                                var rect = e.source.rect;
                                // sdebug('mapview postLayout', rect, parentRect);
                                // currentPadding = _.pick(e.source, 'top', 'left', 'bottom', 'right');
                                self.setMapFakePadding('toolbars', {
                                    left: rect.x,
                                    top: rect.y,
                                    right: parentRect.width - rect.x -
                                        rect
                                            .width,
                                    bottom: parentRect.height - rect.y -
                                        rect.height
                                    //  + (__APPLE__ ? 64 : 80),
                                });

                            }
                        }
                    }, {
                        type: 'Ti.UI.View',
                        bindId: 'mapBottomToolbar',
                        properties: {
                            rclass: 'AppMapViewChildrenHolder',
                            clipChildren: false,
                            bubbleParent: true,
                            height: 'SIZE',
                            zIndex: 1,
                            // layout: 'vertical',
                        },
                        childTemplates: moduleParams.mapBottomToolbarChildren,
                        // events: {

                        // }
                        // }]
                    }],
                    events: {
                        doubletap: function (e) {
                            sdebug('doubletap holder');
                            if (!e.hasOwnProperty('latitude')) {
                                runMethodOnModules('onMapHolderDoubleTap', e);
                                return;
                            }
                        },
                        click: function (e) {
                            console.log('click', e);
                            runMethodOnModules('onMapHolderPress', e);
                        },

                        longpress: function (e) {
                            sdebug('longpress holder');
                            cancelClick = true; //there will be a click event
                            if (!e.hasOwnProperty('latitude')) {
                                runMethodOnModules('onMapHolderLongPress', e);
                                return;
                            }
                        },
                    }
                }
            ].concat(moduleParams.mapChildren)
        },

        backgroundColor: $.cMenuBack
    });
    var self = new AppWindow(_args) as MapWindow;
    // cleanup memory
    moduleParams = null;

    Object.assign(self, {
        settings: settings,
        getMpp() {
            return currentMpp
        },
        getZoom() {
            return currentZoom
        },
        setRegion: function (_region, _deltaFactor, _animated, _deltaScreen) {
            var padding = _.clone(_deltaScreen || currentPadding);
            itemHandler.setMapRegion(mapView, _region, _deltaFactor, _animated, padding);
        },
        updateCamera: function (_params, _deltaScreen) {
            var padding = _.clone(_deltaScreen || currentPadding);
            // sdebug('updateCamera', _params, _deltaScreen, currentPadding);
            itemHandler.updateCamera(mapView, _params, padding, currentZoom);
        },
        setHighlightPoint: function (_value) {
            highlightingPoint = _value;
            setTimeout(function () {
                if (highlightingPoint) {
                    highlightingPoint = false;
                    runMethodOnModules('onHighlightingPoint');
                }
            }, 300);
        },
        getAroundData: function () {
            return {
                centerCoordinate: mapView.centerCoordinate,
                around: Math.max(currentMpp * app.deviceinfo.width, currentMpp * app.deviceinfo.height) / 2
            };
        },
        updateMapItem: function (_mapItem, _item, _changes) {
            var isRoute = itemHandler.isItemARoute(_item);
            var toApply = isRoute ?
                _.pick(_changes, 'latitude',
                    'longitude',
                    'altitude', 'showInfoWindow',
                    'color', 'selectedColor',
                    'customView') :
                _.pick(_changes, 'latitude',
                    'longitude',
                    'altitude', 'image', 'selectedImage', 'showInfoWindow',
                    'customView');
            //make sure the item change are applied before notifying the others!
            _mapItem.item = _item;

            _mapItem.applyProperties(toApply);

            if (_mapItem.selected) {
                _mapItem.showInfo();
            }
            _mapItem.emit('changed', {
                changes: _changes
            });
        },
        setMapFakePadding: function (_key, _padding, _duration) {
            // sdebug('setMapFakePadding', _key, _padding);
            fakePaddings[_key] = _padding;
            updatePadding(_duration);
        },
        removeMapFakePadding: function (_key, _duration) {
            // sdebug('removeMapFakePadding', _key);
            delete fakePaddings[_key];
            updatePadding(_duration);
        },
        ignoreFakePadding: function (_key, _duration) {
            if (!_.includes(ignoredPaddings, _key)) {
                ignoredPaddings.push(_key);
                // updatePadding(_duration);
            }
        },
        unignoreFakePadding: function (_key, _duration) {
            var index = ignoredPaddings.indexOf(_key);
            if (index >= 0) {
                ignoredPaddings.splice(index, 1);
            }
            // updatePadding(_duration);
        },
        getMapFakePadding: function (_key) {
            return fakePaddings[_key];
        },
        setMapPadding: function (_key, _padding, _duration) {
            // sdebug('setMapPadding', _key, _padding);
            mapPaddings[_key] = _padding;
            updatePadding(_duration);
        },
        removeMapPadding: function (_key, _duration) {
            // sdebug('removeMapPadding', _key);
            delete mapPaddings[_key];
            updatePadding(_duration);
        },

        getMapPadding: function (_key) {
            return mapPaddings[_key];
        },

        getMapCurrentPadding: function () {
            if (!arguments) {
                return currentPadding;
            }
            var args = Array.prototype.slice.call(arguments);
            var result = _.reduce(mapPaddings, function (memo, padding, key) {
                if (!_.includes(args, key)) {
                    _.merge(memo, padding, mergeAdd);
                }
                return memo;
            }, {});
            return _.reduce(fakePaddings, function (memo, padding, key) {
                if (!_.includes(args, key)) {
                    _.merge(memo, padding, mergeAdd);
                }
                return memo;
            }, result);
        },
        // removeAnnotations: function (ids: string[]) {
        //     var toRemove = _.filter(currentAnnots, function (annot) {
        //         return _.includes(ids, annot.id);
        //     });
        //     var length = toRemove.length;
        //     // sdebug('removeAnnotations', toRemove, length);
        //     if (length > 0) {
        //         mapView.removeAnnotation(toRemove);
        //         _.remove(currentAnnots, toRemove);
        //     }
        // },
        updateUserLocation: function (_force) {
            var location = settings.currentLocation;
            if (!location) {
                return;
            }
            firstFollow = false;
            // sdebug('updateUserLocation', location, _force, settings.userFollow, firstFollow, settings.updateBearing, location.heading);

            if (_force !== true && !settings.userFollow && !firstFollow && !(settings.updateBearing && location.heading !== undefined)) {
                return;
            }
            var params: TiProperties = {
                animated: true
            };
            if (settings.userFollow) {
                params.centerCoordinate = location;
                params.zoom = Math.max(mapView.zoom, 14);
            }
            if (settings.updateBearing && location.heading) {
                params.bearing = location.heading;
                // params.tilt = settings.userFollow ? 45 : 0;
            }
            this.updateCamera(params);
        },
        mapViewSnapshot: function () {
            return mapView.toImage();
        },
        runMethodOnModules: runMethodOnModules,
        runGetMethodOnModules: runGetMethodOnModules,
        runGetSingleMethodOnModules: runGetSingleMethodOnModules,
        runReduceMethodOnModules: runReduceMethodOnModules,
        getModule: getModule,
        getContentModules: getContentModules,
        showDebugText: function (_text) {
            if (hideDebugTimer) {
                clearTimeout(hideDebugTimer);
                hideDebugTimer = null;
            }
            if (!debugView) {
                debugView = new Label({
                    backgroundColor: '#000000dd',
                    padding: 6,
                    top: __ANDROID__ ? 60 : 10,
                    borderRadius: 6,
                    maxWidth: '90%',
                    font: {
                        size: 11
                    },
                    color: $.white,
                    opacity: 0,
                    text: _text
                });
                self.childrenHolder.add(debugView);
                debugView.animate({
                    opacity: 1,
                    duration: 100
                });
                hideDebugTimer = setTimeout(function () {
                    debugView.animate({
                        opacity: 0,
                        duration: 100
                    }, function () {
                        self.childrenHolder.remove(debugView);
                        debugView = null;
                    });
                }, 4000);
            } else {

                debugView.applyProperties({
                    text: _text
                });
                hideDebugTimer = setTimeout(function () {
                    if (debugView) {
                        debugView.animate({
                            opacity: 0,
                            duration: 100
                        }, function () {
                            self.childrenHolder.remove(debugView);
                            debugView = null;
                        });
                    }

                }, 4000);
            }

        }
    });
    self.setMapPadding('default', mapView.padding);

    // window.on('androidback', function(e) {
    //     sdebug('onBack');
    //     if (!runMethodOnModules('onWindowBack', e)) {
    //         window.closeMe();
    //     }
    // });
    // ak.ti.markTime('onInit');
    getAllModules().forEach(function (module) {
        // sdebug('test on init ', module.id);
        var key = 'onInit' + module.id;
        // ak.ti.markTime(key);
        Object.assign(module, {
            window: self,
            mapView: mapView,
            parent: self
        });
        if (module.onInit) {
            module.onInit();
        }
        // ak.ti.logTime(key);
    });
    // ak.ti.logTime('onInit');

    function onGeolocStatusChange(e) {
        var enabled = e.enabled;
        if (!enabled && settings.enabledGPS) {
            app.showMessage(trc('gps_was_disabled'));
        }
        runMethodOnModules('onGeolocStatusChange', enabled);
    }

    function onLocation(e) {
        settings.currentLocation = e.location;
        sdebug('appmapview onLocation', settings.currentLocation);
        firstFollow = false;
        runMethodOnModules('onLocation', settings.currentLocation);
        // }
    }

    //SPOTLIGHT
    if (__APPLE__) {
        Ti.App.iOS.on('continueactivity', function (e) {
            // console.log(e);
            if (e.searchableItemActivityIdentifier) {
                var item: {
                    id: string
                    item: any
                    desc: any
                } = runGetSingleMethodOnModules('getItem', {
                    id: e.searchableItemActivityIdentifier
                });
                // sdebug('found item', item);
                if (item) {
                    // self.parent.runGetMethodOnModules('onStartExclusiveAction', 'direction');
                    itemHandler.handleItemAction('details', item.item, item.desc, null, self,
                        self);
                }
            }
        });
    }
    //

    function startLocationUpdate() {
        console.log('startLocationUpdate');
        app.locationManager.start();
    }

    function stopLocationUpdate() {
        console.log('stopLocationUpdate');
        app.locationManager.stop();
    }

    function onPause() {
        console.log('onPause', settings.enabledGPS, mapView.userTrackingMode);
        mapView.userTrackingMode = 0;
        stopLocationUpdate();
        runMethodOnModules('onPause');
    };

    function onResume() {
        console.log('onResume', settings.enabledGPS);
        if (settings.enabledGPS) {
            startLocationUpdate();
            mapView.userTrackingMode = 1;
        }
        runMethodOnModules('onResume');
    };

    Ti.App.on('pause', onPause).on('resume', onResume);
    app.on('location', onLocation)
        .on('module_prop', function (e) {
            const moduleId = e.moduleId;
            if (e.id === 'enabled') {
                sdebug('handling module change', e);
                let modulesToChange: { [k: string]: MapModule } = contentModules;
                let index = app.contentModules.indexOf(moduleId);
                if (index == -1) {
                    index = app.mapModules.indexOf(moduleId);
                    modulesToChange = modules;
                }
                if (!!e.value) {
                    if (!contentModules.hasOwnProperty(moduleId)) {
                        sdebug('loading module', moduleId);
                        var module = loadModule(moduleId, index, modulesToChange === contentModules);
                        Object.assign(module, {
                            window: self,
                            mapView: mapView,
                            parent: self
                        });
                        if (module.onInit) {
                            module.onInit();
                        }
                        app.emit('module_loaded', {
                            id: moduleId
                        });
                    }
                } else {
                    if (modulesToChange.hasOwnProperty(moduleId)) {
                        sdebug('unloading module', moduleId);
                        modulesToChange[moduleId].GC();
                        delete modulesToChange[moduleId];
                        app.emit('module_unloaded', {
                            id: moduleId
                        });
                    }
                }
                runMethodOnModules('onModuleLoaded', moduleId, e.value, modulesToChange[moduleId]);
            }

        }).on('enabled_gps', function (e) {
            Ti.App.Properties.setBool('enabled_gps', e.enabled);

            settings.enabledGPS = e.enabled;
            sdebug('enabled_gps changed', settings.enabledGPS);
            // mapView.applyProperties({
            //     userTrackingMode: settings.enabledGPS ? 1 : 0
            // });
            if (settings.enabledGPS && !app.locationManager.isLocationServicesEnabled()) {
                app.emit('error', {
                    message: trc('please_enable_gps')
                });
                return;
            }
            runMethodOnModules('onGPSEnabled', settings.enabledGPS);
            if (settings.enabledGPS) {
                startLocationUpdate();
            } else {
                stopLocationUpdate();
            }
        });
    app.locationManager.on('location_service_state', onGeolocStatusChange);

    // self.addPropertiesToGC('mapView');
    self.onOpen = app.composeFunc(self.onOpen, function () {
        //only init here to make sure any authorization alert is on top
        app.locationManager.init();
        runMethodOnModules('onWindowOpen', settings.enabledGPS);
    });

    self.onClose = app.composeFunc(self.onClose, function () {
        runMethodOnModules('onWindowClose');
        stopLocationUpdate();
    });

    self.onBack = function (e) {
        if (self.cancelRunningRequest()) {
            return;
        }
        if (!runMethodOnModules('onWindowBack', e)) {
            app.closeApp();
        }
    };

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        Ti.App.off('pause', onPause).off('resume', onResume);
        // self.off('focus', onFocus).off('blur', onBlur);
        app.off('location', onLocation);
        app.locationManager.off('location_service_state', onGeolocStatusChange);
        let module;
        for (const key in modules) {
            module = modules[key];
            if (module.GC) {
                module.GC();
            }
        }
        self = null;
        modules = null;
        mapView = null;
    });
    onResume();
    return self;
};