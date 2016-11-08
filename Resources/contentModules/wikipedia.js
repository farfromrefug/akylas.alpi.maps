exports.settings = {
    color: '#ffffff',
    name: trc('wikipedia'),
    description: 'wikipedia_desc',
    preferencesSections: [{
        items: [{
            id: 'copyrights',
            type: 'link',
            subtitle: app.texts.ccopyright,
            url: 'https://en.wikipedia.org/wiki/Wikipedia:Copyrights'
        }]
    }]
};
exports.lang = {
    en: {
        "wikipedia_desc": "search and display Wikipedia geo points on the map.",
    },
    fr: {
        "wikipedia_desc": "cherche et affiche les points géographiques Wikipedia sur la carte",
    }
};

exports.create = function(_context, _args, _additional) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        htmlIcon = app.utilities.htmlIcon,
        cleanUpString = app.api.cleanUpString,
        key = 'wikipedia',
        self = new _context.ContentModule(_args);

    var lang = ak.locale.currentLanguage.split('-')[0].toLowerCase();
    var baseUrl = createBaseUrl(lang);

    function createBaseUrl(_lang) {
        return 'https://' + _lang + '.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&uselang=' +
            _lang;
    }

    var defaultParams = {
        prop: 'coordinates|pageterms|extracts|info',
        // prop: 'coordinates|pageimages|pageterms|extracts|info',
        colimit: 1,

        exintro: true,
        exsentences: 2,
        exlimit: 'max',
        // explaintext: true,
        inprop: 'url',

        // piprop: 'thumbnail|original',
        // pithumbsize: 1000,
        // pilimit: 'max',

        wbptterms: 'description',
    };

    function search(_params, _feature, _itemHandler) {
        var around = geolib.getAroundData(_params.region);
        return app.api.call({
            url: baseUrl,
            silent: _.remove(_params, 'silent'),
            params: _.assign(_.clone(defaultParams), {
                generator: 'geosearch',
                ggscoord: around.centerCoordinate.latitude + '|' + around.centerCoordinate.longitude,
                ggsradius: Math.min(around.radius, 10000),
                ggslimit: 50
            })
        }).then(function(result) {
            if (result.query) {
                return _.reduce(result.query.pages, function(memo, page) {
                    if (page.coordinates && page.coordinates[0].lat) {
                        memo.push(_itemHandler.createAnnotItem(type, parseObject(
                            page)));
                    }
                    return memo;
                }, []);
            }
        });
    }

    function geoSearch(_params, _feature, _itemHandler) {
        return search(_params, _feature, _itemHandler);
    }
    var type = itemHandler.initializeType(key, {
        icon: app.icons.wikipedia,
        title: trc('wikipedia'),
        defaultTitle: trc('wikipedia'),
        color: '#ffffff',
        textColor: 'black',
        apiMethod: geoSearch,
        iconSettings: {
            style: 0
        },
        settings: {
            geofeature: true,
        }
    });

    function getDetails(_item) {

        var url = baseUrl;
        var params = _.clone(defaultParams);
        if (_item.wpedia) {
            params.pageids = _item.wpedia.id;
            url = createBaseUrl(_item.wpedia.pagelanguage || 'en');
        } else {
            var id = _.last(_item.tags.wikipedia.split('/'));
            var test = id.split(':');
            if (test.length > 1) {
                url = createBaseUrl(test[0]);
                id = test[1];
            }
            params.titles = id;
        }
        return app.api.call({
            url: url,
            params: params,
        }).then(function(result) {
            var data, item, items = [];
            if (result.query && result.query.pages.length > 0) {
                for (var i = 0; i < result.query.pages.length; i++) {
                    data = result.query.pages[i];
                    if (data.coordinates && data.coordinates[0].lat) {
                        res = res || {};
                        return parseObject(data);
                    }
                }
            }
        });
    }

    function getProp(obj, key) {
        var result = obj[key];
        if (result) {
            return result;
        }
    }

    function parseObject(_obj) {
        var props = _obj;
        var id = props.pageid;
        var result = {
            wpedia: {
                id: id,
                pagelanguage: props.pagelanguage,
                object: _.omit(props, 'touched', 'lastrevid', 'length', 'ns')
            },
            id: id,
            title: props.title,
            latitude: props.coordinates[0].lat,
            longitude: props.coordinates[0].lon,
            tags: {
                wikipedia: props.fullurl
            }
        };
        // if (props.thumbnail) {
        //     var url = props.thumbnail.source;
        //     result.photos = [{
        //         url: url,
        //         width: props.thumbnail.width,
        //         height: props.thumbnail.height,
        //         image: url
        //     }];
        // }
        if (props.extract) {
            result.description = props.extract;
        } else if (props.terms && props.terms.description) {
            result.description = props.terms.description[0];
        }
        return result;
    }

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            view = null;
        }),
        onInit: function() {
            // _.assign(app.icons, icons);

        },
        // getSearchFilters: function() {
        //     return {
        //         id: key,
        //         icon: type.icon,
        //         color: type.textColor,
        //         text: key,
        //     };
        // },
        getDetailsCalls: function(memo, _query, _item, _desc) {
            if (_item.wpedia || (_item.tags && _item.tags.wikipedia)) {
                memo[key] = _.partial(getDetails, _item);
                return;
            }
            var isRoute = itemHandler.isItemARoute(_item);
            if (!isRoute) {
                var region = geolib.getBoundsOfDistance(_item, 300);
                memo[key] = function() {
                    return search({
                        // query: _query,
                        region: region
                    }, type, itemHandler).then(function(result) {
                        if (result && result.length > 0) {
                            var data;
                            var bestScore = 0;
                            var bestI = -1;
                            for (var i = 0; i < result.length; i++) {
                                data = result[i];
                                distance = geolib.getDistanceSimple(_item, data);
                                var score = _query.score(data.title, 1);
                                var realScore = score / distance;
                                if (realScore > bestScore) {
                                    bestScore = realScore;
                                    bestI = i;
                                }
                                sdebug('found wikipedia', data.title, distance, score,
                                    realScore);
                            }
                            if (bestScore > 0.01) {
                                return result[bestI];
                            }
                        }
                    });
                };
            }
        },
        // getSearchCalls: function(memo, _params) {
        // memo[key] = _.partial(search, _params);
        // },
        // getDetailsCalls: function(memo, _query, _item, _desc) {
        // if (_item.c2c) {
        //     memo[key] = _.partial(getDetails, _item);
        // }
        // },
        getGeoFeatures: function(memo) {
            memo[key] = type;
        },
        getItemTypes: function(memo) {
            memo[key] = type;
        },
    });
    return self;
};