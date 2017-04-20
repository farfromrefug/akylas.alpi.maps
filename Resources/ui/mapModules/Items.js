exports.create = function (_context, _args, _additional) {
    // Ti.App.Properties.removeProperty('lists');
    var __types = Object.assign(
            require('data/routetypes').data,
            require('data/markertypes').data
        ),
        listDefaults = {
            modified: {
                color: '#ef6c00',
                title: trc('modified'),
                defaultTitle: trc('modified_item'),
                icon: app.icons.edit
            }
        },
        lists = Ti.App.Properties.getObject('lists', {}),
        photosDb = Ti.App.Properties.getObject('photos', {}),
        filesDb = Ti.App.Properties.getObject('files', {}),
        settings = _args.settings,
        __items = {},
        __routes = {},
        __clusters = {},
        __currentIds = {},
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = geolib.formatter,
        cleanUpString = app.api.cleanUpString,
        isItemARoute = itemHandler.isItemARoute,
        getAnnotImage = itemHandler.getAnnotImage,

        __movingItems,
        htmlIcon = app.utilities.htmlIcon,
        mapArgs = _additional.mapArgs,
        indexAddItems = function (_items) {},
        indexRemoveItemsIds = function (_items) {},
        indexRemoveList = function (_key) {},
        indexer;
    console.log('__types', __types);
    mapArgs.calloutTemplates = mapArgs.calloutTemplates || {};
    mapArgs.calloutTemplates.calloutPhoto = app.templates.view.cloneTemplateAndFill('calloutPhoto', {
        properties: {
            bubbleParent: false
        }
    }, {
        image: {
            startload: function (e) {
                sdebug('startload');
                e.source.parent.loading.visible = true;
                e.source.backgroundColor = null;
            },
            load: function (e) {
                e.source.parent.loading.visible = false;
                sdebug('load', e.colorArt, e.source.parent.loading.visible);
                if (e.colorArt) {
                    e.source.backgroundColor = e.colorArt.backgroundColor;
                }
            },
            click: app.debounce(function (e) {
                if (!e.source.parent.loading.visible) {
                    var item = (e.annotation && e.annotation.item) || (e.route && e.route.item);
                    // sdebug('click', item);
                    if (item) {
                        app.showImageFullscreen(item.photos, 0, e.source);
                    }
                }
            }),
            longpress: function (e) {
                // sdebug('longpress', e.source.parent.loading);
                if (!e.source.parent.loading.visible) {
                    app.share({
                        image: e.source.toBlob()
                    });
                }
            }
        }
    });

    if (__APPLE__) {
        indexer = Ti.App.iOS.createSearchableIndex();
        if (indexer && indexer.isSupported()) {
            var contenttype = Ti.App.iOS.UTTYPE_HTML;
            indexAddItems = function (_items) {
                // sdebug('indexAddItems', _items);
                indexer.addToDefaultSearchableIndex(_.reduce(_items, function (memo, item) {
                    if (!item.title) {
                        return memo;
                    }
                    var canNav = !!item.latitude;
                    var type = __types[item.type];
                    var phone = item.tags && item.tags.phone;
                    var desc = '';
                    if (item.altitude) {
                        desc += formatter.altitude(item.altitude) + ' ';
                    }
                    if (canNav) {
                        desc += formatter.latLngString(item, 2);
                    }
                    if (item.description) {
                        desc += '\n' + item.description;
                    } else if (item.address) {
                        desc += '\n' + item.address.display_name;
                    }
                    // sdebug('desc', desc);
                    var image = item.photos ? item.photos[0].image : undefined;
                    if (!image || _.startsWith(image, 'http')) {
                        image = (item.image || type.image);
                    }
                    var attributeSet = {
                        contentType: contenttype,
                        title: item.title,
                        namedLocation: item.title,
                        headline: desc,
                        contentDescription: desc.replace(/<(?:.|\n)*?>/gm, ''),
                        thumbnailURL: app.getImagePath(image),
                        keywords: [type.title]
                    };
                    if (phone) {
                        attributeSet.supportsPhoneCall = true;
                        attributeSet.phoneNumbers = [phone];
                    }
                    if (canNav) {
                        attributeSet.supportsNavigation = true;
                        attributeSet.latitude = item.latitude;
                        attributeSet.longitude = item.longitude;
                        attributeSet.altitude = item.altitude;
                    }
                    memo.push({
                        identifier: item.id + '',
                        domainIdentifier: item.type,
                        attributeSet: attributeSet
                    });
                    // sdebug(attributeSet);
                    return memo;
                }, []));
            };
            indexRemoveItemsIds = function (_items) {
                indexer.deleteSearchableItemsByIdentifiers(_items);
            };
            indexRemoveList = function (_key) {
                indexer.deleteAllSearchableItemByDomainIdentifiers([_key]);
            };
        }
    }

    function initiateType(type, key) {
        if (!!type.hidden) {
            return;
        }
        __items[key] = [];
        // sdebug('Items', 'initiateType', key, type);
        itemHandler.initializeType(key, type);

        __clusters[key] = new MapCluster({
            image: app.getImagePath(getAnnotImage(type, {
                iconSettings: {
                    style: 10
                }
            })),
            minZoom: type.minZoom,
            maxZoom: type.maxZoom,
            // tintColor: type.color,
            visible: type.visible,
            // color: type.colors.contrast,
            // strokeColor: $.white
        });
        __currentIds[key] = {
            routes: [],
            markers: []
        };
        if (type.calloutTemplate) {
            mapArgs.calloutTemplates[key] = ak.ti.style(type.calloutTemplate);
        }
        // Ti.App.Properties.removeProperty(type.propertyKey);
        // sdebug('initiateType', key, type);
    }

    function saveLists() {
        Ti.App.Properties.setObject('lists', _.mapValues(lists, _.partialRight(_.omit, 'getPrefKey', 'rclass',
            'image', 'selectedImage', 'visible', 'propertyKey', 'colors')));

    }

    function annotationForMarker(_type, _marker) {
        var hasInfo = _type.hasInfo !== false;
        if (hasInfo || _marker.title) {

            var item = itemHandler.annotationParamsFromItem(_marker, _type);
            return item;
        }
        return undefined;
    }

    function routeForRoute(_type, _route) {
        var hasInfo = _type.hasInfo !== false;
        if (hasInfo || _marker.title) {
            var item = itemHandler.routeParamsFromItem(_route, _type);
            return item;
        }
    }

    var self = new _context.MapModule(_args);
    Object.assign(self, {
        getCluster: function (_type) {
            return __clusters[_type];
        },
        onInit: function () {
            app.on(__ITEMS__ + 'Changed', self.onChanged);
            _.each(lists, function (list, key) {
                if (!__types[key]) {
                    __types[key] = list;
                }
            });
            var thirdTypes = self.parent.runReduceMethodOnModules(true, 'getItemTypes');
            _.each(thirdTypes, function (value, key) {
                if (!__types[key]) {
                    __types[key] = value;
                }
            });
            __types = _.omit(__types, function (e) {
                return !!e.hidden;
            });
            _.each(__types, function (value, key) {
                initiateType(value, key);
            });
            _.each(__types, function (value, key) {
                self.addItems(Ti.App.Properties.getObject(value.propertyKey, []), undefined,
                    false);
            });
            self.mapView.addCluster(_.values(__clusters)
                .reverse());
        },
        GC: app.composeFunc(self.GC, function () {
            app.off(__ITEMS__ + 'Changed', self.onChanged);
            __items = null;
            __clusters = null;
            __currentIds = null;
            __routes = null;
        }),
        addItems: function (_items, _fireEvent, _save) {
            // sdebug('addItems', _items);
            if (!_items || _items.length === 0) {
                return;
            }

            _items = _.groupBy(_items, 'type');
            var added = false;
            _.forEach(_items, function (theItems, _type) {
                var type = __types[_type];
                // sdebug('type', _type, type);
                if (!type) {
                    self.createList(Object.assign({
                        id: _type
                    }, listDefaults[_type]), true);
                    type = __types[_type];
                }
                if (type) {
                    // sdebug('addItems', type, theItems);
                    var cluster = __clusters[_type],
                        toAdd = [],
                        addedMarkers = [],
                        addedRoutes = [],
                        annots = [],
                        currentTypeIds = __currentIds[_type],
                        currentIds,
                        routes = [],
                        existing,
                        isRoute,
                        idKey,
                        newPhotos = false,
                        mapItem;

                    _.each(theItems, function (item) {
                        isRoute = isItemARoute(item);
                        idKey = isRoute ? __ROUTES__ : __MARKERS__;
                        currentIds = currentTypeIds[idKey];
                        existing = false;
                        item.id = item.id + '';
                        if (!_.includes(__movingItems, item.id)) {
                            existing = _.includes(currentIds, item.id);
                            if (!existing) {
                                //for the sake of avoiding duplicates, look in lists too
                                _.each(lists, function (list, key) {
                                    if (_type !== key) {
                                        existing = _.includes(__currentIds[key], [
                                                idKey
                                            ],
                                            item.id);
                                        if (existing) {
                                            sdebug('found existing in list',
                                                key);
                                            return false;
                                        }
                                    }
                                });
                            }
                        }

                        if (!existing) {
                            if (isRoute) {
                                mapItem = routeForRoute(type, item);
                                if (mapItem) {
                                    addedRoutes.push(item);
                                    routes.push(mapItem);
                                }
                            } else {
                                if (item.icon || item.color) {
                                    item.image = getAnnotImage(type, item);
                                    item.selectedImage = getAnnotImage(type,
                                        item,
                                        true);
                                }
                                mapItem = annotationForMarker(type, item);
                                if (mapItem) {
                                    addedMarkers.push(item);
                                    annots.push(mapItem);
                                }
                            }
                        }
                    });
                    if (newPhotos) {
                        Ti.App.Properties.setObject('photos', photoDb);
                    }
                    if (annots.length > 0) {
                        // sdebug('about to add annotations', annots);
                        var added = self.getCluster(_type)
                            .addAnnotation(annots);
                        var addedLength = added.length;
                        if (addedLength !== annots.length) {
                            __items[_type] = __items[_type].concat(addedMarkers.slice(-
                                addedLength));
                        } else {
                            __items[_type] = __items[_type].concat(addedMarkers);
                        }
                        if (_save !== false) {
                            indexAddItems(addedMarkers);
                            Ti.App.Properties.setObject(type.propertyKey, __items[_type]);
                        }
                        currentTypeIds[__MARKERS__] = currentTypeIds[__MARKERS__].concat(_.map(
                            addedMarkers,
                            'id'));
                    }
                    if (routes.length > 0) {
                        // sdebug('about to add routes', routes);
                        __routes[_type] = (__routes[_type] || [])
                            .concat(self.mapView
                                .addRoute(routes));
                        __items[_type] = __items[_type].concat(addedRoutes);
                        if (_save !== false) {
                            indexAddItems(addedRoutes);
                            Ti.App.Properties.setObject(type.propertyKey, __items[_type]);
                        }
                        currentTypeIds[__ROUTES__] = currentTypeIds[__ROUTES__].concat(_.map(
                            addedRoutes,
                            'id'));
                    }

                    if (_fireEvent !== false && (annots.length + routes.length) > 0) {
                        app.emit(__ITEMS__ + 'Added', {
                            items: addedMarkers.concat(addedRoutes),
                            desc: type
                        });
                    }
                }
            });
            return added;
        },
        removeItems: function (_items, _realDelete) {
            sdebug('removeItems', _.map(_items, 'id', 'type'));
            _items = _.groupBy(_items, 'type');
            var removed = false;
            _.forEach(_items, function (theItems, _type) {
                var type = __types[_type];
                if (type) {
                    var cluster = __clusters[_type],
                        annotations = cluster.annotations,
                        annotsToRemove = [],
                        routesToRemove = [],
                        removedIds = [],
                        currentTypeIds = __currentIds[_type],
                        currentIds, isRoute, idKey, index;
                    _.forEach(theItems, function (_item) {
                        isRoute = isItemARoute(_item);
                        idKey = isRoute ? __ROUTES__ : __MARKERS__;
                        sdebug('removeItem', _item.id, _type, idKey, currentTypeIds[
                            idKey]);
                        index = currentTypeIds[idKey].indexOf(_item.id);
                        if (index >= 0) {
                            currentTypeIds[idKey].splice(index, 1);
                            _.remove(__items[_type], {
                                id: _item.id
                            });
                            removedIds.push(_item.id);
                            if (isItemARoute(_item)) {
                                routesToRemove.push(__routes[_type][index]);
                                __routes[_type].splice(index, 1);
                            } else {
                                annotsToRemove.push(annotations[index]);
                            }
                            if (_realDelete !== false) {
                                if (_item.photos) {
                                    var removedPhoto = false;
                                    _.forEach(_item.photos, function (photo) {
                                        var photoDb = photosDb[photo.image];
                                        photoDb = _.without(photoDb, _item.id);
                                        if (photoDb && photoDb.length === 0) {
                                            removedPhoto = true;
                                            delete photosDb[photo.image];
                                            sdebug('removing photo', photo);
                                            Ti.Filesystem.getFile(app.getImagePath(
                                                    photo.image))
                                                .deleteFile();
                                            if (photo.thumbnailImage) {
                                                Ti.Filesystem.getFile(app.getImagePath(
                                                        photo.thumbnailImage
                                                    ))
                                                    .deleteFile();
                                            }
                                        }

                                    });
                                    if (removedPhoto) {
                                        Ti.App.Properties.setObject('photos', photosDb);
                                    }
                                }

                                if (_item.files) {
                                    var removedFile = false;
                                    _.forEach(_item.files, function (file) {
                                        var fileDb = filesDb[file.fileName];
                                        fileDb = _.without(fileDb, _item.id);
                                        if (fileDb && fileDb.length === 0) {
                                            removedFile = true;
                                            delete filesDb[file.filePath];
                                            sdebug('removing file', file);
                                            Ti.Filesystem.getFile(app.getFilePath(
                                                    file.filePath))
                                                .deleteFile();

                                        }

                                    });
                                    if (removedFile) {
                                        Ti.App.Properties.setObject('files', filesDb);
                                    }
                                }

                            }
                        }

                    });
                    if ((annotsToRemove.length + routesToRemove.length) > 0) {
                        if (_realDelete) {
                            indexRemoveItemsIds(removedIds);
                        }
                        cluster.removeAnnotation(annotsToRemove);
                        self.mapView.removeRoute(routesToRemove);
                        Ti.App.Properties.setObject(type.propertyKey, __items[_type]);
                        removed = true;
                        if (_realDelete !== false) {
                            app.emit(__ITEMS__ + 'Removed', {
                                items: theItems,
                                desc: type
                            });
                        }

                    }
                }
            });
            return removed;
        },

        getItems: function (key) {
            if (__items[key]) {
                return __items[key];
            }
        },
        getItemsInRegion: function (memo, _center, _radius) {
            var results = {};
            _.forEach(__items, function (items, key) {
                type = __types[key];
                items = [];
                _.forEach(__items[key], function (item) {
                    if (geolib.isPointInCircle(item, _center, _radius)) {
                        items.push(item);
                    }
                });
                if (items.length > 0) {
                    memo[key] = {
                        desc: type,
                        items: items
                    };
                }
            });
        },
        getItem: function (_item, _type) {
            var result, currentTypeIds, index, item;
            var searchingIn = __types;
            if (_type) {
                searchingIn = _.pick(__types, _type);
            }
            // sdebug('getItem', _item, searchingIn);
            _.forEach(searchingIn, function (type, key) {
                currentTypeIds = __currentIds[key];
                searchKeys = _.get(_item, 'settings.searchKeys') || _.get(type,
                    'settings.searchKeys') || ['id'];
                var params = {};
                for (var i = 0; i < searchKeys.length; i++) {
                    params[searchKeys[i]] = _item[searchKeys[i]];
                }
                if (params.id) {
                    params.id = params.id + '';
                }
                // sdebug('currentTypeIds', key, params);
                var index = _.findIndex(__items[key], params);
                if (index >= 0) {
                    item = __items[key][index];

                    result = {
                        item: item,
                        desc: type,
                        annotation: self.getMapItem(type, item)
                    };
                    return false;
                }
            });
            return result;
        },
        searchItems: function (memo, _query) {
            var type, items, fuzzyResult;
            _.forEach(__items, function (items, key) {
                type = __types[key];
                items = [];
                _.forEach(__items[key], function (item) {
                    var score = item.title && _query.score(_.deburr(item.title), 1);
                    if (score > 0.5) {
                        items.push(item);
                    }
                });
                if (items.length > 0) {
                    memo[key] = {
                        desc: type,
                        items: items
                    };
                }
            });
        },
        getLists: function (_withItems) {
            return _.reduce(__items, function (memo, items, key) {
                var type = __types[key];
                if (type && !type.hidden) {
                    var result = {
                        count: items.length,
                        description: type
                    };
                    if (_withItems) {
                        result.items = items;
                    }
                    memo.push(result);
                }

                return memo;
            }, []);
        },
        getAnnotation: function (_type, _id) {
            if (__types[_type]) {
                var index = __currentIds[_type][__MARKERS__].indexOf(_id);
                if (index >= 0) {
                    return self.getCluster(_type)
                        .getAnnotation(index);
                }
            }
        },
        getRoute: function (_type, _id) {
            if (__types[_type]) {
                var index = __currentIds[_type][__ROUTES__].indexOf(_id);
                if (index >= 0) {
                    return __routes[_type][index];
                }
            }
        },
        getMapItem: function (_type, _item) {
            sdebug('getMapItem', _type, _item.id);
            if (__types[_type]) {
                var isRoute = isItemARoute(_item);
                // sdebug('getMapItem', _type, _item.id);
                var idKey = isRoute ? __ROUTES__ : __MARKERS__;
                var index = __currentIds[_type][idKey].indexOf(_item.id);
                // sdebug('getMapItem', isRoute, idKey, index);
                if (index >= 0) {
                    return isRoute ? __routes[_type][index] : self.getCluster(_type)
                        .getAnnotation(
                            index);
                }
            }
        },
        getMarkersForRegion: function (_type, region, _window, _mapHandler, _callback) {
            sdebug('getMarkersForRegion', _type, region);
            var calls = [];

            var request;

            if (_type.osm) {
                calls.push(_.partial(app.api.queryGeoFeatures, _type.osm, region, _type, itemHandler));
            } else {
                calls.push(_.partial(_type.apiMethod, Object.assign({
                    region: region
                }, _type.apiParams), _type, itemHandler));
            }

            var contentModules = _mapHandler.getContentModules();
            _.forEach(contentModules, function (module) {
                if (module['getMarkersForRegion']) {
                    calls.push(_.partial(module['getMarkersForRegion'], _type, region, itemHandler));
                }
            });
            request = app.api.parallelRequests(calls).then(function (resultsList) {
                console.log('resultsList', resultsList);
                var toAdd = [];
                resultsList.forEach(function (results) {
                    if (results) {
                        toAdd.push.apply(toAdd, results);
                    }
                });
                console.log('toAdd', toAdd);
                var addedItems = self.addItems(toAdd);
                if (_callback) {
                    _callback(addedItems);
                } else {
                    _window.hideLoading();
                }
            }).catch(function (err) {
                if (!_callback) {
                    _window.hideLoading();
                }
                throw err;
            });
            if (!_callback) {
                _window.showLoading({
                    request: request,
                    label: {
                        html: htmlIcon(_type.icon, 1) + ' ' + trc('loading') +
                            '...'
                    }
                });
            }
            return request;
        },
        addOrUpdateItem: function (_type, _item) {

            if (__types[_type] !== undefined) {
                var type = __types[_type];
                var existingItem;
                if (_item.id) {
                    existingItem = self.getItem(_item);
                }
                if (existingItem) {
                    itemHandler.updateItem(existingItem, type, _item);
                } else {
                    self.addItems(_type, [_item]);
                }
            }
        },
        onModuleAction: function (_params) {
            var key = _params.id;
            var win = _params.window || self.window;
            sdebug('onModuleAction', key, _params.command, win.title);
            if (__types[key] !== undefined || _params.command === 'create') {
                var type = __types[key];
                if (_params.command) {
                    switch (_params.command) {
                        case 'clear':
                        case 'clear_list':
                            self.clear(key);
                            Ti.App.Properties.removeProperty(type.propertyKey);
                            break;
                        case 'visibility':
                            self.setVisible(key, _params.value);
                            break;
                        case 'delete_list':
                            if (_params.value) {
                                self.removeList(_params.value);
                            } else {
                                return false;
                            }
                            break;
                        case 'remove':
                            if (_params.items) {
                                self.removeItems(_params.items, true);
                            } else {
                                return false;
                            }
                            break;
                        case 'create':
                            {
                                self.createList(Object.assign({
                                    id: key
                                }, listDefaults[key]), true);
                                type = __types[key];
                                sdebug(_params.command, _params.item);
                                if (_params.item) {
                                    var isRoute = isItemARoute(_params.item);
                                    var item = itemHandler[isRoute ? 'createRouteItem' :
                                        'createAnnotItem'](
                                        type, _params.item);
                                    self.addItems([item]);
                                } else {
                                    return false;
                                }
                                break;
                            }
                        case 'add':
                            {
                                if (_params.items) {
                                    self.addItems(_params.items);
                                } else {
                                    return false;
                                }
                                break;
                            }
                        case 'move':
                            if (_params.items) {
                                self.moveItems(_params.items, _params.moveType);
                            } else {
                                return false;
                            }
                            break;

                        default:
                            return false;

                    }
                } else if (type.osm || type.apiMethod) {
                    var request = self.getMarkersForRegion(type, _params.region || self.mapView.region,
                        win,
                        _params.mapHandler || self.parent,
                        function (_addedItems) {
                            if (_params.callback) {
                                _params.callback(_addedItems);
                            }
                            win.hideLoading();
                        });
                    win.showLoading({
                        request: request,
                        label: {
                            html: htmlIcon(type.icon, 1) + ' ' + trc('loading') +
                                '...'
                        }
                    });

                }
            } else if (key === 'geofeature') {
                var test = self.parent.runReduceMethodOnModules(true, 'getGeoFeatures');
                app.showOptionsListDialog({
                    small: true,
                    collection: true,
                    title: trc('find_geofeatures'),
                    items: _.reduce(Object.assign(_.filter(__types, function (type, key) {
                        return (type.settings && !!type.settings.geofeature) &&
                            type.visible !== false;
                    }), test), function (memo, type, index) {
                        var color = type.textColor || type.color;
                        memo.push({
                            id: type.id,
                            title: {
                                text: type.title,
                                color: color
                            },
                            icon: {
                                text: type.icon,
                                color: color,
                                visible: true
                            },
                            accessory: {
                                visible: false
                            }
                        });

                        return memo;
                    }, [{
                        id: 'prepare_hiking',
                        title: {
                            text: trc('prepare_hiking')
                        },
                        icon: {
                            text: app.icons.hiking,
                            visible: true
                        },
                        accessory: {
                            visible: false
                        }
                    }])
                }, function (e) {
                    if (e.cancel === false) {
                        var key = e.item.id;
                        var type = __types[key];
                        // sdebug(e, key, type);
                        if (type) {
                            var request = self.getMarkersForRegion(type, _params.region || self
                                .mapView.region,
                                win,
                                _params.mapHandler || self.parent,
                                function (_addedItems) {
                                    if (_params.callback) {
                                        _params.callback(_addedItems);
                                    }
                                    win.hideLoading();
                                });
                            win.showLoading({
                                request: request,
                                label: {
                                    html: htmlIcon(type.icon, 1) + ' ' + trc('loading') +
                                        '...'
                                }
                            });

                        } else {
                            self.onModuleAction(Object.assign(e.item, {
                                callback: _params.callback
                            }));
                        }

                    }
                });
            } else if (key === 'prepare_hiking') {
                sdebug('prepare_hiking');
                var addedItems = [];
                win.showLoading({
                    label: {
                        html: htmlIcon(app.icons.hiking, 1) + ' ' + trc('preparing_hike') +
                            '...'
                    }
                });
                var onItems = function (e) {
                    addedItems = addedItems.concat(e.items);
                };
                var geofeatureTypes = ['refuge', 'peak', 'saddle', 'lake', 'water', 'glacier'];
                var index = 0;
                var onDone = function () {
                    // sdebug(addedItems);
                    win.hideLoading();
                    if (_params.callback) {
                        _params.callback(addedItems);
                    }
                };
                var region = _params.region || self.mapView.region;
                var queryFeatures = function (_onDone) {
                    if (index < geofeatureTypes.length) {
                        var type = geofeatureTypes[index++];
                        self.getMarkersForRegion(__types[type], region, win, _params.mapHandler || self.parent, _.partial(
                            queryFeatures,
                            _onDone));
                    } else {
                        _onDone();
                    }

                };
                app.on(__ITEMS__ + 'Added', onItems);
                queryFeatures(onDone);
            } else if (key === __ITEMS__) {
                switch (_params.command) {
                    case 'create_list':

                        if (_.isString(_params.list)) {
                            self.createList(Object.assign({
                                id: _params.list
                            }, listDefaults[_params.list]), _params.onlyIfExists);
                        } else {
                            self.createList(_params.list, _params.onlyIfExists);

                        }
                        break;
                    case 'update_list':
                        self.updateList(_params.list, _params.changes);
                        break;
                }
            } else {
                return false;
            }
            return true;
        },

        clear: function (_key, _indexerClear) {
            this.getCluster(_key)
                .removeAllAnnotations();
            if (_indexerClear !== false) {
                indexRemoveList(_key);
            }
            self.mapView.removeRoute(__routes[_key]);
            __routes[_key] = [];
            __currentIds[_key] = {
                routes: [],
                markers: []
            };
            __items[_key] = [];
        },
        getSupplyTemplates: function (memo) {
            memo.elprofile = app.templates.row.elevationProfile;
            // memo.elprofileHTML = app.templates.row.elevationProfileHTML;
            // memo.elprofileHTML.childTemplates[1].events = {
            //     load:function(e) {
            //         // sdebug('load', e);
            //         e.source.evalJS('plotChart(' + JSON.stringify(e.source.chartdata) + ')');
            //     }
            // };
            memo.file = app.templates.row.gfoptionfileitem;
        },
        getChartData: function (_profile, _color) {
            var getColor = function (value) {
                //value from 0 to 1
                var hue = (Math.max((1 - value * 3) * 120, 12)).toString(10);
                return ["hsla(", hue, ",100%,50%, 0.5)"].join("");
            };
            return {
                chart: {
                    zoomType: 'x',
                    spacing: [5, 5, 5, 5],
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: ''
                },
                // tooltip: {
                //     pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                // },
                plotOptions: {
                    line: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: false
                    }
                },
                xAxis: {
                    labels: {
                        formatter: function () {
                            sdebug('formatter', this.value);
                            return formatter.distance(this.value);
                        }
                    },
                    // tickInterval: 20,
                    //type: 'datetime'
                    text: '',
                    plotBands: _.reduce(_profile.gradleRegions, function (memo, value, index) {
                        memo.push({
                            from: value.from,
                            to: value.to,
                            color: getColor(Math.abs(value.value)),
                            // label: {
                            //   text: value.value * 100 + '%',
                            //   style: {
                            //     color: '#606060'
                            //   }
                            // }
                        });
                        return memo;
                    }, [])

                },
                yAxis: {
                    title: {
                        text: ''
                    }
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    area: {
                        fillColor: null,
                        marker: {
                            radius: 2
                        }
                    }
                },

                series: [{
                    type: 'line',
                    color: _color,
                    data: _profile.data
                }]
            };
        },
        getItemSupplViews: function (_item, _desc, _params) {
            if (isItemARoute(_item) && (_item.profile || (_item.tags &&
                    _item.tags.dplus && _item.tags.dmin))) {
                _params = _params || {};
                var profile = _item.profile;
                var color = _item.color || _desc.color;
                var useHTML = profile && profile.version === 2;
                // sdebug('version', profile.version);
                var result = {
                    template: 'elprofile',
                    // template: useHTML ? 'elprofileHTML' : 'elprofile',
                    properties: {},
                    chartDesc: {
                        visible: true,
                        html: itemHandler.itemProfileDesc(_item)
                    },
                    chart: {
                        visible: false
                    }
                };
                if (profile) {
                    if (useHTML) {
                        Object.assign(result, {
                            chart: {
                                height: (!!_params.small && 80) || undefined,
                                visible: true,
                                chartdata: this.getChartData(profile, color)
                            }
                        });
                        return result;
                    }
                    var heigthLength = profile.max[1] - profile.min[1];
                    var delta = heigthLength / 2;
                    // sdebug('heigthLength', heigthLength);
                    // sdebug('delta', delta);
                    Object.assign(result, {
                        chart: {
                            height: (!!_params.small && 80) || undefined,
                            visible: true,
                            plotSpace: {
                                yRange: {
                                    max: profile.max[1] + delta + 1,
                                    min: profile.min[1] - delta,
                                },
                                xRange: {
                                    max: profile.max[0] + 0.03,
                                    min: profile.min[0] - 0.03,
                                }
                            },
                            xAxis: {
                                majorTicks: {
                                    labels: {
                                        formatCallback: formatter.distance
                                    }
                                }
                            }
                        },
                        line: {
                            data: profile.data,
                            lineColor: color,
                            fillGradient: {
                                type: 'linear',
                                colors: [color, '#00' + color.slice(1)],
                                startPoint: {
                                    x: 0,
                                    y: 0
                                },
                                endPoint: {
                                    x: 0,
                                    y: '100%'
                                },
                                backFillStart: true
                            }
                        }
                    });
                    console.log('test', result);
                    return result;
                }
                // return ;
            }
        },
        onModuleLongAction: function (_params) {
            var key = _params.id;
            if (__types[key] !== undefined) {
                var type = __types[key];
                var options = ['clear', 'list'];
                new OptionDialog({
                        options: _.map(options, function (value,
                            index) {
                            return trc(value);
                        }),
                        buttonNames: [trc('cancel')],
                        cancel: 0,
                        tapOutDismiss: true
                    })
                    .on('click', function (e) {
                        if (!e.cancel) {
                            var option = options[e.index];
                            self.onModuleAction({
                                id: key,
                                command: option
                            });
                        }
                    })
                    .show();
            }
        },

        onMapLongPress: function (e) {
            var loc = _.pick(e, 'latitude', 'longitude', 'altitude');
            var extras = self.parent.runReduceMethodOnModules(true, 'getDroppedExtra', loc, e.zoom);
            _.each(extras, function (value, key) {
                Object.assign(loc, value);
            });
            var type = 'dropped';
            var item = itemHandler.createAnnotItem(__types[type], loc);
            sdebug('onMapLongPress', 'create annot', item);
            self.addItems([item]);
            self.runActionOnItem(type, item, 'select');
            return true;
        },
        setVisible: function (_type, _visible) {
            var type = __types[_type];
            if (type) {
                type.visible = _visible;
                _.forEach(__routes[_type], function (route) {
                    route.visible = _visible;
                });
                Ti.App.Properties.setBool(type.getPrefKey('visible'), _visible);
                __clusters[_type].visible = _visible;
            }
        },
        moveItems: function (_items, _newType) {
            var newListType = __types[_newType];
            if (!newListType) {
                self.createList(Object.assign({
                    id: _newType
                }, listDefaults[_newType]), true);
                newListType = __types[_newType];
            }
            var itemsToMove = [];

            _.forEach(_items, function (_item) {
                var type = _item.type;
                var isRoute = isItemARoute(_item);
                var idKey = isRoute ? __ROUTES__ : __MARKERS__;
                var index = __currentIds[type][idKey].indexOf(_item.id);
                if (index >= 0) {
                    itemsToMove.push(_item);
                }
            });

            var newItems = _.reduce(itemsToMove, function (memo, item) {
                var newItem = JSON.parse(JSON.stringify(item));
                var type = __types[newItem.type];
                newItem.type = _newType;
                delete newItem.image;
                delete newItem.selectedImage;
                if (!newItem.title) {
                    newItem.title = type.defaultTitle;
                }
                newItem.settings = type.settings;
                if (newItem.settings && !!newItem.settings.geofeature) {
                    newItem.icon = newItem.icon || type.icon;
                    newItem.color = newItem.color || type.color;
                    newItem.iconSettings = type.iconSettings;
                }
                if (type.options) {
                    newItem.options = (newItem.options || [])
                        .concat(type.options);
                }
                memo.push(newItem);
                return memo;
            }, []);

            __movingItems = _.map(itemsToMove, 'id');
            sdebug('__movingItems', __movingItems);
            self.removeItems(itemsToMove, false);
            self.addItems(newItems, false);

            //the order is important as anyone listening to it must be able to find the newly moved(added) annotation
            app.emit(__ITEMS__ + 'Moved', {
                oldItems: _.mapValues(_.groupBy(itemsToMove, 'type'), function (items, key) {
                    return {
                        desc: __types[key],
                        items: items
                    };
                }),
                items: newItems,
                desc: newListType
            });

            __movingItems = null;

            app.showMessage(trc('items_moved_to_{title}')
                .assign({
                    title: newListType.title
                }), newListType.colors);

        },
        onChanged: function (e) {
            var item = e.item;
            var type = __types[item.type];
            if (type) {
                var typeId = type.id;
                var isRoute = isItemARoute(item);
                var idKey = isRoute ? __ROUTES__ : __MARKERS__;
                var index = _.findIndex(__items[typeId], {
                    id: item.id
                });
                sdebug('item changed', item.id, index, typeId);
                if (index >= 0) {
                    __items[typeId][index] = item;
                    Ti.App.Properties.setObject(type.propertyKey, __items[typeId]);
                    // indexRemoveItems([item]);
                    indexAddItems([item]);
                    self.parent.updateMapItem(self.getMapItem(typeId, item), item, e.changes);
                    var needsPhotoDbChange = false;
                    if (e.changes.newPhotos) {
                        needsPhotoDbChange = true;
                        _.forEach(e.changes.newPhotos, function (photo) {
                            photosDb[photo.image] = photosDb[photo.image] || [];
                            photosDb[photo.image].push(item.id);
                        });
                    }
                    if (e.changes.deletedPhotos) {
                        _.forEach(e.changes.deletedPhotos, function (photoId) {
                            var photoDb = photosDb[photoId];
                            if (photoDb) {
                                photoDb = _.without(photoDb, item.id);
                            }
                            if (!photoDb || photoDb.length === 0) {
                                needsPhotoDbChange = true;
                                delete photosDb[photoId];
                                sdebug('removing photo', photoId);
                                Ti.Filesystem.getFile(app.getImagePath(photoId))
                                    .deleteFile();
                            }
                        });
                    }
                    if (needsPhotoDbChange) {
                        Ti.App.Properties.setObject('photos', photosDb);
                    }

                    var needsFileDbChange = false;
                    if (e.changes.newFiles) {
                        needsPhotoDbChange = true;
                        _.forEach(e.changes.newFiles, function (file) {
                            filesDb[file.fileName] = photosDb[file.fileName] || [];
                            filesDb[file.fileName].push(item.id);
                        });
                    }
                    if (e.changes.deletedFiles) {
                        _.forEach(e.changes.deletedFiles, function (fileId) {
                            var fileDb = filesDb[fileId];
                            if (fileDb) {
                                fileDb = _.without(fileDb, item.id);
                            }
                            if (!fileDb || fileDb.length === 0) {
                                needsFileDbChange = true;
                                delete filesDb[fileId];
                                sdebug('removing file', fileId);
                                Ti.Filesystem.getFile(app.getFilePath(fileId))
                                    .deleteFile();
                            }
                        });
                    }
                    if (needsFileDbChange) {
                        Ti.App.Properties.setObject('files', filesDb);
                    }
                }
                return true;
            }
        },
        addType: function (_key, _type) {
            if (!__types[_key]) {
                __types[_key] = _type;
                initiateType(newList, key);
            }
        },
        createList: function (_defaults, _onlyIfExists) {
            var key = _defaults.id || _.snakeCase(_defaults.title);
            if (!!_onlyIfExists && lists[key] || __types[key]) {
                return;
            }
            while (lists[key]) {
                key += '_';
            }
            var newList = _.defaults(_defaults, {
                isList: true,
                canBeHidden: true,
                icon: app.icons.circle_stroked,
                // iconStyle: 1,
                defaultTitle: trc('list_item'),
                color: _.some(app.icons)
            });
            sdebug('createList', _defaults, newList);
            lists[key] = newList;
            saveLists();
            initiateType(newList, key);
            self.mapView.addCluster(__clusters[key]);
            __types[key] = newList;
            app.emit(__LIST__ + 'Created', {
                list: lists[key]
            });
        },
        updateList: function (_list, _changes) {
            var key = _list.id;
            var markerList = lists[key];
            if (markerList) {
                Object.assign(markerList, _changes);
                saveLists();
            }
            var type = __types[key];
            if (type) {
                Object.assign(type, _changes);
                if (_changes.hasOwnProperty('color') || _changes.hasOwnProperty('icon')) {
                    type.colors = app.getContrastColors(type.color);
                    type.image = itemHandler.getAnnotImage(type);
                    type.selectedImage = itemHandler.getAnnotImage(type, true);
                    ak.ti.redux.fn.setDefault('.' + type.rclass, {
                        // image: app.getImagePath(type.image),
                        type: type,
                        calloutAnchorPoint: type.calloutAnchorPoint
                    });
                    __clusters[key].applyProperties({
                        tintColor: type.color,
                        visible: type.visible,
                        color: type.colors.contrast
                    });
                    if (__items[key].length > 0) {
                        // app.showAlert({
                        //     title: trc('warning'),
                        //     message: trc('restard_needed')
                        // });
                        // reset all __items for images to be update
                        var theItems = __items[key];
                        _.forEach(theItems, function (item) {
                            if (!isItemARoute(item)) {
                                item.image = itemHandler.getAnnotImage(type, item);
                                item.selectedImage = itemHandler.getAnnotImage(type, item, true);
                            }

                        });
                        self.clear(key, false); //no need to clear the indexer
                        self.addItems(theItems);
                    }

                }
                app.emit(__LIST__ + 'Changed', {
                    list: type
                });
            }
        },
        onModuleLoaded: function (_moduleId, _state, _module) {
            if (_state === false) {
                var type = __types[_moduleId];
                if (type) {
                    sdebug('onModuleUnLoaded', types);
                    if (__clusters[_moduleId]) {
                        this.getCluster(_moduleId)
                            .removeAllAnnotations();
                        self.mapView.removeCluster(__clusters[_moduleId]);
                        delete __clusters[_moduleId];
                    }
                    indexRemoveList(_moduleId);
                    self.mapView.removeRoute(__routes[_moduleId]);
                    delete __routes[_moduleId];
                    delete __currentIds[_moduleId];
                    delete __items[_moduleId];
                    delete __types[_moduleId];

                }

            } else {
                var types = {};
                _module.getItemTypes && _module.getItemTypes(types);
                sdebug('onModuleLoaded', types);
                _.each(types, function (value, key) {
                    if (value.hidden !== false) {
                        __types[key] = value;
                        initiateType(value, key);
                        self.addItems(Ti.App.Properties.getObject(value.propertyKey, []),
                            undefined,
                            false);
                        self.mapView.addCluster(__clusters[key]);
                    }
                });
            }
        },
        removeList: function (_list) {
            sdebug('removeList', _list);
            var key = _list.id;
            var list = lists[key];
            if (list) {
                delete lists[key];
                saveLists();
            }
            var type = __types[key];
            if (type) {
                self.clear(key);
                delete __types[key];
                app.emit(__LIST__ + 'Removed', {
                    list: type
                });
            }
        },
        onWindowOpen: function (_enabled) {
            app.showTutorials(['map_drop_pin']);
        },
        actionsForItem: function (_item, _desc, _onMap, result) {
            // sdebug('items actionsForItem', _item.id, result);
            if (_item) {
                var isRoute = isItemARoute(_item);
                var toAdd = [];
                if (!isRoute) {
                    if (!_item.address) {
                        toAdd.push('reverse_geo');
                    }
                    if (!_item.hasOwnProperty('altitude')) {
                        toAdd.push('consolidate_alt');
                    }
                }

                if (_item.tags) {
                    if (_item.tags.phone) {
                        toAdd.unshift('phone');
                    }
                }

                if (!isRoute) {
                    toAdd.push('searcharound');
                }

                if (!isRoute) {
                    toAdd.push('search_google');
                } else {
                    if (!_item.profile) {
                        toAdd.push('query_profile');
                    }
                }
                if (!_onMap) {
                    toAdd.push('locate');
                }
                toAdd.push('more');
                // sdebug('items toAdd', toAdd);
                Array.prototype.unshift.apply(result, toAdd);
                // sdebug('items result', result);
            }
        },
        moreActionsForItem: function (_item, _desc, _onMap, result) {
            if (_item) {
                var isRoute = isItemARoute(_item);
                if (isRoute && _item.profile) {
                    result.push('update_profile');
                }
            }
        },
        runActionOnItem: function (_type, _item, _action) {
            var isRoute = isItemARoute(_item);
            var mapItem = this.getMapItem(_type, _item);
            sdebug('runActionOnItem', _type, _item.id);
            if (mapItem) {
                switch (_action) {
                    case 'select':

                        this.mapView.selectAnnotation(mapItem);
                        // if (mapItem.showInfoWindow) {
                        // mapItem.showInfo();
                        // } else {
                        setTimeout(function () {
                            if (isRoute) {
                                sdebug('runActionOnItem', 'moveToRoute');
                                self.parent.setRegion(mapItem.region, 0.3, true);
                            } else {
                                sdebug('runActionOnItem', 'moveToAnnotation');
                                self.parent.updateCamera({
                                    centerCoordinate: _.pick(_item, 'latitude',
                                        'longitude')
                                });
                            }
                        }, 100);

                        // }
                        break;
                }
            }
            return true;
        },
        prepareDetailsListView: function (item, itemDesc, sections, createItem, colors, iconicColor) {
            if (item.files) { // });
                sections.push({
                    hideWhenEmpty: true,
                    headerView: ak.ti.style({
                        type: 'Ti.UI.Label',
                        properties: {
                            rclass: 'SectionHeaderLabel',
                            backgroundColor: colors.color,
                            color: colors.contrast,
                            text: 'files'
                        }
                    }),
                    items: _.reduce(item.files, function (items, file) {
                        items.push({
                            template: 'file',
                            callbackId: 'file',
                            icon: {
                                color: iconicColor,
                                text: '\ue288'
                            },
                            title: {
                                text: file.title + ' - ' + (file.fullTitle ||
                                    file.fileName),
                            },
                            subtitle: {
                                text: moment(file.timestamp)
                                    .fromNow() + ' - ' + app.utils
                                    .filesize(file.fileSize, {
                                        round: 0
                                    })
                                // text:moment(file.timestamp).fromNow()
                            },
                            // accessory: {
                            //     color: iconicColor,
                            //     text:$.sHOptions,
                            //     visible:true
                            // },
                            data: file
                        });
                        return items;
                    }, [])
                });
            }
        }
    });
    return self;
};