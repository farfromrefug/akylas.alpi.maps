import { EventEmitter } from 'events';
declare global {
    interface ItemChanges {
        title?: string;
        image?: string;
        icon?: string;
        color?: string;
        selectedImage?: string;
        newPhotos?: ItemPhoto[];
        deletedPhotos?: string[];
        deletedFiles?: string[];
        deletedNotes?: string[];
        newFiles?: ItemFile[];
        newNotes?: ItemNote[];
        tags?: { [k: string]: any };
        showInfoWindow?: boolean;
        customView?: TiDict;
        address?: ItemAddress;
    }
    // type ItemHandler = ItemHdlr
}

export interface ImageResult {
    width: number;
    height: number;
    imageId: number;
    imageName: string;
    thumbnailImageName?: string;
}

export class ItemHandler extends EventEmitter {
    convert = app.utils.convert;
    // openingHours = app.utils.openingHours,
    localImageCache = {};
    showMessage = app.showMessage;
    htmlIcon = app.utilities.htmlIcon;
    itemActions = {
        search_google: {
            icon: $.sGoogle,
            color: '#5394F3',
            text: 'google'
        },
        wikipedia: {
            icon: app.icons.wikipedia,
            color: 'black'
        },
        images: {
            icon: app.icons.photo,
            color: '#DA4630'
        },
        reverse_geo: {
            icon: $.sPlace,
            color: '#2CA8C2',
            text: 'address'
        },
        consolidate_alt: {
            icon: $.sElevation,
            color: '#99CB4A',
            text: 'altitude'
        },
        navigate: {
            icon: $.sRouting,
            text: 'directions'
        },
        more: {
            icon: $.sHOptions
        },
        move: {
            icon: app.icons.folder,
            color: '#839098'
        },
        query_profile: {
            icon: $.sElevationProfile,
            color: '#99CB4A',
            text: 'profile'
        },
        phone: {
            icon: app.icons.phone,
            text: 'call'
        },
        refresh_tags: {
            icon: $.sRefresh,
            text: 'details'
        },
        searcharound: {
            icon: app.icons.details,
            text: 'details'
        },
        remove: {
            icon: String.fromCharCode(0xe287),
            color: app.colors.red.color,
            text: 'delete'
        },
        locate: {
            icon: String.fromCharCode(0xe604),
            color: app.colors.blue.color,
            text: 'locate'
        },
        directions: {
            icon: $.sDirections,
            color: '#0D83D4',
            text: 'directions'
        }
    };
    iconStyleViews = {
        0: new Label({
            properties: {
                color: $.white,
                font: {
                    family: $.iconicfontfamily,
                    size: 30
                },
                verticalAlign: 'middle',
                textAlign: 'center',
                width: __APPLE__ ? 50 : 30,
                // backgroundColor:'red',
                height: __APPLE__ ? 50 : 30,
                // shadowColor: '#00000044',
                // shadowOffset: [0, 1],
                // shadowRadius: 1,
                // opacity: 0.5,
                strokeWidth: 2,
                text: app.icons.circle
            },
            childTemplates: [
                {
                    type: 'Ti.UI.Label',
                    bindId: 'label',
                    properties: {
                        font: {
                            family: $.iconicfontfamily,
                            size: 16
                        },
                        width: 'FILL',
                        height: 'FILL',
                        verticalAlign: 'middle',
                        padding: {
                            bottom: __APPLE__ ? 2 : 0
                        },
                        strokeWidth: 1,
                        strokeColor: $.black,
                        textAlign: 'center',
                        color: $.white
                    }
                }
            ]
        }),
        1: new Label({
            properties: {
                width: __APPLE__ ? 50 : 32,
                height: __APPLE__ ? 60 : 40,
                // backgroundColor:'red',
                color: $.white,
                font: {
                    family: $.iconicfontfamily,
                    size: 40
                },
                padding: {
                    top: __APPLE__ ? 6 : 0
                },
                verticalAlign: 'top',
                textAlign: 'center',

                // shadowColor: '#00000044',
                // shadowOffset: [0, 1],
                // shadowRadius: 1,
                strokeWidth: 2,
                text: $.sPin
            },

            childTemplates: [
                {
                    type: 'Ti.UI.Label',
                    bindId: 'label',
                    properties: {
                        font: {
                            family: $.iconicfontfamily,
                            size: 18
                        },
                        width: 'FILL',
                        // backgroundColor:'#00ff0088',
                        height: 24,
                        top: __APPLE__ ? 10 : 4,
                        // strokeWidth: 4,
                        strokeWidth: 1,
                        strokeColor: $.black,
                        textAlign: 'center',
                        color: $.white
                    }
                }
            ]
        }),
        2: new Label({
            properties: {
                width: 50,
                height: 50,
                font: {
                    family: $.iconicfontfamily,
                    size: 30
                },
                verticalAlign: 'middle',
                padding: {
                    bottom: 2
                },
                textAlign: 'center',
                color: $.white,
                strokeWidth: 1
                // shadowColor: '#00000044',
                // shadowRadius: 1,
                // shadowOffset: [0, 1],
            }
        }),
        10: new Label({
            properties: {
                color: $.white,
                font: {
                    family: $.iconicfontfamily,
                    size: 26
                },
                verticalAlign: 'middle',
                textAlign: 'center',
                // strokeColor: $.white,
                // strokeWidth: 3,
                width: 28,
                height: 28,
                // padding: {
                // top: 2,
                // right: 2
                // },
                // shadowColor: 'gray',
                // shadowRadius: 0,
                // shadowOffset: [0, 1],
                shadowColor: '#00000044',
                shadowOffset: [0, 1],
                shadowRadius: 1,
                text: app.icons.circle
            }
        }),
        11: new Label({
            properties: {
                color: $.white,
                font: {
                    size: 12
                },
                verticalAlign: 'middle',
                textAlign: 'center',
                width: 20,
                height: 20
            }
        })
    };

    geolib = app.utils.geolib;
    private _moveOnFirstChange: boolean = Ti.App.Properties.getBool('items.firstchangemove', false);
    get moveOnFirstChange(): boolean {
        return this._moveOnFirstChange;
    }
    set moveOnFirstChange(_value) {
        this._moveOnFirstChange = _value;
        Ti.App.Properties.setBool('items.firstchangemove', _value);
    }
    // openingHours: {
    //     value: openingHours
    // },
    simplify = require('lib/simplify');
    showFloatingWebView = (_title: string, _url: string, _item: Item, _desc: ItemType, _parent: AppWindow, _mapHandler: MapWindow) => {
        var floating = app.ui.mainwindow.stackSize == 1;
        (floating ? app.ui : _parent.manager).createAndOpenWindow('WebWindow', {
            floating: floating,
            mapHandler: _mapHandler,
            showBackButton: true,
            title: trc(_title),
            item: _item,
            itemDesc: _desc,
            itemHandler: this,
            // barColor:_mapItem.item.color,
            url: _url
        });
    };

