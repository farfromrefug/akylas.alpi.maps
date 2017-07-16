

declare global {
    class SelectionView extends View {
        listView: ListView
    }
    interface Provider {
        url: string
        options?: {
            forceHTTP?: boolean
            variantName: string
            attribution: string
        }
        name: string
        id: string
        category: string
        variants?: Provider[]
    }
    type TileSourceManager = TileSourceMgr
}

export class TileSourceMgr extends MapModule {
    TAG = 'TileSourceManager'
    mapTypes: { [k: string]: number } = app.modules.map.MapType
    bottomControlsVisible = false
    baseSources: { [k: string]: Provider } = {}
    defaultHD = app.deviceinfo.densityFactor >= 3
    overlaySources: { [k: string]: Provider } = {}
    mbTilesGenerator
    geolib = app.utils.geolib
    SOURCES_SECTION_INDEX = 1
    MBTILES_SECTION_INDEX = 0
    mbtiles: { [k: string]: any } = Ti.App.Properties.getObject('mbtiles', {})
    runningMbTiles = Ti.App.Properties.getObject('mbtiles_generating', {})
    runningMbTilesIndexes = []
    generatorService: titanium.AndroidService | titanium.AppiOSBackgroundService
    MBTilesUtils
    currentSources: string[] = Ti.App.Properties.getObject('tilesources', [])
    button: Button
    view: SelectionView
    tileSourcesIndexed: {}
    tileSources
    actionButtons: ActionButton[]
    constructor(_context, _args, _additional) {
        super(_args);
        Ti.App.on('mbtiles_generator_update', e => {
            // sdebug('got update', e);
            var request = e.request,
                running = this.runningMbTiles[request.token];
            if (running) {
                var index = this.runningMbTilesIndexes.indexOf(request.token);
                if (index >= 0) {
                    this.view.listView.updateItemAt(this.MBTILES_SECTION_INDEX, index, {
                        progress: {
                            value: e.progress
                        },
                        subtitle: {
                            text: this.mbTilesDownloadSubTitle(e)
                        }
                    });
                }

                running.query.doneCount = e.doneCount;

                this.saveRunningMBTiles();
            }
        }).on('mbtiles_generator_done', e => {
            var request = e.request,
                running = this.runningMbTiles[request.token];
            if (running) {
                var bounds = request.bounds;
                var center = this.geolib.getCenter([bounds.sw, bounds.ne]);
                app.api.reverseGeocode({
                    latitude: center.latitude,
                    longitude: center.longitude,
                    // zoom:request.minZoom
                }).then(e => {
                    delete this.runningMbTiles[request.token];
                    var index = this.runningMbTilesIndexes.indexOf(request.token);
                    if (index >= 0) {
                        this.runningMbTilesIndexes.splice(index, 1);
                        this.view.listView.deleteItemsAt(this.MBTILES_SECTION_INDEX, index, 1, {
                            animated: true
                        });
                    }
                    this.saveRunningMBTiles();
                    this.mbtiles[request.token] = Object.assign({
                        address: e,
                        layer: request.layer.layer,
                    }, _.pick(request, 'area', 'size', 'token', 'count', 'timestamp',
                        'file', 'bounds', 'minZoom', 'maxZoom'))
                    Ti.App.Properties.setObject('mbtiles', this.mbtiles);

                    this.internalAddTileSource(this.createTileSource(request.token));
                });

            }
            if (e.runningRequestsCount === 0 && this.generatorService) {
                if (__APPLE__) {
                    this.generatorService.unregister();
                    this.generatorService = null;
                } else if (__ANDROID__) {
                    this.generatorService.stop();
                    this.generatorService = null;
                }
            }

        }).on('mbtiles_generator_cancelled', e => {
            console.debug('mbtiles_generator_cancelled', e.request, this.runningMbTilesIndexes);
            var request = e.request,
                running = this.runningMbTiles[request.token];
            if (running) {
                var index = this.runningMbTilesIndexes.indexOf(request.token);
                if (index >= 0) {
                    this.runningMbTilesIndexes.splice(index, 1);
                    this.view.listView.deleteItemsAt(this.MBTILES_SECTION_INDEX, index, 1, {
                        animated: true
                    });
                }

                delete this.runningMbTiles[request.token];
                this.saveRunningMBTiles();
            }
            if (e.runningRequestsCount === 0 && this.generatorService) {
                if (__APPLE__) {
                    this.generatorService.unregister();
                    this.generatorService = null;
                } else if (__ANDROID__) {
                    this.generatorService.stop();
                    this.generatorService = null;
                }
            }
        }).on('mbtiles_generator_state', e => {
            var request = e.request,
                running = this.runningMbTiles[request.token];
            // sdebug('on state');
            if (running) {
                var index = this.runningMbTilesIndexes.indexOf(request.token);
                if (index >= 0) {
                    // sdebug('on state', !!e.request.paused);
                    this.view.listView.updateItemAt(this.MBTILES_SECTION_INDEX, index, {
                        pause: {
                            text: !!e.request.paused ? '\ue01b' : '\ue018'
                        },
                        subtitle: {
                            text: this.mbTilesDownloadSubTitle(e)
                        },
                        loading: {
                            visible: !!e.request.paused
                        }
                    });
                }
            }
        }).on('mbtiles_generator_start', e => {
            var request = e.request;
            this.runningMbTiles[request.token] = {
                doneCount: request.layer.doneCount,
                count: request.count,
                query: Object.assign(request.layer, _.pick(request, 'token', 'timestamp', 'doneCount')),
                file: request.file,
                token: request.token,
                request: request,
                bounds: request.bounds,
                minZoom: request.minZoom,
                maxZoom: request.maxZoom
            }
            this.saveRunningMBTiles();
            this.runningMbTilesIndexes.push(request.token);
            // sdebug('adding mbtiles', runningMbTiles[request.token], request);
            this.view.listView.appendItems(this.MBTILES_SECTION_INDEX, [{
                template: 'mbtiles',
                title: {
                    html: this.sourceName(request.layer.layer)
                },
                subtitle: {
                    text: this.mbTilesDownloadSubTitle(e)
                },
                token: request.token,
                properties: {
                    canMove: false,
                },
                loading: {
                    visible: true
                },
                progress: {
                    value: (request.doneCount > 0) ? (request.doneCount / request.count * 100) : 0
                },
                pause: {
                    text: (request.doneCount > 0) ? '\ue01b' : '\ue018'
                }
            }], {
                    animated: true
                });
        });

        var providers = require('data/tilesources').data;
        for (var provider in providers) {
            this.addLayer(provider, providers);
            if (providers[provider].variants) {
                for (var variant in providers[provider].variants) {
                    this.addLayer(provider + '.' + variant, providers);
                }
            }
        }

        this.tileSourcesIndexed = {};
        this.tileSources = _.reduce(this.currentSources, (memo, value, index) => {
            sdebug('tilesource', value);
            var tileSource = this.createTileSource(value, index);
            // tileSource.clearCache();
            if (tileSource) {
                memo.push(tileSource);
                this.tileSourcesIndexed[value] = tileSource;
            }

            return memo;
        }, []);
        var actions = [{
            id: 'add',
            icon: $.sAdd
        }, {
            id: 'glayer',
            icon: $.sRouting
        }, {
            id: 'traffic',
            enabled: false,
            icon: app.icons.traffic
        }, {
            id: 'buildings',
            enabled: false,
            icon: app.icons.building
        }, {
            id: 'indoor',
            enabled: false,
            icon: $.sLayers
        }];
        this.actionButtons = _.reduce(actions, function (memo, value) {
            memo.push(new ActionButton(Object.assign(value, {
                width: 'FILL'
            })));
            return memo;
        }, []);
        this.view = new View({
            properties: {
                rclass: 'TSControls',
                visible: false,
            },
            childTemplates: [{
                type: 'Ti.UI.ListView',
                bindId: 'listView',
                properties: {
                    rclass: 'TSControlListView',
                    templates: {
                        default: app.templates.row.tilesourceControl,
                        mbtiles: app.templates.row.mbtilesGenerator
                    },
                    defaultItemTemplate: 'default',
                    sections: [{}, {
                        items: _.reduce(this.tileSources, (memo, value) => {
                            memo.push(this.tileSourceItem(value));
                            return memo;
                        }, [])
                    }] // second is for mbtiles
                },
                events: {
                    longpress: e => {
                        sdebug('long press');
                        this.view.listView.editing = !this.view.listView.editing;
                    },
                    move: e => {
                        if (!e.item) {
                            return;
                        }
                        var sourceId = e.item.sourceId;
                        sdebug('on move', e);
                        this.moveTileSourceToIndex(sourceId, e.targetItemIndex, e.item.token);
                    }
                }

            }, {
                type: 'Ti.UI.View',
                properties: {
                    rclass: 'TSControlLine',
                    bubbleParent: false,
                },
                childTemplates: this.actionButtons,
                events: {
                    'click': app.debounce(e => {
                        var callbackId = e.source.callbackId;
                        sdebug('click', callbackId);
                        if (callbackId) {
                            var newEnabled = !e.source.isEnabled();
                            switch (callbackId) {
                                case 'indoor':
                                    // if (newEnabled) {
                                    //     this.mapView.setMapPadding('indoor', {bottom:100});
                                    // }
                                    // else {
                                    //     this.mapView.removeMapPadding('indoor');
                                    // }
                                    var padding = this.mapView.padding as ObjectPadding;
                                    var delta = newEnabled ? 100 : -100;
                                    padding.bottom = (padding.bottom || 0) + delta;
                                    padding.top = (padding.top || 0) + delta;
                                    this.mapView.padding = padding;
                                case 'traffic':
                                case 'buildings':
                                    this.mapView[callbackId] = newEnabled;
                                    e.source.setEnabled(newEnabled);
                                    break;
                                case 'add':
                                    this.showSourceSelection();
                                    break;
                                case 'glayer':
                                    {
                                        var options = Object.keys(this.mapTypes);
                                        var currentMapType = this.mapView.mapType;
                                        var currentType = _.getKeyByValue(this.mapTypes,
                                            currentMapType);
                                        sdebug('mapTypes', this.mapTypes);
                                        sdebug('currentMapType', currentMapType);
                                        sdebug('currentType', currentType);
                                        sdebug('options', options);
                                        new OptionDialog({
                                            options: _.map(Object.keys(this.mapTypes),
                                                function (value,
                                                    index) {
                                                    return trc(value);
                                                }),
                                            selectedIndex: options.indexOf(currentType),
                                            buttonNames: [trc('cancel')],
                                            cancel: 0,
                                            tapOutDismiss: true
                                        }).on('click', function (e) {
                                            if (!e.cancel) {
                                                var newType = options[e.index];
                                                sdebug('click', this.mapTypes,
                                                    currentMapType,
                                                    currentType, newType);
                                                if (newType !== currentType) {
                                                    this.mapView.mapType = this.mapTypes[
                                                        newType];
                                                    Ti.App.Properties.setString(
                                                        'maptype', newType);
                                                }
                                            }
                                        }).show();
                                        break;
                                    }

                            }
                        }

                    })
                }

            }],
            events: {
                click: app.debounce(e => {
                    if (!e.item) {
                        return;
                    }
                    var callbackId = e.source.callbackId || e.bindId;
                    var options: string[], current, tileSource,
                        sourceId = e.item.sourceId;
                    sdebug(e.type, callbackId, e.item);
                    switch (callbackId) {
                        case 'delete':
                            {
                                if (e.item.token && this.runningMbTiles[e.item.token]) {
                                    console.debug('about to delete', e.item.token);
                                    var request = this.runningMbTiles[e.item.token].request;
                                    // request.stop();
                                    Ti.App.emit('mbtiles_generator_command', {
                                        command: 'stop',
                                        token: e.item.token
                                    });
                                } else if (sourceId) {
                                    this.removeTileSource(sourceId);
                                }
                                break;
                            }
                        case 'enable':
                            {
                                current = this.tileSourcesIndexed[sourceId].visible;
                                current = !current;
                                e.source.applyProperties({
                                    text: current ? $.sVisible : $.sHidden,
                                    color: current ? $.cTheme.main : $.white
                                });
                                Ti.App.Properties.setBool(sourceId + '_enabled', current);
                                this.tileSourcesIndexed[sourceId].visible = current;
                                break;
                            }
                        case 'options':
                            {
                                var isMbTiles = !!this.mbtiles[sourceId];
                                var isHd = Ti.App.Properties.getBool(sourceId + '_hd', this.defaultHD);
                                options = ['delete'];
                                if (isMbTiles) {
                                    options.unshift('center_bounds');
                                } else {
                                    options.unshift('clear_cache');
                                }
                                options.unshift(isHd ? 'disable_hd' : 'enable_hd');
                                sdebug('about to show options dialog');
                                new OptionDialog({
                                    options: _.map(options, function (value,
                                        index) {
                                        return trc(value);
                                    }),
                                    buttonNames: [trc('cancel')],
                                    cancel: 0,
                                    tapOutDismiss: true
                                }).on('click', (f => {
                                    if (!f.cancel) {
                                        var option = options[f.index];
                                        switch (option) {
                                            case 'enable_hd':
                                            case 'disable_hd':
                                                isHd = !isHd;
                                                Ti.App.Properties.setBool(sourceId + '_hd',
                                                    isHd);
                                                tileSource = this.tileSourcesIndexed[sourceId];
                                                tileSource.autoHd = isHd;
                                                tileSource.clearCache();
                                                break;

                                            case 'clear_cache':
                                                tileSource = this.tileSourcesIndexed[sourceId];
                                                tileSource.clearCache();
                                                break;
                                            case 'delete':
                                                this.removeTileSource(sourceId);
                                                break;
                                            case 'center_bounds':
                                                var mbTile = this.mbtiles[sourceId];
                                                this.parent.updateCamera({
                                                    zoom: mbTile.minZoom,
                                                    centerCoordinate: this.geolib.getCenter(
                                                        [mbTile.bounds.sw, mbTile.bounds
                                                            .ne
                                                        ])
                                                });
                                                break;
                                        }
                                    }
                                }).bind(this)).show();
                                break;
                            }
                        case 'download':
                            {
                                this.createMBTiles(this.tileSourcesIndexed[sourceId], this.mapView.region);
                                break;
                            }
                        case 'pause':
                            {
                                if (e.item.token && this.runningMbTiles[e.item.token]) {
                                    // var request = runningMbTiles[e.item.token].request;
                                    Ti.App.emit('mbtiles_generator_command', {
                                        command: 'playpause',
                                        token: e.item.token
                                    });
                                    // if (request.paused) {
                                    //     request.resume();
                                    // } else {

                                    //     request.pause();
                                    // }

                                }
                                break;
                            }
                    }
                }, 100),
                change: e => {
                    if (e.item) {
                        var sourceId = e.item.sourceId;
                        this.tileSourcesIndexed[sourceId].opacity = e.value;
                    }

                },
                stop: e => {
                    if (e.item) {
                        if (e.bindId === 'slider') {
                            var sourceId = e.item.sourceId;
                            Ti.App.Properties.setDouble(sourceId + '_opacity', e.source.value);
                        }
                    }

                }
            }
        }) as SelectionView
        this.button = new Button({
            rclass: 'MapButton',
            bubbleParent: false,
            title: $.sLayers,
            bottom: 6,
            top: null,
            left: 8
        });
        _additional.underContainerChildren.push(this.view);
        _additional.mapPaddedChildren.push(this.button);

        this.button.on('click', this.showHide)
        Object.assign(_additional.mapArgs, {
            tileSource: (_additional.mapArgs.tileSource || []).concat(this.tileSources),
            mapType: this.mapTypes[Ti.App.Properties.getString('maptype', 'normal')]
        });
    }
    isOverlay(providerName, layer) {
        if (!!layer.options.isOverlay || (layer.options.opacity && layer.options.opacity < 1)) {
            return true;
        }
        var overlayPatterns = [
            '^(OpenWeatherMap|OpenSeaMap|Lonvia|OpenSkiMap)',
            'OpenMapSurfer.(AdminBounds|Contours)',
            'shading',
            '^openpistemap$.',
            'Stamen.Toner(Hybrid|Lines|Labels)',
            'Acetate.(foreground|labels|roads)',
            'Hydda.RoadsAndLabels'
        ];

        return providerName.toLowerCase().match('(' + overlayPatterns.join('|').toLowerCase() +
            ')') !==
            null;
    }
    addLayer(arg, providers: { [k: string]: Provider }) {
        var parts = arg.split('.');
        var id = arg.toLowerCase();

        var providerName = parts[0];
        var variantName = parts[1];
        var name = providerName + ' ' + variantName;

        var data = providers[providerName];
        if (!data) {
            throw 'No such provider (' + providerName + ')';
        }
        var provider = {
            name: providerName,
            id: id,
            category: data.category,
            url: data.url,
            options: Object.assign({}, data.options),
        };

        // overwrite values in provider from variant.
        if (variantName && 'variants' in data) {
            if (!(variantName in data.variants)) {
                throw 'No such variant of ' + providerName + ' (' + variantName + ')';
            }
            var variant = data.variants[variantName];
            var variantOptions;
            if (typeof variant === 'string') {
                variantOptions = {
                    variant: variant,
                };
            } else {
                variantOptions = variant.options || {};
            }
            variantOptions.variantName = variantName;
            provider.url = variant.url || provider.url;
            Object.assign(provider.options, variantOptions);
        } else if (typeof provider.url === 'function') {
            provider.url = provider.url(parts.splice(1, parts.length - 1).join('.'));
        }
        if (!provider.url) {
            return;
        }
        var forceHTTP = provider.options.forceHTTP;
        if (provider.url.indexOf('//') === 0) {
            provider.url = (forceHTTP ? 'http:' : 'https:') + provider.url;
            // provider.url = forceHTTP ? 'http:' : 'https:' + provider.url;
        }
        provider.url = provider.url.assign(provider.options);
        if (provider.url.indexOf('{variant}') >= 0) {
            return;
        }
        // replace attribution placeholders with their values from toplevel provider attribution,
        // recursively
        var attributionReplacer = function (attr) {
            if (!attr || attr.indexOf('{attribution.') === -1) {
                return attr;
            }
            return attr.replace(/\{attribution.(\w*)\}/,
                function (match, attributionName) {
                    return attributionReplacer(providers[attributionName].options.attribution);
                }
            );
        };
        provider.options.attribution = attributionReplacer(provider.options.attribution);

        // Compute final options combining provider options with any user overrides
        if (this.isOverlay(arg, provider)) {
            this.overlaySources[id] = provider;
        } else {
            this.baseSources[id] = provider;
        }

    }
    createMBTiles = (_tileSource, _bounds) => {
        if (!this.MBTilesUtils) {
            this.MBTilesUtils = require('lib/mbtilesgenerator/utils');
        }
        var realMinZoom = _tileSource.minZoom > 0 ? _tileSource.minZoom : 1;
        var realMaxZoom = Math.min(_tileSource.maxZoom || 22, 17); //prevent downloading under 17 because of bulk rules
        var maxZoom = realMaxZoom;
        var minZoom = Math.min(Math.max(Math.floor(this.mapView.zoom), realMinZoom), maxZoom);
        var layer = JSON.parse(JSON.stringify(_tileSource));
        var bounds = this.geolib.scaleBounds(_bounds, 0.2);
        var center = this.geolib.getCenter([bounds.sw, bounds.ne]);
        var formatScale = function (scale) {
            return '1:' + app.utils.filesize(scale, {
                // exponent: -2,
                base: 10,
                round: 0
            }).slice(0, -1);
        }
        var estimatedData = () => {
            var res = this.MBTilesUtils.computeInfoForMBTiles(layer, bounds, minZoom, maxZoom);
            var minScale = this.geolib.getMapScaleAtZoom(res.minZoom, center);
            var maxScale = this.geolib.getMapScaleAtZoom(res.maxZoom, center);
            return Object.assign(res, {
                minScale: formatScale(minScale.realScale),
                maxScale: formatScale(maxScale.realScale),
            })
        }
        var estimatedText = function (estimated) {
            return trc('area') + ': ' + Math.round(estimated.area) + ' km²\n' +
                trc('count') + ': ' + estimated.count + ' tiles\n' +
                trc('minZoom') + ': ' + estimated.minZoom + ' (' + estimated.minScale + ')\n' +
                trc('maxZoom') + ': ' + estimated.maxZoom + ' (' + estimated.maxScale + ')\n' +
                trc('count') + ': ' + estimated.count + ' tiles\n' +
                trc('estimated_size') + ': ' + app.utils.filesize(estimated.size, {
                    round: 0
                })
        }

        var estimated = estimatedData();
        app.confirmAction({
            buttonNames: [trc('no'), trc('yes')],
            message: estimatedText(estimated),
            customView: {
                properties: {
                    layout: 'vertical',
                    height: 'SIZE',
                    clipChildren: false // for the slider shadow on ios
                },
                childTemplates: [{
                    properties: {
                        layout: 'horizontal',
                        height: 'SIZE',
                        clipChildren: false // for the slider shadow on ios
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        properties: {
                            font: {
                                size: 13
                            },
                            padding: {
                                right: 4,
                                left: 4
                            },
                            text: trc('min')
                        }
                    }, {
                        type: 'Ti.UI.Slider',
                        bindId: 'minSlider',
                        properties: {
                            height: 34,
                            bubbleParent: true,
                            tintColor: $.cTheme.main,
                            min: realMinZoom,
                            max: maxZoom,
                            value: minZoom
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'minValue',
                        properties: {
                            width: '40%',
                            textAlign: 'right',
                            font: {
                                size: 13
                            },
                            padding: {
                                right: 4,
                                left: 4
                            },
                            text: estimated.minScale + '(' + minZoom + ')'
                        }
                    }]
                }, {
                    properties: {
                        layout: 'horizontal',
                        height: 'SIZE',
                        clipChildren: false // for the slider shadow on ios
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        properties: {
                            font: {
                                size: 13
                            },
                            padding: {
                                right: 4,
                                left: 4
                            },
                            text: trc('max')
                        }
                    }, {
                        type: 'Ti.UI.Slider',
                        bindId: 'maxSlider',
                        properties: {
                            height: 34,
                            tintColor: $.cTheme.main,
                            bubbleParent: true,
                            min: minZoom,
                            max: realMaxZoom,
                            value: maxZoom
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'maxValue',
                        properties: {
                            width: '40%',
                            textAlign: 'right',
                            font: {
                                size: 13
                            },
                            padding: {
                                right: 4,
                                left: 4
                            },
                            text: estimated.maxScale + '(' + maxZoom + ')'
                        }
                    }]
                }],
                events: {
                    change: e => {
                        sdebug('change', e.bindId);
                        var estimated = estimatedData();
                        if (e.bindId === 'minSlider') {
                            minZoom = Math.round(e.value);
                            e.source.parent.parent.parent.parent.applyProperties({
                                minValue: {
                                    text: estimated.minScale + '(' + minZoom + ')'
                                },
                                maxSlider: {
                                    min: minZoom
                                },
                                message: {
                                    text: estimatedText(estimated)
                                }
                            })
                        } else if (e.bindId === 'maxSlider') {
                            maxZoom = Math.round(e.value);
                            e.source.parent.parent.parent.parent.applyProperties({
                                maxValue: {
                                    text: estimated.maxScale + '(' + maxZoom + ')'
                                },
                                minSlider: {
                                    max: maxZoom
                                },
                                message: {
                                    text: estimatedText(estimated)
                                }
                            })
                        }
                    }
                }
            },
            title: trc('are_you_sure')
        }, () => {
            this.startMBTilesGeneration(layer, bounds, minZoom, maxZoom);
        });
    }
    getMBTilesGenerator() {
        if (!this.mbTilesGenerator) {
            // if (__APPLE__) {
            this.mbTilesGenerator = require('lib/mbtilesgenerator/generator');
            // }
        }
        return this.mbTilesGenerator;
    }

