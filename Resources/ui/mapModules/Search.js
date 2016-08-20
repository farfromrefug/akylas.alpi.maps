exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        visible = false,
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        htmlIcon = app.utilities.htmlIcon,
        searchRequest,
        photonSearchRequest,
        cleanUpString = app.api.cleanUpString,
        animationDuration = 200,
        infoRowItemForItem = itemHandler.infoRowItemForItem,
        updateParamsForLocation = itemHandler.updateParamsForLocation,
        type = itemHandler.initializeType('searchitem', _.cloneDeep(require('data/markertypes').data[
            'searchitem'])),
        sattype = itemHandler.initializeType('satitem', _.cloneDeep(require('data/markertypes').data[
            'satitem'])),
        resultsVisible = false,
        searchResultIds = null,
        searchFilters = [],
        enabledSearchFilters = [],
        cluster,
        searchRoutes = [],
        self = new _context.MapModule(_args),
        resultView,
        satSection = new ListSection(),
        satCount = 0,
        resultViewHeight = Math.round(app.deviceinfo.height * 0.4),
        searchAsTypeTimer,
        searchHistory = Ti.App.Properties.getObject('search.history', []),
        searchWindow,
        searchView,
        currentInstantSearch,
        getSearchView = function() {
            if (!searchView) {
                var filters = self.parent.runGetMethodOnModules(true, 'getSearchFilters');
                searchView = new View({
                    properties: {
                        top: $navBarTop,
                        rclass: 'SearchView',
                        bubbleParent: false
                    },
                    childTemplates: [{
                        type: 'Ti.UI.View',
                        properties: {
                            rclass: 'InternalElevatedView',
                            backgroundColor: $white,
                            borderRadius: 2,
                            zIndex: 10,
                            layout: 'vertical',
                            height: 'SIZE'
                        },
                        childTemplates: [{
                            type: 'Ti.UI.View',
                            properties: {
                                layout: 'horizontal',
                                height: 44,
                            },

                            childTemplates: [{
                                bindId: 'cancel',
                                type: 'Ti.UI.Label',
                                properties: {
                                    rclass: 'WhiteOptionButton',
                                    text: $sClose
                                }
                            }, {
                                type: 'Ti.UI.TextField',
                                bindId: 'textfield',
                                properties: {
                                    rclass: 'SearchTextField',
                                    value:currentInstantSearch
                                },

                                events: {
                                    change: function(e) {
                                        currentInstantSearch = e.value;
                                        instantSearch(currentInstantSearch);
                                    },
                                    focus: function() {
                                        if (searchFilters.length > 0) {
                                            if (visible) {
                                                searchView.filtersHolder.animate({
                                                    height: 'SIZE',
                                                    duration: 100
                                                });
                                            }
                                        }
                                    },
                                    blur: function() {
                                        if (searchFilters.length > 0) {
                                            if (visible) {
                                                searchView.filtersHolder.animate({
                                                    height: 0,
                                                    duration: 100
                                                });
                                            }

                                        }
                                    },
                                    return: function(e) {

                                        clearInstantSearch();
                                        if (e.value && e.value.length > 0) {
                                            search(e.value);
                                        }
                                    },
                                }
                            }, {
                                // properties: {
                                //     right: 0,
                                //     width: 40,
                                //     height: 'FILL'
                                // },
                                // childTemplates: [{
                                bindId: 'loading',
                                type: 'Ti.UI.ActivityIndicator',
                                properties: {
                                    rclass: 'SearchLoadingIndicator',
                                    visible: false,
                                },
                                // }]
                            }],

                        }, {
                            type: 'Ti.UI.View',
                            bindId: 'filtersHolder',
                            properties: {
                                height: 0,
                            },
                            childTemplates: [{
                                type: 'Ti.UI.ScrollView',
                                bindId: 'scrollableFilters',
                                properties: {
                                    rclass: 'SearchFeaturesFilter',
                                    // visible: false,
                                    visible: filters.length > 0,
                                },
                                childTemplates: _.reduce(filters, function(memo,
                                    value) {
                                    searchFilters.push(value.id);
                                    enabledSearchFilters.push(value.id);
                                    memo.push(new ActionButton(value));
                                    return memo;
                                }, [])
                            }],
                            events: {
                                click: function(e) {
                                    sdebug(e.source);
                                    var id = e.source.callbackId;
                                    if (!id) {
                                        return;
                                    }
                                    var enabled = e.source.isEnabled();
                                    sdebug(id, enabled);
                                    if (enabled) {
                                        _.remove(enabledSearchFilters, function(n) {
                                            return n === id;
                                        });
                                    } else {
                                        enabledSearchFilters.push(id);
                                    }
                                    e.source.setEnabled(!enabled);
                                    sdebug(enabledSearchFilters);
                                }
                            }

                        }]
                    }, {
                        type: 'Ti.UI.ListView',
                        bindId: 'satListView',
                        properties: {
                            // top: 20,
                            bottom: 0,
                            bubbleParent: false,
                            templates: {
                                'default': app.templates.row.search
                            },
                            defaultItemTemplate: 'default',
                            sections: [satSection]
                        },
                        events: {
                            click: app.debounce(function(e) {
                                if (e.item) {
                                    if (e.bindId === 'accessory') {
                                        self.parent.updateCamera({
                                            centerCoordinate: _.pick(e.item.item,
                                                'latitude',
                                                'longitude')
                                        });
                                    } else {
                                        handleOnAdd(e, false, false);
                                    }
                                    hide();
                                }
                            })
                        }
                    }],
                    events: {

                        click: function(e) {
                            if (e.bindId === 'cancel') {
                                hide();
                            }
                        }
                    }
                });
                // searchView.applyProperties({
                //     scrollableFilters: {

                //     }
                // });
            }
            return searchView;
        };

    function getCluster() {
        if (!cluster) {
            sdebug('search type', type);
            cluster = new MapCluster({
                image: app.getImagePath(itemHandler.getAnnotImage(type, {
                    iconSettings: {
                        style: 10,
                        // scale: 0.3
                    }
                })),
                touchable: false,
                maxDistance: 20,
                showText: false,
                // color: type.colors.contrast
            });
            self.mapView.addCluster(cluster);
        }
        return cluster;
    }

    function clearInstantSearch() {
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
            searchAsTypeTimer = null;
        }
        if (photonSearchRequest) {
            photonSearchRequest.abort();
            photonSearchRequest = null;
        }
        // searchView.satListView.animate({
        //     height: 1,
        //     duration: 100
        // }, function() {
        satSection.items = [];
        satCount = 0;
        // });
    }

    function satItem(_item, _itemDesc) {
        return {
            icon: {
                text: _item.icon || _itemDesc.icon,
            },
            title: {
                text: itemHandler.itemTitle(_item, _itemDesc)
            },
            subtitle: {
                html: itemHandler.itemSubtitle(_item, _itemDesc)
            },
            item: _item,
            desc: _itemDesc
        };
    }

    function instantSearch(_query) {
        // sdebug('test1', _query, !searchView);
        if (!searchView) {
            return;
        }
        _query = cleanUpString(_query);
        // sdebug('test2', _query);
        if (searchAsTypeTimer) {
            clearTimeout(searchAsTypeTimer);
        }
        if (_query && _query.length > 2) {
            // sdebug('instantSearch', _query);
            searchAsTypeTimer = setTimeout(function() {
                searchAsTypeTimer = null;
                if (photonSearchRequest) {
                    photonSearchRequest.abort();
                    photonSearchRequest = null;
                }

                var items = [];
                var instantItems = self.parent.runReduceMethodOnModules('searchItems', _query);
                sdebug(instantItems);
                _.each(instantItems, function(list) {
                    _.each(list.items, function(item) {
                        items.push(satItem(item, list.desc));
                    });
                });
                satSection.items = items;
                satCount = items.length;
                if (satCount > 0) {
                    // searchView.satListView.animate({
                    //     height: 150,
                    //     duration: 100
                    // });
                } else {
                    clearInstantSearch();
                }
                // sdebug('search photon');
                searchView.loading.show();
                photonSearchRequest = app.api.photonSearch(_.assign({
                        query: _query,
                    }, settings.currentLocation),
                    onPhotonSearch);

            }, 400);
        } else {
            clearInstantSearch();
        }
    }

    function onPhotonSearch(_results) {
        if (!searchView) {
            return;
        }
        photonSearchRequest = null;
        var hasResults = _results && _results.length > 0;
        if (!hasResults) {
            if (satCount === 0) {
                clearInstantSearch();
            }
            return;
        }
        // sdebug('onPhotonSearch', _results);
        var existing, itemDesc, item;
        var newItems = _.reduce(_results, function(memo, value) {
            existing = self.parent.runGetSingleMethodOnModules('getItem', value);
            if (existing) {
                // value = existing.item;
                // itemDesc = existing.desc;
                // existing = true;
            } else {
                itemDesc = sattype;
                value.type = type.id;
                item = satItem(value, itemDesc);
                item.existing = existing;
                memo.push(item);
            }
            // item = infoRowItemForItem(value, itemDesc, null, null);
            // item.existing = existing;
            // memo.push(item);
            return memo;
        }, []);
        satSection.appendItems(newItems, {
            animated: true
        });
        // searchView.satListView.sections = [{
        //     items: _.reduce(_results, function(memo, value) {
        //         existing = self.parent.runGetSingleMethodOnModules('getItem', value);
        //         if (existing) {
        //             // value = existing.item;
        //             // itemDesc = existing.desc;
        //             // existing = true;
        //         } else {
        //             itemDesc = sattype;
        //             value.type = type.id;
        //             item = infoRowItemForItem(value, itemDesc);
        //             item.existing = existing;
        //             memo.push(item);
        //         }
        //         // item = infoRowItemForItem(value, itemDesc, null, null);
        //         // item.existing = existing;
        //         // memo.push(item);
        //         return memo;
        //     }, [])
        // }];
        // if (currentCount === 0 && newItems.length > 0) {
        //     searchView.satListView.animate({
        //         height: 150,
        //         duration: 100
        //     });
        // }
        if (!searchRequest) {
            searchView.loading.hide();
        }
    }

    function onMapMarkerSelected(e, _item, _itemDesc) {
        if (_item) {
            // sdebug('onMarkerSelected', _item);
            // var index = searchResultIds.indexOf(_item.id);
            if (searchResultIds.hasOwnProperty(_item.id)) {
                var index = searchResultIds[_item.id];
                if (index) {
                    resultView.listView.selectItem(index[0], index[1], {
                        animated: true
                    });
                    return;
                    // return true;
                }

            }
        }
        resultView.listView.deselectAll(true);
        // return true;
    }

    function handleOnAdd(e, _showDetails, _updateListView) {
        var annots, index,
            item = e.item.item,
            desc = e.item.desc;
        var newType = (item.type === type.id || item.type === sattype.id) ? 'modified' : desc.id;
        if (!e.item.existing) {
            item.type = newType;
            sdebug('adding search item', item.id);
            self.parent.runMethodOnModules(
                'spreadModuleAction', {
                    id: __ITEMS__,
                    list: newType,
                    command: 'create_list',
                    onlyIfExists: true
                });
            self.parent.runMethodOnModules(
                'spreadModuleAction', {
                    id: newType,
                    command: 'add',
                    items: [item]
                });
            var newItem = self.parent.runGetSingleMethodOnModules('getItem', item);
            var isRoute = itemHandler.isItemARoute(newItem);
            if (isRoute) {
                var routes = searchRoutes.splice(e.item.routeIndex, 1);
                self.mapView.removeRoute(routes);
            } else {
                if (cluster) {
                    annots = cluster.annotations;
                    index = _.findIndex(annots, function(theA) {
                        return theA.item.id === item.id;
                    });
                    if (index >= 0) {
                        cluster.removeAnnotation(annots[index]);

                        // if (annots.length === 1) {
                        //     clearSearch();
                        // }
                    }
                }
            }
            if (_updateListView !== false) {
                e.section.updateItemAt(e.itemIndex,
                    createListItem(newItem.item, newItem.desc, true), {
                        animated: true
                    });
            }

            self.runAction('select', item, desc);
        } else {
            self.runAction(!!_showDetails ? 'details' : 'select', item, desc);
        }

    }

    var onAccessory = app.debounce(function(e) {
        handleOnAdd(e, true);
    });

    function getResultView() {
        if (!resultView) {
            resultView = new View({
                properties: {
                    rclass: 'SearchResultView',
                    layout: 'vertical',
                    height: 0,
                },
                childTemplates: [{
                    bindId: 'listView',
                    type: 'Ti.UI.ListView',
                    properties: {
                        allowsSelection: true,
                        bubbleParent: false,
                        height: resultViewHeight - 40,
                        templates: {
                            'default': app.templates.row.iteminfosmall
                        },
                        defaultItemTemplate: 'default',
                    },
                    events: {
                        click: function(e) {
                            if (e.item) {
                                var annots, index,
                                    item = e.item.item,
                                    desc = e.item.desc,
                                    existing = !!e.item.existing;

                                sdebug('click', e.bindId, existing, item.id);
                                if (e.bindId === 'accessory') {
                                    onAccessory(e);
                                } else {
                                    if (!existing) {
                                        var isRoute = itemHandler.isItemARoute(item);
                                        if (isRoute) {
                                            var route = searchRoutes[e.item.routeIndex];
                                            self.mapView.selectAnnotation(route);
                                            self.parent.setRegion(route.region, 0.3, true);
                                        } else {
                                            annots = cluster.annotations;
                                            index = _.findIndex(annots, function(theA) {
                                                return theA.item.id === item.id;
                                            });
                                            self.mapView.selectAnnotation(annots[index]);
                                            self.parent.updateCamera({
                                                centerCoordinate: item,
                                            });
                                        }

                                    } else {
                                        self.parent.runMethodOnModules('runActionOnItem',
                                            desc.id,
                                            item, 'select');
                                    }
                                    // annot = cluster.getAnnotation(e.itemIndex);

                                    // self.mapView.selectAnnotation(searchAnnots[e.itemIndex]);
                                    // self.mapView.updateCamera({
                                    //     centerCoordinate: item.data,
                                    //     animated: true
                                    // });
                                }

                            }
                        }
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'cancelBtn',
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
        }
        return resultView;
    }

    function createListItem(_item, _itemDesc, _existing) {

        var args = infoRowItemForItem(_item, _itemDesc);
        args.existing = _existing;
        args.accessory = {
            title: _existing ? $sRight : $sAdd,
            color: args.icon.color
        }
        return args;
    }

    function showSearchResults(res, chainOrError, onDone) {
        // sdebug('showSearchResults', res, errors);
        var errors = (chainOrError.error ? chainOrError.error() : chainOrError.error);
        var hasResult = _.size(res) > 0;
        var hasError = (errors && errors.length > 0);
        if (!hasResult && !hasError) {
            app.showAlert(trc('no_result_found'));
        }
        if (hasError || !hasResult) {
            clearSearch(false);
            onDone();
            return;
        }
        self.parent.runMethodOnModules('hideModule', {
            bottom: true,
            top: true
        });
        resultsVisible = true;
        // if (visible) {
        //     searchView.cancel.applyProperties({
        //         text: $sClose,
        //         visible: true
        //     });
        // } else {

        // }
        self.onMapMarkerSelected = onMapMarkerSelected;
        searchResultIds = {};
        var sectionsCount = 0,
            sectionItems, items = [],
            color, existing, annot, itemDesc, clusterAnnots = [],
            value, i, sectionType, isRoute;
        var sections = _.reduce(res, function(memo, results) {
            sectionType = (results.type && _.defaults({
                color: type.color,
                colors: type.colors,
            }, results.type)) || type;
            sectionItems = [];
            for (i = 0; i < results.items.length; i++) {
                value = results.items[i];
                existing = self.parent.runGetSingleMethodOnModules('getItem', value);
                color = sectionType.colors.color;
                isRoute = itemHandler.isItemARoute(value);
                if (existing) {
                    value = existing.item;
                    isRoute = itemHandler.isItemARoute(value);
                    annot = existing.annotation;
                    itemDesc = existing.desc;
                    color = existing.desc.colors.color;
                    existing = true;
                } else {
                    itemDesc = sectionType;
                    value.type = sectionType.id;
                }

                searchResultIds[value.id] = [sectionsCount, i];
                var item = createListItem(value, itemDesc, existing);
                if (!isRoute) {
                    items.push(value);
                    if (!existing) {
                        if (value.icon || value.color) {
                            value.image = value.selectedImage = itemHandler.getAnnotImage(
                                sectionType,
                                value);
                            value.selectedImage = itemHandler.getAnnotImage(sectionType, value,
                                true);
                        }
                        annot = new MapAnnotation(itemHandler.annotationParamsFromItem(value,
                            sectionType));
                        clusterAnnots.push(annot);
                    }
                } else {
                    if (!existing) {
                        item.routeIndex = searchRoutes.length;
                        searchRoutes.push(new MapRoute(itemHandler.routeParamsFromItem(value,
                            sectionType)));
                    }
                }
                sectionItems.push(item);

                annot = undefined;
            }
            memo.push({
                headerView: ak.ti.style({
                    type: 'Ti.UI.Label',
                    properties: {
                        rclass: 'SectionHeaderLabel',
                        backgroundColor: sectionType.colors.color,
                        color: sectionType.colors.contrast,
                        html: htmlIcon(sectionType.icon, 1) + ' ' + sectionType.title
                    }
                }),
                // headerTitle: sectionType.title,
                items: sectionItems
            });
            sectionsCount++;
            return memo;
        }, []);
        var region;
        if (clusterAnnots.length > 0) {
            getCluster().annotations = clusterAnnots;
            region = getCluster().region;
        }
        if (searchRoutes.length > 0) {
            if (!region) {
                region = {
                    ne: {
                        latitude: -90,
                        longitude: -180
                    },
                    sw: {
                        latitude: 90,
                        longitude: 180
                    }
                };
            }
            for (i = 0; i < searchRoutes.length; i++) {
                var theR = searchRoutes[i].region;
                region.ne.latitude = Math.max(region.ne.latitude, theR.ne.latitude);
                region.ne.longitude = Math.max(region.ne.longitude, theR.ne.longitude);
                region.sw.latitude = Math.min(region.sw.latitude, theR.sw.latitude);
                region.sw.longitude = Math.min(region.sw.longitude, theR.sw.longitude);
            }
        }
        getResultView();
        // resultView.listView.once('postlayout', function() {
        // });
        resultView.applyProperties({
            // cancelBtn: {
            //     visible: !visible
            // },
            listView: {
                sections: sections
            }
        }, true);
        resultView.animate({
            height: resultViewHeight,
            // transform: null,
            duration: animationDuration
        }, function() {
            self.mapView.addRoute(searchRoutes);
            if (region) {
                self.parent.setRegion(region, 0.1, true);
            }
            onDone();
        });

        if (searchWindow) {
            searchWindow.closeMe();
            searchWindow = null;
            searchView = null;
        }

        searchRequest = null;
        if (searchView) {
            searchView.loading.hide();
        }
    }

    function search(_text) {
        searchView.loading.show();
        self.mapView.selectAnnotation(null);
        // searchView.textfield.cancel.hide();
        // searchView.cancel.applyProperties({
        //     visible: false
        // });
        var params = {
            query: _.deburr(_text).toLowerCase().replace(/^(the|le|la|el)\s/, '').trim(),
            maxResults: 40,
            // centerCoordinate: self.mapView.centerCoordinate,
            // radius: 5000
            region: geolib.scaleBounds(self.mapView.region, 0.2)
        };
        var calls = _.values(_.pick(self.parent.runReduceMethodOnModules(true, 'getSearchCalls', params),
            enabledSearchFilters));
        calls = [_.partial(app.api.searchOSM, params)].concat(calls);
        self.window.showLoading();
        searchRequest = app.api.chainCalls(calls, _.partialRight(showSearchResults, self.window.hideLoading));
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

    function show() {
        if (!visible) {
            searchWindow = new AppWindow({
                rclass:'SearchWindow',
                winOpeningArgs: {
                    from: {
                        opacity: 0,
                    },
                    to: {
                        opacity: 1,
                    },
                    duration: animationDuration
                },
                winClosingArgs: {
                    opacity: 0,
                    duration: animationDuration
                }
            });
            searchWindow.onBack = self.onWindowBack;
            // searchWindow.on('click', function(e) {
            //     if (e.source === searchWindow) {
            //         hide();
            //     }
            // });
            searchWindow.container.add(getSearchView());
            self.parent.runGetMethodOnModules('onStartExclusiveAction', 'search');

            visible = true;
            // self.parent.childrenHolder.add(searchView, 1); //not perfect but needs to be on top of the position info :s
            searchView.animate({
                from: {
                    opacity: 0,
                    transform: 'ot0,-100%'
                },
                to: {
                    opacity: 1,
                    transform: null
                },
                duration: animationDuration
            });
            searchView.once('postlayout', function() {
                searchView.textfield.focus();
                if (currentInstantSearch) {
                    instantSearch(currentInstantSearch);
                }

            });
            app.ui.openWindow(searchWindow);
        }
    }

    function clearSearch(_clearField) {
        // sdebug('clearSearch', _clearField);
        if (searchWindow) {
            // sdebug('clearSearch', 'clearing searchWindow');
            if (visible) {
                searchView.loading.hide();
            }
            if (searchRequest) {
                searchRequest.abort();
                searchRequest = undefined;
            }
            if (!resultsVisible && !visible) {
                return;
            }
            searchResultIds = {};
            clearInstantSearch();

            if (searchView && _clearField !== false) {
                searchView.textfield.value = null;
            }
        }

        delete self.onMapMarkerSelected;

        self.parent.runMethodOnModules('onMapReset', {
            top: true,
            bottom: true
        });

        if (resultView) {
            resultsVisible = false;
            resultView.animate({
                height: 0,
                // transform: 'ot0,100%',
                duration: animationDuration
            }, function() {
                self.parent.mapBottomToolbar.remove(resultView);
                resultView = null;
                if (cluster) {
                    cluster.annotations = [];
                }
                self.mapView.removeRoute(searchRoutes);
                searchRoutes = [];
            });
        }
    }

    function hide() {
        clearSearch();
        if (visible) {
            // self.parent.runMethodOnModules('onMapReset', {
            //     top: true,
            //     bottom:true
            // });
            visible = false;

            if (searchWindow) {
                searchView.blur();
                searchWindow.closeMe();
                searchWindow = null;
                searchView = null;
            }
            // searchView.animate({
            //     opacity: 0,
            //     transform: 'ot0,-100%',
            //     duration: animationDuration
            // }, function() {
            //     self.parent.childrenHolder.remove(searchView);
            // });
            if (cluster) {
                self.mapView.removeCluster(cluster);
                cluster = null;
            }
            // self.parent.runMethodOnModules('onMapMarkerSelected', {
            //     annotation: self.mapView.selectedAnnotation

            // });
        }
    }
    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            cluster = null;
            searchView = null;
            resultView = null;
        }),
        onStartExclusiveAction: function(_id) {
            if (_id !== 'search') {
                hide();
            }
        },
        onWindowBack: function() {
            if (visible || resultsVisible) {
                hide();
                return true;
            }
        },

        showSearchResults: showSearchResults,
        onModuleAction: function(_params) {
            if (_params.id === 'search') {
                if (!visible) {
                    show();
                } else {
                    hide();
                }
            } else {
                return false;
            }
            return true;
        }
    });
    return self;
};