// import {ContentModule} from '../ui/mapModules/MapModule'
const stringScore = require('string-score');
const ContentModule = require('../ui/mapModules/MapModule').ContentModule;
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

function typeToRiType(type) {
    switch (type) {
        case 'water':
            return 23;
            break;
    }
}

exports.create = function(_context, _args, _additional) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        // cleanUpString = app.api.cleanUpString,
        self = new ContentModule(_args),
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

    function getDetails(_id) {
        return app.api.call({
            url: 'http://www.refuges.info/api/point',
            params: {
                id: _id,
                detail: 'complet',
                nb_coms: 10,
                format_texte: 'html',
                format: 'geojson'
            }
        }).then(function(result, _options) {
            var data, item, items = [];
            if (result.features && result.features.length > 0) {
                for (var i = 0; i < result.features.length; i++) {
                    data = result.features[i];
                    if (data.geometry && data.geometry.coordinates) {
                        return parseObject(data);
                    }
                }
            }
        });
    }

    function search(_params) {
        return app.api.call({
            url: 'http://www.refuges.info/api/bbox',
            params: {
                type_points: _params.type || 'all',
                detail: 'complet',
                nb_points: 121,
                nb_coms: 10,
                format_texte: 'html',
                format: 'geojson',
                bbox: _params.region.sw.longitude + ',' + _params.region.sw.latitude + ',' +
                    _params.region.ne.longitude +
                    ',' + _params.region.ne.latitude
            }
        }).then(function(result, _options) {
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
            return items;
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

        ['acces', 'remarque', 'proprio'].forEach(function(key) {
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

        for (let key in riTags) {
            var theObj = details[key];
            if (theObj) {
                result.tags[riTags[key]] = parseInt(theObj.valeur) === 1;
            }
        }
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

    Object.assign(self, {
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
            memo[key] = function() {
                return search(_params).then(function(result) {
                    if (result.length > 0) {
                        return {
                            type: type,
                            items: result
                        };
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
                memo[key] = function() {
                    return search({
                        type:typeToRiType(_desc.id),
                        // query: _query,
                        region: region
                    }).then(function(result) {
                        if (result.length > 0) {
                            var data;
                            var bestScore = 0;
                            var bestI = -1;
                            for (var i = 0; i < result.length; i++) {
                                data = result[i];
                                distance = geolib.getDistanceSimple(_item, data);
                                var score = stringScore(_query, data.title, 1);
                                var realScore = score / distance;
                                if (realScore > bestScore) {
                                    bestScore = realScore;
                                    bestI = i;
                                }
                                sdebug('found refuge', data.title, distance, score,
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
        prepareDetailsListView: function(item, itemDesc, sections, createItem) {
            if (item.refugeInfo) {
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
        },
        getMarkersForRegion: function(_type, region, itemHandler) {
            var type = typeToRiType(_type.id);
            if (!type) {
                return Promise.resolve();
            }
            return app.api.call({
                url: 'http://www.refuges.info/api/bbox',
                params: {
                    type_points: type,
                    detail: 'complet',
                    nb_points: 200,
                    nb_coms: 10,
                    format_texte: 'html',
                    format: 'geojson',
                    bbox: region.sw.longitude + ',' + region.sw.latitude + ',' +
                        region.ne.longitude +
                        ',' + region.ne.latitude
                }
            }).then(function(result) {
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
                                items.push(itemHandler.createAnnotItem(_type, item));
                            }
                            // }
                        }
                    }
                }
                return items;
            });
        }

    });
    return self;
};