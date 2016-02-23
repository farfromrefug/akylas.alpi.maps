exports.settings = {
    color: '#00659B',
    name: trc('wikivoyage'),
    description: 'wikivoyage_desc',
    preferencesSections: [{
        items: [{
            id: 'copyrights',
            type: 'link',
            subtitle: app.texts.ccopyright,
            url: 'https://en.wikivoyage.org/wiki/Wikivoyage:Copyleft'
        }]
    }]
};
exports.lang = {
    en: {
        "wikivoyage_desc": "search and display wikivoyage geo points on the map.",
    },
    fr: {
        "wikivoyage_desc": "cherche et affiche les points géographiques wikivoyage sur la carte",
    }
};

exports.create = function(_context, _args, _additional) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        htmlIcon = app.utilities.htmlIcon,
        cleanUpString = app.api.cleanUpString,
        key = 'wikivoyage',
        supportedLangs = ['en', 'fr', 'de', 'fa', 'it', 'nl', 'pl', 'sv']
    self = new _context.ContentModule(_args);

    var lang = ak.locale.currentLanguage.split('-')[0].toLowerCase();
    if (!_.contains(supportedLangs, lang)) {
        lang = supportedLangs[0];
    }
    var baseUrl = createBaseUrl(lang);

    function createBaseUrl(_lang) {
        return 'https://' + _lang + '.wikivoyage.org/w/api.php?action=query&format=json&formatversion=2&uselang=' +
            _lang;
    }

    var defaultParams = {
        // prop: 'coordinates|pageimages|pageterms|extracts|info',
        prop: 'info',
        // colimit: 1,

        // exintro: true,
        // exsentences: 2,
        // exlimit: 'max',
        // explaintext: true,
        inprop: 'url',

        // piprop: 'thumbnail|original',
        // pithumbsize: 1000,
        // pilimit: 'max',

        // wbptterms: 'description',
    };

    function geoSearch(_params, _feature, _itemHandler, _callback) {
        var around = geolib.getAroundData(_params.region);
        return app.api.call({
            url: baseUrl,
            silent: _.remove(_params, 'silent'),
            params: _.assign(defaultParams, {
                generator: 'geosearch',
                ggscoord: around.centerCoordinate.latitude + '|' + around.centerCoordinate.longitude,
                ggsradius: Math.min(around.radius, 10000),
                ggslimit: 50
            }),

            onSuccess: function(result) {
                sdebug('result', result);
                _callback({
                    result: result.query && _.reduce(result.query.pages, function(memo, page) {
                        if (page.coordinates && page.coordinates[0].lat) {
                            memo.push(_itemHandler.createAnnotItem(type, parseObject(
                                page)));
                        }
                        return memo;
                    }, [])
                });
            },
            onError: _callback
        });
    }
    var type = itemHandler.initializeType(key, {
        icon: app.icons.wikipedia,
        title: trc('wikivoyage'),
        defaultTitle: trc('wikivoyage'),
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

    function getDetails(_item, res, chain) {

        var url = baseUrl;
        var params = _.clone(defaultParams);
        if (_item.wvoyage) {
            params.pageids = _item.wvoyage.id;
            url = createBaseUrl(_item.wvoyage.pagelanguage || 'en');
        } else if (_item.tag && _item.tags.wikivoyage) {
            var id = _.last(_item.tags.wikivoyage.split('/'));
            var test = id.split(':');
            if (test.length > 1) {
                url = createBaseUrl(test[0]);
                id = test[1];
            }
            params.titles = id;
        } else if (_item.title) {
            params.titles = _item.title.split(/-|\/|\||_\|,/)[0].trim();
        } else {
            return;
        }
        return app.api.call({
            url: url,
            params: params,
            onSuccess: function(result, _options) {
                sdebug('wvoyage', result);
                var data, item, items = [];
                if (result.query && result.query.pages.length > 0) {
                    for (var i = 0; i < result.query.pages.length; i++) {
                        data = result.query.pages[i];
                        if (data.missing !== true) {
                            res = res || {};
                            res.wvoyage = parseObject(data);
                            break;
                        }
                        // if (data.coordinates && data.coordinates[0].lat) {

                        // }
                    }
                }
                chain.next(res);
            },
            onError: chain.error
        });
    }

    function getProp(obj, key) {
        var result = obj[key];
        if (result) {
            return result;
        }
    }

    function parseObject(_obj) {
        sdebug('wikivoyage', 'parseObject', _obj);
        var props = _obj;
        var id = props.pageid;
        var result = {
            wvoyage: {
                id: id,
                pagelanguage: props.pagelanguage,
                object: _.omit(props, 'touched', 'lastrevid', 'length', 'ns')
            },
            id: id,
            title: props.title,
            // latitude: props.coordinates[0].lat,
            // longitude: props.coordinates[0].lon,
            tags: {
                wikivoyage: props.fullurl
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
        // if (props.extract) {
        //     result.description = props.extract;
        // } else if (props.terms && props.terms.description) {
        //     result.description = props.terms.description[0];
        // }
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
            memo[key] = _.partial(getDetails, _item);
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
            // memo[key] = type;
        },
        getItemTypes: function(memo) {
            // memo[key] = type;
        },
        prepareDetailsListView: function(item, itemDesc, sections, createItem) {
            if (item.wvoyage) {
                sections[0].items.push(createItem({
                    text: trc('wikivoyage'),
                    icon: app.icons.wikipedia,
                    callbackId: 'url',
                    data: {
                        url: item.tags.wikivoyage
                    },
                    isLink: true
                }));
            }
        }
    });
    return self;
};