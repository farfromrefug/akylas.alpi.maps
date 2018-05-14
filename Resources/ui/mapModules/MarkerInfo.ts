import { MapModule } from './MapModule';
export class MarkerInfo extends MapModule {
    visible = false;
    selectedItem = null;
    ignorePointEvent = false;
    cancelClick = false;
    actionsVisibleBeforeHide = false;
    supplViewVisibleBeforeHide = false;
    currentTouchPoint;
    startAnnot;
    endAnnot;
    undendedStartRoute;
    undendedEndRoute;
    view:ItemInfoView;
    onModuleLoaded?;
    constructor(_context, _args, _additional) {
        super(_args);
    }
    GC() {
        super.GC();
        app.off(_EVENT_ITEMS_MOVED_, this.onMoved);
        this.unselectItem();
        this.view = null;
    }
    onInit() {
        app.on(_EVENT_ITEMS_MOVED_, this.onMoved);
    }
    runAction = (_action, _callback?) => {
        this.itemHandler.handleItemAction(_action, this.selectedItem.item, this.selectedItem.desc, _callback, this.window, this.parent);
    };
    getView = () => {
        if (!this.view) {
            this.view = new ItemInfoView({
                onMap: true
            });
            this.view
                .on('action', e => {
                    var callbackId = e.bindId || e.source.callbackId;
                    // sdebug('action', callbackId);
                    if (callbackId === 'type' || callbackId === 'accessory') {
                        this.runAction('details');
                    } else if (callbackId === 'chart') {
                        if (this.currentTouchPoint) {
                            this.parent.setHighlightPoint(true);
                            this.parent.updateCamera({
                                centerCoordinate: this.currentTouchPoint
                            });
                        }
                    } else {
                        this.moveToItem();
                    }
                })
                .on('point', e => {
                    sdebug('on point', e.data, this.ignorePointEvent);
                    if (this.ignorePointEvent) {
                        this.ignorePointEvent = false;
                        return;
                    }
                    var pos = this.selectedItem.item.profile.points[e.data.x];
                    if (this.selectedItem.isRoute) {
                        var data = this.selectedItem.mapItem.distanceFromLocation(pos);
                        sdebug('pos', pos);
                        sdebug('data', data);
                        sdebug('dataPoint', data.latitude + ',' + data.longitude);
                        this.currentTouchPoint = _.pick(data, 'latitude', 'longitude');
                    }
                });
            this.onModuleLoaded = this.view.update;
            this.parent.mapBottomToolbar.add(this.view, 0);
            this.view.onInit(this.window, this.parent);
        }
        return this.view;
    };

    unselectItem = () => {
        if (this.selectedItem) {
            // sdebug('unselectItem');
            this.selectedItem.mapItem.off('changed', this.onSelectedChanged);
            this.selectedItem = null;
            delete this.onRoutePress;
            delete this.onAnnotationPress;
            delete this.onLocation;
            if (this.startAnnot) {
                this.mapView.removeAnnotation([this.startAnnot, this.endAnnot]);
            }
            if (this.undendedStartRoute) {
                this.mapView.removeRoute([this.undendedStartRoute, this.undendedEndRoute]);
            }
        }
    };

    onMapMarkerSelected = e => {
        var mapItem = e.annotation || e.route;
        var hadItem = !!this.selectedItem;
        var hasItem = !!mapItem;
        if (hadItem && mapItem && this.selectedItem.mapItem === mapItem) {
            return;
        }
        this.unselectItem();
        var shouldSelect = hasItem && mapItem.hasInfo !== false;
        // sdebug('selectItem', hadItem, hasItem);
        if (!hasItem || !shouldSelect) {
            this.view && this.view.hideMe();
            return;
        }
        if (hasItem) {
            this.selectedItem = {
                mapItem: mapItem,
                item: mapItem.item,
                desc: mapItem.type
            };
            this.selectedItem.isRoute = this.itemHandler.isItemARoute(this.selectedItem.item);
            mapItem.on('changed', this.onSelectedChanged);
            if (this.selectedItem.isRoute) {
                this.onRoutePress = this.onRoutePress;
                var item = this.selectedItem.item;
                var points = mapItem.points;
                // pinLocation = points[0];
                if (!this.startAnnot) {
                    this.startAnnot = new MapAnnotation({
                        anchorPoint: [0.34, 0.732],
                        image: app.getImagePath(
                            this.itemHandler.getAnnotImage({
                                colors: app.colors.green,
                                icon: app.icons.flag,
                                iconSettings: {
                                    style: 2
                                }
                            })
                        ),
                        touchable: false,
                        zIndex: 1000
                    });
                    this.endAnnot = new MapAnnotation({
                        anchorPoint: [0.34, 0.732],
                        image: app.getImagePath(
                            this.itemHandler.getAnnotImage({
                                iconSettings: {
                                    style: 2
                                },
                                colors: app.colors.red,
                                icon: app.icons.flag
                            })
                        ),
                        touchable: false,
                        zIndex: 1000
                    });
                }
                this.startAnnot.applyProperties({
                    latitude: item.start[0],
                    longitude: item.start[1]
                });
                this.endAnnot.applyProperties({
                    latitude: item.end[0],
                    longitude: item.end[1]
                });
                this.mapView.addAnnotation([this.startAnnot, this.endAnnot]);
                if (!item.startOnRoute) {
                    if (!this.undendedStartRoute) {
                        this.undendedStartRoute = new MapRoute({
                            color: 'gray',
                            lineWidth: 4
                        });
                    }
                    this.undendedStartRoute.points = [item.start, points[0]];
                    this.mapView.addRoute(this.undendedStartRoute);
                }
                if (!item.endOnRoute) {
                    if (!this.undendedEndRoute) {
                        this.undendedEndRoute = new MapRoute({
                            color: 'gray',
                            lineWidth: 4
                        });
                    }
                    this.undendedEndRoute.points = [_.last(points), item.end];
                    this.mapView.addRoute(this.undendedEndRoute);
                }
            } else {
                this.onAnnotationPress = this.onAnnotationPress;
            }
            this.onLocation = this.onLocation;
            this.getView().setSelectedItem(this.selectedItem);
            // view.showMe();
        }
    };

