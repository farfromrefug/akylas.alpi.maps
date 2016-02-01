ak.ti.constructors.createItemInfoView = function(_args) {
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
        ANIMATION_DURATION = 200,
        actionBar = new ItemActionBar({
            bindId: 'actionBar',
            // backgroundColor: null
        }),
        self = new View({
            type: 'Ti.UI.View',
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
                }, _.assign(app.templates.row.cloneTemplateAndFill('iteminfosmallanimated', onMap ? {
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
                swipe: function(e) {
                    // sdebug(e);
                    // if (__ANDROID__) {
                    //     cancelClick = true;
                    // }
                    // sdebug('swipe', e.direction);
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
                click: function(e) {
                    // sdebug('click marker info');
                    if (cancelClick) {
                        cancelClick = false;
                        return;
                    }
                    var callbackId = e.bindId || e.source.callbackId;
                    // sdebug('click', callbackId);
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
        });

    self.setSuppViewsVisible = function(_visible) {
        if (_visible !== suppViewsVisible) {
            suppViewsVisible = _visible;
            needsAnimationChanges = true;
            // self.supplHolder.animate({
            //     height: suppViewsVisible ? 'SIZE' : 0,
            //     duration: 200
            // });
            updateGrabber(true);
        }
    }
    self.suppViewsVisible = function(_visible) {
        return suppViewsVisible;
    }

    self.animateChanges = function() {
        if (!needsAnimationChanges) {
            return;
        }
        self.animate({
            actionBar: {
                height: actionHolderVisible ? $itemActionBarHeight : 0,
            },
            infoHolder: {
                right: actionHolderVisible ? 54 : 0,
            },
            supplHolder: {
                height: suppViewsVisible ? 'SIZE' : 0,
                right: actionHolderVisible ? 0 : 50,
            },
            duration: 200
        });
    }

    self.setActionBarVisible = function(_visible) {
        if (_visible !== actionHolderVisible && (!_visible || self.canShowActionButtons)) {
            var animDuration = 100;
            actionHolderVisible = _visible;
            needsAnimationChanges = true;
        }
    }

    self.actionBarVisible = function(_visible) {
        return actionHolderVisible;
    }


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

    function updateSupplyView(_item, _desc) {
        _item = _item || selectedItem.item;
        _desc = _desc || selectedItem.desc;
        var supplViews = mapHandler.runGetMethodOnModules('getItemSupplViews', _item, _desc, {
            small: true
        });
        // sdebug('supplViews', supplViews);
        if (supplViews.length > 0) {
            for (var i = 0; i < supplViews.length; i++) {
                var value = supplViews[i];
                if (value.template && supplyViewsTemplates.hasOwnProperty(value.template)) {
                    supplViews[i] = app.templates.row.cloneTemplateAndFill(supplyViewsTemplates[value.template],
                        value);
                }
            }
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
                setTimeout(function() {
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

    self.update = function() {
        if (!selectedItem) {
            return;
        }
        var itemDesc = selectedItem.desc;
        var item = selectedItem.item;
        // sdebug('update', item);
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
    }

    function onItemSupplyViewUpdate(e) {
        if (selectedItem && selectedItem.item.id === e.item.id) {
            updateSupplyView();
            updateGrabber(true);
        }
    }

    self.onItemTouched = function(e) {
        var didSelect = null;
        if (selectedItem.item.profile) {
            var point = _.pick(e, 'latitude', 'longitude');
            var data = app.modules.map.fromPointToPath(point, selectedItem.item.profile
                .points);
            var maxDist = geolib.getMapScale(e.mpp, 100).width;
            // sdebug('point', point.latitude + ',' + point.longitude);
            // sdebug('maxDist', maxDist);
            // sdebug('data', data);
            // sdebug('dataPoint', data.latitude + ',' + data.longitude);
            if (data && data.distance <= maxDist) {
                // sdebug('clicked on route with profile', data);
                cancelClick = true; //we dont want the click to be fired and the map to move
                currentSupplViews.line.select(data.index);
                didSelect = _.pick(data, 'latitude', 'longitude');
            }
        }
        if (!visible) {
            self.show();
        }
        return didSelect;
    }

    self.updateLocation = function(_location) {
        sdebug('updateLocation', _location);
        if (_location === null) {
            return;
        }
        if (selectedItem) {
            var params = itemHandler.updateParamsForLocation(selectedItem.item, _location);
            // sdebug('MarkerInfo', 'onLocation', _location);
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
                        // sdebug('location close to profile', data);
                        var lineData = currentSupplViews.line.getDataForIndex(data.index);
                        // sdebug('lineData', lineData);
                        if (lineData) {
                            // sdebug('lineData', lineData);
                            currentSupplViews.applyProperties({
                                userLocation: {
                                    visible: true,
                                    center: [lineData.line.x, lineData.line.y]
                                }
                            });
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
    }

    self.setSelectedItem = function(_item) {
        selectedItem = _item;
        actionBar.updateForItem(selectedItem.item, selectedItem.desc, visible);
        self.update();
        // sdebug(TAG, 'setSelectedItem', _item, visible);
    }

    self.hideMe = function() {
        // sdebug(TAG, 'hideMe', visible);
        if (visible) {
            visible = false;
            self.animate({
                height: 0,
                cancelRunningAnimations: true,
                duration: ANIMATION_DURATION
            }, function() {
                self.visible = false;

            });
        }
    }

    self.showMe = function() {
        // update();
        // sdebug(TAG, 'showMe', visible);
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
    }

    app.on('distance_metric_changed', self.update);
    app.on('temp_metric_changed', updateSupplyView);
    app.on('ItemSupplyViewUpdate', onItemSupplyViewUpdate);
    self.onInit = function(_window, _mapHandler) {
        window = _window;
        mapHandler = _mapHandler;
        supplyViewsTemplates = mapHandler.runReduceMethodOnModules('getSupplyTemplates');
        actionBar.onInit(_window, _mapHandler);
    };

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
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