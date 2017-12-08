import { MapModule } from './MapModule'
export function settings(enabled) {
    var service = Ti.App.Properties.getString('directions.service', 'google');
    var sections = [];
    sections.push({
        items: [{
            callbackId: 'service',
            title: {
                text: trc('choose_service')
            },
            subtitle: {
                text: trc(service)
            }
        }]
    });
    return {
        canBeDisabled: false,
        name: trc('directions'),
        description: 'directions_desc',
        preferencesSections: sections
    }
};

export function onSettingsClickOrChange(e, window) {
    var callbackId = (e.item && e.item.callbackId) || e.bindId;
    switch (callbackId) {
        case 'service':
            var service = Ti.App.Properties.getString('directions.service', 'google');
            var services = ['google', 'mapzen', 'graphhopper'];
            window.showSettingSelection(callbackId, services, services.indexOf(service), function (_index) {
                service = services[_index];
                Ti.App.Properties.setString('directions.service', service);
                e.section.updateItemAt(e.itemIndex, {
                    subtitle: {
                        text: trc(service)
                    }
                });
            });
            break;
    }
};

export class Directions extends MapModule {

    settings
    visible = false
    geolib = app.itemHandler.geolib
    // simplify = app.itemHandler.simplify
    htmlIcon = app.utilities.htmlIcon
    mode = 'walking'
    tempRoute = null
    waypoints: Item[] = []
    inPaintMode = false
    directionsColors = app.getContrastColors('#0D83D4')
    maxPoints = 10
    waypointType: ItemType
    wayPointsAnnotations = []
    view
    paintView
    barHeight = $.navBarTop + $.navBarHeight + 100
    constructor(_context, _args, _additional) {
        super(_args);
        this.settings = _args.settings;
        this.waypointType = {
            defaultTitle: trc('amenity'),
            iconSettings: {
                style: 0,
                scale: 0.6
            },
            colors: this.directionsColors,
            settings: {}
        }
    }
    rightNavButton = function (_id: string, _icon: string, _props?:TiProperties, _bindId?: string) {
        return {
            type: 'Ti.UI.Button',
            bindId: _bindId,
            properties: Object.assign({
                callbackId: _id,
                rclass: 'NavBarRightButton',
                title: _icon
            }, _props)
        };
    }
    segmentButton = (_id: string, _icon: string, _props?:TiProperties, _bindId?: string) => {
        return {
            type: 'Ti.UI.Button',
            bindId: _bindId,
            properties: Object.assign({
                callbackId: _id,
                rclass: 'NavBarRightButton',
                width: 36,
                minWidth: null,
                font: {
                    size: 22
                },
                disabledColor: $.white,
                color: $.gray,
                title: _icon,
                enabled: this.mode !== _id
            }, _props)
        };
    }
    getView = () => {
        if (!this.view) {
            this.view = new View({
                properties: {
                    height: 0,
                    top: 0,
                    clipChildren: false
                },
                childTemplates: [{
                    type: 'Ti.UI.View',
                    bindId: 'bar',
                    properties: {
                        rclass: 'DirectionBar',
                        backgroundColor: this.directionsColors.color,
                        height: this.barHeight,
                        bottom: 0
                    },
                    childTemplates: [{
                        type: 'Ti.UI.View',
                        properties: {
                            top: $.navBarTop,
                            height: $.navBarHeight,
                            layout: 'horizontal'
                        },
                        childTemplates: [
                            this.rightNavButton('close', $.sClose), {
                                type: 'Ti.UI.View',
                                rclass: 'NavBarButtonSeparator'
                            },
                            this.rightNavButton('paintmode', $.sPaint, {
                                visible: __APPLE__
                            }), {
                                type: 'Ti.UI.View',
                                rclass: 'NavBarButtonSeparator',
                            }, {
                                type: 'Ti.UI.View',
                                bindId: 'modeHolder',
                                layout: 'horizontal',
                                width: 'SIZE',
                                childTemplates: [
                                    this.segmentButton('raw', $.sLine),
                                    this.segmentButton('walking', $.sWalking),
                                    this.segmentButton('bicycling', $.sCycling),
                                    this.segmentButton('driving', $.sDriving)
                                ]
                            }, {
                                //     type: 'Ti.UI.View',
                                //     rclass: 'NavBarButtonSeparator'
                                // }, {
                                type: 'Ti.UI.View'
                            },
                            this.rightNavButton('next', $.sCheck, {
                                visible: false,
                            }, 'nextBtn')
                        ]
                    }, {
                        type: 'Ti.UI.View',
                        properties: {
                            height: 'FILL',
                        },
                        childTemplates: [{
                            type: 'Ti.UI.ListView',
                            bindId: 'listView',
                            properties: {
                                rclass: 'DirectionListView',
                                // bubbleParent: false,
                                templates: {
                                    'default': ak.ti.prepareListViewTemplate({
                                        properties: {
                                            rclass: 'DirectionRow',
                                            backgroundColor: this.directionsColors.color,
                                            rightSwipeButtons: [
                                                app.templates.row.createSwipeButton('delete', 'red', false)
                                            ]
                                        },
                                        childTemplates: [{
                                            type: 'AkylasShapes.View',
                                            properties: {
                                                rclass: 'DirectionRowShapeView'
                                            },
                                            childTemplates: [{
                                                type: 'AkylasShapes.Line',
                                                bindId: 'topLine',
                                                properties: {
                                                    rclass: 'DirectionRowShapeTopLine'
                                                }
                                            }, {
                                                type: 'AkylasShapes.Line',
                                                bindId: 'bottomLine',
                                                properties: {
                                                    rclass: 'DirectionRowShapeBottomLine'
                                                }
                                            }, {
                                                type: 'Ti.UI.Label',
                                                bindId: 'icon',
                                                properties: {
                                                    rclass: 'DirectionRowIcon'
                                                }
                                            }]
                                        }, {
                                            type: 'Ti.UI.Label',
                                            bindId: 'title',
                                            properties: {
                                                rclass: 'DirectionRowLabel'
                                            }
                                        }, {
                                            type: 'Ti.UI.Label',
                                            bindId: 'accessory',
                                            properties: {
                                                rclass: 'DirectionRowIcon',
                                                visible: false
                                            }
                                        }]
                                    })
                                },
                                defaultItemTemplate: 'default',
                                sections: [{}]
                            },
                            events: {
                                longpress: (e:TiEvent) => {
                                    // sdebug(e);
                                    this.view.listView.editing = !this.view.listView.editing;
                                },
                                move: (e:TiEvent) => {
                                    // sdebug(e);
                                    if (!e.item) {
                                        return;
                                    }
                                    _.move(this.waypoints, e.itemIndex, e.targetItemIndex);
                                    this.update();
                                },
                                delete: (e:TiEvent) => {
                                    // sdebug(e);
                                    if (!e.item) {
                                        return;
                                    }
                                    var found = e.item.id.match(
                                        /waypoint_([0-9]+)/);
                                    // sdebug('found', found);
                                    if (found) {
                                        var index = _.findIndex(
                                            this.wayPointsAnnotations, {
                                                'id': e.item.id
                                            });
                                        this.mapView.removeAnnotation(
                                            this.wayPointsAnnotations.splice(
                                                index, 1));
                                    }
                                    this.waypoints.splice(e.itemIndex, 1);

                                    this.update();
                                },
                                click: app.debounce((e:TiEvent) => {
                                    // sdebug(e);
                                    if (e.item) {
                                        var item = e.item.item;
                                        switch (e.bindId || e.source.callbackId) {
                                            case 'delete':
                                                {
                                                    var found = item.id
                                                        .match(
                                                        /waypoint_([0-9]+)/
                                                        );
                                                    // sdebug('found',
                                                    //     found);
                                                    if (found) {
                                                        var index = _.findIndex(
                                                            this.wayPointsAnnotations, {
                                                                'id': item
                                                                    .id
                                                            });
                                                        this.mapView.removeAnnotation(
                                                            this.wayPointsAnnotations
                                                                .splice(
                                                                index,
                                                                1));
                                                    }
                                                    this.waypoints.splice(e.itemIndex,
                                                        1);
                                                    e.section.deleteItemsAt(
                                                        e.itemIndex,
                                                        1, {
                                                            animated: true
                                                        });
                                                    this.update();
                                                    break;
                                                }
                                            default:
                                                this.parent.runMethodOnModules(
                                                    'runActionOnItem',
                                                    item.type,
                                                    item, 'select');
                                                break;
                                        }
                                    }
                                })
                            }
                        }]
                    }],
                    events: {
                        'click': app.debounce((e:TiEvent) => {
                            var callbackId = e.source.callbackId;
                            // sdebug(callbackId);
                            switch (callbackId) {
                                case 'close':
                                    this.hide();
                                    break;
                                case 'paintmode':
                                    if (this.inPaintMode) {
                                        this.leavePaintMode();
                                    } else {
                                        this.enterPaintMode();
                                    }
                                    break;
                                // case 'edit':
                                //     view.listView.editing = !view.listView.editing;
                                //     break;
                                case 'next':
                                    this.window.showLoading({
                                        label: {
                                            html: this.htmlIcon($.sTrace, 1) + ' ' +
                                            trc('computing') + '...'
                                        }
                                    });
                                    var points = _.reduce(this.waypoints, function (memo, waypoint) {
                                        memo.push([waypoint.latitude, waypoint.longitude]);
                                        return memo;
                                    }, []);
                                    this.createRoute(points);
                                    break;
                                case 'raw':
                                case 'walking':
                                case 'bicycling':
                                case 'driving':
                                    this.mode = callbackId;
                                    this.view.modeHolder.children.forEach(button => {
                                        // sdebug(button.callbackId, button.callbackId !== this.mode);
                                        button.enabled = button.callbackId !== this.mode;
                                    });
                                    break;
                            }
                        })
                    }
                }]
            });
        }
        this.parent.mapTopToolbar.add(this.view);
        return this.view;
    };