    saveRunningMBTiles() {
        Ti.App.Properties.setObject('mbtiles_generating', _.mapValues(this.runningMbTiles, _.partialRight(_.omit,
            'request')));
    }

    startMBTilesGeneration(_query, _bounds, _minZoom, _maxZoom) {
        sdebug('startMBTilesGeneration', _query, _bounds, _minZoom, _maxZoom);
        var realQuery = function () {
            Ti.App.emit('mbtiles_generator_command', {
                command: 'start',
                layer: _query,
                bounds: _bounds,
                minZoom: _minZoom,
                maxZoom: _maxZoom,
            });
            // Ti.App.emit('mbtiles_generator_request', {
            //     layer: _query,
            //     bounds: _bounds,
            //     minZoom: _minZoom,
            //     maxZoom: _maxZoom,
            // });
        };
        if (__APPLE__) {
            if (!this.generatorService) {

                this.getMBTilesGenerator();
                this.generatorService = Ti.App.iOS.registerBackgroundService({
                    url: 'mbtilesgenerator.js'
                });
            }
            realQuery();
        } else if (__ANDROID__) {
            var isRunning;
            if (!this.generatorService) {
                var intent = Ti.Android.createServiceIntent({
                    url: 'mbtilesgenerator.js'
                });
                isRunning = Ti.Android.isServiceRunning(intent);
            }

            if (!isRunning) {
                this.generatorService = Ti.Android.createService(intent);
                this.generatorService.once('start', realQuery);
                this.generatorService.start();
            } else {
                realQuery();
            }
        }

        // return request;
    }


