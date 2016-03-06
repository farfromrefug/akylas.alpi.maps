exports.create = function(_context, _args, _additional) {

    var settings = _args.settings,
        visible = false,
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        simplify = itemHandler.simplify,
        self = new _context.MapModule(_args),
        htmlIcon = app.utilities.htmlIcon,
        mode = 'walking',
        // selectedMarker = null,
        // mapPadding = null,
        tempRoute = null,
        waypoints = [],
        inPaintMode = false,
        directionsColors = app.getContrastColor('#0D83D4'),
        waypointType = {
            defaultTitle: trc('amenity'),
            iconSettings: {
                style: 0,
                scale: 0.6
            },
            colors: directionsColors,
            settings: {}
        },
        wayPointsAnnotations = [],
        view,
        paintView,
        barHeight = $navBarTop + $navBarHeight + 100,
        rightNavButton = function(_id, _icon, _props, _bindId) {
            return {
                type: 'Ti.UI.Button',
                bindId: _bindId,
                properties: _.assign({
                    callbackId: _id,
                    rclass: 'NavBarRightButton',
                    title: _icon
                }, _props)
            };
        },
        segmentButton = function(_id, _icon, _props, _bindId) {
            return {
                type: 'Ti.UI.Button',
                bindId: _bindId,
                properties: _.assign({
                    callbackId: _id,
                    rclass: 'NavBarRightButton',
                    width: 36,
                    minWidth: null,
                    font: {
                        size: 22
                    },
                    disabledColor: $white,
                    color: $gray,
                    title: _icon,
                    enabled: mode !== _id
                }, _props)
            };
        },
        getView = function() {
            if (!view) {
                view = new View({
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
                            backgroundColor: directionsColors.color,
                            height: barHeight,
                            bottom: 0
                        },
                        childTemplates: [{
                            type: 'Ti.UI.View',
                            properties: {
                                top: $navBarTop,
                                height: $navBarHeight,
                                layout: 'horizontal'
                            },
                            childTemplates: [
                                rightNavButton('close', $sClose), {
                                    type: 'Ti.UI.View',
                                    rclass: 'NavBarButtonSeparator'
                                },
                                rightNavButton('paintmode', $sPaint, {
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
                                        segmentButton('raw', $sLine),
                                        segmentButton('walking', $sWalking),
                                        segmentButton('bicycling', $sCycling),
                                        segmentButton('driving', $sDriving)
                                    ]
                                }, {
                                    //     type: 'Ti.UI.View',
                                    //     rclass: 'NavBarButtonSeparator'
                                    // }, {
                                    type: 'Ti.UI.View'
                                },
                                rightNavButton('next', $sCheck, {
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
                                                    backgroundColor:directionsColors.color,
                                                    rightSwipeButtons: [
                                                        app.templates.row.createSwipeButton(
                                                            'delete', 'red',
                                                            false)
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
                                        longpress: function(e) {
                                            sdebug(e);
                                            view.listView.editing = !view.listView.editing;
                                        },
                                        move: function(e) {
                                            sdebug(e);
                                            if (!e.item) {
                                                return;
                                            }
                                            // var index = _.findIndex(waypoints, {
                                            //     'id': e.item.id
                                            // });
                                            _.move(waypoints, e.itemIndex, e.targetItemIndex);
                                            update();
                                        },
                                        delete: function(e) {
                                            sdebug(e);
                                            if (!e.item) {
                                                return;
                                            }
                                            var found = e.item.id.match(
                                                /waypoint_([0-9]+)/);
                                            sdebug('found', found);
                                            if (found) {
                                                var index = _.findIndex(
                                                    wayPointsAnnotations, {
                                                        'id': e.item.id
                                                    });
                                                self.mapView.removeAnnotation(
                                                    wayPointsAnnotations.splice(
                                                        index, 1));
                                            }
                                            waypoints.splice(e.itemIndex, 1);

                                            update();
                                        },
                                        click: app.debounce(function(e) {
                                            sdebug(e);
                                            if (e.item) {
                                                var item = e.item.item;
                                                switch (e.bindId || e.source.callbackId) {
                                                    case 'delete':
                                                        {
                                                            var found = item.id
                                                                .match(
                                                                    /waypoint_([0-9]+)/
                                                                );
                                                            sdebug('found',
                                                                found);
                                                            if (found) {
                                                                var index = _.findIndex(
                                                                    wayPointsAnnotations, {
                                                                        'id': item
                                                                            .id
                                                                    });
                                                                self.mapView.removeAnnotation(
                                                                    wayPointsAnnotations
                                                                    .splice(
                                                                        index,
                                                                        1));
                                                            }
                                                            waypoints.splice(e.itemIndex,
                                                                1);
                                                            e.section.deleteItemsAt(
                                                                e.itemIndex,
                                                                1, {
                                                                    animated: true
                                                                });
                                                            update();
                                                            break;
                                                        }
                                                    default:
                                                        self.parent.runMethodOnModules(
                                                            'runActionOnItem',
                                                            item.type,
                                                            item, 'select');
                                                        break;
                                                }
                                            }
                                        })
                                    }
                                },
                                // rightNavButton('edit', $sEditMove, {
                                //     bottom: 0,
                                //     right: 0,
                                //     visible: false
                                // }, 'editBtn'),
                            ]
                        }],
                        events: {
                            'click': app.debounce(function(e) {
                                var callbackId = e.source.callbackId;
                                sdebug(callbackId);
                                switch (callbackId) {
                                    case 'close':
                                        hide();
                                        break;
                                    case 'paintmode':
                                        if (inPaintMode) {
                                            leavePaintMode();
                                        } else {
                                            enterPaintMode();
                                        }
                                        break;
                                        // case 'edit':
                                        //     view.listView.editing = !view.listView.editing;
                                        //     break;
                                    case 'next':
                                        self.window.showLoading({
                                            label: {
                                                html: htmlIcon($sTrace, 1) + ' ' +
                                                    trc('computing') + '...'
                                            }
                                        });
                                        var points = _.reduce(waypoints, function(memo,
                                            waypoint) {
                                            memo.push([waypoint.latitude, waypoint.longitude]);
                                            return memo;
                                        }, []);
                                        createRoute(points);
                                        break;
                                    case 'raw':
                                    case 'walking':
                                    case 'bicycling':
                                    case 'driving':
                                        mode = callbackId;
                                        _.each(view.modeHolder.children, function(button) {
                                            sdebug(button.callbackId, button.callbackId !==
                                                mode);
                                            button.enabled = button.callbackId !==
                                                mode;
                                        });
                                        break;
                                }
                            })
                        }
                    }]
                });
            }
            self.parent.mapTopToolbar.add(view);
            return view;
        };

    function update() {
        var nb = waypoints.length;
        sdebug('update', nb);
        if (nb > 0) {
            app.showTutorials(['direction_listview']);
        }
        if (nb > 1) {
            app.showTutorials(['direction_compute']);
        }
        if (tempRoute === null) {
            tempRoute = new MapRoute({
                color: directionsColors.color,
                hasInfo: false,
                touchable: false,
                zIndex: 1000,
                lineWidth: 4,
                points: waypoints
            });
            self.mapView.addRoute(tempRoute);
        } else {
            tempRoute.points = waypoints;
        }
        view.listView.sections[0].updateItems(_.times(nb, function(index) {
            return {
                topLine: {
                    visible: (index !== 0)
                },
                bottomLine: {
                    visible: (index !== (nb - 1))
                }
            };
        }));
        // if (nb > 1) {
        view.nextBtn.visible = nb > 1;
        // }
    }

    function getDirectionModule() {
        if (!app.directions) {
            app.directions = require('lib/ffwdme/ffwdme');
            app.directions.initialize({
                routing: 'Google',
                google: {
                    // apiKey: app.modules.map.googleMapAPIKey
                },
                geoProvider: app.locationManager
            });
            app.directions.on('routecalculation:error', app.showAlert);
        }
        return app.directions;
    }

    function reset() {
        sdebug('reset');
        if (tempRoute !== null) {
            self.mapView.removeRoute(tempRoute);
            tempRoute = null;
        }
        if (wayPointsAnnotations.length > 0) {
            self.mapView.removeAnnotation(wayPointsAnnotations);
            wayPointsAnnotations = [];
        }
        // selectedMarker = null;
        // self.mapView.selectAnnotation(null);
        // if (mapPadding !== null) {
        //     self.mapView.padding = mapPadding;
        //     mapPadding = null;
        // }

        waypoints = [];
        // view.scrollableView.firstPage.removeAllChildren();
        view.applyProperties({
            listView: {
                editing: false,
                sections: [{}]
            },
            nextBtn: {
                visible: false
            }
        });
        // view.editBtn.visible = false;
    }

    function handleCreateRoute(_route) {
        var points = _route.points;
        var firstPoint = points[0];
        var lastPoint = _.last(points);
        hide();
        var type = 'computed';
        var item = {
            start: firstPoint,
            startOnRoute: _.isEqual(points[0], firstPoint),
            endOnRoute: _.isEqual(_.last(points), firstPoint),
            end: lastPoint,
            waypoints: _.pluck(waypoints, 'id'),
            route: _route
        };
        self.parent.runMethodOnModules('spreadModuleAction', {
            id: type,
            command: 'create',
            item: item
        });
        self.parent.runMethodOnModules('runActionOnItem', type, item, 'select');
        self.window.hideLoading();
    }

    function createRoute(_points) {
        sdebug('createRoute', mode, _points);

        if (mode === 'raw') {
            var region = geolib.getBounds(_points);
            handleCreateRoute({
                distance: geolib.getPathLength(_points),
                region: {
                    ne: {
                        latitude: region.maxLat,
                        longitude: region.maxLng,
                    },
                    sw: {
                        latitude: region.minLat,
                        longitude: region.minLng,
                    }
                },
                points: _points
            });
        } else {
            var firstPoint = _points[0];
            var lastPoint = _.last(_points);
            queryRoute({
                origin: firstPoint,
                destination: lastPoint,
                waypoints: _points.slice(1, -1)
            }, function(_result) {
                if (!_result.error) {
                    handleCreateRoute(_result);
                } else {
                    // if (inPaintMode) {
                    //     leavePaintMode();
                    // }
                    self.window.hideLoading();
                }
            });
        }

    }

    function queryRoute(_args, _callback) {
        sdebug('queryRoute', _args);
        var language = app.localeInfo.currentLocale.split('-')[0];
        app.api.queryDirections({
            mode: mode,
            optimize: true,
            origin: _args.origin,
            destination: _args.destination,
            waypoints: _args.waypoints,
            lang: language,
        }, _callback);
    }

    function addItemToListView(_item, _itemDesc, _userLocation) {
        var nb = waypoints.length;
        sdebug('addItemToListView', _item, nb);
        if (nb > 0 && _.last(waypoints).id === _item.id) {
            return;
        }
        if (nb === 10) {
            app.showAlert(trc('too_many_points'));
            return;
        }
        var items = [{
            item: _item,
            title: {
                text: itemHandler.itemTitle(_item, _itemDesc),
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
            waypoints.unshift(_item);
            getView().listView.insertItemsAt(0, 0, items, {
                animated: true
            });
            view.listView.scrollToTop(0, {
                position: 1
            });

        } else {
            waypoints.push(_item);
            getView().listView.appendItems(0, items, {
                animated: true
            });
            view.listView.scrollToBottom(0, {
                position: 1
            });

        }
        update();
    }

    function onAnnotationPressOrSelected(e, _isPress) {
        if (e.route || !e.annotation) {
            return;
        }
        var index = -1,
            userLocation = false,
            mapItem = e.route || e.annotation,
            item, itemDesc;
        if (mapItem === settings.userAnnotation) {
            userLocation = true;
            item = {
                id: 'user_location',
                icon: $sNav,
                title: trc('current_location'),
                latitude: mapItem.latitude,
                longitude: mapItem.longitude,
            };
        } else {
            sdebug('onAnnotationPressOrSelected', _isPress);
            if (_isPress === true) {
                return;
            }
            item = mapItem.item;
            itemDesc = mapItem.type;

        }
        if (!item) {
            return;
        }

        // index = _.findIndex(waypoints, {
        //     'id': item.id
        // });
        // if (index == -1) {
        addItemToListView(item, itemDesc, userLocation);
        // } else {
        //     view.listView.scrollToItem(0, index, {
        //         position: 1
        //     });
        // }
        return (mapItem === settings.userAnnotation);
    }

    function enterPaintMode() {
        if (inPaintMode) {
            return;
        }
        inPaintMode = true;
        self.mapView.selectAnnotation(null);
        self.parent.runMethodOnModules('hideModule', {
            bottom: true
        });
        if (!paintView) {
            var color = Color($cTheme.main);
            paintView = app.modules.paint.createPaintView({
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
            paintView.on('onpaint', function(e) {
                sdebug('onpaint');
                self.window.showLoading({
                    label: {
                        html: htmlIcon($sTrace, 1) + ' ' +
                            trc('computing') + '...'
                    }
                });
                paintView.touchEnabled = false;
                var path = e.path;
                for (var i = path.length - 1; i >= 0; i--) {
                    path[i][1] += $navBarTop + $navBarHeight;
                }
                var points = self.mapView.coordinateForPoints(path);

                var simplifyTolerance = 2;
                var count = 0;
                var toUsePoints = points;
                while (toUsePoints.length > 10) {
                    toUsePoints = simplify(points, simplifyTolerance / 3779);
                    count++;
                    simplifyTolerance += 2;
                }
                sdebug('simplified', count, points.length, toUsePoints.length);
                var tempRoute; {
                    sdebug('add route');
                    tempRoute = new MapRoute({
                        points: toUsePoints
                    });
                    self.mapView.addRoute(tempRoute);
                    // setTimeout(function() {
                    // sdebug('removing route');
                    self.mapView.removeRoute(tempRoute);
                    tempRoute = null;
                    // }, 1000);
                }
                paintView.clear();

                createRoute(toUsePoints);
            });
        }
        paintView.opacity = 0;
        self.parent.childrenHolder.add(paintView);
        paintView.animate({
            opacity: 1,
            duration: 200
        });
        view.bar.animate({
            height: $navBarHeight + $navBarTop,
            duration: 200
        }, reset);
    }

    function leavePaintMode() {
        if (!inPaintMode) {
            return;
        }
        inPaintMode = false;
        self.parent.runMethodOnModules('onMapReset', {
            bottom: true
        });
        paintView.animate({
            opacity: 0,
            duration: 200
        }, function() {
            paintView.clear();
            self.parent.childrenHolder.remove(paintView);
        });

        view.bar.animate({
            height: barHeight,
            duration: 200
        });
    }

    function onMapPress(e) {
        var nb = wayPointsAnnotations.length;
        var loc = _.pick(e, 'latitude', 'longitude', 'altitude');
        var item = _.assign(loc, {
            title: trc('waypoint'),
            id: 'waypoint_' + nb,
            icon: nb + ''
        });
        var annot = new MapAnnotation(_.assign({
            anchorPoint: [0.5, 0.5],
            hasInfo: false,
            image: app.getImagePath(itemHandler.getAnnotImage(waypointType, item))
        }, item));
        wayPointsAnnotations.push(annot);
        self.mapView.addAnnotation(annot);
        addItemToListView(item, waypointType, false);
        return true;
    }

    function show() {
        if (!visible) {
            self.onMapMarkerSelected = onAnnotationPressOrSelected;
            self.onMapPress = onMapPress;
            self.onAnnotationPress = _.partialRight(onAnnotationPressOrSelected, true);
            self.parent.runGetMethodOnModules('onStartExclusiveAction', 'direction');
            // self.parent.runMethodOnModules('hideModule', {
            //     top: true
            // });
            visible = true;
            self.mapView.applyProperties({
                canSelectRoute: false,
                canShowInfoWindow: false

            });
            // if (settings.currentLocation) {
            //     onAnnotationPress({
            //         annotation: settings.userAnnotation
            //     });
            // }
            var selected = self.mapView.selectedAnnotation;
            if (selected) {
                if (itemHandler.isItemARoute(selected.item)) {
                    self.mapView.selectedAnnotation = null;
                } else {
                    onAnnotationPressOrSelected({
                        annotation: selected
                    });
                }

            }

            // }
            getView().animate({
                height: 'SIZE',
                duration: 200
            });
            app.showTutorials(['direction_select', 'direction_paintview']);
        }
    }

    function hide() {
        if (visible) {
            if (paintView) {
                self.parent.childrenHolder.remove(paintView);
                paintView = null;
            }
            sdebug('hide');
            visible = false;
            delete self.onMapMarkerSelected;
            delete self.onAnnotationPress;
            delete self.onMapPress;
            self.mapView.applyProperties({
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
            view.animate({
                height: 0,
                duration: 200
            }, function() {
                reset();
                sdebug('animation done');
                self.parent.mapTopToolbar.remove(view);
                view.bar.height = barHeight;
                inPaintMode = false;
            });
        }
    }

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            view = null;
            // selectedMarker = null;
        }),
        onStartExclusiveAction: function(_id) {
            if (_id !== 'direction') {
                hide();
            }
        },
        hideModule: function() {
            if (!visible) {
                hide();
            }
        },
        canSpreadModuleAction: function(_params) {
            return !visible;
        },
        canSpreadLongModuleAction: function(_params) {
            return !visible;
        },
        onModuleAction: function(_params) {
            if (_params.id === 'direction') {
                show();
            } else {
                return false;
            }
            return true;
        }
    });
    // _additional.mapChildren.push(compassView);
    return self;
};