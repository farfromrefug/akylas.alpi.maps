exports.settings = {
    color: '#FFAB4F',
    name: 'CampToCamp',
    description: 'c2c_desc',
    preferencesSections: [{
        items: [{
            id: 'copyrights',
            type: 'link',
            subtitle: app.texts.ccopyright,
            url: 'http://www.camptocamp.org/articles/106728/fr/licence-des-contenus'
        }]
    }]
};
exports.lang = {
    en: {
        "c2c": "CampToCamp",
        "c2c_desc": "allows you to search for itineraries around any marker or through the search module.",
        "c2c_around": "c2c around",
        "c2c_itineraries": "CampToCamp itineraries",
    },
    fr: {
        "c2c": "CampToCamp",
        "c2c_desc": "cherchez des itinéraires autour de n'importe quel marqueur ou depuis le module de recherche.",
        "c2c_around": "c2c autour",
        "c2c_itineraries": "itinéraires CampToCamp",
    }
};
exports.create = function(_context, _args, _additional) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        htmlIcon = app.utilities.htmlIcon,
        cleanUpString = app.api.cleanUpString,
        self = new _context.ContentModule(_args),
        baseUrl = 'http://www.camptocamp.org/routes/list/',
        type = itemHandler.initializeType('c2c', {
            icon: '\ue800',
            title: trc('c2c_itineraries'),
            defaultTitle: trc('itinerary'),
            color: '#FFAB4F',
            // apiMethod: function(_params, _feature, _itemHandler, _callback) {
            //     sdebug('c2c apiMethod', _params);
            //     _callback({});
            // },
            settings: {}
        }),
        icons = {
            hiking: String.fromCharCode(0xe801),
            skitouring: String.fromCharCode(0xe827),
            snowshoeing: String.fromCharCode(0xe80f),
            mountain_climbing: String.fromCharCode(0xe80e),
            rock_climbing: String.fromCharCode(0xe826),
            snow_ice_mixed: String.fromCharCode(0xe828),
            paragliding: String.fromCharCode(0xe825),
            ice_climbing: String.fromCharCode(0xe802),
        };

    function get_html_translation_table(table, quote_style) {
        //  discuss at: http://phpjs.org/functions/get_html_translation_table/
        // original by: Philip Peterson
        //  revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // bugfixed by: noname
        // bugfixed by: Alex
        // bugfixed by: Marco
        // bugfixed by: madipta
        // bugfixed by: Brett Zamir (http://brett-zamir.me)
        // bugfixed by: T.Wild
        // improved by: KELAN
        // improved by: Brett Zamir (http://brett-zamir.me)
        //    input by: Frank Forte
        //    input by: Ratheous
        //        note: It has been decided that we're not going to add global
        //        note: dependencies to php.js, meaning the constants are not
        //        note: real constants, but strings instead. Integers are also supported if someone
        //        note: chooses to create the constants themselves.
        //   example 1: get_html_translation_table('HTML_SPECIALCHARS');
        //   returns 1: {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}

        var entities = {},
            hash_map = {},
            decimal;
        var constMappingTable = {},
            constMappingQuoteStyle = {};
        var useTable = {},
            useQuoteStyle = {};

        // Translate arguments
        constMappingTable[0] = 'HTML_SPECIALCHARS';
        constMappingTable[1] = 'HTML_ENTITIES';
        constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
        constMappingQuoteStyle[2] = 'ENT_COMPAT';
        constMappingQuoteStyle[3] = 'ENT_QUOTES';

        useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
        useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() :
            'ENT_COMPAT';

        if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
            throw new Error('Table: ' + useTable + ' not supported');
            // return false;
        }

        entities['38'] = '&amp;';
        if (useTable === 'HTML_ENTITIES') {
            entities['160'] = '&nbsp;';
            entities['161'] = '&iexcl;';
            entities['162'] = '&cent;';
            entities['163'] = '&pound;';
            entities['164'] = '&curren;';
            entities['165'] = '&yen;';
            entities['166'] = '&brvbar;';
            entities['167'] = '&sect;';
            entities['168'] = '&uml;';
            entities['169'] = '&copy;';
            entities['170'] = '&ordf;';
            entities['171'] = '&laquo;';
            entities['172'] = '&not;';
            entities['173'] = '&shy;';
            entities['174'] = '&reg;';
            entities['175'] = '&macr;';
            entities['176'] = '&deg;';
            entities['177'] = '&plusmn;';
            entities['178'] = '&sup2;';
            entities['179'] = '&sup3;';
            entities['180'] = '&acute;';
            entities['181'] = '&micro;';
            entities['182'] = '&para;';
            entities['183'] = '&middot;';
            entities['184'] = '&cedil;';
            entities['185'] = '&sup1;';
            entities['186'] = '&ordm;';
            entities['187'] = '&raquo;';
            entities['188'] = '&frac14;';
            entities['189'] = '&frac12;';
            entities['190'] = '&frac34;';
            entities['191'] = '&iquest;';
            entities['192'] = '&Agrave;';
            entities['193'] = '&Aacute;';
            entities['194'] = '&Acirc;';
            entities['195'] = '&Atilde;';
            entities['196'] = '&Auml;';
            entities['197'] = '&Aring;';
            entities['198'] = '&AElig;';
            entities['199'] = '&Ccedil;';
            entities['200'] = '&Egrave;';
            entities['201'] = '&Eacute;';
            entities['202'] = '&Ecirc;';
            entities['203'] = '&Euml;';
            entities['204'] = '&Igrave;';
            entities['205'] = '&Iacute;';
            entities['206'] = '&Icirc;';
            entities['207'] = '&Iuml;';
            entities['208'] = '&ETH;';
            entities['209'] = '&Ntilde;';
            entities['210'] = '&Ograve;';
            entities['211'] = '&Oacute;';
            entities['212'] = '&Ocirc;';
            entities['213'] = '&Otilde;';
            entities['214'] = '&Ouml;';
            entities['215'] = '&times;';
            entities['216'] = '&Oslash;';
            entities['217'] = '&Ugrave;';
            entities['218'] = '&Uacute;';
            entities['219'] = '&Ucirc;';
            entities['220'] = '&Uuml;';
            entities['221'] = '&Yacute;';
            entities['222'] = '&THORN;';
            entities['223'] = '&szlig;';
            entities['224'] = '&agrave;';
            entities['225'] = '&aacute;';
            entities['226'] = '&acirc;';
            entities['227'] = '&atilde;';
            entities['228'] = '&auml;';
            entities['229'] = '&aring;';
            entities['230'] = '&aelig;';
            entities['231'] = '&ccedil;';
            entities['232'] = '&egrave;';
            entities['233'] = '&eacute;';
            entities['234'] = '&ecirc;';
            entities['235'] = '&euml;';
            entities['236'] = '&igrave;';
            entities['237'] = '&iacute;';
            entities['238'] = '&icirc;';
            entities['239'] = '&iuml;';
            entities['240'] = '&eth;';
            entities['241'] = '&ntilde;';
            entities['242'] = '&ograve;';
            entities['243'] = '&oacute;';
            entities['244'] = '&ocirc;';
            entities['245'] = '&otilde;';
            entities['246'] = '&ouml;';
            entities['247'] = '&divide;';
            entities['248'] = '&oslash;';
            entities['249'] = '&ugrave;';
            entities['250'] = '&uacute;';
            entities['251'] = '&ucirc;';
            entities['252'] = '&uuml;';
            entities['253'] = '&yacute;';
            entities['254'] = '&thorn;';
            entities['255'] = '&yuml;';
        }

        if (useQuoteStyle !== 'ENT_NOQUOTES') {
            entities['34'] = '&quot;';
        }
        if (useQuoteStyle === 'ENT_QUOTES') {
            entities['39'] = '&#39;';
        }
        entities['60'] = '&lt;';
        entities['62'] = '&gt;';

        // ascii decimals to real symbols
        for (decimal in entities) {
            if (entities.hasOwnProperty(decimal)) {
                hash_map[String.fromCharCode(decimal)] = entities[decimal];
            }
        }

        return hash_map;
    }

    function html_entity_decode(string, quote_style) {
        //  discuss at: http://phpjs.org/functions/html_entity_decode/
        // original by: john (http://www.jd-tech.net)
        //    input by: ger
        //    input by: Ratheous
        //    input by: Nick Kolosov (http://sammy.ru)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: marc andreu
        //  revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        //  revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // bugfixed by: Onno Marsman
        // bugfixed by: Brett Zamir (http://brett-zamir.me)
        // bugfixed by: Fox
        //  depends on: get_html_translation_table
        //   example 1: html_entity_decode('Kevin &amp; van Zonneveld');
        //   returns 1: 'Kevin & van Zonneveld'
        //   example 2: html_entity_decode('&amp;lt;');
        //   returns 2: '&lt;'

        var hash_map = {},
            symbol = '',
            tmp_str = '',
            entity = '';
        tmp_str = string.toString();

        if (false === (hash_map = get_html_translation_table('HTML_ENTITIES', quote_style))) {
            return false;
        }

        // fix &amp; problem
        // http://phpjs.org/functions/get_html_translation_table:416#comment_97660
        delete(hash_map['&']);
        hash_map['&'] = '&amp;';

        for (symbol in hash_map) {
            entity = hash_map[symbol];
            tmp_str = tmp_str.split(entity)
                .join(symbol);
        }
        tmp_str = tmp_str.split('&#039;')
            .join("'");

        return tmp_str;
    }

    function getProp(obj, key) {
        var result = obj[key];
        if (result) {
            return result;
        }
    }

    function parseObject(_obj) {
        var coordinates = _obj.geometry && _obj.geometry.coordinates;
        if (!coordinates || _obj.geometry.type === 'MultiLineString') {
            return;
        }
        var last;
        var points = _.reduce(coordinates, function(memo, coord) {
            coord.reverse();
            if (last && _.isEqual(last, coord)) {
                return memo;
            }
            memo.push(coord);
            last = coord;
            return memo;
        }, []);
        var props = _obj.properties;
        var region = geolib.getBounds(points);
        var notes;
        var result = {
            c2c: {
                id: _obj.id,
                url: props.url,
                creator: props.creator,
                object: _.omit(_obj, 'geometry', 'metadata')
            },
            id: _obj.id,
            timestamp: moment(props.date).valueOf(),
            tags: {
                maxEle: getProp(props, 'maxElevation'),
                minEle: getProp(props, 'minElevation'),
                dplus: getProp(props, 'heightDiffUp'),
                dmin: getProp(props, 'heightDiffDown'),
                ratings: getProp(props, 'routesRating'),
                activities: getProp(props, 'activities')
            },
            description: getProp(props, 'outingRouteDesc'),
            title: html_entity_decode(getProp(props, 'name')),
            start: points[0],
            startOnRoute: true,
            endOnRoute: true,
            end: _.last(points),
            route: {
                distance: geolib.getPathLength(points),
                region: {
                    ne: {
                        latitude: region.maxLat,
                        longitude: region.maxLng,
                    },
                    sw: {
                        latitude: region.minLat,
                        longitude: region.minLng,
                    }
                },
                points: points
            }
        };
        _.each(['description', 'avalanceDesc', 'gear', 'weather', 'conditions', 'outingComments', 'hutComments',
            'remarks'
        ], function(key) {
            var theObj = props[key];
            if (theObj) {
                result.notes = result.notes || [];
                result.notes.push({
                    title: trc(key),
                    text: theObj
                });
            }
        });
        // result.c2c.hash = convert.hashCode(JSON.stringify(result));
        return result;
    }

    function getC2CResultsFromPage(_url, res) {
        res = res || {
            type:type,
            items:[]
        };
        return app.api.call({
            url: _url,
            // onSuccess: function(result, _options) {
            //     if (result.features && result.features.length > 0) {
            //         var items = _.mapIfDefined(result.features, parseObject);
            //         if (items.length > 0) {
            //             res = res || {};
            //             if (res.c2c) {
            //                 res.c2c.items = res.c2c.items.concat(items);
            //             } else {
            //                 res.c2c = {
            //                     type: type,
            //                     items: items
            //                 };
            //             }

            //         }
            //     }
            //     if (result.metadata.nextPage) {
            //         getC2CResultsFromPage(result.metadata.nextPage, res, chain);
            //     } else {
            //         chain.next(res);
            //     }
            // },

            // onError: chain.error
        }).then(function(result) {
            if (result.features && result.features.length > 0) {
                var items = _.mapIfDefined(result.features, parseObject);
                if (items.length > 0) {
                    res.items = res.c2c.items.concat(items);
                }
            }
            if (result.metadata.nextPage) {
                return getC2CResultsFromPage(result.metadata.nextPage, res);
            } else {
                return res;
            }
        });
    }

    function search(_params) {
        var url = baseUrl + 'onam/' + encodeURIComponent(_params.query) +
            '/act/1-7-6-8-5-2-3-4/geom/yes/npp/100/format/json-track-full-html';
        return getC2CResultsFromPage(url);
    }

    function getDetails(_item) {
        var url = baseUrl + 'id/' + _item.c2c.id +
            '/geom/yes/format/json-track-full-html';
        var id = _item.c2c && _item.c2c.id;
        return getC2CResultsFromPage(url).then(function(result) {
            if (result && result.items.length > 0) {
                return result.c2c.items[0];
            }
        });
    }

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            view = null;
        }),
        onInit: function() {
            _.assign(app.icons, icons);

        },
        getSearchFilters: function() {
            return {
                id: 'c2c',
                icon: type.icon,
                color: type.color,
                text: 'c2c',
            };
        },

        shouldBeEnabledByDefault: function() {
            return /fr|es|it|de|si|ch/i.test(app.localeInfo.currentCountry.toLowerCase());
        },
        getSearchCalls: function(memo, _params) {
            memo['c2c'] = _.partial(search, _params);
        },
        getDetailsCalls: function(memo, _query, _item, _desc) {
            // var isRoute = itemHandler.isItemARoute(_item);
            if (_item.c2c) {
                memo['c2c'] = _.partial(getDetails, _item);
            }
            // if (_item.c2c) {
            //     return;
            // }
            // var isRoute = itemHandler.isItemARoute(_item);
            // if (!isRoute) {
            //     var region = geolib.getBoundsOfDistance(_item, 300);
            //     memo['c2c'] = function(res, chain) {
            //         search({
            //             query: _query,
            //             region: region
            //         }, function(result) {
            //             if (result.error) {
            //                 chain.error(result);
            //             } else {
            //                 if (result.length > 0) {
            //                     var data;
            //                     for (var i = 0; i < result.length; i++) {
            //                         data = result[i];
            //                         distance = geolib.getDistanceSimple(_item, data);
            //                         if (distance <= 20) {
            //                             res = res || {};
            //                             res.ri = data;
            //                             break;
            //                         }
            //                     }
            //                 }
            //                 chain.next(res);
            //             }

            //         });
            //     };
            // }
        },
        // getGeoFeatures: function(memo) {
        //     memo['c2c'] = type;
        // },
        getItemTypes: function(memo) {
            memo['c2c'] = type;
        },
        prepareDetailsListView: function(item, itemDesc, sections, createItem, colors, iconicColor) {
            if (item.c2c) {
                sections[0].items.push(createItem({
                    html: 'Camp2Camp' + '  ' + app.texts.ccopyright,
                    icon: app.icons.website,
                    callbackId: 'url',
                    data: {
                        url: item.c2c.url
                    },
                    isLink: true
                }));

                var obj = item.c2c.object.properties;
                if (obj.linkedParkings && obj.linkedParkings.length > 0) {
                    sections.push({
                        headerView: ak.ti.style({
                            type: 'Ti.UI.Label',
                            properties: {
                                rclass: 'SectionHeaderLabel',
                                backgroundColor: colors.color,
                                color: colors.contrast,
                                html: htmlIcon(type.icon, 1) + ' Camp2Camp'
                            }
                        }),
                        items: _.reduce(obj.linkedParkings, function(items, value) {
                            items.push(createItem({
                                text: value.name,
                                icon: app.icons.parking,
                                callbackId: 'url',
                                data: {
                                    url: value.url
                                }
                            }));
                            return items;
                        }, [])
                    });
                    // sections.push({
                    //     headerTitle: trc('parkings'),
                    //     items: _.reduce(obj.linkedParkings, function(memo, value) {

                    //         return memo;
                    //     }, [])
                    // });
                }

            }
        },
        actionsForItem: function(_item, _desc, _onMap, result) {
            // sdebug('actionsForItem', _onMap, result);
            if (_onMap) {
                result.splice(result.length - 1, 0, ['c2c_around', {
                    icon: type.icon,
                    color: type.color,
                }]);
            }
        },
        onModuleAction: function(_params) {
            if (_params.command === 'c2c_around') {
                self.window.manager.closeToRootWindow();
                var loc = geolib.coords(_params.item.start || _params.item);
                // sdebug('loc', loc);
                var url = baseUrl + 'sarnd/' + loc.longitude + ',' + loc.latitude +
                    ',2000/geom/yes/npp/100/format/json-track-full-html';

                var module = self.parent.getModule('Search');
                var request = getC2CResultsFromPage(url).then(module.showSearchResults).then(self.window.hideLoading)
                self.window.showLoading({
                    request: request,
                    label: {
                        text: trc('searching') + '...'
                    }
                });
                return true;
            }
        },
    });
    return self;
};