    zIndex(_index) {
        return _index;
    }

    createTileSource(_id: string, _index?: number) {
        var layer, isMbTiles = false;
        if (this.mbtiles[_id]) {
            sdebug('found mbtiles', this.mbtiles[_id]);
            isMbTiles = true;
            layer = this.mbtiles[_id].layer;
        } else {
            layer = this.baseSources[_id] || this.overlaySources[_id];
        }
        if (layer) {
            var enabled = Ti.App.Properties.getBool(_id + '_enabled', true);
            var props = Object.assign({
                id: _id,
                url: (!isMbTiles) ? layer.url : undefined,
                source: isMbTiles ? (app.getPath('mbtiles') + this.mbtiles[_id].file) : undefined,
                layer: layer,
                visible: enabled,
                cacheable: !isMbTiles && (!layer.options || layer.options.cacheable !== false || !!app.developerMode),
                maxZoom: 19,
                zIndex: this.zIndex(_index),
                autoHd: Ti.App.Properties.getBool(_id + '_hd', this.defaultHD),
                // tileSize: layer.options.tileSize,
                opacity: Ti.App.Properties.getDouble(_id + '_opacity', (layer.options && layer.options.opacity) ||
                    1),
            }, isMbTiles ? this.mbtiles[_id] : _.omit(layer.options, 'url'));
            var result = new MapTileSource(props);
            // result.clearCache();
            sdebug('createTileSource', JSON.stringify(result));
            return result;
        }
    }

