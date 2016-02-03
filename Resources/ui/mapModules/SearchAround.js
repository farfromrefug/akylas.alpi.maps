exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        visible = false,
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = geolib.formatter,
        searchRequest,
        faderView,
        resultViewHeight = app.deviceinfo.height * 0.5,
        animationDuration = 200,
        searchAroundItem, searchAroundItemDesc,
        lastSelectedIndex = -1,
        OSMIgnoredClass = ['highway', 'waterway', 'historic', 'railway', 'landuse', 'aeroway', 'boundary' ],
        infoRowItemForItem = itemHandler.infoRowItemForItem,
        updateParamsForLocation = itemHandler.updateParamsForLocation,
        type = itemHandler.initializeType('searchitem', _.assign(_.cloneDeep(require('data/markertypes').data[
            'searchitem']), {
            id: 'searchitem',
            iconSettings: {
                style: 0
            }
        })),
        resultsVisible = false,
        searchResultIds = [],
        cluster,
        self = new _context.MapModule(_args),
        resultView, headerView;

    function getCluster() {
        if (!cluster) {
            cluster = new MapCluster({
                image: app.getImagePath(itemHandler.getAnnotImage(type, {
                    iconSettings: {
                        style: 10,
                        scale: 0.3
                    }
                })),
                touchable: false,
                maxDistance: 20,
                showText: false,
                color: type.colors.contrast
            });
            self.mapView.addCluster(cluster);
        }
        return cluster;
    }
    var onAccessory = app.debounce(function(e) {
        var annots, index,
            selectedItem = e.item.item,
            selectedItemDesc = e.item.desc,
            isSearchResult = selectedItem.type === type.id;
        if (isSearchResult) {
            sdebug('selectedItem', selectedItem);
            var newType = selectedItemDesc.isList ? selectedItemDesc.id : 'modified';
            sdebug('newType', newType);
            var newItem = selectedItem;
            delete newItem.image;
            delete newItem.selectedImage;
            delete newItem.distance;
            _.defaultsDeep(newItem, searchAroundItem);
            newItem.type = newType;
            sdebug('newItem', newItem);
            self.parent.runMethodOnModules(
                'spreadModuleAction', {
                    id: newType,
                    command: 'create',
                    item: newItem
                });

            self.parent.runMethodOnModules(
                'spreadModuleAction', {
                    id: searchAroundItemDesc.id,
                    command: 'remove',
                    items: [searchAroundItem]
                });
            var existingItem = self.parent.runGetSingleMethodOnModules('getItem', newItem);
            searchAroundItem = existingItem.item;
            searchAroundItemDesc = existingItem.desc;

        } else {
            app.showAlert('search_around_prevent_duplicates');
        }
        hide();
        self.runAction('refresh_tags', searchAroundItem, searchAroundItemDesc);
    });

    function getResultView() {
        if (!resultView) {
            visible = true;
            headerView = new Label({
                rclass: 'SearchAroundHeader',
                backgroundColor: type.colors.color
            });
            resultView = new View({
                properties: {
                    rclass: 'SearchAroundResultView',
                    height: 0,
                },
                childTemplates: [{
                    bindId: 'listView',
                    type: 'Ti.UI.ListView',
                    properties: {
                        allowsSelection: true,
                        bubbleParent: false,
                        disableBounce: true,
                        backgroundColor: $white,
                        height: 'FILL',
                        templates: {
                            'default': app.templates.row.cloneTemplateAndFill('iteminfosmall', {
                                accessory: {
                                    visible: false,
                                    title: tr('update').toUpperCase(),
                                    width: 'SIZE',
                                    font: {
                                        size: 14,
                                    },
                                    color: type.colors.color
                                }
                            }),
                            'more': {
                                properties: {
                                    height: 42,
                                    backgroundColor: $white
                                },
                                childTemplates: [{
                                    bindId: 'title',
                                    type: 'Ti.UI.Label',
                                    properties: {
                                        width: 'FILL',
                                        height: 'FILL',
                                        color: $black,
                                        textAlign: 'center'
                                    }

                                }]
                            }
                        },

                        defaultItemTemplate: 'default',
                        sections: [{
                            headerView: headerView,
                            items: [{
                                template: 'more',
                                // title: {
                                // },
                                desc: {
                                    isMore: true
                                }
                            }]
                        }]
                    },
                    events: {
                        click: function(e) {
                            if (e.item) {
                                var annots, index,
                                    selectedItem = e.item.item,
                                    selectedItemDesc = e.item.desc,
                                    isSearchResult = selectedItem && selectedItem.type === type
                                    .id;

                                sdebug(e.bindId, isSearchResult, selectedItem);
                                if (e.bindId === 'accessory') {
                                    onAccessory(e);
                                } else {
                                    if (lastSelectedIndex === e.itemIndex) {
                                        return;
                                    }
                                    if (lastSelectedIndex >= 0) {
                                        e.section.updateItemAt(lastSelectedIndex, {
                                            accessory: {
                                                visible: false
                                            }
                                        });
                                    }
                                    if (selectedItemDesc.isMore === true) {
                                        handleNoResult(false);
                                        return;
                                    }
                                    if (isSearchResult) {
                                        annots = cluster.annotations;
                                        index = _.findIndex(annots, function(theA) {
                                            return theA.item.id === selectedItem.id;
                                        });
                                        self.mapView.selectAnnotation(annots[index]);
                                        self.parent.updateCamera({
                                            centerCoordinate: selectedItem
                                        });
                                    } else {
                                        self.parent.runMethodOnModules('runActionOnItem',
                                            selectedItemDesc.id,
                                            selectedItem, 'select');
                                    }
                                    e.section.updateItemAt(e.itemIndex, {
                                        accessory: {
                                            visible: true
                                        }
                                    });
                                    lastSelectedIndex = e.itemIndex;
                                }
                            }
                        }
                    }
                }, {
                    type: 'Ti.UI.Label',
                    properties: {
                        text: trc('cancel').toUpperCase(),
                        width: 'FILL',
                        textAlign: 'center',
                        bubbleParent: false,
                        color: app.colors.red.color,
                        height: 40,
                        backgroundColor: $white,
                        backgroundSelectedColor: app.colors.red.darker,
                    },
                    events: {
                        click: hide
                    }

                }]
            });
            self.parent.mapBottomToolbar.add(resultView);
            self.onMapPress = function() {
                return true;
            };
            // app.on('location', onLocation);
        }
        return resultView;
    }

    function createListItem(_item, _itemDesc) {
        var args = infoRowItemForItem(_item, _itemDesc);
        return args;
    }

    var radiusIndex = 0;
    var radiuses = [50, 200, 500];

    function handleSearch() {
        sdebug('searchAround', radiuses[radiusIndex]);
        
        var request = app.api.searchOSM2({
            // query: searchAroundItem.address,
            centerCoordinate: searchAroundItem,
            silent: true,
            radius: radiuses[radiusIndex]
        }, onSearchAround);
        self.window.showLoading({
            request:request,
            label:{
                text:trc('searching') + '...'
            }
        });
    }

    function handleNoResult(_ask) {
        radiusIndex++;
        if (radiusIndex >= radiuses.length) {
            if (_ask !== false) {
                app.showAlert(trc('no_result'));
            } else {
                app.showMessage(trc('no_result'), type.colors);
            }
            return;
            //no more result
        }

        if (_ask !== false) {
            app.confirmAction({
                'title': trc('no_result_in_a_{1}_radius').assign(formatter.distance(radiuses[radiusIndex -
                    1])),
                'message': trc('do_you_want_to_look_for_more') + '?',
                buttonNames: [trc('no'), trc('yes')]
            }, function() {
                handleSearch();
            });
        } else {
            handleSearch();

        }

    }

    function onSearchAround(result) {
        self.window.hideLoading();
        if (!result.error) {
            if (result && result.length > 0) {
                onOSMSearchResults(radiuses[radiusIndex], radiuses[radiusIndex + 1], result);
            } else {
                handleNoResult();
            }
        }

    }

    function onOSMSearchResults(_radius, _moreRadius, _results) {
        var section = resultView && resultView.listView.getSectionAt(0);
        var existingItems = section ? section.items : [];
        var length = existingItems.length;
        var clusterAnnots = [],
            annot, newItem, newItemDesc;
        sdebug('onOSMSearchResults', existingItems);
        var items = _.reduce(_results, function(memo, result) {
            var alreadyIn = _.findIndex(existingItems, function(it) {
                return it.item && it.item.id === result.id;
            }) !== -1;
            var existingItem = self.parent.runGetSingleMethodOnModules('getItem', result);
            if (!alreadyIn && (!existingItem || existingItem.desc.isList === false)) {
                if (existingItem) {
                    newItem = createListItem(existingItem.item, existingItem.desc);
                    memo.push(newItem);
                    existingItems.push(newItem);
                    searchResultIds.push(newItem.id);
                } else {
                    result.type = type.id;
                    if (result.icon || result.color) {
                        result.image = result.selectedImage = itemHandler.getAnnotImage(type,
                            result);
                        result.selectedImage = itemHandler.getAnnotImage(type, result, true);
                    }
                    newItem = createListItem(result, type);
                    memo.push(newItem);
                    existingItems.push(newItem);
                    searchResultIds.push(newItem.id);
                    annot = new MapAnnotation(itemHandler.annotationParamsFromItem(result, type));
                    clusterAnnots.push(annot);
                }
            }
            annot = undefined;
            return memo;
        }, []);
        if (existingItems.length === 0) {
            handleNoResult();
            return;
        }

        getResultView();
        if (!section) {
            section = resultView.listView.getSectionAt(0);
            length = 1; //because of more
        }
        headerView.html = trc('results_in_a_{1}_radius').assign(formatter.distance(_radius));
        // var items = 
        section.insertItemsAt(Math.max(length - 1, 0), items);
        sdebug('length', length);
        length += items.length;
        sdebug('length', length);
        if (!_moreRadius) {
            section.deleteItemsAt(length - 1, 1, {
                animated: false
            });
        } else {
            section.updateItemAt(length - 1, {
                title: {
                    text: trc('more') + ' (' + formatter.distance(_moreRadius) + ')'
                },
            });
        }
        // sections.push(section);
        // });

        var region = geolib.getBoundsOfDistance(searchAroundItem, _radius);

        getCluster().addAnnotation(clusterAnnots);
        self.parent.runMethodOnModules('hideModule', {
            bottom: true,
            top: true
        });
        resultView.animate({
            height: resultViewHeight,
            duration: animationDuration
        }, function() {
            self.parent.setRegion(region, 0.4, true);
        });
        if (!faderView) {
            faderView = new View({
                properties: {
                    backgroundGradient: {
                        type: 'radial',
                        colors: [{
                            color: '#33000000',
                            offset: 0
                        }, {
                            color: '#33000000',
                            offset: 0.8
                        }, {
                            color: '#aa000000',
                            offset: 1
                        }]
                    },
                    opacity: 0,
                }
            });
            self.parent.childrenHolder.add(faderView);

            faderView.animate({
                opacity: 1,
                duration: animationDuration
            });
        }

        // self.parent.setMapPadding('searcharound', {
        //     bottom: resultView.listView.rect.height
        // }, animationDuration);
    }

    // function onLocation(e) {
    //     var location = e.location;
    //     var section = resultView.listView.sections[0];
    //     var update = _.reduce(section.items, function(memo, item) {
    //         memo.push(updateParamsForLocation(item.item, location));
    //         return memo;
    //     }, []);
    //     section.updateItems(update);
    // }

    function hide() {
        if (visible) {
            visible = false;
            self.parent.runMethodOnModules('runActionOnItem', searchAroundItemDesc.id, searchAroundItem, 'select');
            searchResultIds = [];
            if (searchRequest) {
                searchRequest.abort();
                searchRequest = undefined;
            }
            resultsVisible = false;
            // self.parent.removeMapPadding('searcharound', animationDuration);
            // app.off('location', onLocation);
            if (resultView) {
                headerView = null;
                faderView.animate({
                    opacity: 0,
                    duration: animationDuration
                }, function() {
                    self.parent.childrenHolder.remove(faderView);
                    faderView = null;
                });
                resultView.animate({
                    height: 0,
                    duration: animationDuration
                }, function() {
                    self.parent.mapBottomToolbar.remove(resultView);
                    resultView = null;
                });

            }
            if (cluster) {
                self.mapView.removeCluster(cluster);
                cluster = null;
            }
            delete self.onMapPress;
            self.parent.runMethodOnModules('onMapReset', {
                bottom: true,
                top: true
            });
        }
    }
    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            cluster = null;
            searchView = null;
            faderView = null;
            resultView = null;
        }),
        onInit: function() {},
        onWindowBack: function() {
            sdebug('onWindowBack', visible);
            if (visible) {
                hide();
                return true;
            }
        },
        // hideModule: hide,
        onModuleAction: function(_params) {
            if (_params.command === 'searcharound') {
                lastSelectedIndex = -1;
                searchAroundItem = _params.item;
                searchAroundItemDesc = _params.desc;
                radiusIndex = 0;
                if (searchAroundItem.osm && !_.contains(OSMIgnoredClass, searchAroundItem.osm.class)) {
                    // sdebug('test', _.keys(_params));
                    // self.runAction('refresh_tags', searchAroundItem, searchAroundItemDesc);
                    app.itemHandler.handleItemAction('refresh_tags', searchAroundItem, searchAroundItemDesc, undefined, _params.parent || self.window,
                    _params.mapHandler || self.parent);
                } else {
                    self.window.manager.closeToRootWindow();
                    handleSearch();

                }
            } else {
                return false;
            }
            return true;
        }
    });
    return self;
};