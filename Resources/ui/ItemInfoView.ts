declare global {
    class ItemInfoView extends View {
        setSuppViewsVisible(visible: boolean)
        suppViewsVisible(visible?: boolean)
        setActionBarVisible(visible: boolean)
        actionBarVisible(visible?: boolean)
        animateChanges()
        update()
        updateSupplyView()
        updateLocation(location)
        showMe()
        hideMe()
        setSelectedItem(item: Item)
        onInit(_window, _mapHandler)
        onItemTouched(e)
        canShowActionButtons: boolean
        grabber: View
        supplHolder: View
    }
}
export function create(_args: WindowParams) {
    var mapHandler = _.remove(_args, 'mapHandler'),
        window = _.remove(_args, 'window'),
        onMap = _.remove(_args, 'onMap', false),
        showAccessory = _.remove(_args, 'showAccessory', true),
        TAG = 'ItemInfoView',
        visible = false,
        itemHandler = app.itemHandler,
        selectedItem = null,
        actionHolderVisible = true,
        currentSupplViews,
        cancelClick = false,
        needsAnimationChanges = false,
        supplyViewsTemplates,
        suppViewsVisible = true,
        GRABBER_LENGTH_2 = 15,
        ANIMATION_DURATION = 150,
        actionBar = new ItemActionBar({
            bindId: 'actionBar',
            // backgroundColor: null
        }),
        self = new View({
            properties: _args,

            childTemplates: [{
                type: 'AkylasShapes.View',
                bindId: 'grabberView',
                properties: {
                    width: 'FILL',
                    height: 18
                },
                childTemplates: [{
                    type: 'AkylasShapes.Line',
                    bindId: 'grabber',
                    properties: {
                        touchEnabled: false,
                        retina: true,
                        antialiasing: true,
                        lineColor: '#1E1D30',
                        anchor: app.modules.shapes.CENTER,
                        lineWidth: 6,
                        lineCap: 1,
                        lineJoin: 1,
                        points: [
                            [-GRABBER_LENGTH_2, 0],
                            [0, 0],
                            [GRABBER_LENGTH_2, 0]
                        ]
                    }
                }]
            }, {
                type: 'Ti.UI.View',
                bindId: 'supplHolder',
                properties: {
                    height: 'SIZE'
                }
            }, Object.assign(app.templates.row.cloneTemplateAndFill('iteminfosmallanimated', onMap ? {
                properties: {
                    backgroundColor: null,
                    right: 54,
                },
                accessory: {
                    visible: showAccessory,
                    width: 80,
                }
            } : {
                    accessory: {
                        visible: showAccessory
                    }
                }), {
                    bindId: 'infoHolder',
                }),
                actionBar
            ],
            events: {
                swipe: function (e) {
                    // console.debug(e);
                    // if (__ANDROID__) {
                    //     cancelClick = true;
                    // }
                    // console.debug('swipe', e.direction);
                    switch (e.direction) {
                        case 'down':
                            self.setActionBarVisible(false);
                            self.animateChanges();
                            break;
                        case 'up':
                            self.setActionBarVisible(true);
                            self.animateChanges();
                            break;
                        // case 'left':
                        //     self.runAction('details');
                        //     break;
                    }
                },
                click: function (e) {
                    // console.debug('click marker info');
                    if (cancelClick) {
                        cancelClick = false;
                        return;
                    }
                    var callbackId = e.bindId || e.source.callbackId;
                    // console.debug('click', callbackId);
                    if (callbackId === 'grabber' || callbackId === 'grabberView') {
                        if (currentSupplViews) {
                            self.setSuppViewsVisible(!suppViewsVisible);
                            self.animateChanges();
                        }
                    } else {
                        self.emit('action', e);
                    }
                },
                // singletap: app.debounce(function(e) {

                // }),
            }
        }) as ItemInfoView;

    self.setSuppViewsVisible = function (_visible) {
        if (_visible !== suppViewsVisible) {
            suppViewsVisible = _visible;
            needsAnimationChanges = true;
            // self.supplHolder.animate({
            //     height: suppViewsVisible ? 'SIZE' : 0,
            //     duration: 200
            // });
            updateGrabber(true);
        }
    };
    self.suppViewsVisible = function (_visible) {
        return suppViewsVisible;
    };

    self.animateChanges = function () {
        if (!needsAnimationChanges) {
            return;
        }
        self.animate({
            actionBar: {
                height: actionHolderVisible ? $.itemActionBarHeight : 0,
            },
            infoHolder: {
                right: actionHolderVisible ? 54 : 0,
            },
            supplHolder: {
                height: suppViewsVisible ? 'SIZE' : 0,
                right: actionHolderVisible ? 0 : 50,
            },
            duration: ANIMATION_DURATION
        });
    };

    self.setActionBarVisible = function (_visible) {
        if (_visible !== actionHolderVisible && (!_visible || self.canShowActionButtons)) {
            actionHolderVisible = _visible;
            needsAnimationChanges = true;
        }
    };

    self.actionBarVisible = function (_visible) {
        return actionHolderVisible;
    };

    function updateGrabber(_animated) {
        var points;
        if (currentSupplViews) {
            if (suppViewsVisible) {
                points = [
                    [-GRABBER_LENGTH_2, -3],
                    [0, 3],
                    [GRABBER_LENGTH_2, -3]
                ];
            } else {
                points = [
                    [-GRABBER_LENGTH_2, 3],
                    [0, -3],
                    [GRABBER_LENGTH_2, 3]
                ];
            }
        } else {
            points = [
                [-GRABBER_LENGTH_2, 0],
                [0, 0],
                [GRABBER_LENGTH_2, 0]
            ];
        }
        if (_.isEqual(self.grabber.points, points)) {
            return;
        }
        if (_animated) {
            self.grabber.animate({
                duration: 300,
                points: points
            });
        } else {
            self.grabber.applyProperties({
                points: points
            });
        }
    };

    function updateSupplyView(_item?: Item, _desc?: ItemType) {
        _item = _item || selectedItem.item;
        _desc = _desc || selectedItem.desc;
        var supplViews = mapHandler.runGetMethodOnModules('getItemSupplViews', _item, _desc, {
            small: true
        });
        // console.debug('supplViews', supplViews);
        if (supplViews.length > 0) {
            for (var i = 0; i < supplViews.length; i++) {
                var value = supplViews[i];
                if (value.template && supplyViewsTemplates.hasOwnProperty(value.template)) {
                    supplViews[i] = app.templates.row.cloneTemplateAndFill(supplyViewsTemplates[value.template],
                        value);
                }
            }
            // console.debug('supplViews2', supplViews);
            var newView = new View({
                properties: {
                    layout: 'vertical',
                    height: 'SIZE'
                },
                childTemplates: supplViews
            });
            self.supplHolder.transitionViews(currentSupplViews, newView, {
                style: Ti.UI.TransitionStyle.FADE,
                duration: ANIMATION_DURATION
            });
            currentSupplViews = newView;
            if (app.currentLocation) {
                setTimeout(function () {
                    self.updateLocation(app.currentLocation);
                }, ANIMATION_DURATION);
            }
        } else if (currentSupplViews) {
            self.supplHolder.transitionViews(currentSupplViews, null, {
                style: Ti.UI.TransitionStyle.FADE,
                duration: ANIMATION_DURATION
            });
            currentSupplViews = null;
        }
    }

    self.update = function () {
        if (!selectedItem) {
            return;
        }
        var itemDesc = selectedItem.desc;
        var item = selectedItem.item;
        // console.debug('update', item);
        var args = itemHandler.infoRowItemForItem(item, itemDesc, {
            altitude: {
                visible: false
            },
            altitudeIcon: {
                visible: false
            },
            orientation: {
                visible: false
            },
            opened: {
                visible: false
            },
            opendetails: {
                visible: false
            },
            distance: {
                visible: false
            }
        });
        updateSupplyView(item, itemDesc);
        updateGrabber(true);
        self.applyProperties(args);
        actionBar.updateForItem(item, itemDesc, visible);
    };

    function onItemSupplyViewUpdate(e) {
        if (selectedItem && selectedItem.item.id === e.item.id) {
            updateSupplyView();
            updateGrabber(true);
        }
    }

    self.onItemTouched = function (e) {
        var didSelect = null;
        if (selectedItem.item.profile) {
            var point = _.pick(e, 'latitude', 'longitude');
            var data = app.modules.map.fromPointToPath(point, selectedItem.item.profile
                .points);
            var maxDist = itemHandler.geolib.getMapScale(e.mpp, 100).width;
            // console.debug('point', point.latitude + ',' + point.longitude);
            // console.debug('maxDist', maxDist);
            // console.debug('data', data);
            // console.debug('dataPoint', data.latitude + ',' + data.longitude);
            if (data && data.distance <= maxDist) {
                // console.debug('clicked on route with profile', data);
                // cancelClick = true; //we dont want the click to be fired and the map to move
                // currentSupplViews.line.select(data.index);
                currentSupplViews.chart.highlightValue({
                    datasetIndex: 0,
                    x: data.index
                });
                didSelect = _.pick(data, 'latitude', 'longitude');
            }
        }
        if (!visible) {
            self.show();
        }
        return didSelect;
    };

    self.updateLocation = function (_location) {
        if (_location === null) {
            return;
        }
        if (selectedItem) {
            var params = itemHandler.updateParamsForLocation(selectedItem.item, _location);
            // console.debug('MarkerInfo', 'onLocation', _location);
            if (actionBar) {
                actionBar.updateForItem(selectedItem.item, selectedItem.desc, true);
            }
            self.applyProperties(params);
            if (selectedItem.isRoute) {
                if (selectedItem.item.profile) {
                    var data = app.modules.map.fromPointToPath(_location, selectedItem.item
                        .profile
                        .points);
                    if (data && data.distance <= 20) {
                        console.debug('location close to profile', data);
                        if (currentSupplViews.chart) {
                            var lineData = currentSupplViews.chart.getDataForIndex(0, data.index);
                            if (lineData) {
                                console.debug('lineData', lineData);
                                currentSupplViews.applyProperties({
                                    userLocation: {
                                        visible: true,
                                        center: { x: lineData.xPx, y: lineData.yPx }
                                    }
                                });
                            }
                        }


                    } else {
                        currentSupplViews.applyProperties({
                            userLocation: {
                                visible: false
                            }
                        });
                    }
                }
            }
        }
    };

    self.setSelectedItem = function (_item) {
        selectedItem = _item;
        if (!selectedItem) {
            self.hideMe();
            return;
        }
        actionBar.updateForItem(selectedItem.item, selectedItem.desc, visible);
        self.update();
        self.showMe();
        // console.debug(TAG, 'setSelectedItem', _item, visible);
    };

    self.hideMe = function () {
        // console.debug(TAG, 'hideMe', visible);
        if (visible) {
            visible = false;
            self.animate({
                height: 0,
                cancelRunningAnimations: true,
                duration: ANIMATION_DURATION
            }, function () {
                self.visible = false;

            });
        }
    };

    self.showMe = function () {
        // update();
        // console.debug(TAG, 'showMe', visible);
        if (!visible) {
            visible = true;
            self.visible = true;
            self.animate({
                cancelRunningAnimations: true,
                height: 'SIZE',
                duration: ANIMATION_DURATION
            });
            app.showTutorials(['marker_info_details', 'marker_info_details2',
                'action_bar_longpress'
            ]);

        }
    };

    app.on('distance_metric_changed', self.update);
    app.on('temp_metric_changed', updateSupplyView);
    app.on('ItemSupplyViewUpdate', onItemSupplyViewUpdate);
    self.onInit = function (_window, _mapHandler) {
        window = _window;
        mapHandler = _mapHandler;
        supplyViewsTemplates = mapHandler.runReduceMethodOnModules('getSupplyTemplates');
        actionBar.onInit(_window, _mapHandler);
    };

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        if (actionBar) {
            actionBar.GC();
            actionBar = null;
        }
        app.off('distance_metric_changed', self.update);
        app.off('temp_metric_changed', updateSupplyView);
        app.off('ItemSupplyViewUpdate', onItemSupplyViewUpdate);
        self = null;
        window = null;
        itemHandler = null;
        mapHandler = null;
    });
    return self;
};