    onParentClick = (e) => {
        if (e.source === this.window || e.source === this.window.underContainer) {
            this.hideBottomControls();
        }
    }

    showBottomControls() {
        console.debug('showBottomControls',this.bottomControlsVisible);
        if (this.bottomControlsVisible) {
            return;
        }
        app.showTutorials(['gmaps_settings', 'custom_tilesource']);

        this.view.visible = true;
        // if (__ANDROID__) {
        //     this.mapView.touchPassThrough = true;

        // } else {
        this.window.container.touchEnabled = false;
        // }
        this.bottomControlsVisible = true;
        this.window.on('click', this.onParentClick);
        this.window.container.animate({
            duration: 200,
            transform: '0t0,-' + $.TSCountrolsHeight

        });
    }

    hideBottomControls() {
        if (!this.bottomControlsVisible) {
            return;
        }
        this.view.listView.editing = false;
        // if (__ANDROID__) {
        //     this.mapView.touchPassThrough = false;

        // } else {
        //     this.mapView.touchEnabled = true;
        // }
        this.parent.off('click', this.onParentClick);
        this.window.container.touchEnabled = true;
        this.bottomControlsVisible = false;
        this.window.container.animate({
            duration: 200,
            transform: null
        }, () => {
            this.view.visible = false;
        });
    }

