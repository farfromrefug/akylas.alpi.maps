ak.ti.constructors.createTileSourceSelectWindow = function(_args) {
    var baseSources = _.remove(_args, 'baseSources'),
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

    function fillSections(_base) {
        var region = module.mapView.region;
        var realBase = {all:_base},
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
        return _.reduce(realBase, function(sections, section, sectionKey) {
            sections.push({
                // headerView: {
                //     type: 'Ti.UI.Label',
                //     properties: {
                //         width: 'FILL',
                //         height: 34,
                //         padding:{left:10},
                //         text: sectionKey,
                //         backgroundColor: 'lightgray',
                //         color: $white
                //     },
                //     childTemplates: [{
                //         type: 'Ti.UI.Label',
                //         properties: {
                //             right:5,
                //             font: {
                //                 family: $iconicfontfamily,
                //                 size: 20
                //             },
                //             height:'FILL',
                //             width:40,
                //             backgroundColor:'red',
                //             text: $sDown,
                //             color: $white
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
                items: _.reduce(section, function(items, value, key) {
                    var id = value.id;
                    var subtitle = ' ';
                    if (value.options) {
                        if (value.options.variantName) {
                            subtitle = value.options.variantName;
                        }
                        if (value.options.hasOwnProperty('maxZoom')) {
                            subtitle = (subtitle ? (subtitle + '\n') : '') + 'maxZoom: ' +
                                maxZoomToString(
                                    value.options.maxZoom);
                        }

                    }
                    if (!!value.options.devHidden && !app.developerMode) {
                        return items;
                    }
                    items.push({
                        searchableText: value.category + ',' + id,
                        title: {
                            text: value.name
                        },
                        subtitle: {
                            text: subtitle
                        },
                        sourceId: id,
                        imageView: {
                            image: 'http://raw.githubusercontent.com/farfromrefug/akylas.alpi.maps/master/images/tiles/' +
                                encodeURI(id) + '.png'
                        },
                        // mapView: {
                        //     region:region,
                        //     mapType:'none',
                        //     animateChanges:false,
                        //     touchEnabled:false,
                        //     tileSource:[_.defaults({
                        //         id:value.id,
                        //         tileSize:512,
                        //         url:value.url
                        //     }, value.options)]
                        // },
                        realAttribution: value.options.attribution,
                        attribution: {
                            text: value.category
                        }
                    });
                    return items;
                }, [])
            });
            return sections;
        }, []);

    }

    function createSearchListView(_title, _base, _isOverlay) {

        var sections = fillSections(_base);
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
        //     barColor:$cTheme.main,
        //     // backgroundImage:'toto',
        //     searchBarStyle: 2,
        //     color: $white,
        //     // tintColor: $cTheme.main,
        // });
        var result = new View({
            properties: {
                title: trc(_title),
                layout: 'vertical'
            },
            childTemplates: [{
                type: 'Ti.UI.CollectionView',
                bindId: 'listView',
                properties: {
                    rclass: 'TSSelectionListView',
                    scrollsToTop: !_isOverlay,
                    // searchViewExternal: searchView,
                    caseInsensitiveSearch: true,
                    // sectionIndexTitles:indexes,
                    templates: {
                        'default': app.templates.row.colTileSource
                    },
                    defaultItemTemplate: 'default',
                    sections: sections
                },
                events: {
                    longpress: function(e) {
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
                    singletap: app.debounce(function(e) {
                        if (e.link) {
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
            }]
        });

        return result;
    }
    // var searchText;
    var tabView = new AppTabView({
        nativeControls: true,
        tabsControllerClass: 'TSSelectionTabController',
        tabs: [createSearchListView('map_sources', baseSources),
            createSearchListView('map_overlaySources',
                overlaySources,
                true)
        ]
    }).on('change', function(e) {
        if (e.oldView) {
            e.oldView.applyProperties({
                listView: {
                    scrollsToTop: false,
                    // searchText: null
                }
            });
        }

        e.view.applyProperties({
            listView: {
                scrollsToTop: true,
                // searchText: searchText
            }
        });
    });
    var self = _args.window = new AppWindow({
        rclass: 'TileSourceSelectRealWindow',
        centerContainerView: tabView,
        topToolbar: {
            height: 30,
            layout: 'horizontal',
            childTemplates: [{
                type: 'Ti.UI.TextField',
                properties: {
                    borderRadius: 4,
                    backgroundColor: $cTheme.semi,
                    color: $white,
                    tintColor: $white,
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
                                family: $iconicfontfamily,
                                size: 18
                            },
                            color: $white,
                            width: 30,
                            height: 'FILL',
                            textAlign: 'center',
                            text: app.icons.search
                        }
                    }
                },
                events: {
                    change: function(e) {
                        var searchText = e.value;
                        _.each(tabView.getTabs(), function(_view) {
                            _view.applyProperties({
                                listView: {
                                    searchText: searchText
                                }
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
        },
        bottomToolbar: app.shouldShowAds() ? ak.ti.style({
            type: 'AkylasAdmob.View',
            properties: {
                rclass: 'AdmobView',
                // location: app.currentLocation
            },
            events: {
                load: function(e) {
                    self.showBottomToolbar();
                }
            }
        }) : undefined
    });
    var navWindow = new AppWindow(_args);

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        tabView = null;
        navWindow = null;
        self = null;
    });
    return navWindow;
};