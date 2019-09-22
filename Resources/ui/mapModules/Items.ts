import * as stringScore from 'string-score';
import { MapModule } from './MapModule';
import geolib from '../../lib/geolib';
import filesize from '../../lib/filesize';

declare global {
    interface ItemType {
        id?: string;
        title?: string;
        defaultTitle?: string;
        description?: string;
        icon?: string;
        color?: string;
        defaultColor?: string;
        textColor?: string;
        visible?: boolean;
        propertyKey?: string;
        image?: string;
        selectedImage?: string;
        hidden?: boolean;
        settings?: {
            geofeature?: boolean;
        };
        options?: any;
        iconSettings?: IconSettings;
        apiMethod?();
        osm?: boolean;
        getPrefKey?(suffix: string);
        colors?: ContrastColor;
        rclass?: string;
        apiParams?: any;
        isList?: boolean;
        calloutAnchorPoint?: [number, number];
    }
    interface RouteType extends ItemType {
        routeColor?: string;
        routeSelectedColor?: string;
    }
    interface ItemList extends ItemType {
        isList?: boolean;
        canBeHidden?: boolean;
        defaultTitle?: string;
    }
    interface ItemPhoto {
        image: string;
        url?: string;
        thumbnailImage?: string;
        originalLink?: string;
        width?: number;
        height?: number;
        attribution?: {
            author?: string;
            logo?: string;
            description?: string;
            link?: string;
        };
    }
    interface ItemFile {
        filePath: string;
        title?: string;
        fullTitle?: string;
        timestamp: number;
        fileSize: number;
        fileName?: string;
    }
    interface ItemNote {
        title: string;
        text?: string;
        url?: string;
    }

    interface IconSettings {
        style?: number;
        scale?: number;
    }
    interface ItemAddress {
        [k: string]: any;
        display_name: string;
        address?: { [k: string]: string };
    }
    interface Item extends TiLocation {
        settings?: any;
        id?: string;
        type?: string;
        title?: string;
        customTitle?: string;
        description?: string;
        image?: string;
        icon?: string;
        color?: string;
        selectedImage?: string;
        photos?: ItemPhoto[];
        files?: ItemFile[];
        customView?: TiDict;
        tags?: { [k: string]: any };
        address?: ItemAddress;
        iconSettings?: IconSettings;
        notes?: ItemNote[];
        osm?: {
            subtype?: string;
        };
    }
    interface RouteRoute {
        points?: TiLocation[];
        encoded?: boolean;
        overview_points?: string;
        distance?: number;
        region: Region;
    }
    interface RouteProfile {
        dmin?: number;
        dplus?: number;
    }
    interface Route extends Item {
        route_mode?: string;
        startOnRoute?: boolean;
        endOnRoute?: boolean;
        start?: TiLocation;
        end?: TiLocation;
        points?: TiLocation[];
        route?: RouteRoute;
        waypoints?: string[];
        profile?: RouteProfile;
    }
    interface RowItem extends titanium.ListDataItem {
        searchableText?: string;
        icon: {
            text: string;
            color: string;
        };
        title: {
            text: string;
        };
        description: {
            html: string;
            visible: boolean;
        };
        subtitle: {
            html: string;
        };
        item: Item;
        desc: ItemType;
    }

    interface ItemsMovedEvent extends ItemsEvent {
        oldItems: {
            [k: string]: {
                desc: ItemType;
                items: Item[];
            };
        };
    }
    interface ItemsEvent {
        items: Item[];
        desc: ItemType;
    }
    interface ItemChangedEvent {
        desc: ItemType;
        item: Item;
        changes: {
            newFiles?: ItemFile[];
            newPhotos?: ItemPhoto[];
            deletedPhotos?: string[];
            deletedFiles?: string[];
        };
    }
    interface ListsEvent {
        list: ItemList;
    }
}
export class Items extends MapModule {
    __types: { [k: string]: ItemType } = Object.assign(require('data/routetypes').data, require('data/markertypes').data);
    listDefaults = {
        modified: {
            color: '#ef6c00',
            title: trc('modified'),
            defaultTitle: trc('modified_item'),
            icon: app.icons.edit
        }
    };
    lists: {
        [k: string]: ItemList;
    } = Ti.App.Properties.getObject('lists', {});
    photosDb: {
        [k: string]: string[];
    } = Ti.App.Properties.getObject('photos', {});
    filesDb: {
        [k: string]: string[];
    } = Ti.App.Properties.getObject('files', {});
    __items: { [k: string]: Item[] } = {};
    __routes: { [k: string]: any[] } = {};
    __clusters: { [k: string]: MapCluster } = {};
    __currentIds: { [k: string]: { [k: string]: string[] } } = {};
    formatter = geolib.formatter;
    // cleanUpString = app.api.cleanUpString
    isItemARoute = app.itemHandler.isItemARoute;
    getAnnotImage = app.itemHandler.getAnnotImage;
    mapArgs;
    __movingItems: string[];
    htmlIcon = app.utilities.htmlIcon;
    constructor(_context, _args, _additional) {
        super(_args);
        this.mapArgs = _additional.mapArgs;
        _additional.mapArgs.calloutTemplates = _additional.mapArgs.calloutTemplates || {};
        _additional.mapArgs.calloutTemplates.calloutPhoto = app.templates.view.cloneTemplateAndFill(
            'calloutPhoto',
            {
                properties: {
                    bubbleParent: false
                }
            },
            {
                image: {
                    startload: function(e) {
                        console.debug('startload');
                        e.source.parent.loading.visible = true;
                        e.source.backgroundColor = null;
                    },
                    load: function(e) {
                        e.source.parent.loading.visible = false;
                        console.debug('load', e.colorArt, e.source.parent.loading.visible);
                        if (e.colorArt) {
                            e.source.backgroundColor = e.colorArt.backgroundColor;
                        }
                    },
                    click: app.debounce(function(e) {
                        if (!e.source.parent.loading.visible) {
                            var item = (e.annotation && e.annotation.item) || (e.route && e.route.item);
                            // console.debug('click', item);
                            if (item) {
                                app.showImageFullscreen(item.photos, 0, e.source);
                            }
                        }
                    }),
                    longpress: function(e) {
                        // console.debug('longpress', e.source.parent.loading);
                        if (!e.source.parent.loading.visible) {
                            app.share({
                                image: e.source.toBlob()
                            });
                        }
                    }
                }
            }
        );

        if (__APPLE__) {
            this.indexer = Ti.App.iOS.createSearchableIndex();
            if (this.indexer && this.indexer.isSupported()) {
                var contenttype = Ti.App.iOS.UTTYPE_HTML;
                this.indexAddItems = (_items: Item[]) => {
                    console.debug('indexAddItems', _items);
                    this.indexer.addToDefaultSearchableIndex(
                        _.reduce(
                            _items,
                            (memo, item) => {
                                if (!item.title) {
                                    return memo;
                                }
                                var canNav = !!item.latitude;
                                var type = this.__types[item.type];
                                var phone = item.tags && item.tags.phone;
                                var desc = '';
                                if (item.altitude) {
                                    desc += this.formatter.altitude(item.altitude) + ' ';
                                }
                                if (canNav) {
                                    desc += this.formatter.latLngString(item, 2);
                                }
                                if (item.description) {
                                    desc += '\n' + item.description;
                                } else if (item.address) {
                                    desc += '\n' + item.address.display_name;
                                }
                                // console.debug('desc', desc);
                                var image = item.photos ? item.photos[0].image : undefined;
                                if (!image || _.startsWith(image, 'http')) {
                                    image = item.image || type.image;
                                }
                                var attributeSet: any = {
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
                                // console.debug(attributeSet);
                                return memo;
                            },
                            []
                        ),
                        null
                    );
                };
                this.indexRemoveItemsIds = _items => {
                    this.indexer.deleteSearchableItemsByIdentifiers(_items, null);
                };
                this.indexRemoveList = _key => {
                    this.indexer.deleteAllSearchableItemByDomainIdentifiers([_key]);
                };
            }
        }
    }
    indexAddItems = function(_items) {};
    indexRemoveItemsIds = function(_items) {};
    indexRemoveList = function(_key) {};
    indexer: titanium.AppiOSSearchableIndex;
    initiateType = (type, key) => {
        if (!!type.hidden) {
            return;
        }
        this.__items[key] = [];
        console.debug('Items', 'initiateType', key, type);
        this.itemHandler.initializeType(key, type);

        this.__clusters[key] = new MapCluster({
            image: app.getImagePath(
                this.getAnnotImage(type, {
                    iconSettings: {
                        style: 10
                    }
                })
            ),
            minZoom: type.minZoom,
            maxZoom: type.maxZoom,
            // tintColor: type.color,
            visible: type.visible
            // color: type.colors.contrast,
            // strokeColor: $.white
        });
        // this.__clusters[key].visible = type.visible;
        this.__currentIds[key] = {
            routes: [],
            markers: []
        };
        if (type.calloutTemplate) {
            this.mapArgs.calloutTemplates[key] = ak.ti.style(type.calloutTemplate);
        }
        // Ti.App.Properties.removeProperty(type.propertyKey);
        // console.debug('initiateType', key, type);
    };

    saveLists() {
        Ti.App.Properties.setObject('lists', _.mapValues(this.lists, _v => _.omit(_v, 'getPrefKey', 'rclass', 'image', 'selectedImage', 'visible', 'propertyKey', 'colors')));
    }

    annotationForMarker(_type, _marker) {
        var hasInfo = _type.hasInfo !== false;
        if (hasInfo || _marker.title) {
            var item = this.itemHandler.annotationParamsFromItem(_marker, _type);
            return item;
        }
        return undefined;
    }

    routeForRoute(_type, _route) {
        var hasInfo = _type.hasInfo !== false;
        if (hasInfo || _route.title) {
            var item = this.itemHandler.routeParamsFromItem(_route, _type);
            return item;
        }
    }
    getCluster(_type) {
        return this.__clusters[_type];
    }
    onInit() {
        app.on(_EVENT_ITEMS_CHANGED_, this.onChanged);
        let key;
        for (key in this.lists) {
            if (!this.__types[key]) {
                this.__types[key] = this.lists[key];
            }
        }
        var thirdTypes = this.parent.runReduceMethodOnModules(true, 'getItemTypes');
        for (key in thirdTypes) {
            if (!this.__types[key]) {
                this.__types[key] = thirdTypes[key];
            }
        }
        this.__types = _.omit(this.__types, e => {
            return !!e.hidden;
        });
        for (key in this.__types) {
            let theType = this.__types[key];
            this.initiateType(theType, key);
        }
        for (key in this.__types) {
            let theType = this.__types[key];
            this.addItems(Ti.App.Properties.getObject(theType.propertyKey, []), undefined, false);
        }
        this.mapView.addCluster(_.values(this.__clusters).reverse());
    }
    GC() {
        super.GC();
        app.off(_EVENT_ITEMS_CHANGED_, this.onChanged);
        this.__items = null;
        this.__clusters = null;
        this.__currentIds = null;
        this.__routes = null;
    }
    addItems(_items: Item[], _fireEvent?: boolean, _save?: boolean) {
        // console.debug('addItems', _items);
        if (!_items || _items.length === 0) {
            return;
        }

        var grouped = _.groupBy(_items, 'type');
        var added = false;
        for (const _type in grouped) {
            var type = this.__types[_type];
            // console.debug('type', _type, type);
            if (!type) {
                this.createList(
                    Object.assign(
                        {
                            id: _type
                        },
                        this.listDefaults[_type]
                    ),
                    true
                );
                type = this.__types[_type];
            }
            if (type) {
                // console.debug('addItems', type, theItems);
                var cluster = this.__clusters[_type],
                    toAdd = [],
                    addedMarkers = [],
                    addedRoutes = [],
                    annots = [],
                    currentTypeIds = this.__currentIds[_type],
                    currentIds,
                    routes = [],
                    existing,
                    isRoute,
                    idKey: string,
                    newPhotos = false,
                    mapItem;

                grouped[_type].forEach(item => {
                    isRoute = this.isItemARoute(item);
                    idKey = isRoute ? __ROUTES__ : __MARKERS__;
                    currentIds = currentTypeIds[idKey];
                    existing = false;
                    item.id = item.id + '';
                    if (!_.includes(this.__movingItems, item.id)) {
                        existing = _.includes(currentIds, item.id);
                        if (!existing) {
                            //for the sake of avoiding duplicates, look in lists too
                            for (const key in this.lists) {
                                if (_type !== key) {
                                    existing = _.includes(this.__currentIds[key][idKey], item.id);
                                    if (existing) {
                                        console.debug('found existing in list', key);
                                        return false;
                                    }
                                }
                            }
                        }
                    }

                    if (!existing) {
                        if (isRoute) {
                            mapItem = this.routeForRoute(type, item);
                            if (mapItem) {
                                addedRoutes.push(item);
                                routes.push(mapItem);
                            }
                        } else {
                            if (item.icon || item.color) {
                                item.image = this.getAnnotImage(type, item);
                                item.selectedImage = this.getAnnotImage(type, item, true);
                            }
                            mapItem = this.annotationForMarker(type, item);
                            if (mapItem) {
                                addedMarkers.push(item);
                                annots.push(mapItem);
                            }
                        }
                    }
                });
                if (newPhotos) {
                    Ti.App.Properties.setObject('photos', this.photosDb);
                }
                if (annots.length > 0) {
                    // console.debug('about to add annotations', annots);
                    const added = this.getCluster(_type).addAnnotation(annots);
                    var addedLength = added.length;
                    if (addedLength !== annots.length) {
                        this.__items[_type] = this.__items[_type].concat(addedMarkers.slice(-addedLength));
                    } else {
                        this.__items[_type] = this.__items[_type].concat(addedMarkers);
                    }
                    if (_save !== false) {
                        this.indexAddItems(addedMarkers);
                        Ti.App.Properties.setObject(type.propertyKey, this.__items[_type]);
                    }
                    currentTypeIds[__MARKERS__] = currentTypeIds[__MARKERS__].concat(_.map(addedMarkers, 'id'));
                }
                if (routes.length > 0) {
                    // console.debug('about to add routes', routes);
                    this.__routes[_type] = (this.__routes[_type] || []).concat(this.mapView.addRoute(routes));
                    this.__items[_type] = this.__items[_type].concat(addedRoutes);
                    if (_save !== false) {
                        this.indexAddItems(addedRoutes);
                        Ti.App.Properties.setObject(type.propertyKey, this.__items[_type]);
                    }
                    currentTypeIds[__ROUTES__] = currentTypeIds[__ROUTES__].concat(_.map(addedRoutes, 'id'));
                }

                if (_fireEvent !== false && annots.length + routes.length > 0) {
                    app.emit(_EVENT_ITEMS_ADDED_, {
                        items: addedMarkers.concat(addedRoutes),
                        desc: type
                    });
                }
            }
        }
        return added;
    }
    removeItems(_items: Item[], _realDelete?: boolean) {
        console.debug('removeItems', _.pick(_items, 'id', 'type'));
        var grouped = _.groupBy(_items, 'type');
        var removed = false;
        for (const _type in grouped) {
            var type = this.__types[_type];
            if (type) {
                var cluster = this.__clusters[_type],
                    annotations = cluster.annotations,
                    annotsToRemove = [],
                    routesToRemove = [],
                    removedIds = [],
                    currentTypeIds = this.__currentIds[_type],
                    currentIds,
                    isRoute,
                    idKey,
                    index;
                grouped[_type].forEach(_item => {
                    isRoute = this.isItemARoute(_item);
                    idKey = isRoute ? __ROUTES__ : __MARKERS__;
                    console.debug('removeItem', _item.id, _type, idKey, currentTypeIds[idKey]);
                    index = currentTypeIds[idKey].indexOf(_item.id);
                    if (index >= 0) {
                        currentTypeIds[idKey].splice(index, 1);
                        _.remove(this.__items[_type], {
                            id: _item.id
                        });
                        removedIds.push(_item.id);
                        if (this.isItemARoute(_item)) {
                            routesToRemove.push(this.__routes[_type][index]);
                            this.__routes[_type].splice(index, 1);
                        } else {
                            annotsToRemove.push(annotations[index]);
                        }
                        if (_realDelete !== false) {
                            if (_item.photos) {
                                var removedPhoto = false;
                                _item.photos.forEach(photo => {
                                    var photoDb = this.photosDb[photo.image];
                                    photoDb = _.without(photoDb, _item.id);
                                    if (photoDb && photoDb.length === 0) {
                                        removedPhoto = true;
                                        delete this.photosDb[photo.image];
                                        console.debug('removing photo', photo);
                                        Ti.Filesystem.getFile(app.getImagePath(photo.image)).deleteFile();
                                        if (photo.thumbnailImage) {
                                            Ti.Filesystem.getFile(app.getImagePath(photo.thumbnailImage)).deleteFile();
                                        }
                                    }
                                });
                                if (removedPhoto) {
                                    Ti.App.Properties.setObject('photos', this.photosDb);
                                }
                            }

                            if (_item.files) {
                                var removedFile = false;
                                _item.files.forEach(file => {
                                    var fileDb = this.filesDb[file.fileName];
                                    fileDb = _.without(fileDb, _item.id);
                                    if (fileDb && fileDb.length === 0) {
                                        removedFile = true;
                                        delete this.filesDb[file.filePath];
                                        console.debug('removing file', file);
                                        Ti.Filesystem.getFile(app.getFilePath(file.filePath)).deleteFile();
                                    }
                                });
                                if (removedFile) {
                                    Ti.App.Properties.setObject('files', this.filesDb);
                                }
                            }
                        }
                    }
                });
                if (annotsToRemove.length + routesToRemove.length > 0) {
                    if (_realDelete) {
                        this.indexRemoveItemsIds(removedIds);
                    }
                    cluster.removeAnnotation(annotsToRemove);
                    this.mapView.removeRoute(routesToRemove);
                    Ti.App.Properties.setObject(type.propertyKey, this.__items[_type]);
                    removed = true;
                    if (_realDelete !== false) {
                        app.emit(_EVENT_ITEMS_REMOVED_, {
                            items: grouped[_type],
                            desc: type
                        });
                    }
                }
            }
        }
        return removed;
    }
    getItems(key: string) {
        if (this.__items[key]) {
            return this.__items[key];
        }
    }
    getItemsInRegion = (memo, _center, _radius) => {
        var results = {},
            type: ItemType;
        let items;
        for (const key in this.__items) {
            type = this.__types[key];
            items = [];
            this.__items[key].forEach(item => {
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
        }
    };
    getItem(_item: Item, _type?: string) {
        var result, currentTypeIds, index, item, searchKeys: string[];
        var searchingIn = this.__types;
        if (_type) {
            searchingIn = _.pick(this.__types, _type);
        }
        // console.debug('getItem', _item, searchingIn);
        let type;
        for (const key in searchingIn) {
            type = searchingIn[key];
            currentTypeIds = this.__currentIds[key];
            searchKeys = _.get(_item, 'settings.searchKeys') || _.get(type, 'settings.searchKeys') || ['id'];
            var params: any = {};
            for (var i = 0; i < searchKeys.length; i++) {
                params[searchKeys[i]] = _item[searchKeys[i]];
            }
            if (params.id) {
                params.id = params.id + '';
            }
            // console.debug('currentTypeIds', key, params);
            const index = _.findIndex(this.__items[key], params);
            if (index >= 0) {
                item = this.__items[key][index];

                result = {
                    item: item,
                    desc: type,
                    annotation: this.getMapItem(_type, item)
                };
                break;
            }
        }
        return result;
    }
    searchItems(
        memo: {
            [k: string]: {
                desc: ItemType;
                items: Item[];
            };
        },
        _query: string
    ) {
        var type, items, fuzzyResult;
        for (const key in this.__items) {
            type = this.__types[key];
            items = [];
            this.__items[key].forEach(function(item) {
                var score = item.title && stringScore(_.deburr(item.title), _query, 1);
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
        }
    }
    getLists(_withItems: boolean) {
        type ItemList = {
            count: number;
            description: ItemType;
            items?: Item[];
        };
        return _.reduce(
            this.__items,
            (memo, items, key) => {
                var type = this.__types[key];
                if (type && !type.hidden) {
                    var result: ItemList = {
                        count: items.length,
                        description: type
                    };
                    if (_withItems) {
                        result.items = items;
                    }
                    memo.push(result);
                }

                return memo;
            },
            [] as ItemList[]
        );
    }
    getAnnotation(_type: string, _id: string) {
        if (this.__types[_type]) {
            var index = this.__currentIds[_type][__MARKERS__].indexOf(_id);
            if (index >= 0) {
                return this.getCluster(_type).getAnnotation(index);
            }
        }
    }
    getRoute(_type: string, _id: string) {
        if (this.__types[_type]) {
            var index = this.__currentIds[_type][__ROUTES__].indexOf(_id);
            if (index >= 0) {
                return this.__routes[_type][index];
            }
        }
    }
    getItemById(_type: string, _id: string) {
        if (this.__types[_type]) {
            var index = this.__currentIds[_type][__ROUTES__].indexOf(_id);
            if (index >= 0) {
                return this.__items[_type][index];
            }
        }
    }
    getType(_type: string) {
        return this.__types[_type];
    }
    getMapItem(_type: string, _item: Item) {
        console.debug('getMapItem', _type, _item.id);
        if (this.__types[_type]) {
            var isRoute = this.isItemARoute(_item);
            // console.debug('getMapItem', _type, _item.id);
            var idKey = isRoute ? __ROUTES__ : __MARKERS__;
            var index = this.__currentIds[_type][idKey].indexOf(_item.id);
            // console.debug('getMapItem', isRoute, idKey, index);
            if (index >= 0) {
                return isRoute ? this.__routes[_type][index] : this.getCluster(_type).getAnnotation(index);
            }
        }
    }
    getMarkersForRegion = (_type: ItemType, region: MapRegion, _window: AppWindow, _mapHandler: MapWindow, _callback: Function) => {
        console.debug('getMarkersForRegion', _type, region);
        var calls = [];

        var request;

        if (_type.osm) {
            calls.push(_.partial(app.api.queryGeoFeatures, _type.osm, region, _type, this.itemHandler));
        } else {
            calls.push(
                _.partial(
                    _type.apiMethod,
                    Object.assign(
                        {
                            region: region
                        },
                        _type.apiParams
                    ),
                    _type,
                    this.itemHandler
                )
            );
        }

        const contentModules = _mapHandler.getContentModules();
        let module;
        for (const key in contentModules) {
            module = contentModules[key];
            if (module['getMarkersForRegion']) {
                calls.push(_.partial(module['getMarkersForRegion'], _type, region, this.itemHandler));
            }
        }
        request = app.api
            .parallelRequests(calls)
            .then(resultsList => {
                console.log('resultsList', resultsList);
                var toAdd = [];
                resultsList.forEach(function(results) {
                    if (results) {
                        toAdd.push.apply(toAdd, results);
                    }
                });
                console.log('toAdd', toAdd);
                var addedItems = this.addItems(toAdd);
                if (_callback) {
                    _callback(addedItems);
                } else {
                    _window.hideLoading();
                }
            })
            .catch(function(err) {
                if (!_callback) {
                    _window.hideLoading();
                } else {
                    _callback(err);
                }
                throw err;
            });
        if (!_callback) {
            _window.showLoading({
                request: request,
                label: {
                    html: this.htmlIcon(_type.icon, 1) + ' ' + trc('loading') + '...'
                }
            });
        }
        return request;
    };
    // addOrUpdateItem(_type, _item:Item) {
    //     if (this.__types[_type] !== undefined) {
    //         var type = this.__types[_type];
    //         var existingItem;
    //         if (_item.id) {
    //             existingItem = this.getItem(_item);
    //         }
    //         if (existingItem) {
    //             this.itemHandler.updateItem(existingItem, type, _item);
    //         } else {
    //             this.addItems(_type, [_item]);
    //         }
    //     }
    // }
    onModuleAction(_params: {
        id: string;
        window?: AppWindow;
        command: string;
        value?: any;
        item?: Item;
        items?: Item[];
        mapHandler?: MapWindow;
        region?: MapRegion;
        callback?: Function;
        moveType?: string;
        list?: string;
        onlyIfExists?: boolean;
        changes?: any;
    }) {
        var key = _params.id;
        var win = _params.window || this.window;
        console.debug('onModuleAction', key, _params.command, win.title);
        if (this.__types[key] !== undefined || _params.command === 'create') {
            var type = this.__types[key];
            if (_params.command) {
                switch (_params.command) {
                    case 'clear':
                    case 'clear_list':
                        this.clear(key);
                        Ti.App.Properties.removeProperty(type.propertyKey);
                        break;
                    case 'visibility':
                        this.setVisible(key, _params.value);
                        break;
                    case 'delete_list':
                        if (_params.value) {
                            this.removeList(_params.value);
                        } else {
                            return false;
                        }
                        break;
                    case 'remove':
                        if (_params.items) {
                            this.removeItems(_params.items, true);
                        } else {
                            return false;
                        }
                        break;
                    case 'create': {
                        this.createList(
                            Object.assign(
                                {
                                    id: key
                                },
                                this.listDefaults[key]
                            ),
                            true
                        );
                        type = this.__types[key];
                        console.debug(_params.command, _params.item);
                        if (_params.item) {
                            var isRoute = this.isItemARoute(_params.item);
                            let func = isRoute ? this.itemHandler.createRouteItem : this.itemHandler.createAnnotItem;
                            var item = func(type, _params.item);
                            this.addItems([item]);
                        } else {
                            return false;
                        }
                        break;
                    }
                    case 'add': {
                        if (_params.items) {
                            this.addItems(_params.items);
                        } else {
                            return false;
                        }
                        break;
                    }
                    case 'move':
                        if (_params.items) {
                            this.moveItems(_params.items, _params.moveType);
                        } else {
                            return false;
                        }
                        break;

                    default:
                        return false;
                }
            } else if (type.osm || type.apiMethod) {
                var request = this.getMarkersForRegion(type, _params.region || this.mapView.region, win, _params.mapHandler || this.parent, function(_addedItems) {
                    if (_params.callback) {
                        _params.callback(_addedItems);
                    }
                    win.hideLoading();
                });
                win.showLoading({
                    request: request,
                    label: {
                        html: this.htmlIcon(type.icon, 1) + ' ' + trc('loading') + '...'
                    }
                });
            }
        } else if (key === 'geofeature') {
            var test = this.parent.runReduceMethodOnModules(true, 'getGeoFeatures');
            app.showOptionsListDialog(
                {
                    small: true,
                    collection: true,
                    title: trc('find_geofeatures'),
                    items: _.reduce(
                        Object.assign(
                            _.filter(this.__types, function(type, key) {
                                return type.settings && !!type.settings.geofeature && type.visible !== false;
                            }),
                            test
                        ),
                        function(memo, type: ItemType, index) {
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
                        },
                        [
                            {
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
                            }
                        ] as TiDict[]
                    )
                },
                e => {
                    if (e.cancel === false) {
                        var key = e.item.id;
                        var type = this.__types[key];
                        // console.debug(e, key, type);
                        if (type) {
                            var request = this.getMarkersForRegion(type, _params.region || this.mapView.region, win, _params.mapHandler || this.parent, function(_addedItems) {
                                if (_params.callback) {
                                    _params.callback(_addedItems);
                                }
                                win.hideLoading();
                            });
                            win.showLoading({
                                request: request,
                                label: {
                                    html: this.htmlIcon(type.icon, 1) + ' ' + trc('loading') + '...'
                                }
                            });
                        } else {
                            this.onModuleAction(
                                Object.assign(e.item, {
                                    callback: _params.callback
                                })
                            );
                        }
                    }
                }
            );
        } else if (key === 'prepare_hiking') {
            console.debug('prepare_hiking');
            var addedItems = [];
            win.showLoading({
                label: {
                    html: this.htmlIcon(app.icons.hiking, 1) + ' ' + trc('preparing_hike') + '...'
                }
            });
            var onItems = function(e) {
                addedItems = addedItems.concat(e.items);
            };
            var geofeatureTypes = ['refuge', 'peak', 'saddle', 'lake', 'water', 'glacier'];
            var index = 0;
            var onDone = function() {
                app.off(_EVENT_ITEMS_ADDED_, onItems);
                // console.debug(addedItems);
                win.hideLoading();
                if (_params.callback) {
                    _params.callback(addedItems);
                }
            };
            var region = _params.region || this.mapView.region;
            var queryFeatures = _onDone => {
                if (index < geofeatureTypes.length) {
                    var type = geofeatureTypes[index++];
                    this.getMarkersForRegion(this.__types[type], region, win, _params.mapHandler || this.parent, _.partial(queryFeatures, _onDone));
                } else {
                    _onDone();
                }
            };
            app.on(_EVENT_ITEMS_ADDED_, onItems);
            queryFeatures(onDone);
        } else if (key === __ITEMS__) {
            switch (_params.command) {
                case 'create_list':
                    if (_.isString(_params.list)) {
                        this.createList(
                            Object.assign(
                                {
                                    id: _params.list
                                },
                                this.listDefaults[_params.list]
                            ),
                            _params.onlyIfExists
                        );
                    } else {
                        this.createList(_params.list, _params.onlyIfExists);
                    }
                    break;
                case 'update_list':
                    this.updateList(_params.list, _params.changes);
                    break;
            }
        } else {
            return false;
        }
        return true;
    }
    clear(_key, _indexerClear?: boolean) {
        this.getCluster(_key).removeAllAnnotations();
        if (_indexerClear !== false) {
            this.indexRemoveList(_key);
        }
        this.mapView.removeRoute(this.__routes[_key]);
        this.__routes[_key] = [];
        this.__currentIds[_key] = {
            routes: [],
            markers: []
        };
        this.__items[_key] = [];
    }
    getSupplyTemplates(memo) {
        memo.elprofile = app.templates.row.elevationProfile;
        // memo.elprofileHTML = app.templates.row.elevationProfileHTML;
        // memo.elprofileHTML.childTemplates[1].events = {
        //     load:function(e) {
        //         // console.debug('load', e);
        //         e.source.evalJS('plotChart(' + JSON.stringify(e.source.chartdata) + ')');
        //     }
        // };
        memo.file = app.templates.row.gfoptionfileitem;
    }
    // getChartData: function (_profile, _color) {
    //     var getColor = function (value) {
    //         //value from 0 to 1
    //         var hue = (Math.max((1 - value * 3) * 120, 12)).toString(10);
    //         return ["hsla(", hue, ",100%,50%, 0.5)"].join("");
    //     };
    //     return {
    //         chart: {
    //             zoomType: 'x',
    //             spacing: [5, 5, 5, 5],
    //             plotBackgroundColor: null,
    //             plotBorderWidth: null,
    //             plotShadow: false
    //         },
    //         credits: {
    //             enabled: false
    //         },
    //         title: {
    //             text: ''
    //         },
    //         // tooltip: {
    //         //     pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    //         // },
    //         plotOptions: {
    //             line: {
    //                 allowPointSelect: true,
    //                 cursor: 'pointer',
    //                 dataLabels: {
    //                     enabled: false
    //                 },
    //                 showInLegend: false
    //             }
    //         },
    //         xAxis: {
    //             labels: {
    //                 formatter: function () {
    //                     console.debug('formatter', this.value);
    //                     return formatter.distance(this.value);
    //                 }
    //             },
    //             // tickInterval: 20,
    //             //type: 'datetime'
    //             text: '',
    //             plotBands: _.reduce(_profile.gradleRegions, function (memo, value, index) {
    //                 memo.push({
    //                     from: value.from,
    //                     to: value.to,
    //                     color: getColor(Math.abs(value.value)),
    //                     // label: {
    //                     //   text: value.value * 100 + '%',
    //                     //   style: {
    //                     //     color: '#606060'
    //                     //   }
    //                     // }
    //                 });
    //                 return memo;
    //             }, [])

    //         },
    //         yAxis: {
    //             title: {
    //                 text: ''
    //             }
    //         },
    //         legend: {
    //             enabled: false
    //         },
    //         plotOptions: {
    //             area: {
    //                 fillColor: null,
    //                 marker: {
    //                     radius: 2
    //                 }
    //             }
    //         },

    //         series: [{
    //             type: 'line',
    //             color: _color,
    //             data: _profile.data
    //         }]
    //     };
    // },
    getItemSupplViews(_item, _desc, _params) {
        if (this.isItemARoute(_item) && (_item.profile || (_item.tags && _item.tags.dplus && _item.tags.dmin))) {
            _params = _params || {};
            var profile = _item.profile;
            var color = _item.color || _desc.color;
            // var useHTML = profile && profile.version === 2;
            // console.debug('profile', profile);
            var result = {
                template: 'elprofile',
                // template: useHTML ? 'elprofileHTML' : 'elprofile',
                properties: {},
                chartDesc: {
                    visible: true,
                    html: this.itemHandler.itemProfileDesc(_item)
                },
                chart: {
                    visible: false
                }
            };
            if (profile) {
                // if (useHTML) {
                //     Object.assign(result, {
                //         chart: {
                //             height: (!!_params.small && 80) || undefined,
                //             visible: true,
                //             chartdata: this.getChartData(profile, color)
                //         }
                //     });
                //     return result;
                // }
                var heigthLength = profile.max[1] - profile.min[1];
                var delta = heigthLength / 2;
                // console.debug('heigthLength', heigthLength);
                // console.debug('delta', delta);
                Object.assign(result, {
                    chartset: {
                        highlightColor: color,
                        color: color,
                        values: profile.version === 2 ? profile.data : profile.data[1].map(Math.floor),
                        fillGradient: {
                            type: 'linear',
                            colors: [color + '00', color],
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
                    },
                    chart: {
                        height: (!!_params.small && 80) || undefined,
                        visible: true
                    }
                });
                // console.log('test', result);
                return result;
            }
            // return ;
        }
    }
    onModuleLongAction(_params) {
        var key = _params.id;
        if (this.__types[key] !== undefined) {
            var type = this.__types[key];
            var options = ['clear', 'list'];
            new OptionDialog({
                options: _.map(options, function(value, index) {
                    return trc(value);
                }),
                buttonNames: [trc('cancel')],
                cancel: 0,
                tapOutDismiss: true
            })
                .on('click', e => {
                    if (!e.cancel) {
                        var option = options[e.index];
                        this.onModuleAction({
                            id: key,
                            command: option
                        });
                    }
                })
                .show();
        }
    }
    onMapLongPress(e) {
        var loc = _.pick(e, 'latitude', 'longitude', 'altitude');
        var extras = this.parent.runReduceMethodOnModules(true, 'getDroppedExtra', loc, e.zoom);
        for (const key in extras) {
            Object.assign(loc, extras[key]);
        }
        var type = 'dropped';
        var item = this.itemHandler.createAnnotItem(this.__types[type], loc);
        console.debug('onMapLongPress', 'create annot', item);
        this.addItems([item]);
        this.runActionOnItem(type, item, 'select');
        return true;
    }
    setVisible(_type: string, _visible: boolean) {
        var type = this.__types[_type];
        console.debug('setVisible', _type, _visible);
        if (type) {
            type.visible = _visible;
            this.__routes[_type].forEach(function(route) {
                route.visible = _visible;
            });
            Ti.App.Properties.setBool(type.getPrefKey('visible'), _visible);
            this.__clusters[_type].visible = _visible;
        }
    }
    moveItems(_items: Item[], _newType: string) {
        var newListType = this.__types[_newType];
        if (!newListType) {
            this.createList(
                Object.assign(
                    {
                        id: _newType
                    },
                    this.listDefaults[_newType]
                ),
                true
            );
            newListType = this.__types[_newType];
        }
        var itemsToMove: Item[] = [];

        _items.forEach(_item => {
            var type = _item.type;
            var isRoute = this.isItemARoute(_item);
            var idKey = isRoute ? __ROUTES__ : __MARKERS__;
            var index = this.__currentIds[type][idKey].indexOf(_item.id);
            if (index >= 0) {
                itemsToMove.push(_item);
            }
        });

        var newItems = _.reduce(
            itemsToMove,
            (memo, item) => {
                var newItem = JSON.parse(JSON.stringify(item));
                var type = this.__types[newItem.type];
                newItem.type = _newType;
                delete newItem.image;
                delete newItem.selectedImage;
                if (!newItem.title) {
                    newItem.title = type.defaultTitle;
                }
                newItem.settings = type.settings;
                if (newItem.settings && !!newItem.settings.geofeature) {
                    newItem.icon = newItem.icon || type.icon;
                    // newItem.color = newItem.color || type.color;
                    newItem.iconSettings = type.iconSettings;
                }
                if (type.options) {
                    newItem.options = (newItem.options || []).concat(type.options);
                }
                memo.push(newItem);
                return memo;
            },
            []
        );

        this.__movingItems = _.map(itemsToMove, 'id');
        console.debug('__movingItems', this.__movingItems);
        this.removeItems(itemsToMove, false);
        this.addItems(newItems, false);

        //the order is important as anyone listening to it must be able to find the newly moved(added) annotation
        app.emit(_EVENT_ITEMS_MOVED_, {
            oldItems: _.mapValues(_.groupBy(itemsToMove, 'type'), (items, key) => {
                return {
                    desc: this.__types[key],
                    items: items
                };
            }),
            items: newItems,
            desc: newListType
        });

        this.__movingItems = null;

        app.showMessage(
            trc('items_moved_to_{title}').assign({
                title: newListType.title
            }),
            newListType.colors
        );
    }
    onChanged = (e: ItemChangedEvent) => {
        var item = e.item;
        var type = this.__types[item.type];
        if (type) {
            var typeId = type.id;
            var isRoute = this.isItemARoute(item);
            var idKey = isRoute ? __ROUTES__ : __MARKERS__;
            var index = _.findIndex(this.__items[typeId], {
                id: item.id
            });
            console.debug('item changed', item.id, index, typeId);
            if (index >= 0) {
                this.__items[typeId][index] = item;
                Ti.App.Properties.setObject(type.propertyKey, this.__items[typeId]);
                // indexRemoveItems([item]);
                this.indexAddItems([item]);
                this.parent.updateMapItem(this.getMapItem(typeId, item), item, e.changes);
                var needsPhotoDbChange = false;
                if (e.changes.newPhotos) {
                    needsPhotoDbChange = true;
                    e.changes.newPhotos.forEach(photo => {
                        this.photosDb[photo.image] = this.photosDb[photo.image] || [];
                        this.photosDb[photo.image].push(item.id);
                        if (photo.thumbnailImage) {
                            this.photosDb[photo.thumbnailImage] = this.photosDb[photo.thumbnailImage] || [];
                            this.photosDb[photo.thumbnailImage].push(item.id);
                        }
                    });
                }
                if (e.changes.deletedPhotos) {
                    e.changes.deletedPhotos.forEach(photoId => {
                        var photoDb = this.photosDb[photoId];
                        if (photoDb) {
                            photoDb = _.without(photoDb, item.id);
                        }
                        if (!photoDb || photoDb.length === 0) {
                            needsPhotoDbChange = true;
                            delete this.photosDb[photoId];
                            console.debug('removing photo', photoId);
                            Ti.Filesystem.getFile(app.getImagePath(photoId)).deleteFile();
                        }
                    });
                }
                if (needsPhotoDbChange) {
                    Ti.App.Properties.setObject('photos', this.photosDb);
                }

                var needsFileDbChange = false;
                if (e.changes.newFiles) {
                    needsPhotoDbChange = true;
                    e.changes.newFiles.forEach(file => {
                        this.filesDb[file.fileName] = this.photosDb[file.fileName] || [];
                        this.filesDb[file.fileName].push(item.id);
                    });
                }
                if (e.changes.deletedFiles) {
                    e.changes.deletedFiles.forEach(fileId => {
                        var fileDb = this.filesDb[fileId];
                        if (fileDb) {
                            fileDb = _.without(fileDb, item.id);
                        }
                        if (!fileDb || fileDb.length === 0) {
                            needsFileDbChange = true;
                            delete this.filesDb[fileId];
                            console.debug('removing file', fileId);
                            Ti.Filesystem.getFile(app.getFilePath(fileId)).deleteFile();
                        }
                    });
                }
                if (needsFileDbChange) {
                    Ti.App.Properties.setObject('files', this.filesDb);
                }
            }
            return true;
        }
    };
    addType(_key, _type) {
        if (!this.__types[_key]) {
            this.__types[_key] = _type;
            this.initiateType(_type, _key);
        }
    }
    createList(_defaults, _onlyIfExists) {
        var key = _defaults.id || _.snakeCase(_defaults.title);
        if ((!!_onlyIfExists && this.lists[key]) || this.__types[key]) {
            return;
        }
        while (this.lists[key]) {
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
        console.debug('createList', _defaults, newList);
        this.lists[key] = newList;
        this.saveLists();
        this.initiateType(newList, key);
        this.mapView.addCluster(this.__clusters[key]);
        this.__types[key] = newList;
        app.emit(__LIST__ + 'Created', {
            list: this.lists[key]
        });
    }
    updateList(_list, _changes) {
        var key = _list.id;
        var markerList = this.lists[key];
        if (markerList) {
            Object.assign(markerList, _changes);
            this.saveLists();
        }
        var type = this.__types[key];
        if (type) {
            Object.assign(type, _changes);
            if (_changes.hasOwnProperty('color') || _changes.hasOwnProperty('icon')) {
                type.colors = app.getContrastColors(type.color);
                type.image = this.itemHandler.getAnnotImage(type);
                type.selectedImage = this.itemHandler.getAnnotImage(type, undefined, true);
                ak.ti.redux.fn.setDefault('.' + type.rclass, {
                    // image: app.getImagePath(type.image),
                    type: type,
                    calloutAnchorPoint: type.calloutAnchorPoint
                });
                this.__clusters[key].applyProperties({
                    tintColor: type.color,
                    visible: type.visible,
                    color: type.colors.contrast
                });
                if (this.__items[key].length > 0) {
                    // app.showAlert({
                    //     title: trc('warning'),
                    //     message: trc('restard_needed')
                    // });
                    // reset all this.__items for images to be update
                    const theItems = this.__items[key];
                    theItems.forEach(item => {
                        if (!this.isItemARoute(item)) {
                            item.image = this.itemHandler.getAnnotImage(type, item);
                            item.selectedImage = this.itemHandler.getAnnotImage(type, item, true);
                        }
                    });
                    this.clear(key, false); //no need to clear the indexer
                    this.addItems(theItems);
                }
            }
            app.emit(__LIST__ + 'Changed', {
                list: type
            });
        }
    }
    onModuleLoaded(_moduleId, _state, _module) {
        if (_state === false) {
            var type = this.__types[_moduleId];
            if (type) {
                console.debug('onModuleUnLoaded', types);
                if (this.__clusters[_moduleId]) {
                    this.getCluster(_moduleId).removeAllAnnotations();
                    this.mapView.removeCluster(this.__clusters[_moduleId]);
                    delete this.__clusters[_moduleId];
                }
                this.indexRemoveList(_moduleId);
                this.mapView.removeRoute(this.__routes[_moduleId]);
                delete this.__routes[_moduleId];
                delete this.__currentIds[_moduleId];
                delete this.__items[_moduleId];
                delete this.__types[_moduleId];
            }
        } else {
            var types: { [k: string]: ItemType } = {};
            _module.getItemTypes && _module.getItemTypes(types);
            console.debug('onModuleLoaded', types);
            let value;
            for (const key in types) {
                value = types[key];
                if (value.hidden !== false) {
                    this.__types[key] = value;
                    this.initiateType(value, key);
                    this.addItems(Ti.App.Properties.getObject(value.propertyKey, []), undefined, false);
                    this.mapView.addCluster(this.__clusters[key]);
                }
            }
        }
    }
    removeList(_list) {
        console.debug('removeList', _list);
        var key = _list.id;
        var list = this.lists[key];
        if (list) {
            delete this.lists[key];
            this.saveLists();
        }
        var type = this.__types[key];
        if (type) {
            this.clear(key);
            delete this.__types[key];
            app.emit(__LIST__ + 'Removed', {
                list: type
            });
        }
    }
    onWindowOpen(_enabled) {
        app.showTutorials(['map_drop_pin']);
    }
    actionsForItem(_item, _desc, _onMap, result) {
        // console.debug('items actionsForItem', _item.id, result);
        if (_item) {
            var isRoute = this.isItemARoute(_item);
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
            // console.debug('items toAdd', toAdd);
            Array.prototype.unshift.apply(result, toAdd);
            // console.debug('items result', result);
        }
    }
    moreActionsForItem(_item, _desc, _onMap, result) {
        if (_item) {
            var isRoute = this.isItemARoute(_item);
            if (isRoute && _item.profile) {
                result.push('update_profile');
            }
        }
    }
    runActionOnItem(_type, _item, _action) {
        var isRoute = this.isItemARoute(_item);
        var mapItem = this.getMapItem(_type, _item);
        console.debug('runActionOnItem', _type, _item.id);
        if (mapItem) {
            switch (_action) {
                case 'select':
                    this.mapView.selectAnnotation(mapItem);
                    // if (mapItem.showInfoWindow) {
                    // mapItem.showInfo();
                    // } else {
                    setTimeout(() => {
                        if (isRoute) {
                            console.debug('runActionOnItem', 'moveToRoute');
                            this.parent.setRegion(mapItem.region, 0.3, true);
                        } else {
                            console.debug('runActionOnItem', 'moveToAnnotation');
                            this.parent.updateCamera({
                                centerCoordinate: _.pick(_item, 'latitude', 'longitude')
                            });
                        }
                    }, 100);

                    // }
                    break;
            }
        }
        return true;
    }
    prepareDetailsListView(item: Item, itemDesc: ItemType, sections, createItem, colors: ContrastColor, iconicColor: string) {
        if (item.files) {
            // });
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
                items: _.reduce(
                    item.files,
                    function(items, file) {
                        items.push({
                            template: 'file',
                            callbackId: 'file',
                            icon: {
                                color: iconicColor,
                                text: '\ue288'
                            },
                            title: {
                                text: file.title + ' - ' + (file.fullTitle || file.fileName)
                            },
                            subtitle: {
                                text:
                                    moment(file.timestamp).fromNow() +
                                    ' - ' +
                                    filesize(file.fileSize, {
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
                    },
                    []
                )
            });
        }
    }
    onPOIPress(e: { poi }) {
        console.log('onPOIPress', e);
        if (!e.poi.name || !e.poi.id) {
            return;
        }
        Ti.UI.createSnackbar({
            title: `poi: ${e.poi.name}`,
            view: app.ui.mainwindow,
            action: 'add'
        })
            .on('action', () => {
                this.parent.showLoading({
                    label: {
                        html: trc('requesting_details') + '...'
                    }
                });
                app.api.osmDetails({ osm: Object.assign(e.poi, { type: 'node', id:e.poi.id/10 }) }).then((r: any) => {
                    console.log('got osm details', r);
                    if (r) {
                        this.parent.runMethodOnModules('spreadModuleAction', {
                            id: 'modified',
                            command: 'create',
                            item: r
                        });
                    }
                    this.parent.hideLoading();
                });
            })
            .show({
                gravity: 48
            });
    }
}
export function create(_context, _args, _additional) {
    return new Items(_context, _args, _additional);
}