    showHide = () => {
        if (this.bottomControlsVisible) {
            this.hideBottomControls();
        } else {
            this.showBottomControls();
        }
    }

    sourceName(_value) {
        var title = _value.name;
        if (_value.options) {
            if (_value.options.variantName) {
                title += '<small> <i>' + _value.options.variantName +
                    '</i></small>';
            }

        }
        return title;
    }

    mbTilesSubTitle(_value, _showDate) {
        // return 'toto';
        if (!_value.area) {
            return;
        }
        var result = Math.round(_value.area) + ' km² - ' + app.utils.filesize(_value.size, {
            round: 0
        });
        if (_showDate !== false) {
            // moment.duration(moment().valueOf() - _value.timestamp).format()
            result += ' - ' + app.utils.humanizeDuration(moment().valueOf() - _value.timestamp, {
                largest: 1,
                round: true
            });
        }
        return result;
    }

    mbTilesTitle(_value) {
        sdebug('mbTilesTitle', _value);
        var displayName = '';
        if (_value.address) {
            var address = _value.address;
            var params = ['village', 'town', 'city', 'state', 'country'];
            for (var i = 0; i < params.length; i++) {
                if (address.address.hasOwnProperty(params[i])) {
                    displayName = address.address[params[i]];
                    break;
                }
            }
        }

        // if (e.address.hasOwnProperty('country') && displayName !== e.address['country']) {
        //     displayName += ', ' + e.address['country'];
        // }
        return displayName;
    }

