// import {ContentModule} from '../ui/mapModules/MapModule'
const stringScore = require('string-score');
const ContentModule = require('../ui/mapModules/MapModule').ContentModule;
exports.settings = {
    color: '#4C64A9',
    name: 'Facebook',
    description: 'fb_desc',
    preferencesSections: [{
        items: [{
            id: 'copyrights',
            type: 'link',
            url: 'https://www.facebook.com/help/249141925204375/'
        }]
    }]
};
exports.lang = {
    en: {
        "fb_desc": "Get infos from Facebook when getting details for a marker.",
    },
    fr: {
        "fb_desc": "Ajoute les informations de Refuges.info lors de la mise à jour d'un marqueur.",
    }
};

exports.create = function (_context, _args, _additional) {
    var phoneReg = /\s*(?:\+?(\d{1,3}))?([-. (]*(\d{2,3})[-. )]*)?((\d{2,3})[-. ]*(\d{2,4})(?:[-.x ]*(\d+))?)/g,
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = itemHandler.geolib.formatter,
        cleanUpString = app.api.cleanUpString,
        convert = app.utils.convert,
        self = new ContentModule(_args);

    function fbHoursToOSM(_hours) {
        var result = {};
        for (var key in _hours) {
            var keyArray = key.split('_');
            var dayId = _.capitalize(keyArray[0].slice(0, 2));
            var isOpen = keyArray[2] === 'open';
            if (isOpen) {
                result[dayId] = _hours[key];
            } else {
                result[dayId] += '-' + _hours[key];
            }
        }
        result = _.invert(result, true);
        _.mapValues(result, function (value) {
            return value.join(',');
        });
        return _.reduce(result, function (memo, value, key) {
            memo += value + ' ' + key + ';';
            return memo;
        }, '');
    }

    function parseObject(obj) {
        sdebug(obj);
        var result = {
            id: obj.id,
            fb: {
                id: obj.id,
            },
            tags: Object.assign({}, _.pick(obj, 'name')),
            latitude: obj.location.latitude,
            longitude: obj.location.longitude,
        };
        if (obj.about) {
            result.tags.description = obj.about;
        }
        if (obj.phone && obj.phone !== '<<not-applicable>>') {
            var match = obj.phone.match(phoneReg);
            if (match) {
                result.tags.phone = match[0].trim();
            }
        }
        if (obj.link) {
            result.tags.facebook = obj.link;
        }
        if (obj.hours) {
            var oh = fbHoursToOSM(obj.hours);
            result.tags.opening_hours = oh;
            //convert hours
        }
        var address = _.omit(obj.location, 'latitude',
            'longitude');
        if (_.size(address) > 0) {
            result.address = convert.osmAddress({
                address: address
            });
        }

        result.title = obj.name;
        if (obj.website && obj.website !== '<<not-applicable>>') {
            result.tags.website = obj.website;
        }
        if (obj.price_range) {
            result.tags.price = obj.price_range.match(/\$*/)[0].length;
        }

        // result.fb.hash = convert.hashCode(JSON.stringify(result));
        return result;
    }

    function getDetails(_id) {
        return app.api.call({
            url: 'https://graph.facebook.com/v2.4/' + _id,
            params: {
                access_token: app.servicesKeys.facebook,
                fields: 'hours,phone,name,location,cover,about,description,emails,food_styles,restaurant_services,restaurant_specialties,payment_options,link,price_range,website',
            }
        }).then(function (result) {
            if (result.location && result.location.latitude) {
                return parseObject(result);
            }
        });
    }

    function search(_params, _callback) {
        return app.api.call({
            url: 'https://graph.facebook.com/search',
            params: {
                access_token: app.servicesKeys.facebook,
                q: _params.query,
                fields: 'hours,phone,name,location,cover,about,description,emails,food_styles,restaurant_services,restaurant_specialties,payment_options,link,price_range,website',
                type: 'page',
                center: (_params.center.latitude + ',' + _params.center.longitude),
                distance: 20
            },
        }).then(function (result) {
            var data, item, items = [];
            if (result.data.length > 0) {
                var distance;
                result.data.forEach(function (data) {
                    if (data.location && data.location.latitude) {
                        var score = _params.query ? (stringScore(_params.query, data.name, 1)) : 1;
                        if (score > 0.5) {
                            item = parseObject(data);
                            if (item) {
                                items.push(item);
                            }
                        }

                    }
                });
            }
            return items;
        });
    }

    Object.assign(self, {
        GC: app.composeFunc(self.GC, function () {
            view = null;
        }),
        onInit: function () {

        },
        shouldBeEnabledByDefault: function () {
            return false;
        },
        // getSearchCalls: function(memo, _params) {
        //     memo['fb'] = function(res, chain) {
        //         search(_params, function(result) {
        //             if (result.error) {
        //                 chain.error(result);
        //             } else {
        //                 if (result.length > 0) {
        //                     res = res || {};
        //                     if (res.fb) {
        //                         res.fb.items = res.fb.items.concat(result);
        //                     } else {
        //                         res.fb = {
        //                             items: result
        //                         };
        //                     }
        //                 }
        //                 chain.next(res);
        //             }
        //         });
        //     };
        // },
        getDetailsCalls: function (memo, _query, _item, _desc) {
            if (_item.fb) {
                memo['fb'] = _.partial(getDetails, _item.fb.id);
                return;
            }
            var isRoute = itemHandler.isItemARoute(_item);
            if (!isRoute) {
                memo['fb'] = function () {
                    return search({
                        query: _query,
                        center: _.pick(_item, 'latitude', 'longitude')
                    }).then(function (result) {
                        if (result.length > 0) {
                            var data;
                            var bestScore = 0;
                            var bestI = -1;
                            for (var i = 0; i < result.length; i++) {
                                data = result[i];
                                var score = stringScore(_query, data.title);
                                distance = geolib.getDistanceSimple(_item, data);
                                var realScore = score / distance;
                                if (realScore > bestScore) {
                                    bestScore = realScore;
                                    bestI = i;
                                }

                            }
                            if (bestScore > 0.006) {
                                return result[bestI];
                            }
                        }
                    });
                };
            }
        },
        // onModuleAction: function(_params) {
        //     if (_params.id === 'fb') {

        //     } else {
        //         return false;
        //     }
        //     return true;
        // },

    });
    return self;
};