    update = () => {
        var nb = this.waypoints.length;
        // sdebug('update', nb);
        if (nb > 0) {
            app.showTutorials(['direction_listview']);
        }
        if (nb > 1) {
            app.showTutorials(['direction_compute']);
        }
        if (this.tempRoute === null) {
            this.tempRoute = new MapRoute({
                color: this.directionsColors.color,
                hasInfo: false,
                touchable: false,
                zIndex: 1000,
                lineWidth: 4,
                points: this.waypoints
            });
            this.mapView.addRoute(this.tempRoute);
        } else {
            this.tempRoute.points = this.waypoints;
        }
        this.view.listView.sections[0].updateItems(_.times(nb, function (index) {
            return {
                topLine: {
                    visible: (index !== 0)
                },
                bottomLine: {
                    visible: (index !== (nb - 1))
                }
            };
        }));
        this.view.nextBtn.visible = nb > 1;
    }
    directions
    getDirectionModule() {
        if (!this.directions) {
            this.directions = require('lib/ffwdme/ffwdme');
            this.directions.initialize({
                routing: 'Google',
                google: {
                    // apiKey: app.modules.map.googleMapAPIKey
                },
                geoProvider: app.locationManager
            });
            this.directions.on('routecalculation:error', app.showAlert);
        }
        return this.directions;
    }

