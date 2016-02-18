exports.settings = {
    color: '#BD732C',
    name: 'Refuges.info',
    description: 'ri_desc',
    preferencesSections: [{
        items: [{
            id: 'copyrights',
            type: 'link',
            subtitle: app.texts.ccopyright,
            url: 'http://www.refuges.info/wiki/licence'
        }]
    }]
};
exports.lang = {
    en: {
        "ri_desc": "Get infos from Refuges.info when getting details for a hut or peak.",
    },
    fr: {
        "ri_desc": "Ajoute les informations de Refuges.info lors de la mise à jour d'un refuge ou d'un sommet.",
    }
};

exports.create = function(_context, _args, _additional) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        // cleanUpString = app.api.cleanUpString,
        self = new _context.ContentModule(_args),
        key = 'ri',
        type = itemHandler.initializeType(key, {
            icon: app.icons.house,
            title: trc('refuges.info'),
            defaultTitle: trc('refuge'),
            color: '#BD732C',
            settings: {}
        }),
        riTags = {
            cheminee: 'fireplace',
            couvertures: 'blanket',
            latrines: 'toilets',
            bois: 'wood',
            eau: 'drinking_water',
            poele: 'stove'
        };

    function getDetails(_id, res, chain) {
        return app.api.call({
            url: 'http://www.refuges.info/api/point',
            params: {
                id: _id,
                detail: 'complet',
                nb_coms: 10,
                format_texte: 'html',
                format: 'geojson'
            },
            onSuccess: function(result, _options) {
                res = res || {};
                var data, item, items = [];
                if (result.features && result.features.length > 0) {
                    res = res || {};
                    for (var i = 0; i < result.features.length; i++) {
                        data = result.features[i];
                        if (data.geometry && data.geometry.coordinates) {
                            res.ri = parseObject(data);
                            break;
                        }
                    }
                }
                chain.next(res);
            },
            onError: chain.error
        });
    }

    function search(_params, _callback) {
        return app.api.call({
            url: 'http://www.refuges.info/api/bbox',
            params: {
                type_points: 'all',
                detail: 'complet',
                nb_points: 121,
                nb_coms: 10,
                format_texte: 'html',
                format: 'geojson',
                bbox: _params.region.sw.longitude + ',' + _params.region.sw.latitude + ',' +
                    _params.region.ne.longitude +
                    ',' + _params.region.ne.latitude
            },
            onSuccess: function(result, _options) {
                var data, item, items = [];
                if (result.features && result.features.length > 0) {
                    var i;
                    for (i = 0; i < result.features.length; i++) {
                        data = result.features[i];
                        if (data.geometry && data.geometry.coordinates) {
                            // var score = (_params.query && _params.query.score(data.properties.nom)) ||
                            // 1;

                            // if (score > 0.5) {
                            item = parseObject(data);
                            if (item) {
                                items.push(item);
                            }
                            // }
                        }
                    }
                }
                _callback(items);
            },
            onError: _callback
        });
    }

    function parseObject(obj) {
        sdebug(obj);
        var result = {
            refugeInfo: {
                id: obj.id
                    // object:_.omit(_obj, 'geometry')
            },
            title: obj.properties.nom,
            latitude: obj.geometry.coordinates[1],
            longitude: obj.geometry.coordinates[0],
            id: obj.id,
        };
        var props = obj.properties;

        _.each(['acces', 'remarque', 'proprio'], function(key) {
            var theObj = props[key];
            if (theObj && theObj.nom.length > 0 && theObj.valeur.length > 0) {
                result.notes = result.notes || [];
                result.notes.push({
                    title: theObj.nom,
                    text: theObj.valeur,
                });
            }
        });
        if (props.date) {
            result.refugeInfo.creationDate = moment(props.date.creation).valueOf();
            result.refugeInfo.modifDate = moment(props.date.derniere_modif).valueOf();
        }
        result.tags = result.tags || {};
        if (props.places) {
            result.tags.capacity = props.places.valeur;
        }

        // if (fb.remarque) {
        //     if ()
        //     result.tags.phone = fb.phone.match(phoneReg)[0].trim();
        // }
        if (props.createur) {
            result.refugeInfo.createurId = props.createur.id;
            result.refugeInfo.createurName = props.createur.nom;
        }
        if (props.coord.alt) {
            result.altitude = parseInt(props.coord.alt);
        }
        var details = props.info_comp;
        if (details.site_officiel) {
            result.tags.website = details.site_officiel.url;
        }

        _.each(riTags, function(value, key) {
            var theObj = details[key];
            if (theObj) {
                result.tags[value] = parseInt(theObj.valeur) === 1;
            }
        });
        result.photos = [];
        var photoPath = 'http://www.refuges.info';
        _.each(props.coms, function(com) {
            if (com.photo && com.photo.nb > 0) {
                var thePhoto = {
                    thumbnail: photoPath + com.photo.reduite,
                    // width: photo.width,
                    // height: photo.height,
                    url: photoPath + com.photo.originale,
                    attribution: {
                        logo: '/images/refuges_info.png',
                        description: com.texte,
                        date: moment(com.photo.date).valueOf()
                    }
                };
                if (com.createur.id !== 0) {
                    thePhoto.attribution.author = com.createur.nom;
                    thePhoto.attribution.author_id = com.createur.id;
                }
                result.photos.push(thePhoto);
            }
        });
        // result.ri.hash = convert.hashCode(JSON.stringify(result));
        return result;
    }

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            view = null;
        }),
        onInit: function() {

        },
        shouldBeEnabledByDefault: function() {
            return /fr|es|it|de|si|ch/i.test(app.localeInfo.currentCountry);
        },
        // getSearchFilters: function() {
        //     return {
        //         id: key,
        //         icon: type.icon,
        //         color: type.color,
        //         text: 'refuges.info',
        //     };
        // },
        getSearchCalls: function(memo, _params) {
            memo[key] = function(res, chain) {
                search(_params, function(result) {
                    if (result.error) {
                        chain.error(result);
                    } else {
                        if (result.length > 0) {
                            res = res || {};
                            if (res.ri) {
                                res.ri.items = res.ri.items.concat(result);
                            } else {
                                res.ri = {
                                    type: type,
                                    items: result
                                };
                            }
                        }
                        chain.next(res);
                    }
                });
            };
        },
        getDetailsCalls: function(memo, _query, _item, _desc) {
            if (_item.refugeInfo) {
                memo[key] = _.partial(getDetails, _item.refugeInfo.id);
                return;
            }
            var isRoute = itemHandler.isItemARoute(_item);
            if (!isRoute) {
                var region = geolib.getBoundsOfDistance(_item, 300);
                memo[key] = function(res, chain) {
                    search({
                        // query: _query,
                        region: region
                    }, function(result) {
                        if (result.error) {
                            chain.error(result);
                        } else {
                            if (result.length > 0) {
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
                                    sdebug('found refuge', data.title, distance, score,
                                        realScore);
                                }
                                if (bestScore > 0.01) {
                                    res.ri = result[bestI];
                                    sdebug(data, res.ri);
                                }
                            }
                            chain.next(res);
                        }

                    });
                };
            }
        },
        prepareDetailsListView: function(item, itemDesc, sections, createItem) {
            if (item.refugeInfo) {
                sdebug('test has refugeInfo');
                sections[0].items.push(createItem({
                    html: 'refuges.info' + '  ' + app.texts.ccopyright,
                    icon: app.icons.website,
                    callbackId: 'url',
                    data: {
                        url: 'http://www.refuges.info/point/' + item.refugeInfo
                            .id
                    },
                    isLink: true
                }));
            }
        }

    });
    return self;
};