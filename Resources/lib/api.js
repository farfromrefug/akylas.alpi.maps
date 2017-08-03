class PrivateHTTPPromise extends Promise {
    constructor(executor) {
        super(executor);
    }
    abort() {
        if (this.request) {
            this.request.abort();
        }
    }
}

function createApi(_context) {
    var context = _context;
    var convert = app.utils.convert;
    var geolib = app.utils.geolib;
    var queryString = app.utilities.queryString;
    var contactEmail = 'contact%40akylas.fr';
    var osAPIURL = 'http://api-alpimaps.rhcloud.com/';
    // var osAPIURL = 'http://localhost:8080/';
    var osmOverpassUrls = [
        // 'http://api.openstreetmap.fr/oapi/',
        'http://overpass-api.de/api/',
        // 'http://overpass.osm.rambler.ru/cgi/'
    ];
    var index = 0;

    var cleanUpString = function (s) {
        return _.deburr(s).toLowerCase().replace(/^(the|le|la|el)\s/, '').trim();
    };

    function overpassAPIURL() {
        index = (index + 1) % osmOverpassUrls.length;
        return osmOverpassUrls[index];
    }

    function getType(thing) {
        if (thing === null) return '[object Null]'; // special case
        return Object.prototype.toString.call(thing);
    }

    function formatGoogleAddress(_object) {
        return {
            display_name: _object.formatted_address,
            address: _.mapKeys(_.reduce(_object.address_components, function (memo, value) {
                memo[value.types[0]] = value.long_name;
                return memo;
            }, {}), {
                route: 'road',
                postal_code: 'postcode',
                locality: 'city'
            })
        };
    }

    function mapzenDecodeLine(str, precision) {
        var index = 0,
            lat = 0,
            lng = 0,
            coordinates = [],
            shift = 0,
            result = 0,
            byte = null,
            latitude_change,
            longitude_change,
            factor = Math.pow(10, precision || 6);

        // Coordinates have variable length when encoded, so just keep
        // track of whether we've hit the end of the string. In each
        // loop iteration, a single coordinate is decoded.
        while (index < str.length) {

            // Reset shift, result, and byte
            byte = null;
            shift = 0;
            result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            shift = result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            lat += latitude_change;
            lng += longitude_change;

            coordinates.push([lat / factor, lng / factor]);
        }

        return coordinates;
    };

    function graphhoperDecodeLine(encoded, is3D) {
        var len = encoded.length;
        var index = 0;
        var array = [];
        var lat = 0;
        var lng = 0;
        var ele = 0;

        while (index < len) {
            var b;
            var shift = 0;
            var result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += deltaLat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var deltaLon = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += deltaLon;

            if (is3D) {
                // elevation
                shift = 0;
                result = 0;
                do {
                    b = encoded.charCodeAt(index++) - 63;
                    result |= (b & 0x1f) << shift;
                    shift += 5;
                } while (b >= 0x20);
                var deltaEle = ((result & 1) ? ~(result >> 1) : (result >> 1));
                ele += deltaEle;
                array.push([lat * 1e-5, lng * 1e-5, ele / 100]);
            } else
                array.push([lat * 1e-5, lng * 1e-5]);
        }
        // var end = new Date().getTime();
        // console.log("decoded " + len + " coordinates in " + ((end - start) / 1000) + "s");
        return array;
    }

    function decodeLine(encoded) {
        var len = encoded.length;
        var index = 0;
        var array = [];
        var lat = 0;
        var lng = 0;

        while (index < len) {
            var b;
            var shift = 0;
            var result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            array.push([Math.round(lat) * 1e-5, Math.round(lng) * 1e-5]);
        }

        return array;
    }

    // function encode(coordinate, factor) {
    //     coordinate = Math.round(coordinate * factor);
    //     coordinate <<= 1;
    //     if (coordinate < 0) {
    //         coordinate = ~coordinate;
    //     }
    //     var output = '';
    //     while (coordinate >= 0x20) {
    //         output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
    //         coordinate >>= 5;
    //     }
    //     output += String.fromCharCode(coordinate + 63);
    //     return output;
    // }

    var degrees2meters = function (lon, lat) {
        var x = lon * 20037508.34 / 180;
        var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return [x, y];
    };

    function latlongToString(_point) {
        if (_.isArray(_point) && _point.length == 2) {
            return _point[0].toFixed(4) + ',' + _point[1].toFixed(4);
        } else if (_point.hasOwnProperty('latitude')) {
            return _point.latitude.toFixed(4) + ',' + _point.longitude.toFixed(4);
        }
    }

    function regionToString(_region) {
        if (_.isArray(_region) && _region.length == 4) {
            return 'bbox:' + _region[0].toFixed(4) + ',' + _region[1].toFixed(4) + ',' + _region[2].toFixed(
                4) + ',' + _region[3].toFixed(4);
        } else if (_region.hasOwnProperty('ne')) {
            return 'bbox:' + latlongToString(_region.sw) + ',' + latlongToString(_region.ne);
        }
    }

    function radiusToString(_point, _radius) {
        var result = 'around:' + _radius + ',';
        if (_.isArray(_point) && _point.length == 2) {
            result += _point[0].toFixed(4) + ',' + _point[1].toFixed(4);
        } else if (_point.hasOwnProperty('latitude')) {
            result += _point.latitude.toFixed(4) + ',' + _point.longitude.toFixed(4);
        }
        return result;
    }

    //mapquest algos
    function decompress(encoded, precision) {
        precision = Math.pow(10, -precision);
        var len = encoded.length,
            index = 0,
            lat = 0,
            lng = 0,
            array = [];
        while (index < len) {
            var b, shift = 0,
                result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            array.push([lat * precision, lng * precision]);
        }
        return array;
    }

    function compress(points, precision) {
        var oldLat = 0,
            oldLng = 0,
            len = points.length,
            index = 0;
        var encoded = '';
        precision = Math.pow(10, precision);
        while (index < len) {
            var pt = points[index++];
            //  Round to N decimal places
            var lat = Math.round(pt[0] * precision);
            var lng = Math.round(pt[1] * precision);

            //  Encode the differences between the points
            encoded += encodeNumber(lat - oldLat);
            encoded += encodeNumber(lng - oldLng);

            oldLat = lat;
            oldLng = lng;
        }
        return encoded;
    }
    var mapQuestDirections = ['none', 'n', 'nw', 'ne', 's', 'se', 'sw', 'w', 'e'];
    //mapquest algos
    //

    function encodeNumber(num) {
        num = num << 1;
        if (num < 0) {
            num = ~(num);
        }
        var encoded = '';
        while (num >= 0x20) {
            encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
            num >>= 5;
        }
        encoded += String.fromCharCode(num + 63);
        return encoded;
    }

    function parallelRequests(_calls) {
        var requests = [];
        var theR = Promise.all(_calls.map(function (c) {
            var r = c();
            requests.push(r);
            return r;
        }));
        var abort = function () {
            requests.forEach(function (r) {
                r.abort();
            });
        };
        theR.abort = abort;

        function newThen(p) {
            var oldThen = p.then;
            return function (resolve, reject) {
                var result = oldThen.call(p, resolve, reject);
                result.abort = abort;
                result.then = newThen(result);
                return result;
            };
        }
        theR.then = newThen(theR);
        return theR;
    }

    function parallelMapRequests(_calls) {
        var keys = [];
        return parallelRequests(_.reduce(_calls, function (memo, f, key) {
            keys.push(key);
            memo.push(f);
            return memo;
        }, [])).then(function (results) {
            var res = {};
            var result;
            for (var i = results.length - 1; i >= 0; i--) {
                result = results[i];
                if (result) {
                    res[keys[i]] = result;
                }
            }
            return res;
        });
    }

    var api = new _context.EventEmitter({
        osAPIURL: osAPIURL,
        networkConnected: false,
        offlineMode: false,
        cleanUpString: cleanUpString,
        parallelRequests: parallelRequests,
        parallelMapRequests: parallelMapRequests,
        call: function (options) {
            var client;
            var promise = new PrivateHTTPPromise((resolve, reject) => {
                if (this.networkConnected === false) {
                    return onError('no_network_connection', reject, options);
                    // return Promise.reject('no_network_connection');
                }
                if (this.offlineMode === true) {
                    options.silent = true;
                    return onError('offline_mode', reject, options);
                    // return;
                }
                var params = JSON.parse(JSON.stringify(options.params || {}));
                client = new HTTPClient({
                    showActivity: options.showActivity,
                    headers: options.headers,
                    timeout: options.hasOwnProperty('timeout') ? options.timeout : 30000,
                    ondatastream: options.ondatastream,
                    onload: function (e) {
                        if (!!options.forData) {
                            resolve(this.responseData);
                        } else {
                            onSuccess(this, e, resolve, reject, options);
                        }
                    },
                    onerror: function (e) {
                        var returnText = this.responseText;
                        if (returnText) {
                            var jsonResponse;
                            try {
                                jsonResponse = JSON.parse(returnText);
                            } catch (e) {}
                            // returnText = JSON.parse(returnText);
                            if (jsonResponse && jsonResponse.error) {
                                e.error = jsonResponse.error.text || jsonResponse.error;
                            } else {
                                e.error = returnText;
                            }
                        }
                        onError(e, reject, options);
                    }
                });
                // var postMethod = options.requestMethod === "POST" || options.requestMethod === "PUT";
                var requestUrl = options.url;
                if (!requestUrl) {
                    requestUrl = this.apiUrl + options.method;
                }
                requestUrl = queryString(params, requestUrl);
                console.debug(requestUrl);
                var dataToSend;
                if (options.postParams) {
                    dataToSend = options.postParams;
                } else if (options.postParamsString) {
                    //if i want to send JSON i need to make it a string
                    dataToSend = JSON.stringify(options.postParamsString);
                }
                console.debug('dataToSend', dataToSend);
                client.open(options.requestMethod || "GET", requestUrl);
                client.send(dataToSend);
                return client;
            });
            promise.request = client;
            return promise;
        },
        updateNetwork: function (e) {
            console.log(e);
            var type = Titanium.Network.networkType;
            var newConnected = (type === Ti.Network.NETWORK_MOBILE || type === Ti.Network.NETWORK_WIFI);

            console.log('updateNetwork', type, api.networkConnected, newConnected);
            if (newConnected != api.networkConnected) {
                sdebug('updateNetwork', newConnected);
                api.networkConnected = newConnected;
                api.emit('networkchange', {
                    connected: api.networkConnected
                });
            }
        },
        queryImages: function (_query) {
            var params = Object.assign({
                api_key: app.servicesKeys.flickr,
                format: 'json',
                // tag_mode: 'AND',
                content_type: 1,
                sort: 'relevance',
                per_page: 10,
                page: 0,
                nojsoncallback: 1,
                method: 'flickr.photos.search'

            }, _query);
            return api.call({
                url: 'https://api.flickr.com/services/rest/',
                silent: _params.silent,
                params: params
            }).then(function (_result) {
                return _result.photos.photo;
            });
        },
        queryGeoFeatures: function (_query, _region, _feature, _itemHandler) {
            var data = '';
            if (_region) {
                data += '[' + regionToString(_region) + ']';
            }
            data += '[out:json];(' + _.reduce(_query, function (result, value, index) { //array
                var type = value.type;
                result += type;
                if (value.hasOwnProperty('options')) {
                    var options = _.reduce(value.options, function (result2, value2, key2) {
                        result2 += '(' + key2 + ':' + value2 + ')';
                        return result2;
                    }, '');
                    result += options;
                }
                if (value.hasOwnProperty('features')) {
                    result += value.features;
                }
                // if (value.region) {
                //     var region = regionToString(value.region);
                //     result += region;
                // }
                if (value.recurse) {
                    result += ';' + value.recurse;
                }
                return result + ';';
            }, '');

            data += ');out ' + (_feature.outType || 'center qt') + ' 200;';
            sdebug('data', data);
            return api.call({
                url: overpassAPIURL() + 'interpreter',
                params: {
                    data: escape(data),
                    contact: contactEmail
                }
            }).then(function (result) {
                sdebug('result', result);
                var results;
                if (_feature.usingWays) {
                    var nodes = _.groupBy(_.filter(result.elements, 'type', 'node'), 'id');
                    // var nodes = _.filter(result.elements, 'type', 'node');
                    var ways = _.filter(result.elements, 'type', 'way');
                    var resultingWays = _.indexBy(ways, 'id');
                    sdebug('ways', resultingWays);
                    var canMerge = function (way1, way2) {
                        if (way1.id === way2.id) {
                            return false;
                        }
                        var keys = _.uniq(_.keys(way1.tags).concat(_.keys(way2.tags)));
                        for (var i = 0; i < keys.length; i++) {
                            var key = keys[i];
                            if (way1[key] && way2[key] && way1[key] !== way2[key]) {
                                return false;
                            }
                        }
                        return true;
                    };
                    // sdebug('nodes', nodes);
                    var wayId, comparing, start2, end2;
                    for (var i = 0; i < ways.length; i++) {
                        var current = ways[i];
                        var start = current.nodes[0];
                        var end = _.last(current.nodes);
                        for (wayId in resultingWays) {
                            comparing = resultingWays[wayId];
                            if (!comparing || !canMerge(comparing, current)) {
                                continue;
                            }
                            start2 = comparing.nodes[0];
                            end2 = _.last(comparing.nodes);

                            if (start2 === end) {
                                comparing.nodes = current.nodes.slice(0, -1).concat(
                                    comparing.nodes);
                                comparing.geometry = current.geometry.slice(0, -1).concat(
                                    comparing.geometry);
                                delete resultingWays[current.id + ''];
                                _.defaultsDeep(comparing.tags, current.tags);
                                break;
                            } else if (end2 === start) {
                                comparing.nodes = comparing.nodes.concat(
                                    current.nodes.slice(1));
                                comparing.geometry = comparing.geometry.concat(
                                    current.geometry.slice(1));
                                delete resultingWays[current.id + ''];
                                _.defaultsDeep(comparing.tags, current.tags);
                                break;
                            }
                        }
                    }
                    results = _.mapIfDefined(resultingWays, function (way, key) {
                        var item = convert.prepareOSMWay(way, nodes,
                            geolib);
                        if (item) {
                            return _itemHandler.createRouteItem(
                                _feature, item);
                        }
                    });

                } else {
                    results = _.mapIfDefined(result.elements, function (ele) {
                        if (_feature.filterFunc && !_feature.filterFunc(
                                ele)) {
                            return;
                        }
                        if (ele.lat || ele.center) {
                            var item = convert.prepareOSMObject(ele,
                                false,
                                false);
                            if (item) {
                                return _itemHandler.createAnnotItem(
                                    _feature, item);
                            }

                        }
                    });
                }

                return results;

            });
        },
        addressAutocomplete: function (_query) {
            var lang = ak.locale.currentLanguage;
            return api.call({
                url: 'https://maps.googleapis.com/maps/api/place/autocomplete/json',
                silent: _params.silent,
                params: {
                    key: app.servicesKeys.google,
                    input: _query,
                    language: lang,
                    components: 'country:' + lang
                }
            });
        },
        reverseGeocode: function (_query) {
            //http://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=en&latlng=35.699,139.707
            return api.call({
                url: 'http://open.mapquestapi.com/nominatim/v1/reverse.php',
                silent: _query.silent,
                params: {
                    key: app.servicesKeys.mapquest,
                    lat: _query.latitude,
                    lon: _query.longitude,
                    zoom: _query.zoom,
                    format: 'json',
                    addressdetails: 1
                }
            }).then(function (e) {
                if (e.error) {
                    onError(e.error, function (err) {
                        throw err;
                    });
                } else if (!e.display_name) {
                    onError('no_result_found', function (err) {
                        throw err;
                    });
                }
                return convert.osmAddress(e);
            });
        },

        queryGoogleDirections: function (_args) {
            const lang = _args.lang.split('-')[0];
            return api.call({
                url: 'https://maps.googleapis.com/maps/api/directions/json',
                silent: _args.silent,
                params: {
                    // key: app.servicesKeys.google,
                    units: geolib.metrics ? 'metric' : 'imperial',
                    mode: _args.mode,
                    origin: _args.origin.join(','),
                    destination: _args.destination.join(','),
                    waypoints: _.reduce(_args.waypoints, function (memo, value) {
                        memo.push(value.join(','));
                        return memo;
                    }, []).join('|'),
                    language: lang,
                    region: lang
                }
            }).then(function (result) {
                console.log(result);
                if (result.routes.length === 0) {
                    onError('no_route_found', function (err) {
                        throw err;
                    });
                    return;
                }

                var arrPush = Array.prototype.push;
                var points = [];
                var stepPoints;
                var route = result.routes[0];
                var distance = 0;
                var duration = 0;
                _.each(route.legs, function (leg) {
                    distance += leg.distance.value;
                    duration += leg.duration.value;
                    _.each(leg.steps, function (step) {
                        stepPoints = decodeLine(step.polyline.points);
                        // step.pointsStartIndex = points.length;
                        // step.pointsCount = stepPoints.length;
                        // fullPolyline.push(step.polyline.points);
                        arrPush.apply(points, stepPoints);
                        // delete step.polyline;
                    });
                });
                var bounds = route.bounds;
                return {
                    // googleRoute: JSON.stringify(result.routes),
                    distance: distance,
                    duration: duration * 1000,
                    region: {
                        ne: [bounds.northeast.lat, bounds.northeast.lng],
                        sw: [bounds.southwest.lat, bounds.southwest.lng]
                    },
                    // encoded:true,
                    // overview_points:route.overview_polyline.points,
                    points: points
                };
            });
        },
        queryMapzenDirections: function (_args) {
            return api.call({
                url: 'https://valhalla.mapzen.com/route',
                silent: _args.silent,
                params: {
                    api_key: app.servicesKeys.mapzen,
                    json: {
                        locations: _.reduce(_args.waypoints, function (memo, value) {
                            memo.push({
                                lat: value[0],
                                lon: value[1]
                            });
                            return memo;
                        }, [{
                            lat: _args.origin[0],
                            lon: _args.origin[1]
                        }]).concat([{
                            lat: _args.destination[0],
                            lon: _args.destination[1]
                        }]),
                        costing: (function (mode) {
                            switch (mode) {
                                case 'walking':
                                    return 'pedestrian'
                                case 'bicycling':
                                    return 'bicycle'
                                case 'driving':
                                    return 'auto'
                            }
                        })(_args.mode),
                        directions_options: {
                            units: geolib.metrics ? 'km' : 'mi',
                            language: _args.lang
                        }
                    }
                }
            }).then(function (result) {
                console.log(result);
                if (!result.trip || result.trip.legs.length === 0) {
                    onError('no_route_found', function (err) {
                        throw err;
                    });
                    return;
                }

                var arrPush = Array.prototype.push;
                var points = [];
                var stepPoints;
                var route = result.trip;
                // var distance = 0;
                // var duration = 0;
                _.each(route.legs, function (leg) {
                    // distance += leg.summary.length;
                    // duration += leg.summary.time;
                    // _.each(leg.maneuvers, function (step) {
                    stepPoints = mapzenDecodeLine(leg.shape);
                    // step.pointsStartIndex = points.length;
                    // step.pointsCount = stepPoints.length;
                    // fullPolyline.push(step.polyline.points);
                    arrPush.apply(points, stepPoints);
                    // delete step.polyline;
                    // });
                });
                var summary = route.summary;
                return {
                    // googleRoute: JSON.stringify(result.routes),
                    distance: summary.length * (geolib.metrics ? 1000 : 1609.34),
                    duration: summary.time * 1000, //s
                    region: {
                        ne: [summary.max_lat, summary.max_lon],
                        sw: [summary.min_lat, summary.min_lon]
                    },
                    // encoded:true,
                    // overview_points:route.overview_polyline.points,
                    points: points
                };
            });
        },
        queryGraphhopperDirections: function (_args) {
            const lang = _args.lang.split('-')[0];
            return api.call({
                url: 'https://graphhopper.com/api/1/route',
                silent: _args.silent,
                params: [
                    ['key', app.servicesKeys.graphhopper],
                    ['vehicle', (function (mode) {
                        switch (mode) {
                            case 'walking':
                                return 'foot'
                            case 'bicycling':
                                return 'bike'
                            case 'driving':
                                return 'car'
                        }
                    })(_args.mode)],
                    ['locale', lang]
                ].concat(_.reduce(_args.waypoints, function (memo, value) {
                    memo.push(['point', value.join(',')]);
                    return memo;
                }, [
                    ['point', _args.origin.join(',')]
                ]).concat([
                    ['point', _args.destination.join(',')]
                ]))
            }).then(function (result) {
                console.log(result);
                if (!result.paths || result.paths.length === 0) {
                    onError('no_route_found', function (err) {
                        throw err;
                    });
                    return;
                }

                var route = result.paths[0];
                return {
                    distance: route.distance,
                    duration: route.time,
                    region: {
                        ne: [route.bbox[3], route.bbox[2]],
                        sw: [route.bbox[1], route.bbox[0]]
                    },
                    points: graphhoperDecodeLine(route.points)
                };
            });
        },
        queryDirections: function (_args) {
            var service = Ti.App.Properties.getString('directions.service', 'google');
            switch (service) {
                case 'mapzen':
                    return api.queryMapzenDirections(_args);
                case 'graphhopper':
                    return api.queryGraphhopperDirections(_args);
                default:
                    return api.queryGoogleDirections(_args);

            }
        },
        osmDetails: function (_args) {
            if (!_args.osm) {
                return Promise.resolve();
            }
            sdebug('osmDetails', _args);
            var type = _args.osm.type;
            var data = '[out:json];{1}({2});out {3};'.assign(type, _args.osm.id, (type === 'relation') ?
                'geom' : 'center');
            return api.call({
                url: overpassAPIURL() + 'interpreter',
                silent: _args.silent,
                params: {
                    data: escape(data)

                }
            }).then(function (result) {
                if (result.elements && result.elements.length === 0) {
                    return convert.prepareOSMObject(result.elements[0], true, true);
                }
            });
        },
        osmAddress: function (_args) {
            sdebug('osmAddress', _args);
            if (!_args.osm) {
                return Promise.reject(trc('no_result_found'));
            }
            return api.call({
                url: 'http://nominatim.openstreetmap.org/lookup',
                silent: _args.silent,
                params: {
                    osm_ids: _args.osm.type.slice(0, 1).toUpperCase() + _args.osm.id,
                    format: 'json',
                    addressdetails: 1,
                    extratags: 1,
                    email: contactEmail
                }
            }).then(function (result) {
                if (result.length > 0) {
                    return convert.osmAddress(result[0]);
                }
            });
        },
        searchOSM: function (_params) {
            var region;
            if (_params.region) {
                region = _params.region;
            } else if (_params.centerCoordinate) {
                region = geolib.getBoundsOfDistance(_params.centerCoordinate, _params.radius ||
                    2000);
            }
            var query = _params.query;
            if (query.address) {
                query = app.getAddressSearchTermOSM(query);
            }
            return api.call({
                url: 'http://nominatim.openstreetmap.org/search',
                silent: _params.silent,
                params: {
                    limit: _params.maxResults,
                    q: query,
                    format: 'json',
                    viewbox: region ? (region.sw.longitude + ',' + region.ne.latitude + ',' +
                        region.ne.longitude + ',' + region.sw.latitude) : undefined,
                    bounded: region ? 1 : 0,
                    addressdetails: 1,
                    extratags: 1,
                    email: contactEmail
                }
            }).then(function (result) {
                console.log('on search', result);
                if (result.length > 0) {
                    result = _.mapIfDefined(result, convert.prepareNominatimResult);
                    result = _.uniq(result, function (value) {
                        if (value.osm.class === 'highway') {
                            return value.title;
                        } else {
                            return value.osm.id;
                        }
                    });
                    return {
                        items: result
                    }
                }
            });
        },
        //search around algo
        searchOSM2: function (_params) {
            var query = _.isString(_params.query) ? '["name"="{query}"]'.assign(_params) : '["name"]';
            var center = _params.centerCoordinate;
            var region = '';
            if (center) {
                region = '(' + radiusToString(center, _params.radius || 2000) + ')';
            }
            var data = '';
            if (_params.region) {
                data += '[' + regionToString(_params.region) + ']';
            }
            data += '[out:json];(' +
                'node{1}{2};' +
                'way{1}{2};' +
                'rel{1}{2};' +
                ');' +
                'out center tags 30;';
            data = data.assign(query, region);

            return api.call({
                url: overpassAPIURL() + 'interpreter',
                params: {
                    data: escape(data),
                    contact: contactEmail
                },
                silent: _params.silent
            }).then(function (result) {
                sdebug(result.elements);
                // if (!result.elements || result.elements.length === 0) {
                //     _callback();
                // } else {
                var results = _.mapIfDefined(result.elements, function (value) {
                    var tags = value.tags;
                    if (/stop|platform/.test(tags.railway) ||
                        tags.highway || tags.area || tags.waterway ||
                        (value.type === 'relation' && (!tags.building && tags.type !==
                            'multipolygon'))) {
                        return;
                    }
                    var result = convert.prepareOSMObject(value);
                    if (result && center) {
                        result.distance = geolib.getDistanceSimple(result, center);
                    }
                    return result;
                });
                return _.orderBy(results, 'distance');
                // }
            });
        },
        queryTraffic: function (_bbox) {
            var bbox = [_bbox.ne[0], _bbox.sw[1], _bbox.sw[0], _bbox.ne[1]];
            return api.call({
                url: 'http://www.mapquestapi.com/traffic/v2/incidents',
                params: {
                    key: app.servicesKeys.mapquest,
                    // outFormat:'json',
                    inFormat: 'kvp',
                    boundingBox: bbox.join(','),
                    rand: Math.random()
                }
            });
        },
        queryPanoramas: function (_params, _feature, _itemHandler) {
            var region = _.remove(_params, 'region');
            return api.call({
                url: 'http://www.panoramio.com/map/get_panoramas.php',
                silent: _.remove(_params, 'silent'),
                params: Object.assign({
                    set: 'public',
                    from: 0,
                    to: Ti.App.Properties.getInt('panoramio.max', 50),
                    size: 'original',
                    mapfilter: true,
                    minx: region.sw.longitude,
                    miny: region.sw.latitude,
                    maxx: region.ne.longitude,
                    maxy: region.ne.latitude,
                }, _params)
            }).then(function (result) {
                return _.map(result.photos, function (photo) {
                    var thumbnail =
                        'http://mw2.google.com/mw-panoramio/photos/thumbnail/' +
                        photo.photo_id + '.jpg';
                    var original = photo.photo_file_url;
                    var item = Object.assign(_itemHandler.createAnnotItem(
                        _feature,
                        photo, photo.photo_id), {
                        title: photo.photo_title,
                        thumbnail: thumbnail,
                        photos: [{
                            thumbnail: thumbnail,
                            width: photo.width,
                            height: photo.height,
                            image: original,
                            attribution: {
                                logo: '/images/panoramio_logo.png',
                                link: photo.photo_url,
                                author: photo.owner_name,
                                author_link: photo.owner_url
                            },
                        }],

                        timestamp: photo.upload_date
                    });
                    return item;
                });
            });
        },
        // graphhopperDirection: function(_args, _callback) {
        //     var params = {
        //         inFormat: 'json',
        //         outFormat: 'json',
        //     };
        //     var mode = _args.mode;
        //     switch (mode) {
        //         case 'walking':
        //             mode = 'foot';
        //             break;
        //         case 'bicycling':
        //             mode = 'bike';
        //             break;
        //         default:
        //             mode = 'car';
        //             break;
        //     }
        //     var points = _args.waypoints;
        //     points.unshift(_args.origin);
        //     points.push(_args.destination);
        //     var nb = points.length;
        //     sdebug('points', nb, points);
        //     var langs = ['ar','ast','bg','ca','cs_CZ','da_DK','de_DE','el','en_US','es','fa','fi','fil','fr','gl','he','hsb','hu_HU','it','ja','lt_LT','ne','nl','pl_PL','pt_BR','pt_PT','ro','ru','si','sk','sv_SE','tr','uk','vi_VI','zh_CN'];
        //     var lang = app.localeInfo.currentLocale.replace('-', '_');
        //     sdebug('lang', lang);
        //     if (!_.includes(langs, lang)) {
        //         lang = app.localeInfo.currentLanguage;
        //         if (!_.includes(langs, lang)) {
        //             lang = langs[0];
        //         }
        //     }
        //     sdebug('lang', lang);
        //     var postParams = {
        //         json: JSON.stringify({

        //             options: {
        //                 ambiguities: 'ignore',
        //                 vehicle: mode,
        //                 doReverseGeocode: false,
        //                 unit: geolib.metrics ? 'k' : 'm',
        //                 calc_points: true,
        //                 type: 'json',
        //                 elevation: false,
        //                 points_encoded: true,
        //                 instructions: true,
        //                 locale: lang
        //             },
        //             locations: _.reduce(points, function(memo, value, index) {
        //                 memo.push({
        //                     latLng: {
        //                         lat: value[0],
        //                         lng: value[1]
        //                     },
        //                     type: (nb > 0 && index < (nb - 1)) ? 'v' : undefined
        //                 });
        //                 return memo;
        //             }, [])
        //         })
        //     };
        //     api.call({
        //         url: 'https://localhost:8989/api/1/route',
        //         params: params,
        //         // silent:_params.silent,
        //         requestMethod: "POST",
        //         postParams: postParams,
        //         onSuccess: function(e, _options) {
        //             if (e.info.statuscode !== 0) {
        //                 onError({
        //                     code: e.info.statuscode,
        //                     error: e.info.messages.join(', ')
        //                 }, _callback, _options);
        //             } else {
        //                 var route = e.route;
        //                 var bbox = e.route.boundingBox;
        //                 var result = {
        //                     summary: {
        //                         region: [bbox.lr.lat, bbox.ul.lng, bbox.ul.lat, bbox.lr.lng],
        //                         distance: route.distance * 1000, // km => m
        //                         duration: route.time * 1000, // min => ms
        //                     },
        //                     legs: _.reduce(route.legs, function(memo, leg) {
        //                         memo.push({
        //                             distance: leg.distance * 1000, // km => m
        //                             duration: leg.time * 1000, // min => ms ,
        //                             steps: _.reduce(leg.maneuvers, function(
        //                                 memo2, step) {
        //                                 memo2.push({
        //                                     distance: step.distance *
        //                                         1000, // km => m
        //                                     duration: step.time *
        //                                         1000, // min => ms ,
        //                                     instruction: step
        //                                         .narrative,
        //                                     mode: step.transportMode
        //                                         .toLowerCase(),
        //                                     streets: step.streets,
        //                                     turnType: step.turnType,
        //                                     direction: mapQuestDirections[
        //                                         step.direction
        //                                     ],
        //                                     start: [step.startPoint
        //                                         .lat,
        //                                         step.startPoint
        //                                         .lng
        //                                     ],
        //                                 });
        //                                 return memo2;
        //                             }, [])
        //                         });
        //                         return memo;
        //                     }, []),
        //                     points: decompress(route.shape.shapePoints, 6)
        //                 };
        //                 _callback({
        //                     mapquestRoute: result,
        //                     region: {
        //                         ne: [bbox.ul.lat, bbox.lr.lng],
        //                         sw: [bbox.lr.lat, bbox.ul.lng]
        //                     },
        //                     // region: [bbox.lr.lat, bbox.ul.lng, bbox.ul.lat, bbox.lr.lng],
        //                     distance: route.distance * 1000, // km => m
        //                     duration: route.time * 1000, // min => ms
        //                     points: result.points
        //                 });
        //             }
        //         },
        //         onError: _callback
        //     });
        // },
        mapquestDirection: function (_args) {
            var params = {
                key: app.servicesKeys.mapquest,
                inFormat: 'json',
                outFormat: 'json',
            };
            var mode = _args.mode;
            switch (mode) {
                case 'walking':
                    mode = 'pedestrian';
                    break;
                case 'bicycling':
                    mode = 'bicycle';
                    break;
                default:
                    mode = 'fastest';
                    break;
            }
            var points = _args.waypoints;
            points.unshift(_args.origin);
            points.push(_args.destination);
            var nb = points.length;
            sdebug('points', nb, points);
            var langs = ['en_US', 'en_GB', 'fr_CA', 'fr_FR', 'de_DE', 'es_ES', 'es_MX', 'ru_RU'];
            var lang = ak.locale.currentLanguage.replace('-', '_');
            sdebug('lang', lang);
            if (!_.includes(langs, lang)) {
                lang = ak.locale.currentLanguage + '_' + ak.locale.currentLanguage.toUpperCase();
                if (!_.contincludesains(langs, lang)) {
                    lang = langs[0];
                }
            }
            sdebug('lang', lang);
            var postParams = {
                json: JSON.stringify({

                    options: {
                        ambiguities: 'ignore',
                        routeType: mode,
                        doReverseGeocode: false,
                        unit: geolib.metrics ? 'k' : 'm',
                        avoidTimedConditions: false,
                        shapeFormat: 'cmp6',
                        fullShape: true,
                        locale: lang
                    },
                    locations: _.reduce(points, function (memo, value, index) {
                        memo.push({
                            latLng: {
                                lat: value[0],
                                lng: value[1]
                            },
                            type: (nb > 0 && index < (nb - 1)) ? 'v' : undefined
                        });
                        return memo;
                    }, [])
                })
            };
            return api.call({
                url: 'http://open.mapquestapi.com/directions/v2/route',
                params: params,
                // silent:_params.silent,
                requestMethod: 'POST',
                postParams: postParams
            }).then(function (e) {
                if (e.info.statuscode !== 0) {
                    return Promise.reject({
                        code: e.info.statuscode,
                        error: e.info.messages.join(', ')
                    });
                    // onError({

                    // }, function (err) {
                    //     throw err
                    // });
                } else {
                    var route = e.route;
                    var bbox = e.route.boundingBox;
                    var result = {
                        summary: {
                            region: [bbox.lr.lat, bbox.ul.lng, bbox.ul.lat, bbox.lr.lng],
                            distance: route.distance * 1000, // km => m
                            duration: route.time * 1000, // min => ms
                        },
                        legs: _.reduce(route.legs, function (memo, leg) {
                            memo.push({
                                distance: leg.distance * 1000, // km => m
                                duration: leg.time * 1000, // min => ms ,
                                steps: _.reduce(leg.maneuvers, function (
                                    memo2, step) {
                                    memo2.push({
                                        distance: step.distance *
                                            1000, // km => m
                                        duration: step.time *
                                            1000, // min => ms ,
                                        instruction: step
                                            .narrative,
                                        mode: step.transportMode
                                            .toLowerCase(),
                                        streets: step.streets,
                                        turnType: step.turnType,
                                        direction: mapQuestDirections[
                                            step.direction
                                        ],
                                        start: [step.startPoint
                                            .lat,
                                            step.startPoint
                                            .lng
                                        ],
                                    });
                                    return memo2;
                                }, [])
                            });
                            return memo;
                        }, []),
                        points: decompress(route.shape.shapePoints, 6)
                    };
                    return {
                        mapquestRoute: result,
                        region: {
                            ne: [bbox.ul.lat, bbox.lr.lng],
                            sw: [bbox.lr.lat, bbox.ul.lng]
                        },
                        // region: [bbox.lr.lat, bbox.ul.lng, bbox.ul.lat, bbox.lr.lng],
                        distance: route.distance * 1000, // km => m
                        duration: route.time * 1000, // min => ms
                        points: result.points
                    };
                }
            });
        },
        mapquestElevation: function (_point) {
            var params = {
                key: app.servicesKeys.mapquest,
                inFormat: 'json',
                outFormat: 'json',
            };
            var postParams = {
                json: JSON.stringify({
                    options: {
                        // routeType: 'pedestrian',
                        unit: 'm',
                        // cyclingRoadFactor:0.1,
                        shapeFormat: 'cmp6',
                    },
                    latLngCollection: [_point.latitude, _point.longitude]

                })
            };
            return api.call({
                url: 'http://open.mapquestapi.com/elevation/v1/profile',
                params: params,
                // silent:_params.silent,
                requestMethod: 'POST',
                postParams: postParams
            }).then(function (e) {
                if (e.info.statuscode !== 0) {
                    onError({
                        code: e.info.statuscode,
                        error: e.info.messages.join(', ')
                    }, function (err) {
                        throw err
                    });
                } else {
                    return {
                        altitude: e.elevationProfile[0].height
                    };
                }
            });
        },
        ignElevation: function (_point) {
            var params = {
                // zonly: true,
                lat: _point.latitude,
                lon: _point.longitude,
            };

            return api.call({
                url: 'http://wxs.ign.fr/' + app.servicesKeys.ign + '/alti/rest/elevation.json',
                params: params,
                // silent:_params.silent,
                headers: {
                    'User-Agent': app.info.name
                }
            }).then(function (e) {
                if (e.error) {
                    onError({
                        code: e.error.code,
                        error: e.error.description
                    }, function (err) {
                        throw err
                    });
                } else {
                    return {
                        altitude: e.elevations[0].z,
                        accuracy: e.elevations[0].acc
                    };
                }
            });
        },
        ignElevationProfile: function (_itemHandler, _points) {
            var nb = _points.length;
            var dist = geolib.getPathLength(_points); //m
            _points = _itemHandler.simplifyToNB(_points, 50);
            _points = _.unzip(_points);
            var maxPoints = 800;
            var params = {
                // zonly: true,
                delimiter: ',',
                sampling: Math.min(Math.max(Math.ceil(dist / 50), nb), maxPoints),
                lat: _points[0].join(','),
                lon: _points[1].join(','),
            };

            return api.call({
                url: 'http://wxs.ign.fr/' + app.servicesKeys.ign + '/alti/rest/elevationLine.json',
                headers: {
                    'User-Agent': app.info.name
                },
                params: params
            }).then(function (e, _options) {
                if (e.error) {
                    onError({
                        code: e.error.code,
                        error: e.error.description
                    }, function (err) {
                        throw err
                    });
                } else {
                    sdebug(e.elevations);
                    var last, totalDistance = 0,
                        distance = 0,
                        lastGradle = 0;
                    var zdistance, grade, lastGradleDistance = 0;
                    // var profile = e.elevationProfile;
                    // var coords = e.elevations;
                    var getDistanceSimple = geolib.getDistanceSimple;
                    var result = {
                        profile: _.reduce(e.elevations, function (memo, value, index) {
                            if (Math.abs(value.z) > 10000) {
                                return memo;
                            }
                            // value.distance *= 1000;
                            if (last) {
                                if (last.lat === value.lat && last.lon ===
                                    value.lon) {
                                    return memo;
                                }
                                zdistance = value.z - last.z;
                                distance = getDistanceSimple(last, value);
                                gradle = Math.round(zdistance / distance * 10) /
                                    10;
                                if (zdistance > 0) {
                                    memo.dplus += zdistance;
                                } else if (zdistance < 0) {
                                    memo.dmin += zdistance;
                                }
                                totalDistance += distance;
                                // if (lastGradle != gradle) {
                                //   memo.gradleRegions.push({
                                //     value: gradle,
                                //     from: lastGradleDistance,
                                //     to: totalDistance,
                                //   });
                                //   lastGradle = gradle;
                                //   lastGradleDistance = totalDistance;
                                // }
                            }
                            if (value.z > memo.max[1]) {
                                memo.max[1] = value.z;
                            }
                            if (value.z < memo.min[1]) {
                                memo.min[1] = value.z;
                            }
                            // totalDistance += distance;

                            // memo.data.push([totalDistance, value.z]);
                            memo.data[0].push(totalDistance);
                            memo.data[1].push(value.z);
                            memo.points.push([value.lat, value.lon]);
                            last = value;
                            return memo;
                        }, {
                            version: 1,
                            max: [0, -1000],
                            min: [0, 100000],
                            dplus: 0,
                            dmin: 0,
                            points: [],
                            data: [
                                [],
                                []
                            ],
                            // data: [],
                            gradleRegions: null
                        })
                    };
                    result.profile.max[0] = totalDistance;
                    result.profile.dmin = Math.round(result.profile.dmin);
                    result.profile.dplus = Math.round(result.profile.dplus);
                    return result;
                }
            });
        },
        mapquestElevationProfile: function (_points) {
            var params = {
                key: app.servicesKeys.mapquest,
                inFormat: 'json',
                outFormat: 'json',
            };
            var postParams = {
                json: JSON.stringify({
                    options: {
                        // routeType: 'pedestrian',
                        unit: 'm',
                        // cyclingRoadFactor:0.1,
                    },
                    shapeFormat: 'cmp6',
                    latLngCollection: compress(_points, 6)

                })
            };
            return api.call({
                url: 'http://open.mapquestapi.com/elevation/v1/profile',
                params: params,
                // silent:_params.silent,
                requestMethod: 'POST',
                // timeout: 30000,
                postParams: postParams
            }).then(function (e) {
                if (e.info.statuscode > 300 && e.info.statuscode < 600) {
                    onError({
                        code: e.info.statuscode,
                        error: e.info.messages.join(', ')
                    }, function (err) {
                        throw err
                    });
                } else {
                    var last;
                    var profile = e.elevationProfile;
                    var coords = e.shapePoints;
                    var result = {
                        profile: _.reduce(profile, function (memo, value, index) {
                            if (value.height === -32768) {
                                return memo;
                            }
                            value.distance *= 1000;
                            if (last) {
                                if (last.distance == value.distance) {
                                    return memo;
                                }
                                var distance = value.height - last.height;
                                if (distance > 0) {
                                    memo.dplus += distance;
                                } else if (distance < 0) {
                                    memo.dmin += distance;
                                }
                            }
                            if (value.distance > memo.max[0]) {
                                memo.max[0] = value.distance;
                            }
                            if (value.distance < memo.min[0]) {
                                memo.min[0] = value.distance;
                            }
                            if (value.height > memo.max[1]) {
                                memo.max[1] = value.height;
                            }
                            if (value.height < memo.min[1]) {
                                memo.min[1] = value.height;
                            }

                            memo.data[0].push(value.distance);
                            memo.data[1].push(value.height);
                            var coordIndex = index * 2;
                            memo.points.push([coords[coordIndex], coords[
                                coordIndex + 1]]);
                            last = value;
                            return memo;
                        }, {
                            max: [-1000, -1000],
                            min: [100000, 100000],
                            dplus: 0,
                            dmin: 0,
                            points: [],
                            data: [
                                [],
                                []
                            ]
                        })
                    };
                    return result;
                }
            });
        },
        gPlaceSearch: function (_params) {

            // _callback(JSON.parse(
            //     "[{\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.17978069999999,\n            \"lng\": 5.6920813\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png\",\n    \"id\": \"765e15c8b31d0eb7468039b765fe8b4ff7e7a47a\",\n    \"name\": \"Rue de Pacalaire\",\n    \"place_id\": \"ChIJIY5awWvzikcRxRu8SvN5dl4\",\n    \"reference\": \"CpQBjwAAABzk1dhs3UdP1WPmxtaY_8hyJ_AkKFr1DewMEggasUPgIN09E525Rl4zN6fe36lE92kZjH8ahhyYZVmHEta-LmylRxM2nN3J9O8ZyFAvSfur7D5SVXBOmrpGLs44fwuDpjaKauAOs8vpuazhFpGsfLsqZOeJyi3loVM7VgdTNpZPXZluRVszS5bDFNorx4cVyxIQW9Os5GCwOBEhxhHV6g5MEBoURS-xHJTwWWAyA4hE3PblaYA4rRs\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"route\"],\n    \"vicinity\": \"Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179894,\n            \"lng\": 5.693167\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/fitness-71.png\",\n    \"id\": \"a05f43612d60b5a6b98cf592a0ad8a82ff33874f\",\n    \"name\": \"Club Gymnesia\",\n    \"opening_hours\": {\n        \"open_now\": true,\n        \"weekday_text\": []\n    },\n    \"place_id\": \"ChIJR5EWb2nzikcRgj_PXNLlgmw\",\n    \"reference\": \"CmRgAAAADmoIV1fnZPlvv2UWlkGRtZFxVMlAMzIcGFdOSO5_GyPAzPDtfeDjcA-LHUOPDxI0bZig2Wht953t3cfQdgeyE_4l8rR_bYkJJNOiXaXVYbchb4dPFqXnZtPpsitl_lnpEhD1L3DkjFdB8cTohBoWPNHlGhSuzWDrnZ5eHVOoeLVWcOvAwGkMXw\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"gym\", \"health\", \"point_of_interest\", \"establishment\"],\n    \"vicinity\": \"18 Avenue de la Houille Blanche, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179708,\n            \"lng\": 5.692616\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n    \"id\": \"330e5b2399981af0c6076834d3fc51b4f515116a\",\n    \"name\": \"Squash Center\",\n    \"opening_hours\": {\n        \"open_now\": false,\n        \"weekday_text\": []\n    },\n    \"photos\": [{\n        \"height\": 332,\n        \"html_attributions\": [\n            \"<a href=\\\"https://www.google.com/maps/views/profile/107423589791659136226\\\">Squash Center</a>\"\n        ],\n        \"photo_reference\": \"CmRdAAAA_yxv9veXgFZs5oPx4ADqS9p8F13bkHKbbvbUu2IXsqrZ5zaYspUac4EVGtUoL0OalYXYqmqh2k8L5B0Mx7E8UAQijr_Ovch3XZHt_KHMhg15pjPbhviMuMDX9PDOmX0zEhCkXma-l1omNEmyvoF01vv3GhRpKwKqhlML4HbUhEBNgP59QqSCPA\",\n        \"width\": 500\n    }],\n    \"place_id\": \"ChIJjfl122vzikcRdXXQvfKCSwo\",\n    \"reference\": \"CmRgAAAA3GRPfuJ3vAvMz8B5o8YYFpoNjjjVLAAhuUMNfN1yOTwFW9ZdsGU5uW8d9AqoD4Apgm8BEZmOglibV1f6R6h_3Oo62dHbyBWzsNXLw_-txgtDnIxwAJXi76x-vjwzK-dWEhCIjQKHeoOMcObYcpf9K_vyGhSN8YUXV1KIiwQT3DX7E6W2qKq6nA\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"point_of_interest\", \"establishment\"],\n    \"vicinity\": \"11 Rue de Pacalaire, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179288,\n            \"lng\": 5.693465\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n    \"id\": \"e464b9185c9f88ab6e140c0d2c2a36c88941b5d7\",\n    \"name\": \"Adecco\",\n    \"place_id\": \"ChIJJXl7e2nzikcRng9j00y8oQI\",\n    \"reference\": \"CmRZAAAAshv5YpHh_urzHyEZy40WtIuQamtrgsv8Hgm0s-IKZ_iFnKCB_YDnpsyZ4PNHBPeR6YFCm0e40UvhZAqp_ZC1beTd2fDYIXPBpYqIwjdLDbtBb1bkaA7q3NYYhosdAgMZEhAFYf3N7_SG-9e8EymvmSV8GhTtMvq30CmgDl_L1NjOF8z_wfwquw\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"point_of_interest\", \"establishment\"],\n    \"vicinity\": \"20 Avenue de la Houille Blanche, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179382,\n            \"lng\": 5.692195\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n    \"id\": \"90b02b57c165d5eea9dff725204400ec0d8ec3b2\",\n    \"name\": \"Denis Savio Nature\",\n    \"place_id\": \"ChIJ9y7P206MikcRVR2WV5QkLPE\",\n    \"reference\": \"CnRmAAAAwg6UidJo0KJdHD9z8ACqmaqNYd9N_Ha5JJ4jS2kPJy7Ji9XMaWT6z8wVfdJoHJZD3OiA4sLlxhtFGG5902_wgtTttR9knFrTiq9jgVnGtXWPb4evfaLjgoawh7BRgNzH0izMRPUaPWDQbfQPZzy0_xIQ78qzgZyW35bpXC4fYQMX1RoUKndq2tmA2H-sT6nmNwFKFFnG1Ug\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"point_of_interest\", \"establishment\"],\n    \"vicinity\": \"38 Rue de Pacalaire, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179532,\n            \"lng\": 5.692317\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n    \"id\": \"7fad47148244424114588faf3ffd75096447fc2b\",\n    \"name\": \"FROG'S NETWORK\",\n    \"photos\": [{\n        \"height\": 256,\n        \"html_attributions\": [\n            \"<a href=\\\"https://www.google.com/maps/views/profile/115277177975822054678\\\">FROG&#39;S NETWORK</a>\"\n        ],\n        \"photo_reference\": \"CmRdAAAAmZ5UFg6hNSrglnpWUtOYip2gy5rcx7L7TMTFIf482rp_DAeDkmu3V_V4ErPMTSzH6kVnoUBdwPA6JOZw8dyQE4fensqH0ukQdcY0vLOM7za0F35EwPtRutaicFX_Lb1oEhBsn5ElKYMlN23L0Qbz7UAGGhQN6Z7X2jf1Y-t2864xeXWASF2aHQ\",\n        \"width\": 256\n    }],\n    \"place_id\": \"ChIJMfah0WvzikcR5m12dHRaGq0\",\n    \"reference\": \"CnRiAAAAMN6ENzyta2VtdB0Nsyv63ElFTBz2H1_anQFLNjLEKLqKGZkOIAy8Pxa5EmczzdzkO9dHXPdv9ockCOXxs7zm6K4mUEYmdRh5UFo1Xs3rRAJLaeH8FeH1QCXatXXcummdnosIedabpjqQSdU64Vd2WBIQiiSdP0k8czfuCnQin6HqNxoU4MkGfBkBQnyh03ExHgHIvbk6ig4\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"point_of_interest\", \"establishment\"],\n    \"vicinity\": \"36 Rue de Pacalaire, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179528,\n            \"lng\": 5.69242\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n    \"id\": \"f4bf3bc2dbee1757c36cab88a17cb3bcb265ff50\",\n    \"name\": \"Caradyn\",\n    \"place_id\": \"ChIJudtvxWvzikcR-FWiK_EFTz0\",\n    \"reference\": \"CmRaAAAAhwGuyajH17LMHgfACMEauFdo7vHUKbX_sGxsjkSmc6MrrORkP-OdFGxpBCfzGz_5eVYQiV_nYy2OKY6CFB8dCimwWUxjMVZKTwzHX7U6O5u-51z_iERUJMqpHaoGVU4AEhDvWTgGG7eNRrPSuU1N7oStGhSHRiXY34c6iHjqD9cVTjCqzfIFfA\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"establishment\"],\n    \"vicinity\": \"36 Rue de Pacalaire, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.179528,\n            \"lng\": 5.69242\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n    \"id\": \"abd263a18152cba051cba34f0ac764acf451758f\",\n    \"name\": \"Alpes Publicom\",\n    \"place_id\": \"ChIJudtvxWvzikcRyfKlsU7u8GM\",\n    \"reference\": \"CnRhAAAARviLU63JrkvCs-j1WdUCyikTrjMMEfJwYgGZ43CuQ3loNCMu-LCrlLs4FV8f31IRnuDzinCCBE87irD8lYBBHmy3z-8TPD-MJdOQlUyl0G2l2GIz2K9fzbyzPIYBhw6iZ8Q3FIAH66dACdp2f9jLXRIQvGy8DmrU5A2yymkX7mQ_0hoUOa9SyTgU_ozfd1hl2joz0m0psuc\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"establishment\"],\n    \"vicinity\": \"36 Rue de Pacalaire, Seyssinet-Pariset\"\n}, {\n    \"geometry\": {\n        \"location\": {\n            \"lat\": 45.1729516,\n            \"lng\": 5.6703133\n        },\n        \"viewport\": {\n            \"northeast\": {\n                \"lat\": 45.1907319,\n                \"lng\": 5.7015459\n            },\n            \"southwest\": {\n                \"lat\": 45.153409,\n                \"lng\": 5.6387341\n            }\n        }\n    },\n    \"icon\": \"http://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png\",\n    \"id\": \"cc50dc8d46b1c10e7ddb4d217b81bac8586fe15d\",\n    \"name\": \"Seyssinet-Pariset\",\n    \"place_id\": \"ChIJ6R9AoCbzikcRYGa-5CqrCAQ\",\n    \"reference\": \"CoQBdgAAAACJrLnPp3GPbOvCgIs9oOls5ybG4l86lj3AhjzUQIc5MRHU_gneO7WF59XPujiDSSKMafgRbIGfmFeM8m6D3RXrwWIebutDCHD7YtVCNg4dZczbdAFe3Lnbc-6zR2biXXeIu-WyL5UChUqOWg9LjVhHP4GsKfMIwG2X6c13Z2CUEhDtU3w5nrglKSZKykZNyd9dGhSzudzoOkHlGApqcsm39ADeSKRPBw\",\n    \"scope\": \"GOOGLE\",\n    \"types\": [\"locality\", \"political\"],\n    \"vicinity\": \"Seyssinet-Pariset\"\n}]"
            // ));
            // return;
            return api.call({
                url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
                silent: _params.silent,
                params: {
                    key: app.servicesKeys.google,
                    radius: 30,
                    // rankby: 'distance',
                    location: (_params.latitude + ',' + _params.longitude)
                }
            }).then(function (result) {
                if (result.results.length === 0) {
                    onError('no_place_found', function (err) {
                        throw err
                    });
                    return;
                }

                return _.reduce(result.results, function (memo, value) {
                    if (!_.includes(['route', 'neighborhood'], value.types[
                            0])) {
                        memo.push({
                            latitude: value.geometry.location.lat,
                            longitude: value.geometry.location.lng,
                            name: value.name,
                            vicinity: value.vicinity,
                            placeid: value.place_id,
                            types: value.types,
                        });
                    }
                    return memo;
                }, []);
            });
        },
        gPlaceDetails: function (_placeiid) {
            // var result = JSON.parse(
            //     "{\n      \"address_components\" : [\n         {\n            \"long_name\" : \"11\",\n            \"short_name\" : \"11\",\n            \"types\" : [ \"street_number\" ]\n         },\n         {\n            \"long_name\" : \"Rue de Pacalaire\",\n            \"short_name\" : \"Rue de Pacalaire\",\n            \"types\" : [ \"route\" ]\n         },\n         {\n            \"long_name\" : \"Seyssinet-Pariset\",\n            \"short_name\" : \"Seyssinet-Pariset\",\n            \"types\" : [ \"locality\", \"political\" ]\n         },\n         {\n            \"long_name\" : \"France\",\n            \"short_name\" : \"FR\",\n            \"types\" : [ \"country\", \"political\" ]\n         },\n         {\n            \"long_name\" : \"38170\",\n            \"short_name\" : \"38170\",\n            \"types\" : [ \"postal_code\" ]\n         }\n      ],\n      \"adr_address\" : \"\\u003cspan class=\\\"street-address\\\"\\u003e11 Rue de Pacalaire\\u003c/span\\u003e, \\u003cspan class=\\\"postal-code\\\"\\u003e38170\\u003c/span\\u003e \\u003cspan class=\\\"locality\\\"\\u003eSeyssinet-Pariset\\u003c/span\\u003e, \\u003cspan class=\\\"country-name\\\"\\u003eFrance\\u003c/span\\u003e\",\n      \"formatted_address\" : \"11 Rue de Pacalaire, 38170 Seyssinet-Pariset, France\",\n      \"formatted_phone_number\" : \"04 76 84 51 53\",\n      \"geometry\" : {\n         \"location\" : {\n            \"lat\" : 45.179708,\n            \"lng\" : 5.692616\n         }\n      },\n      \"icon\" : \"http://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png\",\n      \"id\" : \"330e5b2399981af0c6076834d3fc51b4f515116a\",\n      \"international_phone_number\" : \"+33 4 76 84 51 53\",\n      \"name\" : \"Squash Center\",\n      \"opening_hours\" : {\n         \"open_now\" : false,\n         \"periods\" : [\n            {\n               \"close\" : {\n                  \"day\" : 0,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 0,\n                  \"time\" : \"1000\"\n               }\n            },\n            {\n               \"close\" : {\n                  \"day\" : 1,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 1,\n                  \"time\" : \"1000\"\n               }\n            },\n            {\n               \"close\" : {\n                  \"day\" : 2,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 2,\n                  \"time\" : \"1000\"\n               }\n            },\n            {\n               \"close\" : {\n                  \"day\" : 3,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 3,\n                  \"time\" : \"1000\"\n               }\n            },\n            {\n               \"close\" : {\n                  \"day\" : 4,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 4,\n                  \"time\" : \"1000\"\n               }\n            },\n            {\n               \"close\" : {\n                  \"day\" : 5,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 5,\n                  \"time\" : \"1000\"\n               }\n            },\n            {\n               \"close\" : {\n                  \"day\" : 6,\n                  \"time\" : \"2300\"\n               },\n               \"open\" : {\n                  \"day\" : 6,\n                  \"time\" : \"1000\"\n               }\n            }\n         ],\n         \"weekday_text\" : [\n            \"Monday: 10:00 am – 11:00 pm\",\n            \"Tuesday: 10:00 am – 11:00 pm\",\n            \"Wednesday: 10:00 am – 11:00 pm\",\n            \"Thursday: 10:00 am – 11:00 pm\",\n            \"Friday: 10:00 am – 11:00 pm\",\n            \"Saturday: 10:00 am – 11:00 pm\",\n            \"Sunday: 10:00 am – 11:00 pm\"\n         ]\n      },\n      \"photos\" : [\n         {\n            \"height\" : 332,\n            \"html_attributions\" : [\n               \"\\u003ca href=\\\"https://www.google.com/maps/views/profile/107423589791659136226\\\"\\u003eSquash Center\\u003c/a\\u003e\"\n            ],\n            \"photo_reference\" : \"CmRdAAAA_wNe5hSjSNwVjsBGDCpieWfcpg7mSOXW8CQno9iM2uFm1B-dWakmHa8djJWVglkqipvDaLnXul7qhd1X2CA_pk4XMeaTwdfBl-xI2lO9fVIGJNSUCJXSEWfG_7ADlkAbEhCExpE4LVxVf_Tv_XGGrYQaGhS63PtmFrkDWTRML2ouwkqPE1WHGg\",\n            \"width\" : 500\n         },\n         {\n            \"height\" : 393,\n            \"html_attributions\" : [\n               \"\\u003ca href=\\\"https://www.google.com/maps/views/profile/107423589791659136226\\\"\\u003eSquash Center\\u003c/a\\u003e\"\n            ],\n            \"photo_reference\" : \"CmRdAAAAnjKKjknFJ8cN2cZupnbwQFLP_OoiGybbEB5TD01wF_rWHbTYdXSpquJ2fPWputgCyxbgZvM5V054tlt2UHJk8ls9u0M2UeoUaNuMT3bUhVhzhd1zF5iPAjzRpzD6XX3zEhCNa9zhTziQBdHNa_BBcwraGhTdmLSuuSsaNOlLtLvJG10Bj-owzw\",\n            \"width\" : 1001\n         }\n      ],\n      \"place_id\" : \"ChIJjfl122vzikcRdXXQvfKCSwo\",\n      \"reference\" : \"CmRgAAAALnXp-2jmLJOIjeIXdIMuE3BPxXbrfrSU72vgRPJc59eoJC5I9Ok-KQ40CzVfWhAaLiA3cWoDt1tHNRrm6gAfXD_c4QOtGFzGgYCfVy2X0vwdB2ChYWVcnDSaf_MinkcjEhA1Hv4ulBCs7-3h75LYdzC6GhQmPvP92EBWA-WTwpHG2weneZsUFw\",\n      \"reviews\" : [\n         {\n            \"aspects\" : [\n               {\n                  \"rating\" : 3,\n                  \"type\" : \"overall\"\n               }\n            ],\n            \"author_name\" : \"Maximilien Dangoumau\",\n            \"author_url\" : \"https://plus.google.com/112455107012095572766\",\n            \"language\" : \"fr\",\n            \"rating\" : 5,\n            \"text\" : \"Tres bon accueil. Les gérants sont trés sympa. Prix raisonnable \",\n            \"time\" : 1377087912\n         },\n         {\n            \"aspects\" : [\n               {\n                  \"rating\" : 2,\n                  \"type\" : \"overall\"\n               }\n            ],\n            \"author_name\" : \"VEAULEGER .François\",\n            \"author_url\" : \"https://plus.google.com/108305665006370863663\",\n            \"language\" : \"fr\",\n            \"rating\" : 4,\n            \"text\" : \"\",\n            \"time\" : 1424013756\n         },\n         {\n            \"aspects\" : [\n               {\n                  \"rating\" : 3,\n                  \"type\" : \"overall\"\n               }\n            ],\n            \"author_name\" : \"A Google User\",\n            \"language\" : \"fr\",\n            \"rating\" : 5,\n            \"text\" : \"Super accueil de JP et Eric, qui prêtent les balles, donnent des conseils, et n'éteignent pas la lumière au milieu d'un jeu lorsqu'on atteint les 45 minutes prévues, d'autres devraient s'en inspirer...\\nTournois amicaux régulièrement organisés dans une ambiance joviale, j'y ai souvent participé même en étant pas bon, et c'est toujours un plaisir!\",\n            \"time\" : 1325593438\n         },\n         {\n            \"aspects\" : [\n               {\n                  \"rating\" : 2,\n                  \"type\" : \"overall\"\n               }\n            ],\n            \"author_name\" : \"A Google User\",\n            \"language\" : \"fr\",\n            \"rating\" : 4,\n            \"text\" : \"Acceuil sympa, services proposés par des pros. Annexes en bon état (vestiaires, douches propres) malgré les terrains un peu vieillots (murs rafistolés et bandes manquantes). Tournois bon enfant organisés régulièrement, prix un peu au-dessus de la concurrence.\",\n            \"time\" : 1313479619\n         }\n      ],\n      \"scope\" : \"GOOGLE\",\n      \"types\" : [ \"point_of_interest\", \"establishment\" ],\n      \"url\" : \"https://plus.google.com/107423589791659136226/about?hl=en-US\",\n      \"user_ratings_total\" : 4,\n      \"utc_offset\" : 120,\n      \"vicinity\" : \"11 Rue de Pacalaire, Seyssinet-Pariset\",\n      \"website\" : \"http://squashcenter.free.fr/\"\n   }"
            // );
            return api.call({
                url: 'https://maps.googleapis.com/maps/api/place/details/json',
                silent: _params.silent,
                params: {
                    key: app.servicesKeys.google,
                    placeid: _placeiid
                }
            }).then(function (result, _options) {
                if (!result.result) {
                    onError('no_place_found', function (err) {
                        throw err
                    });
                    return;
                }
                result = result.result;
                return {
                    title: result.name,
                    placeid: result.place_id,
                    types: result.types,
                    address: formatGoogleAddress(result),
                    phone: result.formatted_phone_number,
                    latitude: result.geometry.location.lat,
                    longitude: result.geometry.location.lng,
                    opening_hours: result.opening_hours,
                    url: result.website
                };
            });
        },
        downloadAndSaveImage: function (_url, _imageId, _callback) {
            return api.call({
                url: _url,
                forData: true
            }).then(function (data) {
                var path = 'image_' + _imageId + '.jpg';
                Ti.Filesystem.getFile(app.getImagePath(path)).write(data);
                console.log('downloadAndSaveImage', path, data)
                return {
                    image: data,
                    imageName: path
                }
            });
        },
        downloadAndSaveFile: function (_url, _type, _params) {
            return api.call(Object.assign({
                url: _url,
                forData: true
            }, _params)).then(function (data) {
                var timestamp = moment().valueOf();
                var path = Ti.Utils.md5HexDigest(_url) + '_' + timestamp + '.' + _type;
                var file = Ti.Filesystem.getFile(app.getFilePath(path));
                file.write(data);
                return {
                    originalLink: _url,
                    file: data,
                    type: _type,
                    timestamp: timestamp,
                    fileSize: file.size,
                    fileName: path
                };
            });
        },
        webToPDF: function (_url, _title) {
            var pxPerCm = app.deviceinfo.dpi / 2.54;
            sdebug();
            // var url
            // var url = 'https://bottle-alpimaps.rhcloud.com/pdf?url=' + _url + '&viewport=' + app.deviceinfo.pixelWidth + 'x' + app.deviceinfo.pixelHeight;
            return api.downloadAndSaveFile(osAPIURL + 'webtopdf', 'pdf', {
                requestMethod: 'POST',
                headers: {
                    'User-Agent': Ti.defaultUserAgent,
                    'Content-Type': 'application/json'
                },
                postParamsString: {
                    url: _url,
                    'viewport-size': app.deviceinfo.width + 'x' + app.deviceinfo.height,
                    // 'page-size':'A3',
                    zoom: 2,
                    // 'page-width':11,
                    // 'page-height':15,
                    // dpi:app.deviceinfo.dpi,
                    'disable-smart-shrinking': true,
                    encoding: 'UTF-8',

                    T: 0,
                    B: 0,
                    L: 0,
                    R: 0
                }
            }).then(function (e) {
                if (e.file) {
                    var matches = _url.match(/(https?:\/\/|www\.?)(www\.)?([^\/\s]+)/);
                    // sdebug('test', matches);
                    var title = _.last(matches);
                    var parts = title.split('.');
                    if (parts.length > 1) {
                        title = parts[parts.length - 2];
                    } else {
                        title = parts[0];
                    }
                    return Object.assign(e, {
                        originalLink: _url,
                        title: _.capitalize(title),
                        fullTitle: _title
                    });
                } else {
                    return e;
                }
            });
        },
        getImage: function (_source) {
            var url = _source.url || _source;
            return api.call({
                url: url,
                forData: true
            }).then(function (data) {
                var result = _.isObject(_source) ? _.omit(_source, 'url') : {};
                result.image = data;
                result.url = url;
                return result;
            });
        },
        getPhoto: function (_photo) {
            console.log('getPhoto', _photo);
            var url = _photo.url;
            var imageId = moment().valueOf();
            return api.downloadAndSaveImage(url, imageId).then(function (e) {
                console.log('getPhotodone', e);
                if (e.image) {
                    var result = _.omit(_photo, 'url', 'image');
                    result = Object.assign(result, {
                        width: e.image.width,
                        height: e.image.height,
                        url: url,
                        image: e.imageName
                    });
                    console.log('downloaded photo', result);
                    if (result.thumbnail) {
                        return api.downloadAndSaveImage(result.thumbnail, imageId + '_thumb').then(
                            function (e2) {
                                if (e2.image) {
                                    result.thumbnailImage = e2.imageName;
                                }
                                return result;
                            });
                    } else {
                        return result;
                    }
                }
            });
        },
        openWeatherMapLatLng: function (_params) {
            var coord = geolib.coords(_params);
            sdebug('openWeatherMapLatLng', coord);
            return api.call({
                url: 'http://api.openweathermap.org/data/2.5/weather',
                silent: true,
                params: {
                    APPID: app.servicesKeys.owm,
                    nb_points: 100,
                    units: 'metric',
                    format: 'json',
                    lat: coord.latitude,
                    lon: coord.longitude
                }
            }).then(function (result) {
                if (result.cod && result.cod != '200') {
                    onError({
                        error: {
                            code: parseInt(result.cod),
                            message: result.message
                        }
                    }, function (err) {
                        throw err;
                    });
                } else {
                    return result;
                }
            });
        },
        openWeatherForecast: function (_params) {
            var coord = geolib.coords(_params);

            sdebug('openWeatherForecast', coord);
            return api.call({
                url: 'http://api.openweathermap.org/data/2.5/forecast',
                silent: true,
                params: {
                    APPID: app.servicesKeys.owm,
                    units: 'metric',
                    format: 'json',
                    lat: coord.latitude,
                    lon: coord.longitude
                }
            }).then(function (result) {
                if (result.cod && result.cod != '200') {
                    onError({
                        error: {
                            code: parseInt(result.cod),
                            message: result.message
                        }
                    }, function (err) {
                        throw err;
                    });

                    return;
                }
                return result;
            });
        },
        openWeatherMapRegion: function (_params) {
            var region = _params.region;
            return api.call({
                url: 'http://api.openweathermap.org/data/2.5/box/city',
                params: {
                    APPID: app.servicesKeys.owm,
                    nb_points: 100,
                    units: 'metric',
                    cluster: 'no',
                    format: 'json',
                    bbox: region.sw.longitude + ',' + region.sw.latitude + ',' + region.ne.longitude +
                        ',' + region.ne.latitude + ',' + Math.floor(_params.zoom)
                }
            }).then(function (result) {
                if (result.cod && result.cod != '200') {
                    onError({
                        error: {
                            code: parseInt(result.cod),
                            message: result.message
                        }
                    }, function (err) {
                        throw err;
                    });
                }
                if (result.list) {
                    if (result.list.length > 0) {
                        _callback(result.list);
                    } else {
                        return api.openWeatherMapLatLng(geolib.getCenter([region.sw, region.ne]));
                    }
                } else {
                    return result;
                }
            });
        },
        photonSearch: function (_params) {
            var langs = ['en', 'it', 'fr', 'de'];
            var lang = ak.locale.currentLanguage.split('-')[0].toLowerCase();
            if (!_.includes(langs, lang)) {
                lang = langs[0];
            }
            return api.call({
                url: 'http://photon.komoot.de/api/',
                silent: true,
                params: {
                    q: _params.query,
                    lat: _params.latitude,
                    lon: _params.longitude,
                    lang: lang,
                    limit: 40
                }
            }).then(function (results) {
                results = _.mapIfDefined(results.features, function (value) {
                    var result = convert.preparePhotonObject(value);
                    if (result && _params.latitude) {
                        result.distance = geolib.getDistanceSimple(result, _params);
                    }
                    return result;
                });
                results = _.uniq(results, function (value) {
                    if (value.osm.class === 'highway') {
                        return value.title;
                    } else {
                        return value.osm.id;
                    }
                });
                return _.orderBy(results, 'distance');
            });
        },
        decodeLine: decodeLine
    });

    var onError = (function (e, failureCallback, _lastcall) {
        var res = e,
            code = -1;
        if (_.isObject(e.error)) {
            code = e.error.code;
            res = '[Error ' + code + '] ' + e.error.message;
        } else {
            code = e.code;
            res = e.error ? ('[Error ' + code + '] ' + e.error) : e;
        }
        sdebug('HTTP onError', e);

        if (failureCallback) {
            failureCallback(e.error ? e : {
                error: e,
                code: code
            });
        }
        if (code !== 0) // cancel
        {
            app.emit('error', {
                title: trc('error'),
                error: res,
                silent: (_lastcall && _lastcall.silent === true)
            });
        }

    }).bind(api);

    var onSuccess = (function (clientThis, e, completedCallback, failureCallback, _lastcall) {
        var res = 'Unknown error';
        var result = clientThis.responseText || '{}';
        sdebug('statusCode:', e.code);
        if (e.code >= 200 && e.code < 300) {
            try {
                result = JSON.parse(result);
            } catch (e) {
                res = e.message + ': ' + result;
            }
            if (!result || !result.error) {
                // res = result.result || result;
                if (result.message) {
                    api.emit('message', {
                        // title: res,
                        message: result.message
                    });
                }
                if (completedCallback) completedCallback(result, _lastcall);
                return;
            } else {
                sdebug('error', result);
                res = result.error;
            }
        } else {
            res = {
                code: e.code,
                error: e.error || 'No response received.'
            };
        }
        onError(res, failureCallback, _lastcall);
    }).bind(api);
    return api;
}

var api;
if (typeof exports === 'undefined') {
    api = createApi(this);
} else {
    exports.init = function (_context) {
        return createApi(_context);
    };
}