    getImagePath = app.getImagePath;
    getThumbnailImagePath = app.getThumbnailImagePath;
    getAnnotImage = (_markerType: ItemType, _item?: Item, _selected?: boolean) => {
        // sdebug('getAnnotImage', _markerType, _item, _selected);
        var selected = !!_selected;

        var colors = _markerType.colors;
        var icon = _markerType.icon;
        var iconSettings = _.merge(
            {
                style: 1,
                scale: 1
            },
            _markerType.iconSettings,
            _item && _item.iconSettings
        );

        if (_item) {
            if (_item.color) {
                colors = app.getContrastColors(_item.color);
            }

            icon = _item.icon || icon;
        }

        var imageId = ['annot', iconSettings.style, iconSettings.scale | 1, parseInt(colors.color.slice(1), 16), icon.charCodeAt(0), selected ? 'on' : 'off'].join('_');
        if (__APPLE__) {
            imageId += '@' + app.deviceinfo.densityFactor + 'x';
        }
        imageId += '.png';
        if (this.localImageCache[imageId]) {
            return imageId;
        }

        this.localImageCache[imageId] = this.getImagePath(imageId);
        var file = Ti.Filesystem.getFile(this.localImageCache[imageId]);
        // sdebug('getAnnotImage', imageId, this.localImageCache[imageId], file.exists(), app.needsUpdate('annot_images'));

        if (!app.needsUpdate('annot_images') && file.exists()) {
            return imageId;
        }
        var textColor = colors.luminance > 0.8 ? colors.contrast : $.white;
        var view = this.iconStyleViews[iconSettings.style + ''];
        var color = colors.color,
            darkenColor = Color(color)
                .darken(20)
                .saturate(10)
                .toHex8String(),
            image,
            params: TiDict = {
                color: selected
                    ? Color(color)
                          .saturate(8)
                          .toHex8String()
                    : Color(color)
                          .setAlpha(0.6)
                          .toHex8String(),
                strokeColor: selected
                    ? textColor
                    : Color(darkenColor)
                          .setAlpha(0.4)
                          .toHex8String(),
                label: {
                    text: icon,
                    strokeColor: colors.darkest,
                    color: textColor
                }
            };

        // if (iconSettings.style === 1) {
        // params.strokeColor = selected ? textColor : Color(darkenColor).setAlpha(0.6).toHex8String();
        // params.label.color = selected ? $.white : darkenColor;
        // params.label.color = textColor;
        // } else
        if (iconSettings.style === 2) {
            params.strokeColor = selected
                ? colors.darkest
                : Color(darkenColor)
                      .setAlpha(0.7)
                      .toHex8String();
            // params.color = selected ? darkenColor : color;
            params.text = icon;
        } else if (iconSettings.style === 11) {
            params.strokeColor = null;
            // params.color = selected ? darkenColor : color;
            params.text = icon;
        }
        // view.applyProperties(params, true);
        // sdebug('creating annot image', imageId, params, iconSettings);
        image = view.toImage(null, {
            properties: params
        });
        // image = view.toImage();

        if (iconSettings.scale != 1 || selected) {
            image = Ti.Image.getFilteredImage(image, {
                scale: (selected ? 1.1 : 1) * iconSettings.scale
            });
        }
        file.write(image);
        return imageId;
    };
    initializeType = (_id: string, _type: ItemType) => {
        if (_type.getPrefKey) {
            return _type; //already done
        }
        // sdebug('initializeType', _id, _type);
        _type.propertyKey = _id + '_items';
        _type.getPrefKey = function(_suffix) {
            return this.id + '_' + _suffix;
        };
        _type.visible = Ti.App.Properties.getBool(_type.getPrefKey('visible'), true);
        _type.id = _id;
        _type.rclass = 'MapAnnot' + _.capitalize(_id);
        _type.colors = app.getContrastColors(_type.color);
        _type.image = this.getAnnotImage(_type);
        _type.selectedImage = this.getAnnotImage(_type, undefined, true);
        ak.ti.redux.fn.setDefault('.' + _type.rclass, {
            // image: app.getImagePath(type.image),
            calloutAnchorPoint: _type.calloutAnchorPoint
        });
        return _type;
    };
    getFormattedDistance = (...args) => this.geolib.getFormattedDistance.apply(this.geolib, args);
    // getImagePath: app.getImagePath,
    customViewForAnnot = (_item: Item, _needsLoading?: boolean) => {
        if (!_item.photos) {
            return;
        }
        var photo = _item.photos[0];

        var ratio = photo.width / photo.height;
        // var scale = Math.min(400 / photo.width, 300 / photo.height);
        var banner = ratio > 2;
        sdebug('customViewForAnnot', photo, _needsLoading);
        return {
            template: 'calloutPhoto',
            title: {
                text: _item.description || _item.title
            },
            image: {
                scaleType: banner ? Ti.UI.SCALE_TYPE_ASPECT_FIT : Ti.UI.SCALE_TYPE_ASPECT_FILL,
                filterOptions: {
                    colorArt: banner
                    // scale: scale
                },
                image: this.getThumbnailImagePath(photo)
            },
            loading: {
                visible: false
            }
            // time: {
            //     text: moment(_item.timestamp).format('LL')
            // }
        };
    };
    annotationParamsFromItem = (_item: Item, _markerType: ItemType) => {
        // sdebug('annotationParamsFromItem', _item, _markerType);
        var annot: TiPropertiesT<MapAnnotation> = {
            item: _item,
            type: _markerType,
            rclass: _markerType.rclass,
            latitude: _item.latitude,
            longitude: _item.longitude
        };
        if (_item.hasOwnProperty('altitude')) {
            annot.altitude = _item.altitude;
        }
        var iconSettings = _item.iconSettings || _markerType.iconSettings || {};
        switch (iconSettings.style) {
            case 0:
                annot.anchorPoint = [0.5, 0.5];
                annot.calloutAnchorPoint = [0.5, __APPLE__ ? 0.2 : 0.1];
                break;
            default:
            case 1:
                annot.anchorPoint = [0.5, __APPLE__ ? 0.732 : 1];
                annot.calloutAnchorPoint = [0.5, 0.1];
                break;
        }
        if (_item.image) {
            annot.image = this.getImagePath(_item.image);
        } else {
            annot.image = this.getImagePath(_markerType.image);
        }
        if (_item.selectedImage) {
            annot.selectedImage = this.getImagePath(_item.selectedImage);
        } else {
            annot.selectedImage = this.getImagePath(_markerType.selectedImage);
        }
        if (_item.photos && _item.photos.length > 0) {
            annot.showInfoWindow = true;
            annot.customView = this.customViewForAnnot(_item);
        }
        return ak.ti.style(annot, 'MapAnnotation');
    };
    routeParamsFromItem(_item: Route, _routeType: RouteType) {
        var points = _item.points;
        if (_item.route) {
            points = _item.route.points;
            if (!!_item.route.encoded) {
                var decodeLine = app.api.decodeLine;
                var arrPush = Array.prototype.push;
                if (Array.isArray(points)) {
                    points = _.reduce(
                        points,
                        function(memo, value) {
                            arrPush.apply(memo, decodeLine(value));
                            return memo;
                        },
                        []
                    );
                } else {
                    points = decodeLine(points);
                }
            }
        }
        var route = {
            item: _item,
            type: _routeType,
            visible: _routeType.visible,
            points: points,
            title: _item.title,
            color: Color(_item.color || _routeType.routeColor || _routeType.color)
                .setAlpha(0.5)
                .toHex8String(),
            selectedColor: _routeType.routeSelectedColor,
            rclass: _routeType.rclass,
            bubbleParent: true
        };
        return ak.ti.style(route, 'MapRoute');
    }
    itemTitle(_item: Item, _desc: ItemType) {
        var result = _item.title || _desc.defaultTitle || '';
        if (_item.tags) {
            var tags = _item.tags;
            if (tags.network && !_.startsWith(result, tags.network)) {
                result = tags.network + ': ' + result;
            }
            if (tags.operator && !_.startsWith(result, tags.operator)) {
                result = tags.operator + ': ' + result;
            }
        }
        return result;
    }
    simplifyToNB = (points, nb: number, tolerance: number) => {
        if (points.length <= nb) {
            return points;
        }
        var simplifyTolerance = tolerance || 2;
        var count = 0;
        var toUsePoints = points;
        while (toUsePoints.length > nb) {
            toUsePoints = this.simplify(points, simplifyTolerance / 3779);
            count++;
            simplifyTolerance += 2;
        }
        return toUsePoints;
    };
    itemProfileDesc(_item: Route) {
        return '';
        // if (_item.route_mode !== 'walking') return '';
        // var duration = this.computeProfileEstimatedTime({
        //     distance: _item.route.distance,
        //     dplus: (_item.profile && _item.profile.dplus) || _item.tags.dplus,
        //     dmin: (_item.profile && _item.profile.dmin) || _item.tags.dmin
        // });
        // return trc('estimated') + ' ' + this.htmlIcon(String.fromCharCode(0xe08e), 0, $.black) + moment.duration(
        //     duration).format('h[h]m[m]');
    }
    computeProfileEstimatedTime(_args) {
        // sdebug('computeProfileEstimatedTime', _args);
        var meters = _args.distance,
            fudge = (_args.fudge || 0.1) * meters,
            totalMeters = meters + fudge,
            pti = _args.pti || 4,
            gain = _args.dplus,
            gainRate = _args.dplusrate || 500,
            totalGain = gain / gainRate,
            loss = Math.abs(_args.dmin),
            lossRate = _args.dminrate || 600,
            totalLoss = loss / lossRate,
            totalElevation = totalGain - totalLoss,
            movingRate = totalMeters / 1609 / pti,
            movingTime = movingRate + totalElevation, //hours
            shortBreaksTotal = Math.floor(movingTime - Math.floor(movingTime / 4.5)) * 5, //min
            longBreaksTotal = Math.floor(movingTime / 4.5) * 30, //min
            totalTime = Math.round((movingTime * 60 + shortBreaksTotal + longBreaksTotal) * 10) / 10 * 60 * 1000;
        // sdebug('totalElevation', totalElevation);
        // sdebug('totalMeters', totalMeters);
        // sdebug('totalLoss', totalLoss);
        // sdebug('totalGain', totalGain);
        // sdebug('movingRate', movingRate);
        // sdebug('movingTime', movingTime);
        // sdebug('totalTime', totalTime);
        return totalTime;
    }
    itemDetails = (_item: Item, _desc: ItemType) => {
        return this.convert.osmTagsFastDetails(_item).join(', ');
    };
    itemIcons = (_item: Item, _color: string) => {
        return this.convert.osmTagsIconsHTML(_item, _color);
    };
    itemSubtitle = (_item: Item, _desc: ItemType) => {
        var subtitle;
        if (_item.description) {
            subtitle = _item.description;
        } else if (_item.tags && _item.tags.description) {
            subtitle = _item.tags.description;
        }
        if (!subtitle) {
            if (_item && _item.address) {
                subtitle = _item.address.display_name;
            } else {
                var isRoute = this.isItemARoute(_item);
                if (isRoute) {
                    var route = (_item as Route).route;
                    subtitle = this.htmlIcon($.sDist, 0, $.black) + this.geolib.formatter.distance(route.distance);
                    // if (route.duration > 0) {
                    // console.log('duraation', route.duration);
                    // subtitle += ' ' + htmlIcon(String.fromCharCode(0xe08e), 0, $.black) + moment
                    //     .duration(route.duration)
                    //     .format(route.duration >= 60 * 60000 ? 'h[h]mm' : 'mm[m]');
                    // }
                    var profile = (_item as Route).profile || _item.tags;
                    if (profile) {
                        if (profile.dplus) {
                            subtitle += ' ' + this.htmlIcon($.sDplus, 0, $.black) + this.geolib.formatter.altitude(profile.dplus);
                        }
                        if (profile.dmin) {
                            subtitle += ' ' + this.htmlIcon($.sDmin, 0, $.black) + this.geolib.formatter.altitude(Math.abs(profile.dmin));
                        }
                    }
                } else {
                    subtitle = this.geolib.formatter.latLngString(_item, 2);
                }
            }
        }

        return subtitle;
    };
    getAddressSearchTermOSM(_item: Item) {
        var address = _item.address.address || _item.address;
        sdebug('getAddressSearchTermOSM', address);
        if (_item.osm && address[_item.osm.subtype]) {
            return address[_item.osm.subtype];
        }
        var params = [['address26', 'address29', 'footway', 'pedestrian', 'road'], ['city', 'town', 'village']];
        var count = 0;
        return _.reduce(
            params,
            function(memo, value, index) {
                if (count < 3 || index < 5) {
                    if (Array.isArray(value)) {
                        value.forEach(function(key) {
                            var toAdd = address[key];
                            if (toAdd) {
                                memo += toAdd;
                                memo += ' ';
                                count++;
                                return false;
                            }
                        });
                        // } else {
                        //     var toAdd = address[value];
                        //     if (toAdd) {
                        //         memo += toAdd;
                        //         memo += ' ';
                        //         count++;
                        //     }
                    }
                }
                return memo;
            },
            ''
        );
    }
    itemSearchTerm = (_item: Item) => {
        sdebug('itemSearchTerm', _item);
        if (_item.tags && _item.tags.name) {
            return _item.tags.name;
        } else if (!!_item.customTitle && _item.title) {
            return _item.title;
        }
        if (_item.address) {
            return this.getAddressSearchTermOSM(_item);
        } else {
            return this.geolib.formatter.latLngString(_item, 0, ',');
        }
    };
    setMapRegion = (_mapView: MapView, _region: Region, _deltaFactor: number, _animated?: boolean, _deltaScreen?: { top?; bottom?; left?; right? }) => {
        sdebug('setMapRegion', _region, _deltaFactor, _animated, _deltaScreen);
        this.updateCamera(
            _mapView,
            {
                region: this.geolib.scaleBounds(_region, _deltaFactor),
                animated: _animated
            },
            _deltaScreen
        );
    };
    updateCamera = (_mapView: MapView, _params: MapUpdateCamParams, _deltaScreen?: { top?; bottom?; left?; right? }, _zoom?: number) => {
        var geolib = this.geolib,
            zoom,
            deltaSpan;
        sdebug('updateCamera', _params, _deltaScreen);
        if (_params.region) {
            var region = _params.region;
            var center = geolib.getCenter([region.sw, region.ne]);
            // if (_deltaScreen) {
            // zoom = geolib.getBoundsZoomLevel(region, app.deviceinfo);
            // if (_deltaScreen.bottom) {
            //     deltaSpan = geolib.getSpanFromPixels(_deltaScreen.bottom,
            //         center, zoom);
            //     region.sw.latitude -= deltaSpan;
            // }
            // if (_deltaScreen.top) {
            //     deltaSpan = geolib.getSpanFromPixels(_deltaScreen.top,
            //         center, zoom);
            //     region.ne.latitude += deltaSpan;
            // }
            // sdebug('updateCamera2', region);
            // }
        } else if (_params.centerCoordinate) {
            zoom = _params.zoom || _zoom;
            var location = this.geolib.coords(_params.centerCoordinate);
            // if (_deltaScreen.bottom) {
            //     deltaSpan = geolib.getSpanFromPixels(_deltaScreen.bottom / 2, location, zoom);
            //     // location.latitude -= deltaSpan;
            // }
            // if (_deltaScreen.top) {
            //     deltaSpan = geolib.getSpanFromPixels(_deltaScreen.top / 2, location, zoom);
            //     // location.latitude += deltaSpan;
            // }
            _params.centerCoordinate = location;
        }
        if (_deltaScreen) {
            _params.focusOffset = [_deltaScreen.left - _deltaScreen.right, _deltaScreen.bottom - _deltaScreen.top];
        }

        _mapView.updateCamera(_params);
    };
    updateItem = (_item: Item, _desc: ItemType, _changes: ItemChanges, _mapHandler: MapWindow) => {
        var currentFirstPhoto = _item && _item.photos && _item.photos[0];
        var item = _.merge(_item, _changes);
        var isRoute = this.isItemARoute(_item);
        var i;
        if (!isRoute) {
            if (_changes.icon || _changes.color) {
                item.image = this.getAnnotImage(_desc, item);
                item.selectedImage = this.getAnnotImage(_desc, item, true);
                _changes.image = this.getImagePath(item.image);
                _changes.selectedImage = this.getImagePath(item.selectedImage);
            }
        }

        if (_changes.tags) {
            if (_changes.tags.image) {
                _changes.newPhotos = (_changes.newPhotos || []).concat([
                    {
                        image: _changes.tags.image
                    }
                ]);
            }
            if (_changes.tags.colour && !item.color) {
                item.color = _changes.tags.colour;
            }
            if (_changes.tags.icon && !item.icon) {
                item.icon = _changes.tags.icon;
            }
        }

        if (_changes.newPhotos) {
            item.photos = item.photos || [];
            for (i = 0; i < _changes.newPhotos.length; i++) {
                var photo = _changes.newPhotos[i];
                var existing = _.findIndex(item.photos, { image: photo.image });
                if (existing === -1) {
                    item.photos.push(photo);
                }
            }
            delete item.newNotes;
            _changes.showInfoWindow = item.photos.length > 0;
            delete item.newPhotos;
        }
        if (_changes.deletedPhotos) {
            _changes.deletedPhotos.forEach(function(photoName) {
                item.photos = _.reject(item.photos, { image: photoName });
            });
            if (item.photos.length === 0) {
                _changes.showInfoWindow = false;
                delete item.photos;
            } else {
                _changes.showInfoWindow = true;
            }
            delete item.deletedPhotos;
        }

        if (_changes.newNotes) {
            item.notes = item.notes || [];
            for (i = 0; i < _changes.newNotes.length; i++) {
                item.notes.push(_changes.newNotes[i]);
            }
            delete item.newNotes;
        }
        if (_changes.deletedNotes) {
            item.notes = item.notes.filter(n=>_changes.deletedNotes.indexOf(n.title) === -1)
            // _changes.deletedNotes.forEach(function(noteId) {
            //     item.notes = _.reject(item.notes, { id: noteId });
            // });
            if (item.notes.length === 0) {
                delete item.notes;
            }
            delete item.deletedNotes;
        }

        if (_changes.newFiles) {
            item.files = item.files || [];
            for (i = 0; i < _changes.newFiles.length; i++) {
                item.files.push(_changes.newFiles[i]);
            }
            delete item.newFiles;
        }
        if (_changes.deletedFiles) {
            _changes.deletedFiles.forEach(function(fileId) {
                item.files = _.reject(item.files, { fileName: fileId });
            });
            if (item.files.length === 0) {
                delete item.files;
            }
            delete item.deletedFiles;
        }

        var newPhotosCount = item && item.photos && item.photos.length;
        if (newPhotosCount > 0 && (!currentFirstPhoto || _.isEqual(currentFirstPhoto, item.photos[0]))) {
            _changes.customView = this.customViewForAnnot(item);
        }

        if (this.moveOnFirstChange && _desc.isList !== true) {
            sdebug('about to move item', item);
            _mapHandler.runMethodOnModules('spreadModuleAction', {
                id: item.type,
                command: 'move',
                items: [item],
                moveType: 'modified'
            });
            app.showTutorials('item.firstchangemoved');
        } else {
            app.emit(_EVENT_ITEMS_CHANGED_, {
                // bubbles: true,
                desc: _desc,
                item: item,
                changes: _changes
            });
        }

        return item;
    };
    updateParamsForLocation(_item: Item, _location: TiLocation) {
        var args: any = {};
        if (!_item) {
            return args;
        }
        var geolib = this.geolib;
        args.extraHolder = {
            visible: false
        };
        // sdebug('updateParamsForLocation', _item, _location);
        if (_item.hasOwnProperty('altitude') && _item.altitude !== null) {
            args.extraHolder.visible = true;
            args.altitudeIcon = {
                visible: true
            };
            args.altitude = {
                visible: true,
                text: geolib.formatter.altitude(_item.altitude)
            };
        }
        if (_location) {
            args.extraHolder.visible = true;
            var startPoint = (_item as Route).start || _item;
            var heading = geolib.getCompassDirection(_location, startPoint);
            // _location.altitude = Math.round(Math.random() * 1000);
            if (args.altitude && _location.hasOwnProperty('altitude')) {
                args.altitude.text += ' (' + geolib.formatter.altitude(startPoint.altitude - _location.altitude) + ')';
            }

            args.distance = {
                visible: true,
                text: this.getFormattedDistance(_location, startPoint)
            };
            var bearing = heading.bearing || 0;
            bearing -= _location.heading || 0;
            args.orientation = {
                visible: true,
                transform: bearing !== 0 ? 'r' + bearing : null
            };
        }

        return args;
    }
    itemOHInfos(_item: Item) {
        if (_item.tags && _item.tags.opening_hours) {
            var result: any = {};
            var now = moment();
            var address = _.merge(
                {
                    country_code: app.localeInfo.currentCountry.toLowerCase()
                },
                _item.address
            );
            var oh = app.openingHours(_item.tags.opening_hours, {
                lat: _item.latitude,
                lon: _item.longitude,
                address: address
            });
            var it = oh.getIterator();
            var state = it.getState();
            result.opened = state;
            result.oh = oh;
            it.advance();
            var endDate = it.getDate();
            if (endDate) {
                endDate = moment(endDate);
                sdebug(endDate.valueOf());
                sdebug(now.valueOf());
                var delta = Math.floor((endDate.valueOf() - now.valueOf()) / 1000);
                sdebug(delta);
                if (0 < delta && delta < 12 * 3600) {
                    result.nextTime = endDate;
                }
            }
            return result;
        }
    }
    infoRowItemForItem = (_item: Item, _itemDesc: ItemType, _defaults?, _currentLocation?: TiLocation) => {
        if (_currentLocation === undefined) {
            _currentLocation = app.currentLocation;
        }
        var args: RowItem = _defaults || {};
        var colors = _itemDesc.colors;
        if (_item.color) {
            colors = app.getContrastColors(_item.color);
        }
        var isRoute = this.isItemARoute(_item);
        var hasExtra = false;
        var title = this.itemTitle(_item, _itemDesc);
        var desc = this.itemIcons(_item, colors.darkerRel);
        var subtitle = this.itemSubtitle(_item, _itemDesc);

        Object.assign(args, {
            searchableText: _.deburr(title),
            icon: {
                text: _item.icon || _itemDesc.icon,
                color: colors.luminance > 0.8 ? colors.contrast : colors.color
            },
            title: {
                text: title
            },
            description: {
                html: desc,
                visible: !!desc
            },
            subtitle: {
                html: subtitle
            },
            item: _item,
            desc: _itemDesc
        });

        if (_item.photos && _item.photos.length > 0) {
            var photo = _item.photos[0];
            args.image = {
                image: this.getThumbnailImagePath(photo),
                visible: true
            };
        }
        // if (!isRoute) {
        var subParams = this.updateParamsForLocation(_item, _currentLocation);
        _.extend(args, subParams);
        // }
        var ohInfos = this.itemOHInfos(_item);
        if (ohInfos) {
            args.opened = {
                visible: true,
                color: app.colors[ohInfos.opened ? 'green' : 'red'].darkerRel
            };
            if (ohInfos.nextTime) {
                args.opendetails = {
                    visible: true,
                    text: ohInfos.nextTime.format('LT'),
                    color: app.colors[ohInfos.opened ? 'red' : 'green'].darkerRel
                };
            }
        }
        return args;
    };
    createAnnotItem(_feature, _data, _id?: string) {
        // sdebug('createAnnotItem', _data);
        // var item = {
        //     type: _feature.id,
        //     id: _id,
        //     // image: _feature.image,
        //     // selectedImage: _feature.selectedImage,
        // };
        // var now = moment().valueOf();
        // if (_pos) {
        //     item.latitude = _pos.latitude;
        //     item.longitude = _pos.longitude;
        //     item.altitude = _pos.altitude;
        //     item.timestamp = _pos.timestamp || now;
        //     item.id = _pos.id || _id;
        // } else {
        //     item.timestamp = now;
        // }
        // if (!item.id) {
        //     item.id = now;
        // }
        // return item;
        var now = moment().valueOf();
        var item = _.defaults(_data, {
            type: _feature.id,
            timestamp: now,
            id: now
        });

        return item;
    }
    createRouteItem(_routeType: RouteType, _data, _id?: string) {
        var now = moment().valueOf();
        var item = _.defaults(_data, {
            type: _routeType.id,
            timestamp: now,
            id: now
        });

        return item;
    }
    isItemARoute(_item: Item) {
        return !!_item.hasOwnProperty('route') || !!_item.hasOwnProperty('points');
    }