    reset = () => {
        // sdebug('reset');
        if (this.tempRoute !== null) {
            this.mapView.removeRoute(this.tempRoute);
            this.tempRoute = null;
        }
        if (this.wayPointsAnnotations.length > 0) {
            this.mapView.removeAnnotation(this.wayPointsAnnotations);
            this.wayPointsAnnotations = [];
        }

        this.waypoints = [];
        this.view.applyProperties({
            listView: {
                editing: false,
                sections: [{}]
            },
            nextBtn: {
                visible: false
            }
        });
    }

    handleCreateRoute = (_route: RouteRoute, firstPoint, lastPoint) => {
        // sdebug('createRoute', _route);
        var points = _route.points;
        if (!!_route.encoded) {
            points = app.api.decodeLine(_route.overview_points);
        }
        this.hide();
        // sdebug('test', points[0], firstPoint, _.isEqual(points[0], firstPoint));
        var type = 'computed';
        var item = {
            start: firstPoint,
            startOnRoute: _.isEqual(points[0], firstPoint),
            endOnRoute: _.isEqual(_.last(points), lastPoint),
            end: lastPoint,
            route_mode: this.mode,
            waypoints: _.map(this.waypoints, 'id'),
            route: _route
        } as Route;
        this.parent.runMethodOnModules('spreadModuleAction', {
            id: type,
            command: 'create',
            item: item
        });
        this.parent.runMethodOnModules('runActionOnItem', type, item, 'select');
        this.window.hideLoading();
    }

    createRoute = (_points) => {
        sdebug('createRoute', this.mode, _points);

        if (this.mode === 'raw') {
            var region = this.geolib.getBounds(_points);
            this.handleCreateRoute({
                distance: this.geolib.getPathLength(_points),
                region: {
                    ne: {
                        latitude: region.maxLat,
                        longitude: region.maxLng
                    },
                    sw: {
                        latitude: region.minLat,
                        longitude: region.minLng
                    }
                },
                points: _points
            }, _points[0], _.last(_points));
        } else {
            var firstPoint = _points[0];
            var lastPoint = _.last(_points);
            this.queryRoute({
                origin: firstPoint,
                destination: lastPoint,
                waypoints: _points.slice(1, -1)
            }).then( (_result)=> {
                this.handleCreateRoute(_result, firstPoint, lastPoint);
            }).catch(this.window.showError).then(this.window.hideLoading);
        }

    }