    mbTilesDownloadSubTitle(e) {
        return this.mbTilesSubTitle(e.request, false) + '\n' + trc(!!e.request.paused ? 'paused' : 'downloading') +
            '  (' + e.progress
                .toFixed() + '%)';
    }

    tileSourceItem(_value) {

        var id = _value.id;
        var mbTile = this.mbtiles[id];
        var isMbTiles = !!mbTile;
        var layer = _value.layer;
        sdebug('tileSourceItem', id, isMbTiles, _value, app.developerMode);
        // if (id !== shadingId) {
        var enabled = Ti.App.Properties.getBool(id + '_enabled',
            true);
        return {
            title: {
                html: isMbTiles ? (this.mbTilesTitle(mbTile) + ': ' + this.sourceName(layer)) : this.sourceName(layer)
            },
            subtitle: {
                html: isMbTiles ? this.mbTilesSubTitle(mbTile, true) : undefined
            },
            sourceId: id,
            enable: {
                text: enabled ? $.sVisible : $.sHidden,
                color: enabled ? $.cTheme.main : $.white,
            },
            slider: {
                value: Ti.App.Properties.getDouble(id +
                    '_opacity', 1)
            },
            download: {
                visible: !isMbTiles && (!layer.options || layer.options.cacheable !== false || !!app.developerMode),
                // visible: !isMbTiles && ((layer.options && !!layer.options.downloadable) || !!app.developerMode)
            }

        };
    }
    GC() {
        super.GC();
        this.tileSources = null;
        this.tileSourcesIndexed = null;
        this.view = null;
        this.button = null;
        _.each(this.actionButtons, button => {
            button.GC();
        });
        this.actionButtons = null;
    }
    onWindowOpen(_enabled) {
        app.showTutorials(['map_settings']);

        _.each(this.runningMbTiles, (value, id) => {
            sdebug('runningMbTiles', value.query.token, value.bounds, value.minZoom,
                value.maxZoom);
            this.startMBTilesGeneration(value.query, value.bounds, value.minZoom, value.maxZoom);
            // request.pause();
        });
    }
    onMapReset(_params) {
        _params = _params || {};
        if (!!_params.bottom) {
            this.button.animate({
                opacity: 1,
                duration: 200
            });
        }
    }
    hideModule(_params) {
        this.hideBottomControls();
        _params = _params || {};
        if (!!_params.bottom) {
            this.button.animate({
                opacity: 0,
                duration: 200
            });
        }

    }
    // onMapPadding: function(_padding, _duration) {
    //     button.animate({
    //         transform: 't0,-' + _padding.bottom,
    //         duration: _duration || 0
    //     });
    // },
    // onMapHolderPress: function(e) {
    // var callbackId = _.get(e, 'source.callbackId');
    // if (callbackId !== 'tilesources' && bottomControlsVisible) {
    //     hideBottomControls();
    //     return true;
    // }
    // },
    onModuleAction(_params) {
        if (_params.id === 'tilesources') {
            this.showHide();
        } else {
            return false;
        }
        return true;
    }
    showSourceSelection() {
        app.ui.createAndOpenWindow('TileSourceSelectWindow', {
            module: this,
            baseSources: this.baseSources,
            overlaySources: this.overlaySources
        });
    }