    actionsForItem = (_mapHandler: MapWindow, _item: Item, _desc: ItemType, _onMap?: boolean) => {
        var isRoute = this.isItemARoute(_item);
        // var options = ['search_google', 'images'];
        var options = [];
        if (_desc && _desc.options) {
            options = options.concat(_desc.options);
        }
        options.push('remove');

        _mapHandler.runMethodOnModules('actionsForItem', _item, _desc, _onMap, options);
        // sdebug('actionsForItem', options);
        console.error('actionsForItem', options);
        options = options.map(key => {
            if (typeof key === 'string' && this.itemActions.hasOwnProperty(key)) {
                return [key, this.itemActions[key]];
            }
            return key;
        });

        // var result = _.mapValues(options, function(value, key){
        //     sdebug('test', value, key);
        //     if (!Array.isArray(value) && itemActions.hasOwnProperty(key)) {
        //         return [key, itemActions[key]];
        //     }
        //     return value;
        // })
        // sdebug('actionsForItem2', options);
        // var result = _.pairs(_.pick(itemActions, options));
        return options;
    };
    showMoreOptionMenuForItem(_item: Item, _desc: ItemType, _callback: Function, _parent: AppWindow, _mapHandler: MapWindow, _params?) {
        _params = _params || {};
        // var options = ['add_photo', 'move', 'share'];
        var options = ['add_photo', 'move'];
        var isRoute = this.isItemARoute(_item);
        if (__APPLE__ && !isRoute) {
            options.push('open_maps');
            if (Ti.Platform.canOpenURL('comgooglemaps://')) {
                options.push('open_google_maps');
            }
        }
        _mapHandler.runMethodOnModules('moreActionsForItem', _item, _desc, !!_params.onMap, options);

        new OptionDialog({
            options: _.map(options, value => trc(value)),
            buttonNames: [trc('cancel')],
            cancel: 0,
            tapOutDismiss: true
        })
            .on(
                'click',
                (e => {
                    if (!e.cancel) {
                        var option = options[e.index];
                        this.handleItemAction(option, _item, _desc, _callback, _parent, _mapHandler);
                    }
                }).bind(this)
            )
            .show();
    }
    handlePhotoTaken = (_parent: AppWindow, e: TiMediaEvent) => {
        _parent.showLoading({
            label: {
                html: trc('saving_photo') + '...'
            }
        });
        sdebug(e);
        return new Promise((resolve: (res: ImageResult) => void) => {
            const image = e.media;
            const imageWidth = e.width;
            const imageHeight = e.height;
            const imageId = moment().valueOf();
            const imageName = 'photo_' + imageId + '.jpg';

            const result: ImageResult = {
                width: imageWidth,
                height: imageHeight,
                imageId: imageId,
                imageName: imageName
            };
            const MAX_WIDTH = 600;
            sdebug('writing image', result);
            Ti.Filesystem.getFile(this.getImagePath(imageName)).write(image);
            if (imageWidth > MAX_WIDTH || imageHeight > MAX_WIDTH) {
                const thumbnailImageName = 'photo_' + imageId + '_thumbnail.jpg';
                sdebug('creating image thumbnail', thumbnailImageName);
                result.thumbnailImageName = thumbnailImageName;
                Ti.Image.getFilteredImage(image, {
                    scale: MAX_WIDTH / Math.max(imageWidth, imageHeight),
                    callback: (e: TiImageEvent) => {
                        sdebug('created image thumbnail', e);
                        Ti.Filesystem.getFile(this.getImagePath(thumbnailImageName)).write(e.image);
                        _parent.hideLoading();
                        resolve(result);
                    }
                });
            } else {
                _parent.hideLoading();
                resolve(result);
            }
            // _callback(image, imageId, imageName, thumbnailImageName);
        });
    };
    getItemSetting(prop, _item: Item, _desc: ItemType) {
        return (_item.settings && !!_item.settings[prop]) || (_desc.settings && !!_desc.settings[prop]);
    }
    takePhoto = (_parent: AppWindow) => {
        return new Promise((resolve, reject) => {
            Titanium.Media.requestCameraPermissions(() => {
                Titanium.Media.showCamera({
                    success: resolve,
                    cancel: reject,
                    error: function(error) {
                        if (error.code == Titanium.Media.NO_CAMERA) {
                            app.showAlert('Please run this on device');
                        } else {
                            app.showAlert('Unexpected error: ' + error.code);
                        }
                        reject();
                    },
                    saveToPhotoGallery: false,
                    mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
                });
            });
        }).then((e: TiMediaEvent) => {
            return this.handlePhotoTaken(_parent, e);
        });
        // Titanium.Media.showCamera({
        //     success: _.partial(this.handlePhotoTaken, _parent, _callback),
        //     cancel: _callback,
        //     error: function (error) {
        //         if (error.code == Titanium.Media.NO_CAMERA) {
        //             app.showAlert('Please run this on device');
        //         } else {
        //             app.showAlert('Unexpected error: ' + error.code);
        //         }
        //         _callback();
        //     },
        //     saveToPhotoGallery: false,
        //     mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
        // });
    };
    handleItemAction = (_option: string, _items: Item | Item[], _desc: ItemType, _callback: Function, _parent: AppWindow, _mapHandler: MapWindow, _params?) => {
        sdebug('handleItemAction', _option);
        let _item: Item;
        if (!Array.isArray(_items)) {
            _item = _items;
            _items = [_item];
        }
        if (_item) {
            sdebug('handleItemAction item:', _item.id, _item.title, _item.type);
        }

        var colors = app.getColors(_item, _desc);
        var url: string, request;
        switch (_option) {
            case 'wikipedia':
                url = _item.tags.wikipedia;
                if (!_.startsWith(url, 'http')) {
                    url = 'http://en.wikipedia.org/wiki/' + escape(url);
                }
                this.showFloatingWebView(_option, url, _item, _desc, _parent, _mapHandler);
                break;
            case 'more':
                this.showMoreOptionMenuForItem(_item, _desc, _callback, _parent, _mapHandler, _params);

                break;
            case 'edit':
                _parent.manager.createAndOpenWindow('EditListWindow', {
                    mapHandler: _mapHandler,
                    item: _item,
                    list: _desc
                });
                break;
            case 'details':
                _parent.manager.handleOpenWindow('geofeature', {
                    mapHandler: _mapHandler,
                    item: _item,
                    itemDesc: _desc
                });
                break;
            case 'items_list':
                _parent.manager.createAndOpenWindow('ItemsListWindow', {
                    mapHandler: _mapHandler,
                    itemDesc: _desc
                });
                break;
            case 'phone': {
                var phone = _item.tags.phone;
                if (phone) {
                    app.confirmAction(
                        {
                            buttonNames: [trc('cancel'), trc('call')],
                            message: phone,
                            title: null
                        },
                        function() {
                            Ti.Platform.openURL('tel:' + phone);
                        }
                    );
                }
                break;
            }
            case 'add_photo': {
                this.handleItemAction(
                    'acquire_photo',
                    _item,
                    _desc,
                    (option, photo: ItemPhoto) => {
                        if (photo) {
                            let result = this.updateItem(
                                _item,
                                _desc,
                                {
                                    newPhotos: [photo]
                                },
                                _mapHandler
                            );
                            if (_callback) {
                                _callback(_option, result);
                            }
                        }
                    },
                    _parent,
                    _mapHandler
                );
                break;
            }
            case 'acquire_photo': {
                new OptionDialog({
                    options: [trc('take_picture'), trc('select_gallery')],

                    buttonNames: [trc('cancel')],
                    title: trc(_option),
                    cancel: 0,
                    tapOutDismiss: true
                })
                    .on('click', (e: TiEvent) => {
                        sdebug(e);
                        if (!e.cancel) {
                            return Promise.resolve()
                                .then(() => {
                                    if (e.index === 0) {
                                        return this.takePhoto(_parent);
                                    } else if (e.index === 1) {
                                        return new Promise((resolve, reject) => {
                                            Titanium.Media.openPhotoGallery({
                                                success: resolve,
                                                cancel: reject,
                                                error: reject,
                                                // allowEditing: true,
                                                mediaTypes: [Ti.Media.MEDIA_TYPE_PHOTO]
                                            }).then((e: TiMediaEvent) => {
                                                return this.handlePhotoTaken(_parent, e);
                                            });
                                        }) as Promise<ImageResult>;
                                    }
                                })
                                .then(r => {
                                    let result: ItemPhoto;
                                    if (r) {
                                        result = {
                                            width: r.width,
                                            height: r.height,
                                            image: r.imageName,
                                            thumbnailImage: r.thumbnailImageName
                                        };

                                        // showMessage('address_found', color);
                                    }
                                    if (_callback) {
                                        _callback(_option, result);
                                    }
                                });
                        }
                    })
                    .show();

                break;
            }
            case 'refresh_tags': {
                var clearUpString = function(s) {
                    return _.deburr(s)
                        .toLowerCase()
                        .replace(/^(the|le|la|el)\s/, '')
                        .trim();
                };
                var q = clearUpString(_item.title || _desc.defaultTitle);
                var hasChanged = false;

                var calls = _mapHandler.runReduceMethodOnModules('getDetailsCalls', q, _item, _desc);
                calls.osm = _.partial(app.api.osmDetails, _item);
                console.log('getDetailsCalls', calls);

                var request = app.api
                    .parallelMapRequests(calls)
                    .then(function(res) {
                        console.log('getDetailsCalls returned', res);
                        var callsToAdd = [],
                            value;
                        for (let key in res) {
                            value = res[key];
                            if (_.isObject(value)) {
                                if (value.photos) {
                                    value.photos.forEach(function(photo) {
                                        var url = photo.url || photo;
                                        var existing = _item.photos?_item.photos.findIndex(v => v.url === url):-1;
                                        if (existing === -1) {
                                            hasChanged = true;
                                            console.log('downloading photo', photo);
                                            callsToAdd.push(app.api.getPhoto(photo));
                                        }
                                    });
                                    delete value.photos;
                                }

                                if (value.notes) {
                                    value.notes.forEach(function(note) {
                                        var id = note.title;
                                        var existing = _item.notes?_item.notes.findIndex(v => v.url === url):-1;
                                        if (existing === -1) {
                                            hasChanged = true;
                                            value.newNotes = value.newNotes || [];
                                            value.newNotes.push(note);
                                        }
                                    });
                                    delete value.notes;
                                }
                            }
                        }
                        console.log('callsToAdd', callsToAdd);
                        if (callsToAdd.length > 0) {
                            return Promise.all(callsToAdd).then(function(photos) {
                                console.log('downloaded photos', photos);
                                photos = photos.filter(function(p) {
                                    return !!p;
                                });
                                if (photos.length > 0) {
                                    res.photos = photos;
                                }
                                return res;
                            });
                        } else {
                            return res;
                        }
                    })
                    .then(function(res) {
                        console.log('res', JSON.stringify(res));
                        var result: ItemChanges = {};
                        if (res && res.photos) {
                            result.newPhotos = result.newPhotos || [];

                            res.photos.forEach(function(photo) {
                                result.newPhotos.push(photo);
                                sdebug('adding newPhoto', photo);
                            });
                        }
                        var customizer = function(value, srcValue, key, object, source) {
                            if (!value && srcValue) {
                                // hasChanged = true;
                                // sdebug('needChanges for', key, value, srcValue);
                                return srcValue;
                            }
                            return _.merge(value, srcValue, customizer);
                        };
                        for (let key in res) {
                            let value = res[key];
                            _.merge(result, _.omit(value, 'id', 'title', 'address'), customizer);
                            if (!_item.address && value.address) {
                                result.address = value.address;
                            }
                        }
                        console.log('about to return success', result);
                        return result;
                    })
                    .then(changes => {
                        console.log('changes', changes);
                        ['icon', 'settings'].forEach(function(value) {
                            if (changes.hasOwnProperty(value) && !_item.hasOwnProperty(value) && _desc.hasOwnProperty(value) && _.isEqual(_desc[value], changes[value])) {
                                delete changes[value];
                            }
                        });
                        if (changes && _.size(changes) > 0) {
                            if (!hasChanged) {
                                var test = _.omit(_item, 'id', 'title', 'type', 'image', 'selectedImage', 'profile', 'timestamp', 'settings', 'photos', 'notes', 'address');
                                // sdebug('changes', changes);
                                // var hashCode1 = convert.hashCode(JSON.stringify(test));
                                // var hashCode2 = convert.hashCode(JSON.stringify(changes));
                                hasChanged = !_.isEqual(test, changes);
                                // sdebug(JSON.stringify(test));
                                // sdebug(JSON.stringify(changes));
                                // sdebug('needs change after item changed');
                            }
                            if (hasChanged) {
                                app.showMessage(trc('item_refreshed'), _desc.colors);
                                var result = this.updateItem(_item, _desc, changes, _mapHandler);
                                if (_callback) {
                                    _callback(_option, result);
                                }
                            } else {
                                this.showMessage(trc('nothing_to_update'), colors);
                            }
                        } else {
                            this.showMessage(trc('nothing_to_update'), colors);
                        }
                    })
                    .catch(e => _parent && _parent.showError(e))
                    .then(r => {
                        _parent && _parent.hideLoading();
                        return r;
                    });
                if (_parent) {
                    _parent.showLoading({
                        request: request,
                        label: {
                            text: trc('refreshing') + '...'
                        }
                    });
                }
                break;
            }
            case 'twitter':
            case 'facebook':
            case 'website':
                this.showFloatingWebView(_option, _item.tags[_option], _item, _desc, _parent, _mapHandler);
                break;
            case 'search_google': {
                url = 'https://www.google.com/search?z=14&q=' + escape(this.itemSearchTerm(_item));
                this.showFloatingWebView(_option, url, _item, _desc, _parent, _mapHandler);
                break;
            }
            case 'share': {
                var data = this.geolib.formatter.latLngString(_item, 0) + '\n' + ' shared using Alpi Maps';
                app.share({
                    text: data,
                    image: _mapHandler.mapViewSnapshot()
                });
                break;
            }
            case 'open_maps': {
                url = 'http://maps.apple.com/?q=';
                url += this.geolib.formatter.latLngString(_item, 0, ',');
                Ti.Platform.openURL(url);
                break;
            }
            case 'open_google_maps': {
                url = 'comgooglemaps://?zoom=14&q=';
                url += this.geolib.formatter.latLngString(_item, 0, ',');
                Ti.Platform.openURL(url);
                break;
            }
            case 'reverse_geo': {
                request = app.api
                    .reverseGeocode(_item)
                    .then(res => {
                        var changes: ItemChanges = {
                            address: res
                        };
                        if (res.osm_type) {
                            if (!_item.title || _item.title === trc('dropped_pin')) {
                                changes.title = res.address[res.osm_type];
                            }
                            if (!_item.icon && app.icons[res.osm_type]) {
                                changes.icon = app.icons[res.osm_type];
                            }
                        }

                        this.showMessage(trc('address_found'), colors);
                        var result = this.updateItem(_item, _desc, changes, _mapHandler);
                        return result;
                    })
                    .catch(e => _parent && _parent.showError(e))
                    .then(r => {
                        _parent && _parent.hideLoading();
                        return r;
                    });
                if (_parent) {
                    _parent.showLoading({
                        request: request,
                        label: {
                            text: trc(_option) + '...'
                        }
                    });
                }
                break;
            }
            case 'images': {
                this.showFloatingWebView(_option, 'http://www.google.com/images?q=' + escape(this.itemSearchTerm(_item)), _item, _desc, _parent, _mapHandler);

                break;
            }
            case 'consolidate_alt': {
                request = app.api
                    .ignElevation(_item)
                    .then(changes => {
                        this.showMessage(trc('elevation_found'), colors);
                        var result = this.updateItem(_item, _desc, changes, _mapHandler);
                        if (_callback) {
                            _callback(_option, result);
                        }
                    })
                    .catch(e => _parent && _parent.showError(e))
                    .then(r => {
                        _parent && _parent.hideLoading();
                        return r;
                    });
                if (_parent) {
                    _parent.showLoading({
                        request: request,
                        label: {
                            text: trc(_option) + '...'
                        }
                    });
                }
                break;
            }
            case 'update_profile':
            case 'query_profile': {
                var factor = 1;
                //app.simplify(_item.route.points, factor/3779)
                var route = (_item as Route).route;
                var points = route.points;
                // var toUsePoints = this.simplify(_item.route.points, factor / 3779);
                // sdebug(_option, points.length, toUsePoints.length);
                request = app.api
                    .ignElevationProfile(this, route.points)
                    .then(changes => {
                        this.showMessage(trc('profile_found'), colors);
                        var result = this.updateItem(_item, _desc, changes, _mapHandler);
                        if (_callback) {
                            _callback(_option, result);
                        }
                        // } else {
                        //     app.showAlert(e);
                        if (_parent) {
                            _parent.hideLoading();
                        }
                    })
                    .catch(e => _parent && _parent.showError(e))
                    .then(r => {
                        _parent && _parent.hideLoading();
                        return r;
                    });
                if (_parent) {
                    _parent.showLoading({
                        request: request,
                        label: {
                            text: trc(_option) + '...'
                        }
                    });
                }
                break;
            }
            case 'remove':
            case 'delete': {
                var result = _mapHandler.runMethodOnModules('spreadModuleAction', {
                    id: _desc.id,
                    command: 'remove',
                    items: _items
                });
                if (_callback) {
                    _callback(_option, result);
                }
                break;
            }
            // case 'searcharound':
            //     _mapHandler.runMethodOnModules('spreadModuleAction', {
            //         id: _option,
            //         parent: _parent,
            //         mapHandler: _mapHandler,
            //         command: _option,
            //         item: _item,
            //         desc: _desc,
            //     });
            //     break;
            case 'locate':
            case 'select':
                _mapHandler.runMethodOnModules('runActionOnItem', _item.type, _item, 'select');
                if (_callback) {
                    _callback(_option, true);
                }
                _parent.manager.closeToRootWindow();
                break;
            case 'move': {
                var lists: ItemList[] = _.filter(_.map(_.flatten(_mapHandler.runGetMethodOnModules('getLists')), 'description'), { isList: true });
                // _.filter(_mapHandler.runGetMethodOnModules('getLists'));
                // var isRoute = this.isItemARoute(_item);
                _item = _item || _items[0];
                app.showOptionsListDialog(
                    {
                        title: trc('choose_list'),
                        items: _.reduce(
                            lists,
                            function(memo, _list, type) {
                                if (_list.id !== _item.type) {
                                    memo.push({
                                        list: _list,
                                        properties: {},
                                        title: {
                                            text: _list.title
                                        },
                                        icon: {
                                            text: _list.icon,
                                            color: _list.color,
                                            visible: true
                                        },
                                        accessory: {
                                            visible: false
                                        }
                                    });
                                }

                                return memo;
                            },
                            []
                        )
                    },
                    function(e) {
                        var result = false;
                        if (e.cancel === false) {
                            result = _mapHandler.runMethodOnModules('spreadModuleAction', {
                                id: _desc.id,
                                command: 'move',
                                items: _items,
                                moveType: e.item.list.id
                            });
                        }
                        if (_callback) {
                            _callback(_option, result);
                        }
                    }
                );
                break;
            }
            case 'take_photo':
                {
                    sdebug('take_photo command', app.currentLocation);
                    if (app.currentLocation) {
                        var _this = this;
                        var currentPos = _.pick(app.currentLocation, 'latitude', 'longitude', 'altitude');

                        this.takePhoto(_parent).then(r => {
                            var type = 'photo';
                            var existingItem = _mapHandler.runGetSingleMethodOnModules('getItem', currentPos, type);
                            sdebug('existingItem', existingItem);
                            if (existingItem) {
                                app.showMessage(trc('item_updated'), existingItem.desc.colors);
                                existingItem.item = _this.updateItem(
                                    existingItem.item,
                                    existingItem.desc,
                                    {
                                        newPhotos: [
                                            {
                                                width: r.width,
                                                height: r.height,
                                                image: r.imageName,
                                                thumbnailImage: r.thumbnailImageName
                                            }
                                        ]
                                    },
                                    _mapHandler
                                );
                            } else {
                                var newItem = Object.assign(
                                    {
                                        id: r.imageId,
                                        timestamp: r.imageId,
                                        photos: [
                                            {
                                                width: r.width,
                                                height: r.height,
                                                image: r.imageName,
                                                thumbnailImage: r.thumbnailImageName
                                            }
                                        ]
                                    },
                                    _.pick(app.currentLocation, 'latitude', 'longitude', 'altitude')
                                );
                                var result = _mapHandler.runMethodOnModules('spreadModuleAction', {
                                    id: type,
                                    command: 'create',
                                    item: newItem
                                });
                                existingItem = _mapHandler.runGetSingleMethodOnModules('getItem', currentPos, type);
                            }
                            _this.handleItemAction('select', existingItem.item, existingItem.desc, _callback, _parent, _mapHandler, _params);
                        });
                    }
                }
                break;
            default:
                _mapHandler.runMethodOnModules('spreadModuleAction', {
                    id: _item.type,
                    parent: _parent,
                    mapHandler: _mapHandler,
                    command: _option,
                    params: _params,
                    item: _item,
                    desc: _desc
                });
                break;
        }
    };
}