    queryRoute = (_args) => {
        sdebug('queryRoute', _args);
        return app.api.queryDirections({
            mode: this.mode,
            optimize: true,
            origin: _args.origin,
            destination: _args.destination,
            waypoints: _args.waypoints,
            lang: app.localeInfo.currentLocale,
        });
    }

    addItemToListView = (_item: Item, _itemDesc: ItemType, _userLocation?: boolean) => {
        var nb = this.waypoints.length;
        // sdebug('addItemToListView', _item, nb);
        if (nb > 0 && _.last(this.waypoints).id === _item.id) {
            return;
        }
        var items = [{
            item: _item,
            title: {
                text: this.itemHandler.itemTitle(_item, _itemDesc),
            },
            icon: {
                text: _item.icon || _itemDesc.icon
            },
            topLine: {
                visible: (nb !== 0)
            },
            bottomLine: {
                visible: false
            }
        }];

        if (_userLocation) {
            this.waypoints.unshift(_item);
            this.getView().listView.insertItemsAt(0, 0, items, {
                animated: true
            });
            this.view.listView.scrollToTop(0, {
                position: 1
            });

        } else {
            this.waypoints.push(_item);
            this.getView().listView.appendItems(0, items, {
                animated: true
            });
            this.view.listView.scrollToBottom(0, {
                position: 1
            });

        }
        this.update();
    }

    onAnnotationPressOrSelected = (e: TiEvent, _isPress?: boolean) => {
        if (e.route || !e.annotation) {
            return;
        }
        if (this.wayPointsAnnotations.length >= this.maxPoints) {
            app.showAlert(trc('too_many_points'));
            return;
        }
        var index = -1,
            userLocation = false,
            mapItem = e.route || e.annotation,
            item, itemDesc;
        if (mapItem === this.settings.userAnnotation) {
            userLocation = true;
            item = {
                id: 'user_location',
                icon: $.sNav,
                title: trc('current_location'),
                latitude: mapItem.latitude,
                longitude: mapItem.longitude,
            };
        } else {
            // sdebug('onAnnotationPressOrSelected', _isPress);
            if (_isPress === true) {
                return;
            }
            item = mapItem.item;
            itemDesc = mapItem.type;

        }
        if (!item) {
            return;
        }
        this.addItemToListView(item, itemDesc, userLocation);

        return (mapItem === this.settings.userAnnotation);
    }

    enterPaintMode = () => {
        if (this.inPaintMode) {
            return;
        }
        this.inPaintMode = true;
        this.mapView.selectAnnotation(null);
        this.parent.runMethodOnModules('hideModule', {
            bottom: true
        });
        if (!this.paintView) {
            var color = Color($.cTheme.main);
            this.paintView = app.modules.paint.createPaintView({
                // eraseMode:true,
                // strokeWidth (float), strokeColor (string), strokeAlpha (int, 0-255)
                backgroundGradient: {
                    type: 'radial',
                    colors: [{
                        color: color.setAlpha(0).toHex8String(),
                        offset: 0
                    }, {
                        color: color.setAlpha(0).toHex8String(),
                        offset: 0.7
                    }, {
                        color: color.toHex8String(),
                        offset: 1
                    }]
                },
                multipleTouchEnabled: false,
                strokeColor: '#0581FC',
                strokeAlpha: 255,
                strokeWidth: 6,
                eraseMode: false
            });
            this.paintView.on('onpaint', function (e) {
                sdebug('onpaint');
                this.window.showLoading({
                    label: {
                        html: this.htmlIcon($.sTrace, 1) + ' ' +
                        trc('computing') + '...'
                    }
                });
                this.paintView.touchEnabled = false;
                var path = e.path;
                for (var i = path.length - 1; i >= 0; i--) {
                    path[i][1] += $.navBarTop + $.navBarHeight;
                }
                var points = this.mapView.coordinateForPoints(path);

                var simplifyTolerance = 2;
                var count = 0;
                var toUsePoints = points;
                while (toUsePoints.length > 10) {
                    toUsePoints = this.simplify(points, simplifyTolerance / 3779);
                    count++;
                    simplifyTolerance += 2;
                }
                sdebug('simplified', count, points.length, toUsePoints.length);
                var tempRoute = new MapRoute({
                    points: toUsePoints
                });
                this.mapView.addRoute(tempRoute);
                // setTimeout(function() {
                // sdebug('removing route');
                this.mapView.removeRoute(tempRoute);
                tempRoute = null;
                // }, 1000);
                this.paintView.clear();

                this.createRoute(toUsePoints);
            });
        }
        this.paintView.opacity = 0;
        this.parent.childrenHolder.add(this.paintView);
        this.paintView.animate({
            opacity: 1,
            duration: 200
        });
        this.view.bar.animate({
            height: $.navBarHeight + $.navBarTop,
            duration: 200
        }, this.reset);
    }