    moveToItem = () => {
        if (this.selectedItem) {
            if (this.selectedItem.isRoute) {
                this.parent.setRegion(this.selectedItem.mapItem.region, 0.3, true);
            } else {
                this.parent.setHighlightPoint(true);
                this.parent.updateCamera({
                    centerCoordinate: this.selectedItem.item
                });
            }
        }
    };

    onSelectedChanged = e => {
        // sdebug('selectedChange');
        if (this.selectedItem && e.source === this.selectedItem.mapItem) {
            this.selectedItem.item = this.selectedItem.mapItem.item;
            this.selectedItem.desc = this.selectedItem.mapItem.type;
            this.view.setSelectedItem(this.selectedItem);
            this.moveToItem();
        }
    };

    onMoved = e => {
        if (this.selectedItem) {
            // sdebug('onMoved');
            var item = this.selectedItem.item;
            var index = _.findIndex(e.items, 'id', item.id);
            // sdebug('onMoved', index);
            if (index >= 0) {
                this.parent.runMethodOnModules('runActionOnItem', e.desc.id, item, 'select');
            }
        }
    };

    onAnnotationPress = e => {
        this.currentTouchPoint = null;
        if (this.selectedItem && e.annotation === this.selectedItem.mapItem) {
            // sdebug('show while already selected');
            this.view.onItemTouched(e);
        }
    };

    onRoutePress = e => {
        sdebug('onRoutePress');
        this.currentTouchPoint = null;
        if (this.selectedItem && e.route === this.selectedItem.mapItem) {
            this.currentTouchPoint = this.view.onItemTouched(e);
            // if (currentTouchPoint) {
            //     ignorePointEvent = true; //there will be a point event that we can ignore
            // }
        }
    };

    onLocation = _location => {
        if (_location === null) {
            return;
        }
        if (this.selectedItem && this.view) {
            this.view.updateLocation(_location);
        }
    };
    
    onMapReset = _params => {
        if (this.view && !this.view.canShowActionButtons) {
            this.view.canShowActionButtons = true;
            sdebug('markerInfo', 'onMapReset', this.actionsVisibleBeforeHide, this.supplViewVisibleBeforeHide);
            this.view.setActionBarVisible(this.actionsVisibleBeforeHide);
            this.view.setSuppViewsVisible(this.supplViewVisibleBeforeHide);
            this.view.animateChanges();
        }
    };
    hideModule = _params => {
        _params = _params || {};
        // sdebug('markerInfo', 'hideModule', _params);
        // if (!!_params.bottom) {
        if (this.view && this.view.canShowActionButtons) {
            this.view.canShowActionButtons = false;
            this.actionsVisibleBeforeHide = this.view.actionBarVisible();
            this.supplViewVisibleBeforeHide = this.view.suppViewsVisible();
            this.view.setActionBarVisible(false);
            this.view.setSuppViewsVisible(false);
            this.view.animateChanges();
        }

        // }
    };
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
    onMapHolderDoubleTap = e => {
        var callbackId = e.bindId || e.source.callbackId;
        if (callbackId === 'chart' && this.currentTouchPoint) {
            this.parent.setHighlightPoint(true);
            this.parent.updateCamera({
                centerCoordinate: this.currentTouchPoint,
                zoom: 17
            });
        }
        return true;
    };

    onMapPress = e => {
        this.currentTouchPoint = null;
    };
}

export function create(_context, _args, _additional) {
    return new MarkerInfo(_context, _args, _additional);
};