export function create(_args: WindowParams & {
    module: TileSourceManager,
    baseSources: { [k: string]: Provider }
    overlaySources: { [k: string]: Provider }
}) {
    var baseSources = _.remove(_args, 'baseSources'),
        queryString = app.utilities.queryString,
        module = _.remove(_args, 'module'),
        overlaySources = _.remove(_args, 'overlaySources');

    function maxZoomToString(_zoom) {
        var result;
        if (_zoom <= 4) {
            result = 'country';
        } else if (_zoom <= 8) {
            result = 'state';
        } else if (_zoom <= 10) {
            result = 'region';
        } else if (_zoom <= 11) {
            result = 'county';
        } else if (_zoom <= 12) {
            result = 'suburb';
        } else if (_zoom <= 14) {
            result = 'city';
        } else if (_zoom <= 18) {
            result = 'neighborhood';
        } else {
            result = 'street';
        }
        return trc(result);
    }

    function fillSections(_base: { [k: string]: Provider }) {
        var region = module.mapView.region;
        var realBase = {
            all: _base
        },
            category, categories, i;

        //first create categories
        // _.each(_base, function(value, key) {
        //     categories = (value.category || 'world').split(',');
        //     for (i = 0; i < categories.length; i++) {
        //         category = categories[i];
        //         realBase[category] = realBase[category] || {};
        //         realBase[category][key] = value;
        //     }
        // });
        return _.reduce(realBase, function (sections, section, sectionKey) {
            sections.push({
                // headerView: {
                //     type: 'Ti.UI.Label',
                //     properties: {
                //         width: 'FILL',
                //         height: 34,
                //         padding:{left:10},
                //         text: sectionKey,
                //         backgroundColor: 'lightgray',
                //         color: $.white
                //     },
                //     childTemplates: [{
                //         type: 'Ti.UI.Label',
                //         properties: {
                //             right:5,
                //             font: {
                //                 family: $.iconicfontfamily,
                //                 size: 20
                //             },
                //             height:'FILL',
                //             width:40,
                //             backgroundColor:'red',
                //             text: $.sDown,
                //             color: $.white
                //         }
                //     }],
                //     events:{
                //         click:function(e) {
                //             sdebug(e);
                //             e.section.visible = !e.section.visible;
                //         }
                //     }
                // },
                // visible: false,
                // showHeaderWhenHidden: true,
                items: _.reduce(section, function (items, value, key) {

                    var isMbTiles = value.hasOwnProperty('file');
                    var mbtiles: MBTilesProvider;
                    if (isMbTiles) {
                        mbtiles = value as MBTilesProvider;
                        value = mbtiles.layer;
                        sdebug('mbtiles', mbtiles);
                    }
                    var id = value.id;

                    var subtitle = ' ';
                    if (value.options) {
                        if (value.options.variantName) {
                            subtitle = value.options.variantName;
                        }
                        if (!isMbTiles && value.options.hasOwnProperty('maxZoom')) {
                            subtitle = (subtitle ? (subtitle + '\n') : '') + 'maxZoom: ' +
                                maxZoomToString(
                                    value.options.maxZoom);
                        }
                        if (!!value.options.devHidden && !app.developerMode) {
                            return items;
                        }
                    }

                    var item = {
                        searchableText: value.category + ',' + id,
                        title: {
                            text: value.name
                        },
                        subtitle: {
                            text: subtitle
                        },

                        mapView: {
                            region:region,
                            minZoom:value.options.minZoom,
                            maxZoom:value.options.maxZoom,
                            tileSource:[_.defaults({
                                id:value.id,
                                tileSize:512,
                                url:value.url
                            }, value.options)]
                        },
                        realAttribution: value.options && value.options.attribution,
                    };
                    if (mbtiles) {
                        var imageUrl;
                        if (mbtiles.bounds) {
                            var layers:any = [{
                                url: value.url && value.url.replace(/&/g, '%26'),
                                subdomains: value.options && value.options.subdomains,
                                headers: (value.options && value.options.userAgent && {
                                    'User-Agent': value.options
                                        .userAgent
                                })
                            }];

                            if (value.options && (!!value.options.isOverlay ||
                                (value.options.opacity && value.options
                                    .opacity < 1))) {
                                layers.unshift({
                                    url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                });
                            }
                            imageUrl = queryString({
                                layers: layers,
                                width: 500,
                                height: 500,
                                bounds: mbtiles.bounds,
                            }, app.api.osAPIURL + 'staticmap');

                        } else {
                            imageUrl =
                                'http://raw.githubusercontent.com/farfromrefug/akylas.alpi.maps/master/images/tiles/' +
                                encodeURI(id) + '.png'
                        }
                        sdebug('image url', imageUrl);
                        Object.assign(item, {
                            sourceId: mbtiles.token || mbtiles.id,
                            delete: {
                                visible: true
                            },
                            attribution: {
                                text: module.mbTilesSubTitle(mbtiles, true)
                            },
                            imageView: {
                                image: imageUrl
                            },
                            subtitle: {
                                text: item.subtitle.text + '\n' + module.mbTilesTitle(mbtiles)
                            }
                        });
                    } else {
                        Object.assign(item, {
                            sourceId: id,
                            imageView: {
                                image: 'http://raw.githubusercontent.com/farfromrefug/akylas.alpi.maps/master/images/tiles/' +
                                encodeURI(id) + '.png'
                            },
                            attribution: {
                                text: value.category
                            }
                        });

                    }

                    items.push(item);
                    return items;
                }, [])
            });
            return sections;
        }, []);

    }

    function createSearchListView(_title: string, _base: { [k: string]: Provider }, _isOverlay = false) {

        // var sections = fillSections(_base);
        // var index = 0;
        // _.each(letters, function(letter) {
        //     var newIndex = _.findIndex(items, function(item) {
        //         return (item.searchableText.charAt(0).toLowerCase() === letter);
        //     });
        //     if (newIndex >= 0) {
        //         index = newIndex;
        //     }
        //     indexes.push({
        //         title: letter.toUpperCase(),
        //         index: index
        //     });
        // });
        // var searchView = new SearchBar({
        //     showCancel: true,
        //     barColor:$.cTheme.main,
        //     // backgroundImage:'toto',
        //     searchBarStyle: 2,
        //     color: $.white,
        //     // tintColor: $.cTheme.main,
        // });
        var result = new CollectionView({
            // properties: {
            // title: trc(_title),
            //     layout: 'vertical'
            // },
            // childTemplates: [{
            type: 'Ti.UI.CollectionView',
            bindId: 'listView',
            properties: {
                title: trc(_title),
                rclass: 'TSSelectionListView',
                scrollsToTop: !_isOverlay,
                // searchViewExternal: searchView,
                caseInsensitiveSearch: true,
                // sectionIndexTitles:indexes,
                templates: {
                    'default': app.templates.row.colTileSource2
                },
                defaultItemTemplate: 'default',
                // sections: fillSections(_base)
            },
            events: {
                longpress: function (e) {
                    if (!e.item) {
                        return;
                    }
                    sdebug(e.item, e.source);
                    app.showViewFullScreen(
                        new View(
                            app.templates.row.cloneTemplateAndFill(
                                'colTileSource', _.merge(e.item, {
                                    properties: {
                                        height: '60%',
                                    },
                                    imageView: {
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        height: '60%',
                                        touchPassThrough: true
                                    },
                                    title: {
                                        font: {
                                            size: 17
                                        }
                                    },
                                    subtitle: {
                                        font: {
                                            size: 15
                                        }
                                    },
                                    attribution: {
                                        html: e.item.realAttribution,
                                        font: {
                                            size: 13
                                        }
                                    }
                                }))), e.source
                    );
                },
                singletap: app.debounce(function (e) {
                    if (e.bindId === 'delete') {
                        app.confirmAction({
                            'title': trc('are_you_sure'),
                            'message': trc('delete_mbtiles_confirm'),
                            buttonNames: [trc('no'), trc('yes')]
                        }, function () {
                            module.removeMBTiles(e.item.sourceId);
                            e.section.deleteItemsAt(e.itemIndex, 1, {
                                animated: true
                            });
                        });
                    } else if (e.link) {
                        self.manager.createAndOpenWindow('WebWindow', {
                            url: e.link,
                            title: e.item.title.text
                        });
                    } else if (e.item) {
                        module.addTileSource(e.item.sourceId);
                        navWindow.closeMe();
                    }
                })
            }
            // }]
        });
        result.loadList = function() {
            result.sections = fillSections(_base);
        }

        return result;
    }

    var mbTiles = Ti.App.Properties.getObject('mbtiles', {});
    console.log('saved mbtiles file', mbTiles);
    // var docPath = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
    // var docs = docPath.getDirectoryListing().filter(function (s) {
    //     return s.endsWith('.mbtiles')
    // })
    // docs.forEach(function (item) {
    //     console.log('handling mbtiles file', item, mbTiles[item]);
    //     mbTiles[item] = {
    //         id: item,
    //         layer:{
    //             token:item,
    //             name: item.split('.').slice(-1).join(''),
    //         },
    //         file: Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, item).nativePath
    //     }
    //     console.log('handling mbtiles file1', item, mbTiles[item]);
    // })
    // var searchText;
    var tabView = new AppTabView({
        // nativeControls: true,
        tabsControllerClass: 'TSSelectionTabController',
        tabs: [createSearchListView('map_sources', baseSources),
        createSearchListView('map_overlaySources', overlaySources, true),
        createSearchListView('offline_maps', mbTiles, true),
        ]
    }).on('change', function (e) {
        if (!!e.firstLoad && e.currentPage !== 0) {
            e.view.loadList();
        }
        if (e.oldView) {
            e.oldView.applyProperties({
                // listView: {
                scrollsToTop: false,
                // searchText: null
                // }
            });
        }

        e.view.applyProperties({
            // listView: {
            scrollsToTop: true,
            // searchText: searchText
            // }
        });
    });

    var self = _args.window = new AppWindow({
        rclass: 'TileSourceSelectRealWindow',
        centerContainerView: tabView,
        rightNavButtons: __ANDROID__ ? [{
            icon: '\ue103',
            callback: function () {
                Ti.Filesystem.requestStoragePermissions(function () {
                    Ti.Android.currentActivity.startActivityForResult({
                        action: Ti.Android.ACTION_GET_CONTENT,
                        category: Ti.Android.CATEGORY_OPENABLE,
                        type: "*/*"
                    }, function (e) {
                        console.log(e);
                    });
                })

            }
        }] : null,
        topToolbar: {
            height: 30,
            layout: 'horizontal',
            childTemplates: [{
                type: 'Ti.UI.TextField',
                properties: {
                    borderRadius: 4,
                    backgroundColor: $.cTheme.semi,
                    color: $.white,
                    tintColor: $.white,
                    width: 'FILL',
                    left: 20,
                    height: 'FILL',
                    clearButtonMode: Ti.UI.INPUT_BUTTONMODE_ALWAYS,
                    returnKeyType: Ti.UI.RETURNKEY_DONE,
                    // top:5,
                    // bottom:5,
                    right: 20,
                    leftButton: {
                        type: 'Ti.UI.Label',
                        properties: {
                            font: {
                                family: $.iconicfontfamily,
                                size: 18
                            },
                            color: $.white,
                            width: 30,
                            height: 'FILL',
                            textAlign: 'center',
                            text: app.icons.search
                        }
                    }
                },
                events: {
                    change: function (e) {
                        var searchText = e.value;
                        tabView.getTabs().forEach(function (_view) {
                            _view.applyProperties({
                                // listView: {
                                searchText: searchText
                                // }
                            });
                        });
                    }
                }
                // }, {
                //     type: 'Ti.UI.Button',
                //     properties: {
                //         title: trc('clear'),
                //         right: 8
                //     }
            }]
        }
    });
    var navWindow = new AppWindow(_args);

    self.once('open', function(){
        // setTimeout(function(){
            tabView.getTab(0).loadList();
        // }, 100);
        
    })

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        tabView = null;
        navWindow = null;
        self = null;
    });
    return navWindow;
};