    leavePaintMode = () => {
        if (!this.inPaintMode) {
            return;
        }
        this.inPaintMode = false;
        this.parent.runMethodOnModules('onMapReset', {
            bottom: true
        });
        this.paintView.animate({
            opacity: 0,
            duration: 200
        }, () => {
            this.paintView.clear();
            this.parent.childrenHolder.remove(this.paintView);
        });

        this.view.bar.animate({
            height: this.barHeight,
            duration: 200
        });
    }

    onMapPress?(e: TiEvent)
    HandleOnMapPress = (e: TiEvent) => {
        var nb = this.wayPointsAnnotations.length;
        if (nb >= this.maxPoints) {
            app.showAlert(trc('too_many_points'));
            return;
        }
        var loc: TiLocation = _.pick(e, 'latitude', 'longitude', 'altitude');
        var item: Item = Object.assign(loc, {
            title: trc('waypoint'),
            id: 'waypoint_' + nb,
            icon: nb + ''
        });
        var annot = new MapAnnotation(Object.assign({
            anchorPoint: [0.5, 0.5],
            hasInfo: false,
            image: app.getImagePath(this.itemHandler.getAnnotImage(this.waypointType, item))
        }, item));
        this.wayPointsAnnotations.push(annot);
        this.mapView.addAnnotation(annot);
        this.addItemToListView(item, this.waypointType, false);
        return true;
    }
    onMapMarkerSelected?(e:TiEvent, _isPress?: boolean)
    onAnnotationPress?(e:TiEvent)
    show = () => {
        if (!this.visible) {
            this.onMapMarkerSelected = this.onAnnotationPressOrSelected;
            this.onMapPress = this.HandleOnMapPress;
            this.onAnnotationPress = _.partialRight(this.onAnnotationPressOrSelected, true);
            this.parent.runGetMethodOnModules('onStartExclusiveAction', 'direction');
            // self.parent.runMethodOnModules('hideModule', {
            //     top: true
            // });
            this.visible = true;
            this.mapView.applyProperties({
                canSelectRoute: false,
                canShowInfoWindow: false

            });
            // if (settings.currentLocation) {
            //     onAnnotationPress({
            //         annotation: settings.userAnnotation
            //     });
            // }
            var selected = this.mapView.selectedAnnotation;
            if (selected) {
                if (this.itemHandler.isItemARoute(selected.item)) {
                    this.mapView.selectedAnnotation = null;
                } else {
                    this.onAnnotationPressOrSelected({
                        annotation: selected
                    });
                }

            }

            // }
            this.getView().animate({
                height: 'SIZE',
                duration: 200
            });
            app.showTutorials(['direction_select', 'direction_paintview']);
        }
    }

    hide = () => {
        if (this.visible) {
            if (this.paintView) {
                this.parent.childrenHolder.remove(this.paintView);
                this.paintView = null;
            }
            // sdebug('hide');
            this.visible = false;
            delete this.onMapMarkerSelected;
            delete this.onAnnotationPress;
            delete this.onMapPress;
            this.mapView.applyProperties({
                canSelectRoute: true,
                canShowInfoWindow: true

            });
            // delete self.onRoutePress;
            // settings.userAnnotation.touchable = false;
            // view.selectedView.animate({
            //     transform: 'ot0,-100%',
            //     duration: 200
            // });
            // self.parent.runMethodOnModules('onMapReset', {
            //     bottom: true,
            //     top: true
            // });
            this.view.animate({
                height: 0,
                duration: 200
            }, () => {
                this.reset();
                // sdebug('animation done');
                this.parent.mapTopToolbar.remove(this.view);
                this.view.bar.height = this.barHeight;
                this.inPaintMode = false;
            });
        }
    }
    GC() {
        super.GC();
        this.view = null;
    }

    onStartExclusiveAction = (_id:string) => {
        if (_id !== 'direction') {
            this.hide();
        }
    }
    hideModule = () => {
        if (!this.visible) {
            this.hide();
        }
    }
    canSpreadModuleAction(_params) {
        return !this.visible;
    }
    canSpreadLongModuleAction(_params) {
        return !this.visible;
    }
    onModuleAction(_params) {
        if (_params.id === 'direction') {
            this.show();
        } else {
            return false;
        }
        return true;
    }
}
export function create(_context, _args, _additional) {
    return new Directions(_context, _args, _additional);
};