    addTileSource(_id) {
        if (!_.includes(this.currentSources, _id)) {
            var tileSource = this.createTileSource(_id, this.currentSources.length);
            this.internalAddTileSource(tileSource);
        }
    }
    internalAddTileSource(tileSource) {
        if (tileSource) {
            sdebug('internalAddTileSource', tileSource);
            this.currentSources.push(tileSource.id);
            this.tileSources.push(tileSource);
            this.tileSourcesIndexed[tileSource.id] = tileSource;
            this.mapView.addTileSource(tileSource);
            this.view.listView.appendItems(this.SOURCES_SECTION_INDEX, [this.tileSourceItem(tileSource)]);
            Ti.App.Properties.setObject('tilesources', this.currentSources);
            this.updateZIndexes();
            app.showTutorials(['tilesource_listview']);
        }
    }
    updateZIndexes() {
        for (var i = 0; i < this.currentSources.length; i++) {
            this.tileSourcesIndexed[this.currentSources[i]].zIndex = this.zIndex(i);
        }
    }
    moveTileSourceToIndex(_id, _index, _token) {
        console.debug('moveTileSourceToIndex', _id, _index, _token);
        var tileSource = this.tileSourcesIndexed[_id];
        var index = this.currentSources.indexOf(_id);
        _.move(this.currentSources, index, _index);
        Ti.App.Properties.setObject('tilesources', this.currentSources);
        this.updateZIndexes();
        if (_token && this.runningMbTiles[_token]) {
            console.debug('updating runningMbTiles', this.runningMbTiles[_token].index, _index);
            this.runningMbTiles[_token].index = _index;
            this.saveRunningMBTiles();
        }
        // tileSource.zIndex = zIndex(_index)-1;
        // this.mapView.removeTileSource(tileSource);
        // this.mapView.addTileSource(tileSource, _index);
    }

