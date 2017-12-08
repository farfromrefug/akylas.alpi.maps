// import MapModule from './MapModule'
const MapModule = require('./MapModule').MapModule;
exports.create = function(_context, _args, _additional) {
    var visible = false,
        selectedItem = null,
        itemHandler = app.itemHandler,
        ignorePointEvent = false,
        cancelClick = false,
        actionsVisibleBeforeHide = false,
        supplViewVisibleBeforeHide = false,
        currentTouchPoint,
        self = Object.assign(new MapModule(_args), {
            runAction: function(_action, _callback) {
                itemHandler.handleItemAction(_action, selectedItem.item, selectedItem.desc, _callback, self
                    .window,
                    self.parent);
            }
        }),
        startAnnot, endAnnot,
        undendedStartRoute, undendedEndRoute,
        view,
        getView = function() {
            if (!view) {
                view = new ItemInfoView({
                    onMap: true
                });
                view.on('action', function(e) {
                        var callbackId = e.bindId || e.source.callbackId;
                        // sdebug('action', callbackId);
                        if (callbackId === 'type' || callbackId === 'accessory') {
                            self.runAction('details');

                        } else if (callbackId === 'chart') {
                            if (currentTouchPoint) {
                                self.parent.setHighlightPoint(true);
                                self.parent.updateCamera({
                                    centerCoordinate: currentTouchPoint
                                });
                            }
                        } else {
                            moveToItem();
                        }
                    })
                    .on('point', function(e) {
                        sdebug('on point', e.data, ignorePointEvent);
                        if (ignorePointEvent) {
                            ignorePointEvent = false;
                            return;
                        }
                        var pos = selectedItem.item.profile.points[e.data.x];
                        if (selectedItem.isRoute) {

                            var data = selectedItem.mapItem.distanceFromLocation(pos);
                            sdebug('pos', pos);
                            sdebug('data', data);
                            sdebug('dataPoint', data.latitude + ',' + data.longitude);
                            currentTouchPoint = _.pick(data, 'latitude', 'longitude');

                        }
                    });
                self.onModuleLoaded = view.update;
                self.parent.mapBottomToolbar.add(view, 0);
                view.onInit(self.window, self.parent);
            }
            return view;
        };

    function unselectItem() {
        if (selectedItem) {
            // sdebug('unselectItem');
            selectedItem.mapItem.off('changed', onSelectedChanged);
            selectedItem = null;
            delete self.onRoutePress;
            delete self.onAnnotationPress;
            delete self.onLocation;
            if (startAnnot) {
                self.mapView.removeAnnotation([startAnnot, endAnnot]);
            }
            if (undendedStartRoute) {
                self.mapView.removeRoute([undendedStartRoute, undendedEndRoute]);
            }
        }
    }

    function selectItem(e) {
        var mapItem = e.annotation || e.route;
        var hadItem = !!selectedItem;
        var hasItem = !!mapItem;
        if (hadItem && mapItem && selectedItem.mapItem === mapItem) {
            return;
        }
        unselectItem();
        var shouldSelect = hasItem && mapItem.hasInfo !== false;
        // sdebug('selectItem', hadItem, hasItem);
        if (!hasItem || !shouldSelect) {
            view && view.hideMe();
            return;
        }
        if (hasItem) {
            selectedItem = {
                mapItem: mapItem,
                item: mapItem.item,
                desc: mapItem.type
            };
            selectedItem.isRoute = itemHandler.isItemARoute(selectedItem.item);
            mapItem.on('changed', onSelectedChanged);
            if (selectedItem.isRoute) {
                self.onRoutePress = onRoutePress;
                var item = selectedItem.item;
                var points = mapItem.points;
                // pinLocation = points[0];
                if (!startAnnot) {
                    startAnnot = new MapAnnotation({
                        anchorPoint: [0.34, 0.732],
                        image: app.getImagePath(itemHandler.getAnnotImage({
                            colors: app.colors.green,
                            icon: app.icons.flag,
                            iconSettings: {
                                style: 2
                            }
                        })),
                        touchable: false,
                        zIndex: 1000
                    });
                    endAnnot = new MapAnnotation({
                        anchorPoint: [0.34, 0.732],
                        image: app.getImagePath(itemHandler.getAnnotImage({
                            iconSettings: {
                                style: 2
                            },
                            colors: app.colors.red,
                            icon: app.icons.flag
                        })),
                        touchable: false,
                        zIndex: 1000
                    });
                }
                startAnnot.applyProperties({
                    latitude: item.start[0],
                    longitude: item.start[1],
                });
                endAnnot.applyProperties({
                    latitude: item.end[0],
                    longitude: item.end[1],
                });
                self.mapView.addAnnotation([startAnnot, endAnnot]);
                if (!item.startOnRoute) {
                    if (!undendedStartRoute) {
                        undendedStartRoute = new MapRoute({
                            color: 'gray',
                            lineWidth: 4
                        });
                    }
                    undendedStartRoute.points = [item.start, points[0]];
                    self.mapView.addRoute(undendedStartRoute);
                }
                if (!item.endOnRoute) {
                    if (!undendedEndRoute) {
                        undendedEndRoute = new MapRoute({
                            color: 'gray',
                            lineWidth: 4
                        });
                    }
                    undendedEndRoute.points = [_.last(points), item.end];
                    self.mapView.addRoute(undendedEndRoute);
                }
            } else {
                self.onAnnotationPress = onAnnotationPress;
            }
            self.onLocation = onLocation;
            getView()
                .setSelectedItem(selectedItem);
            // view.showMe();
        }
    }

    function moveToItem() {
        if (selectedItem) {
            if (selectedItem.isRoute) {
                self.parent.setRegion(selectedItem.mapItem.region, 0.3, true);
            } else {
                self.parent.setHighlightPoint(true);
                self.parent.updateCamera({
                    centerCoordinate: selectedItem.item
                });
            }
        }
    }

    function onSelectedChanged(e) {
        // sdebug('selectedChange');
        if (selectedItem && e.source === selectedItem.mapItem) {
            selectedItem.item = selectedItem.mapItem.item;
            selectedItem.desc = selectedItem.mapItem.type;
            view.setSelectedItem(selectedItem);
            moveToItem();
        }
    }

    function onMoved(e) {
        if (selectedItem) {
            // sdebug('onMoved');
            var item = selectedItem.item;
            var index = _.findIndex(e.items, 'id', item.id);
            // sdebug('onMoved', index);
            if (index >= 0) {
                self.parent.runMethodOnModules('runActionOnItem', e.desc.id, item, 'select');
            }
        }
    }

    function onAnnotationPress(e) {
        currentTouchPoint = null;
        if (selectedItem &&
            e.annotation === selectedItem.mapItem) {
            // sdebug('show while already selected');
            view.onItemTouched(e);
        }
    }

    function onRoutePress(e) {
        sdebug('onRoutePress');
        currentTouchPoint = null;
        if (selectedItem &&
            e.route === selectedItem.mapItem) {
            currentTouchPoint = view.onItemTouched(e);
            // if (currentTouchPoint) {
            //     ignorePointEvent = true; //there will be a point event that we can ignore
            // }
        }
    }

    function onLocation(_location) {
        if (_location === null) {
            return;
        }
        if (selectedItem) {
            view.updateLocation(_location);
        }
    }
    Object.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            unselectItem();
            view = null;
            app.off(__ITEMS__ + 'Moved', onMoved);
        }),
        onInit: function() {
            app.on(__ITEMS__ + 'Moved', onMoved);
        },
        onMapReset: function(_params) {
            if (view && !view.canShowActionButtons) {
                view.canShowActionButtons = true;
                sdebug('markerInfo', 'onMapReset', actionsVisibleBeforeHide, supplViewVisibleBeforeHide);
                view.setActionBarVisible(actionsVisibleBeforeHide);
                view.setSuppViewsVisible(supplViewVisibleBeforeHide);
                view.animateChanges();
            }

        },
        hideModule: function(_params) {
            _params = _params || {};
            // sdebug('markerInfo', 'hideModule', _params);
            // if (!!_params.bottom) {
            if (view && view.canShowActionButtons) {
                view.canShowActionButtons = false;
                actionsVisibleBeforeHide = view.actionBarVisible();
                supplViewVisibleBeforeHide = view.suppViewsVisible();
                view.setActionBarVisible(false);
                view.setSuppViewsVisible(false);
                view.animateChanges();
            }

            // }

        },
        onMapMarkerSelected: selectItem,
        // onMapHolderSingleTap: function(e) {
        //     var callbackId = e.bindId || e.source.callbackId;
        //     sdebug('markerInfo','onMapHolderSingleTap', callbackId);
        //     if (callbackId === 'grabber' || callbackId === 'grabberView') {
        //         if (currentSupplViews) {
        //             suppViewsVisible = !suppViewsVisible;
        //             view.supplHolder.animate({
        //                 height: suppViewsVisible ? 'SIZE' : 0,
        //                 duration: 200
        //             });
        //             updateGrabber(true);
        //         }
        //     } else if (callbackId === 'chart') {

        //         if (chartHighlightedPoint) {
        //             self.parent.setHighlightPoint(true);
        //             self.parent.updateCamera({
        //                 centerCoordinate: chartHighlightedPoint
        //             });
        //         }
        //     }
        // },
        onMapHolderDoubleTap: function(e) {
            var callbackId = e.bindId || e.source.callbackId;
            if (callbackId === 'chart' && currentTouchPoint) {
                self.parent.setHighlightPoint(true);
                self.parent.updateCamera({
                    centerCoordinate: currentTouchPoint,
                    zoom: 17
                });
            }
            return true;

        },

        onMapPress: function(e) {
            currentTouchPoint = null;
        },
    });

    return self;
};
