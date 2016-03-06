exports.create = function(_context, _args, _additional) {
    // Ti.App.Properties.removeProperty('tilesources');

    var TAG = 'TileSourceManager',
        mapTypes = app.modules.map.MapType,
        bottomControlsVisible = false,
        baseSources = {},
        htmlIcon = app.utilities.htmlIcon,
        defaultHD = app.deviceinfo.densityFactor >= 3,
        overlaySources = {},
        mbTilesGenerator,
        geolib = app.utils.geolib,
        SOURCES_SECTION_INDEX = 1,
        MBTILES_SECTION_INDEX = 0,
        mbtiles = Ti.App.Properties.getObject('mbtiles', {}),
        runningMbTiles = Ti.App.Properties.getObject('mbtiles_generating', {}),
        generatorService,
        MBTilesUtils,

        currentSources = Ti.App.Properties.getObject('tilesources', []);

    Ti.App.on('mbtiles_generator_update', function(e) {
        // sdebug('got update', e);
        var request = e.request,
            running = runningMbTiles[request.token];
        if (running) {
            view.listView.updateItemAt(MBTILES_SECTION_INDEX, running.index, {
                progress: {
                    value: e.progress
                },
                subtitle: {
                    text: mbTilesDownloadSubTitle(e)
                }
            });
            running.query.doneCount = e.doneCount;

            saveRunningMBTiles();
        }
    }).on('mbtiles_generator_done', function(e) {
        var request = e.request,
            running = runningMbTiles[request.token];
        if (running) {
            var bounds = request.bounds;
            var center = geolib.getCenter([bounds.sw, bounds.ne]);
            app.api.reverseGeocode({
                latitude: center.latitude,
                longitude: center.longitude,
                // zoom:request.minZoom
            }, function(e) {
                view.listView.deleteItemsAt(MBTILES_SECTION_INDEX, running.index, 1, {
                    animated: true
                });
                delete runningMbTiles[request.token];
                saveRunningMBTiles();
                mbtiles[request.token] = _.assign({
                    address: e,
                    layer: request.layer.layer,
                }, _.pick(request, 'area', 'size', 'token', 'count', 'timestamp',
                    'file', 'bounds', 'minZoom', 'maxZoom'))
                Ti.App.Properties.setObject('mbtiles', mbtiles);

                self.internalAddTileSource(createTileSource(request.token));
            });

        }
        if (e.runningRequestsCount === 0 && generatorService) {
            if (__APPLE__) {
                generatorService.unregister();
                generatorService = null;
            } else if (__ANDROID__) {
                generatorService.stop();
                generatorService = null;
            }
        }

    }).on('mbtiles_generator_cancelled', function(e) {
        var request = e.request,
            running = runningMbTiles[request.token];
        if (running) {
            view.listView.deleteItemsAt(MBTILES_SECTION_INDEX, running.index, 1, {
                animated: true
            });
            delete runningMbTiles[request.token];
            saveRunningMBTiles();
        }
        if (e.runningRequestsCount === 0 && generatorService) {
            if (__APPLE__) {
                generatorService.unregister();
                generatorService = null;
            } else if (__ANDROID__) {
                generatorService.stop();
                generatorService = null;
            }
        }
    }).on('mbtiles_generator_state', function(e) {
        var request = e.request,
            running = runningMbTiles[request.token];
        // sdebug('on state');
        if (running) {
            // sdebug('on state', !!e.request.paused);
            view.listView.updateItemAt(MBTILES_SECTION_INDEX, running.index, {
                pause: {
                    text: !!e.request.paused ? '\ue01b' : '\ue018'
                },
                subtitle: {
                    text: mbTilesDownloadSubTitle(e)
                }
            });
        }
    }).on('mbtiles_generator_start', function(e) {
        var request = e.request;
        runningMbTiles[request.token] = {
            index: view.listView.getSectionItemsCount(MBTILES_SECTION_INDEX),
            doneCount: request.layer.doneCount,
            count: request.count,
            query: _.assign(request.layer, _.pick(request, 'token', 'timestamp', 'doneCount')),
            file: request.file,
            token: request.token,
            request: request,
            bounds: request.bounds,
            minZoom: request.minZoom,
            maxZoom: request.maxZoom
        }
        saveRunningMBTiles();
        // sdebug('adding mbtiles', runningMbTiles[request.token], request);
        view.listView.appendItems(MBTILES_SECTION_INDEX, [{
            template: 'mbtiles',
            title: {
                html: sourceName(request.layer.layer)
            },
            subtitle: {
                text: mbTilesDownloadSubTitle(e)
            },
            token: request.token,
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
    // Ti.App.Properties.removeProperty('mbtiles');
    // Ti.App.Properties.removeProperty('mbtiles_generating');
    function getMBTilesGenerator() {
        if (!mbTilesGenerator) {
            // if (__APPLE__) {
            mbTilesGenerator = require('lib/mbtilesgenerator/generator');
            // }
        }
        return mbTilesGenerator;
    }

    function saveRunningMBTiles() {
        Ti.App.Properties.setObject('mbtiles_generating', _.mapValues(runningMbTiles, _.partialRight(_.omit,
            'request')));
    }

    function startMBTilesGeneration(_query, _bounds, _minZoom, _maxZoom) {
        sdebug('startMBTilesGeneration', _query, _bounds, _minZoom, _maxZoom);
        var realQuery = function() {
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
            if (!generatorService) {

                getMBTilesGenerator();
                generatorService = Ti.App.iOS.registerBackgroundService({
                    url: 'mbtilesgenerator.js'
                });
            }
            realQuery();
        } else if (__ANDROID__) {
            var isRunning;
            if (!generatorService) {
                var intent = Ti.Android.createServiceIntent({
                    url: 'mbtilesgenerator.js'
                });
                isRunning = Ti.Android.isServiceRunning(intent);
            }

            if (!isRunning) {
                generatorService = Ti.Android.createService(intent);
                generatorService.once('start', realQuery);
                generatorService.start();
            } else {
                realQuery();
            }
        }

        // return request;
    }

    function createMBTiles(_tileSource, _bounds) {
        if (!MBTilesUtils) {
            MBTilesUtils = require('lib/mbtilesgenerator/utils');
        }
        var realMinZoom = _tileSource.minZoom > 0 ? _tileSource.minZoom : 1;
        var realMaxZoom = Math.min(_tileSource.maxZoom || 22, 17); //prevent downloading under 17 because of bulk rules
        var maxZoom = realMaxZoom;
        var minZoom = Math.min(Math.max(Math.floor(self.mapView.zoom), realMinZoom), maxZoom);
        var layer = JSON.parse(JSON.stringify(_tileSource));
        var bounds = geolib.scaleBounds(_bounds, 0.2);
        var center = geolib.getCenter([bounds.sw, bounds.ne]);
        var formatScale = function(scale) {
            return '1:' + app.utils.filesize(scale, {
                // exponent: -2,
                base: 10,
                round: 0
            }).slice(0, -1);
        }
        var estimatedData = function() {
            var res = MBTilesUtils.computeInfoForMBTiles(layer, bounds, minZoom, maxZoom);
            var minScale = geolib.getMapScaleAtZoom(res.minZoom, center);
            var maxScale = geolib.getMapScaleAtZoom(res.maxZoom, center);
            return _.assign(res, {
                minScale: formatScale(minScale.realScale),
                maxScale: formatScale(maxScale.realScale),
            })
        }
        var estimatedText = function(estimated) {
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
                            tintColor: $cTheme.main,
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
                            tintColor: $cTheme.main,
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
                    change: function(e) {
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
        }, function() {
            startMBTilesGeneration(layer, bounds, minZoom, maxZoom);
        });
    }

    function zIndex(_index) {
        return _index;
    }

    function createTileSource(_id, _index) {
        var layer, isMbTiles = false;
        if (mbtiles[_id]) {
            sdebug('found mbtiles', mbtiles[_id]);
            isMbTiles = true;
            layer = mbtiles[_id].layer;
        } else {
            layer = baseSources[_id] || overlaySources[_id];
        }
        if (layer) {
            var enabled = Ti.App.Properties.getBool(_id + '_enabled', true);
            var props = _.assign({
                id: _id,
                url: (!isMbTiles) ? layer.url : undefined,
                source: isMbTiles ? (app.getPath('mbtiles') + mbtiles[_id].file) : undefined,
                layer: layer,
                visible: enabled,
                cacheable: !isMbTiles && (!layer.options || layer.options.cacheable !== false || !!app.developerMode),
                maxZoom: 19,
                zIndex: zIndex(_index),
                autoHd: Ti.App.Properties.getBool(_id + '_hd', defaultHD),
                // tileSize: layer.options.tileSize,
                opacity: Ti.App.Properties.getDouble(_id + '_opacity', (layer.options && layer.options.opacity) ||
                    1),
            }, isMbTiles ? mbtiles[_id] : _.omit(layer.options, 'url'));
            var result = new MapTileSource(props);
            // result.clearCache();
            sdebug('createTileSource', JSON.stringify(result));
            return result;
        }
    }

    function onParentClick(e) {
        if (e.source === self.window || e.source === self.window.underContainer) {
            hideBottomControls();
        }
    }

    function showBottomControls() {
        if (bottomControlsVisible) {
            return;
        }
        app.showTutorials(['gmaps_settings', 'custom_tilesource']);

        view.visible = true;
        // if (__ANDROID__) {
        //     self.mapView.touchPassThrough = true;

        // } else {
        self.window.container.touchEnabled = false;
        // }
        bottomControlsVisible = true;
        self.window.on('click', onParentClick);
        self.window.container.animate({
            duration: 200,
            transform: '0t0,-' + $TSCountrolsHeight

        });
    }

    function hideBottomControls() {
        if (!bottomControlsVisible) {
            return;
        }
        view.listView.editing = false;
        // if (__ANDROID__) {
        //     self.mapView.touchPassThrough = false;

        // } else {
        //     self.mapView.touchEnabled = true;
        // }
        self.parent.off('click', onParentClick);
        self.window.container.touchEnabled = true;
        bottomControlsVisible = false;
        self.window.container.animate({
            duration: 200,
            transform: null
        }, function() {
            view.visible = false;
        });
    }

    function showHide() {
        if (bottomControlsVisible) {
            hideBottomControls();
        } else {
            showBottomControls();
        }
    }

    function sourceName(_value) {
        var title = _value.name;
        if (_value.options) {
            if (_value.options.variantName) {
                title += '<small> <i>' + _value.options.variantName +
                    '</i></small>';
            }

        }
        return title;
    }

    function mbTilesSubTitle(_value, _showDate) {
        // return 'toto';
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

    function mbTilesTitle(_value) {
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

    function mbTilesDownloadSubTitle(e) {
        return mbTilesSubTitle(e.request) + '\n' + trc(!!e.request.paused ? 'paused' : 'downloading') + '  (' + e.progress
            .toFixed() + '%)';
    }

    function tileSourceItem(_value) {

        var id = _value.id;
        var mbTile = mbtiles[id];
        var isMbTiles = !!mbTile;
        var layer = _value.layer;
        sdebug('tileSourceItem', id, isMbTiles, _value, app.developerMode);
        // if (id !== shadingId) {
        var enabled = Ti.App.Properties.getBool(id + '_enabled',
            true);
        return {
            title: {
                html: isMbTiles ? (mbTilesTitle(mbTile) + ': ' + sourceName(layer)) : sourceName(layer)
            },
            subtitle: {
                html: isMbTiles ? mbTilesSubTitle(mbTile, true) : undefined
            },
            sourceId: id,
            enable: {
                text: enabled ? $sVisible : $sHidden,
                color: enabled ? $cTheme.main : $white,
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

    {
        var isOverlay = function(providerName, layer) {
            if (!!layer.options.isOverlay || (layer.options.opacity && layer.options.opacity < 1)) {
                return true;
            }
            var overlayPatterns = [
                '^(OpenWeatherMap|OpenSeaMap|Lonvia|OpenSkiMap)',
                'OpenMapSurfer.(AdminBounds|Contours)',
                'shading',
                '^openpistemap$',
                'Stamen.Toner(Hybrid|Lines|Labels)',
                'Acetate.(foreground|labels|roads)',
                'Hydda.RoadsAndLabels'
            ];

            return providerName.toLowerCase().match('(' + overlayPatterns.join('|').toLowerCase() +
                    ')') !==
                null;
        };
        var providers = require('data/tilesources').data;
        var addLayer = function(arg) {
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
                options: _.assign({}, data.options),
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
                _.assign(provider.options, variantOptions);
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
            var attributionReplacer = function(attr) {
                if (!attr || attr.indexOf('{attribution.') === -1) {
                    return attr;
                }
                return attr.replace(/\{attribution.(\w*)\}/,
                    function(match, attributionName) {
                        return attributionReplacer(providers[attributionName].options.attribution);
                    }
                );
            };
            provider.options.attribution = attributionReplacer(provider.options.attribution);

            // Compute final options combining provider options with any user overrides
            if (isOverlay(arg, provider)) {
                overlaySources[id] = provider;
            } else {
                baseSources[id] = provider;
            }

        };
        for (var provider in providers) {
            addLayer(provider);
            if (providers[provider].variants) {
                for (var variant in providers[provider].variants) {
                    addLayer(provider + '.' + variant);
                }
            }
        }
    }
    var tileSourcesIndexed = {};
    var tileSources = _.reduce(currentSources,
        function(memo, value, index) {
            sdebug('tilesource', value);
            var tileSource = createTileSource(value, index);
            // tileSource.clearCache();
            if (tileSource) {
                memo.push(tileSource);
                tileSourcesIndexed[value] = tileSource;
            }

            return memo;
        }, []);
    var actions = [{
        id: 'add',
        icon: $sAdd
    }, {
        id: 'glayer',
        icon: $sRouting
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
        icon: $sLayers
    }];
    var actionButtons = _.reduce(actions, function(memo, value) {
        memo.push(new ActionButton(_.assign(value, {
            width: 'FILL'
        })));
        return memo;
    }, []);
    var view = new View({
            properties: {
                rclass: 'TSControls',
                visible: false,
            },
            childTemplates: [{
                type: 'Ti.UI.CollectionView',
                bindId: 'listView',
                properties: {
                    rclass: 'TSControlListView',
                    templates: {
                        default: app.templates.row.tilesourceControl,
                        mbtiles: app.templates.row.mbtilesGenerator
                    },
                    defaultItemTemplate: 'default',
                    sections: [{}, {
                            items: _.reduce(tileSources, function(memo, value, key) {
                                memo.push(tileSourceItem(value));
                                return memo;
                            }, [])
                        }] // second is for mbtiles
                },
                events: {
                    longpress: function(e) {
                        // sdebug(e);
                        view.listView.editing = !view.listView.editing;
                    },
                    move: function(e) {
                        if (!e.item) {
                            return;
                        }
                        var sourceId = e.item.sourceId;
                        sdebug(e);
                        self.moveTileSourceToIndex(sourceId, e.targetItemIndex);
                    }
                }

            }, {
                type: 'Ti.UI.View',
                properties: {
                    rclass: 'TSControlLine',
                    bubbleParent: false,
                },
                childTemplates: actionButtons,
                events: {
                    'click': app.debounce(function(e) {
                        var callbackId = e.source.callbackId;
                        sdebug('click', callbackId);
                        if (callbackId) {
                            var newEnabled = !e.source.isEnabled();
                            switch (callbackId) {
                                case 'indoor':
                                    // if (newEnabled) {
                                    //     self.mapView.setMapPadding('indoor', {bottom:100});
                                    // }
                                    // else {
                                    //     self.mapView.removeMapPadding('indoor');
                                    // }
                                    var padding = self.mapView.padding;
                                    var delta = newEnabled ? 100 : -100;
                                    padding.bottom = (padding.bottom || 0) + delta;
                                    padding.top = (padding.top || 0) + delta;
                                    self.mapView.padding = padding;
                                case 'traffic':
                                case 'buildings':
                                    self.mapView[callbackId] = newEnabled;
                                    e.source.setEnabled(newEnabled);
                                    break;
                                case 'add':
                                    self.showSourceSelection();
                                    break;
                                case 'glayer':
                                    {
                                        var options = Object.keys(mapTypes);
                                        var currentMapType = self.mapView.mapType;
                                        var currentType = _.getKeyByValue(mapTypes,
                                            currentMapType);
                                        sdebug('mapTypes', mapTypes);
                                        sdebug('currentMapType', currentMapType);
                                        sdebug('currentType', currentType);
                                        sdebug('options', options);
                                        new OptionDialog({
                                            options: _.map(Object.keys(mapTypes),
                                                function(value,
                                                    index) {
                                                    return trc(value);
                                                }),
                                            selectedIndex: options.indexOf(currentType),
                                            buttonNames: [trc('cancel')],
                                            cancel: 0,
                                            tapOutDismiss: true
                                        }).on('click', function(e) {
                                            if (!e.cancel) {
                                                var newType = options[e.index];
                                                sdebug('click', mapTypes,
                                                    currentMapType,
                                                    currentType, newType);
                                                if (newType !== currentType) {
                                                    self.mapView.mapType = mapTypes[
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
                click: app.debounce(function(e) {
                    if (!e.item) {
                        return;
                    }
                    var callbackId = e.source.callbackId || e.bindId;
                    var options, current, tileSource,
                        sourceId = e.item.sourceId;
                    sdebug(e.type, callbackId, e.item);
                    switch (callbackId) {
                        case 'delete':
                            {
                                if (e.item.token && runningMbTiles[e.item.token]) {
                                    var request = runningMbTiles[e.item.token].request;
                                    // request.stop();
                                    Ti.App.emit('mbtiles_generator_command', {
                                        command: 'stop',
                                        token: e.item.token
                                    });
                                } else if (sourceId) {
                                    self.removeTileSource(sourceId);
                                }
                                break;
                            }
                        case 'enable':
                            {
                                current = tileSourcesIndexed[sourceId].visible;
                                current = !current;
                                e.source.applyProperties({
                                    text: current ? $sVisible : $sHidden,
                                    color: current ? $cTheme.main : $white
                                });
                                Ti.App.Properties.setBool(sourceId + '_enabled', current);
                                tileSourcesIndexed[sourceId].visible = current;
                                break;
                            }
                        case 'options':
                            {
                                var isMbTiles = !!mbtiles[sourceId];
                                var isHd = Ti.App.Properties.getBool(sourceId + '_hd', defaultHD);
                                options = ['delete'];
                                if (isMbTiles) {
                                    options.unshift('center_bounds');
                                } else {
                                    options.unshift('clear_cache');
                                }
                                options.unshift(isHd ? 'disable_hd' : 'enable_hd');
                                sdebug('about to show options dialog');
                                new OptionDialog({
                                    options: _.map(options, function(value,
                                        index) {
                                        return trc(value);
                                    }),
                                    buttonNames: [trc('cancel')],
                                    cancel: 0,
                                    tapOutDismiss: true
                                }).on('click', (function(f) {
                                    if (!f.cancel) {
                                        var option = options[f.index];
                                        switch (option) {
                                            case 'enable_hd':
                                            case 'disable_hd':
                                                isHd = !isHd;
                                                Ti.App.Properties.setBool(sourceId + '_hd',
                                                    isHd);
                                                tileSource = tileSourcesIndexed[sourceId];
                                                tileSource.autoHd = isHd;
                                                tileSource.clearCache();
                                                break;

                                            case 'clear_cache':
                                                tileSource = tileSourcesIndexed[sourceId];
                                                tileSource.clearCache();
                                                break;
                                            case 'delete':
                                                self.removeTileSource(sourceId);
                                                break;
                                            case 'center_bounds':
                                                var mbTile = mbtiles[sourceId];
                                                self.parent.updateCamera({
                                                    zoom: mbTile.minZoom,
                                                    centerCoordinate:geolib.getCenter([mbTile.bounds.sw, mbTile.bounds.ne])
                                                });
                                                break;
                                        }
                                    }
                                }).bind(this)).show();
                                break;
                            }
                        case 'download':
                            {
                                createMBTiles(tileSourcesIndexed[sourceId], self.mapView.region);
                                break;
                            }
                        case 'pause':
                            {
                                if (e.item.token && runningMbTiles[e.item.token]) {
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
                change: function(e) {
                    if (e.item) {
                        var sourceId = e.item.sourceId;
                        tileSourcesIndexed[sourceId].opacity = e.value;
                    }

                },
                stop: function(e) {
                    if (e.item) {
                        if (e.bindId === 'slider') {
                            var sourceId = e.item.sourceId;
                            Ti.App.Properties.setDouble(sourceId + '_opacity', e.source.value);
                        }
                    }

                }
            }
        }),
        button = new Button({
            rclass: 'MapButton',
            bubbleParent: false,
            title: $sLayers,
            bottom: 6,
            top: null,
            left: 8
        });
    _additional.underContainerChildren.push(view);
    _additional.mapPaddedChildren.push(button);

    button.on('click', showHide);

    var self = new _context.MapModule(_args);

    _.assign(self, {
        mbTilesSubTitle: mbTilesSubTitle,
        mbTilesTitle: mbTilesTitle,
        GC: app.composeFunc(self.GC, function() {
            tileSources = null;
            tileSourcesIndexed = null;
            view = null;
            button = null;
            _.each(actionButtons, function(button) {
                button.GC();
            });
            actionButtons = null;
        }),
        onWindowOpen: function(_enabled) {
            app.showTutorials(['map_settings']);

            _.each(runningMbTiles, function(value, id) {
                sdebug('runningMbTiles', value.query.token, value.bounds, value.minZoom,
                    value.maxZoom);
                startMBTilesGeneration(value.query, value.bounds, value.minZoom, value.maxZoom);
                // request.pause();
            });
        },
        onMapReset: function(_params) {
            _params = _params || {};
            if (!!_params.bottom) {
                button.animate({
                    opacity: 1,
                    duration: 200
                });
            }
        },
        hideModule: function(_params) {
            hideBottomControls();
            _params = _params || {};
            if (!!_params.bottom) {
                button.animate({
                    opacity: 0,
                    duration: 200
                });
            }

        },
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
        onModuleAction: function(_params) {
            if (_params.id === 'tilesources') {
                showHide();
            } else {
                return false;
            }
            return true;
        },
        showSourceSelection: function() {
            app.ui.createAndOpenWindow('TileSourceSelectWindow', {
                module: self,
                baseSources: baseSources,
                overlaySources: overlaySources
            });
        },

        addTileSource: function(_id) {
            if (!_.contains(currentSources, _id)) {
                var tileSource = createTileSource(_id, currentSources.length);
                self.internalAddTileSource(tileSource);
            }
        },
        internalAddTileSource: function(tileSource) {
            if (tileSource) {
                sdebug('internalAddTileSource', tileSource);
                currentSources.push(tileSource.id);
                tileSources.push(tileSource);
                tileSourcesIndexed[tileSource.id] = tileSource;
                self.mapView.addTileSource(tileSource);
                view.listView.appendItems(SOURCES_SECTION_INDEX, [tileSourceItem(tileSource)]);
                Ti.App.Properties.setObject('tilesources', currentSources);
                self.updateZIndexes();
                app.showTutorials(['tilesource_listview']);
            }
        },
        updateZIndexes: function() {
            for (var i = 0; i < currentSources.length; i++) {
                tileSourcesIndexed[currentSources[i]].zIndex = zIndex(i);
            }
        },
        moveTileSourceToIndex: function(_id, _index) {
            var tileSource = tileSourcesIndexed[_id];
            var index = currentSources.indexOf(_id);
            _.move(currentSources, index, _index);
            Ti.App.Properties.setObject('tilesources', currentSources);
            self.updateZIndexes();
            // tileSource.zIndex = zIndex(_index)-1;
            // self.mapView.removeTileSource(tileSource);
            // self.mapView.addTileSource(tileSource, _index);
        },

        removeTileSource: function(_id) {
            sdebug('remove tilesource', _id);
            if (tileSourcesIndexed[_id]) {
                var tileSource = tileSourcesIndexed[_id];
                var index = currentSources.indexOf(_id);
                sdebug('remove tilesource index ', index);
                if (index >= 0) {
                    currentSources.splice(index, 1);
                    tileSources.splice(index, 1);
                    view.listView.deleteItemsAt(SOURCES_SECTION_INDEX, index, 1, {
                        animated: true
                    });
                    Ti.App.Properties.setObject('tilesources', currentSources);
                    Ti.App.Properties.removeProperty(_id + '_enabled');
                    Ti.App.Properties.removeProperty(_id + '_opacity');
                    Ti.App.Properties.removeProperty(_id + '_hd');
                }
                self.mapView.removeTileSource(tileSource);
                self.updateZIndexes();
            }
        },
        removeMBTiles: function(_id) {
            if (mbtiles[_id]) {
                self.removeTileSource(_id);
                Ti.Filesystem.getFile(app.getPath('mbtiles') + mbtiles[_id].file).deleteFile();
                delete mbtiles[_id];
                Ti.App.Properties.setObject('mbtiles', mbtiles);
            }
        },
        onWindowBack: function() {
            if (bottomControlsVisible) {
                hideBottomControls();
                return true;
            }
        },
    });
    _.assign(_additional.mapArgs, {
        tileSource: (_additional.mapArgs.tileSource || []).concat(tileSources),
        mapType: mapTypes[Ti.App.Properties.getString('maptype', 'normal')]
    });

    // tileSource1.clearCache();
    // tileSource2.clearCache();
    // tileSourceLandShading.clearCache();
    // 

    return self;
};