    removeTileSource(_id) {
        sdebug('remove tilesource', _id);
        if (this.tileSourcesIndexed[_id]) {
            var tileSource = this.tileSourcesIndexed[_id];
            var index = this.currentSources.indexOf(_id);
            sdebug('remove tilesource index ', index);
            if (index >= 0) {
                this.currentSources.splice(index, 1);
                this.tileSources.splice(index, 1);
                this.view.listView.deleteItemsAt(this.SOURCES_SECTION_INDEX, index, 1, {
                    animated: true
                });
                Ti.App.Properties.setObject('tilesources', this.currentSources);
                Ti.App.Properties.removeProperty(_id + '_enabled');
                Ti.App.Properties.removeProperty(_id + '_opacity');
                Ti.App.Properties.removeProperty(_id + '_hd');
            }
            this.mapView.removeTileSource(tileSource);
            this.updateZIndexes();
        }
    }
    removeMBTiles(_id) {
        if (this.mbtiles[_id]) {
            this.removeTileSource(_id);
            Ti.Filesystem.getFile(app.getPath('mbtiles') + this.mbtiles[_id].file).deleteFile();
            delete this.mbtiles[_id];
            Ti.App.Properties.setObject('mbtiles', this.mbtiles);
        }
    }
    onWindowBack() {
        if (this.bottomControlsVisible) {
            this.hideBottomControls();
            return true;
        }
    }
}

export function create(_context, _args, _additional) {
    return new TileSourceMgr(_context, _args, _additional);
};