(function(global, undefined) {

    "use strict";

    function Geolib() {}

    // Constants
    Geolib.TO_RAD = Math.PI / 180;
    Geolib.TO_DEG = 180 / Math.PI;
    Geolib.PI_X2 = Math.PI * 2;
    Geolib.PI_DIV4 = Math.PI / 4;
    Geolib.XDPI = (app.deviceinfo.xdpi || app.deviceinfo.dpi) / app.deviceinfo.densityFactor;
    Geolib.PX_PER_CM = Geolib.XDPI / 2.54;

    function getNiceNumber(number) {
        var exponent = Math.floor(Math.log(Math.abs(number)) / Math.LN10);
        var fraction = Math.abs(number) * Math.pow(10, -exponent);
        var roundedFraction = 10;
        if (fraction < 1.5) {
            roundedFraction = 1;
        } else if (fraction < 3) {
            roundedFraction = 2;
        } else if (fraction < 7) {
            roundedFraction = 5;
        }
        return roundedFraction * Math.pow(10, exponent);
    }

    function _getRoundNum(t) {
        var e = Math.pow(10, (Math.floor(t) + "").length - 1),
            i = t / e;
        return i = i >= 10 ? 10 : i >= 5 ? 5 : i >= 3 ? 3 : i >= 2 ? 2 : 1, e * i;
    }
    // Setting readonly defaults
    var geolib = Object.create(Geolib.prototype, {
        version: {
            value: "$version$"
        },
        earthRadius: {
            value: 6378137
        },
        minLat: {
            value: -90
        },
        maxLat: {
            value: 90
        },
        minLon: {
            value: -180
        },
        maxLon: {
            value: 180
        },
        pxPerCM: {
            value: Geolib.PX_PER_CM
        },
        sexagesimalPattern: {
            value: /^([0-9]{1,3})°\s*([0-9]{1,3}(?:\.(?:[0-9]{1,2}))?)'\s*(([0-9]{1,3}(\.([0-9]{1,2}))?)"\s*)?([NEOSW]?)$/
        },
        measures: {
            value: Object.create(Object.prototype, {
                "m": {
                    value: 1
                },
                "km": {
                    value: 0.001
                },
                "cm": {
                    value: 100
                },
                "mm": {
                    value: 1000
                },
                "mi": {
                    value: (1 / 1609.344)
                },
                "sm": {
                    value: (1 / 1852.216)
                },
                "ft": {
                    value: (100 / 30.48)
                },
                "in": {
                    value: (100 / 2.54)
                },
                "yd": {
                    value: (1 / 0.9144)
                }
            })
        },
        prototype: {
            value: Geolib.prototype
        },
        extend: {
            value: function(methods, overwrite) {
                for (var prop in methods) {
                    if (typeof geolib.prototype[prop] === 'undefined' || overwrite === true) {
                        if (typeof methods[prop] === 'function' && typeof methods[prop].bind ===
                            'function') {
                            geolib.prototype[prop] = methods[prop].bind(geolib);
                        } else {
                            geolib.prototype[prop] = methods[prop];
                        }
                    }
                }
            }
        }
    });

    if (typeof(Number.prototype.toRad) === 'undefined') {
        Number.prototype.toRad = function() {
            return this * Geolib.TO_RAD;
        };
    }

    if (typeof(Number.prototype.toDeg) === 'undefined') {
        Number.prototype.toDeg = function() {
            return this * Geolib.TO_DEG;
        };
    }

    // Here comes the magic
    geolib.extend({

        decimal: {},

        sexagesimal: {},

        metrics: true,

        getValue: function(point, index, possibleValues, raw) {

            var result;
            if (Object.prototype.toString.call(point) == '[object Array]') {
                result = point[index];
            } else if (typeof point === "object") {
                possibleValues.every(function(val) {
                    return point.hasOwnProperty(val) ? (function() {
                        result = point[val];
                        return false;
                    }()) : true;
                });
                // result = this.getValue(['lat', 'latitude']);
            } else {
                result = parseFloat(point);
            }
            return raw !== false ? result : this.useDecimal(result);
        },
        // returns latitude of a given point, converted to decimal
        // set raw to true to avoid conversion
        getLat: function(point, raw) {
            return this.getValue(point, 0, ['lat', 'latitude'], raw);
        },

        // Alias for getLat
        latitude: function(point) {
            return this.getLat.call(geolib, point);
        },

        // returns longitude of a given point, converted to decimal
        // set raw to true to avoid conversion
        getLon: function(point, raw) {
            return this.getValue(point, 1, ['lng', 'lon', 'longitude'], raw);
        },

        // Alias for getLon
        longitude: function(point) {
            return this.getLon.call(geolib, point);
        },

        getElev: function(point, raw) {
            return this.getValue(point, 2, ['alt', 'altitude', 'elevation', 'elev'], raw);
        },

        // Alias for getElev
        elevation: function(point) {
            return this.getElev.call(this, point);
        },

        coords: function(point, raw) {
            var retval = {
                latitude: this.getLat(point, raw),
                longitude: this.getLon(point, raw),
                elevation: this.getElev(point, raw),

            };
            return retval;

        },

        // Alias for coords
        ll: function(point, raw) {
            return this.coords.call(this, point, raw);
        },

        // checks if a variable contains a valid latlong object
        validate: function(point) {

            var keys = this.getKeys(point);

            if (typeof keys === 'undefined' || typeof keys.latitude === 'undefined' || keys.longitude ===
                'undefined') {
                return false;
            }

            var lat = this.getLat(point);
            var lng = this.getLon(point);

            if (typeof lat === 'undefined' || !this.isDecimal(lat) && !this.isSexagesimal(lat)) {
                return false;
            }

            if (typeof lng === 'undefined' || !this.isDecimal(lng) && !this.isSexagesimal(lng)) {
                return false;
            }

            lat = this.useDecimal(lat);
            lng = this.useDecimal(lng);

            if (lat < this.minLat || lat > this.maxLat || lng < this.minLon || lng > this.maxLon) {
                return false;
            }

            return true;

        },

        /**
         * Calculates geodetic distance between two points specified by latitude/longitude using
         * Vincenty inverse formula for ellipsoids
         * Vincenty Inverse Solution of Geodesics on the Ellipsoid (c) Chris Veness 2002-2010
         * (Licensed under CC BY 3.0)
         *
         * @param    object    Start position {latitude: 123, longitude: 123}
         * @param    object    End position {latitude: 123, longitude: 123}
         * @param    integer   Accuracy (in meters)
         * @return   integer   Distance (in meters)
         */
        getDistance: function(start, end, accuracy) {

            accuracy = Math.floor(accuracy) || 1;

            var s = this.coords(start);
            var e = this.coords(end);

            var a = 6378137,
                b = 6356752.314245,
                f = 1 / 298.257223563; // WGS-84 ellipsoid params
            var L = (e['longitude'] - s['longitude']).toRad();

            var cosSigma, sigma, sinAlpha, cosSqAlpha, cos2SigmaM, sinSigma;

            var U1 = Math.atan((1 - f) * Math.tan(parseFloat(s['latitude']).toRad()));
            var U2 = Math.atan((1 - f) * Math.tan(parseFloat(e['latitude']).toRad()));
            var sinU1 = Math.sin(U1),
                cosU1 = Math.cos(U1);
            var sinU2 = Math.sin(U2),
                cosU2 = Math.cos(U2);

            var lambda = L,
                lambdaP, iterLimit = 100;
            do {
                var sinLambda = Math.sin(lambda),
                    cosLambda = Math.cos(lambda);
                sinSigma = (
                    Math.sqrt(
                        (
                            cosU2 * sinLambda
                        ) * (
                            cosU2 * sinLambda
                        ) + (
                            cosU1 * sinU2 - sinU1 * cosU2 * cosLambda
                        ) * (
                            cosU1 * sinU2 - sinU1 * cosU2 * cosLambda
                        )
                    )
                );
                if (sinSigma === 0) {
                    return 0; // co-incident points
                }

                cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
                sigma = Math.atan2(sinSigma, cosSigma);
                sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
                cosSqAlpha = 1 - sinAlpha * sinAlpha;
                cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;

                if (isNaN(cos2SigmaM)) {
                    cos2SigmaM = 0; // equatorial line: cosSqAlpha=0 (§6)
                }
                var C = (
                    f / 16 * cosSqAlpha * (
                        4 + f * (
                            4 - 3 * cosSqAlpha
                        )
                    )
                );
                lambdaP = lambda;
                lambda = (
                    L + (
                        1 - C
                    ) * f * sinAlpha * (
                        sigma + C * sinSigma * (
                            cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)
                        )
                    )
                );

            } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

            if (iterLimit === 0) {
                return NaN; // formula failed to converge
            }

            var uSq = (
                cosSqAlpha * (
                    a * a - b * b
                ) / (
                    b * b
                )
            );

            var A = (
                1 + uSq / 16384 * (
                    4096 + uSq * (-768 + uSq * (
                        320 - 175 * uSq
                    ))
                )
            );

            var B = (
                uSq / 1024 * (
                    256 + uSq * (-128 + uSq * (
                        74 - 47 * uSq
                    ))
                )
            );

            var deltaSigma = (
                B * sinSigma * (
                    cos2SigmaM + B / 4 * (
                        cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 +
                            4 * sinSigma * sinSigma
                        ) * (-3 + 4 * cos2SigmaM * cos2SigmaM)
                    )
                )
            );

            var distance = b * A * (sigma - deltaSigma);

            distance = distance.toFixed(3); // round to 1mm precision

            if (s.elevation && e.elevation) {
                var climb = Math.abs(s.elevation - e.elevation);
                distance = Math.sqrt(distance * distance + climb * climb);
            }

            return Math.floor(
                Math.round(distance / accuracy) * accuracy
            );

            /*
            // note: to return initial/final bearings in addition to distance, use something like:
            var fwdAz = Math.atan2(cosU2*sinLambda,  cosU1*sinU2-sinU1*cosU2*cosLambda);
            var revAz = Math.atan2(cosU1*sinLambda, -sinU1*cosU2+cosU1*sinU2*cosLambda);
            return { distance: s, initialBearing: fwdAz.toDeg(), finalBearing: revAz.toDeg() };
            */

        },

        /**
         * Calculates the distance between two spots.
         * This method is more simple but also far more inaccurate
         *
         * @param    object    Start position {latitude: 123, longitude: 123}
         * @param    object    End position {latitude: 123, longitude: 123}
         * @param    integer   Accuracy (in meters)
         * @return   integer   Distance (in meters)
         */
        getDistanceSimple: function(start, end, accuracy) {
            accuracy = Math.floor(accuracy) || 1;
            var s = this.coords(start);
            var e = this.coords(end);
            if (s.latitude === e.latitude &&
                s.longitude === e.longitude) {
                return 0;
            }
            var slat = s['latitude'].toRad();
            var slon = s['longitude'].toRad();
            var elat = e['latitude'].toRad();
            var elon = e['longitude'].toRad();
            var distance =
                Math.round(
                    Math.acos(
                        Math.sin(
                            elat
                        ) *
                        Math.sin(
                            slat
                        ) +
                        Math.cos(
                            elat
                        ) *
                        Math.cos(
                            slat
                        ) *
                        Math.cos(
                            slon - elon
                        )
                    ) * this.earthRadius
                );

            return Math.floor(Math.round(distance / accuracy) * accuracy);

        },

        /**
         * Calculates the center of a collection of geo coordinates
         *
         * @param        array       Collection of coords [{latitude: 51.510, longitude: 7.1321}, {latitude: 49.1238, longitude: "8° 30' W"}, ...]
         * @return       object      {latitude: centerLat, longitude: centerLng}
         */
        getCenter: function(coords) {

            if (!coords.length) {
                return false;
            }

            var X = 0.0;
            var Y = 0.0;
            var Z = 0.0;
            var lat, lon, hyp, coord;

            for (var i = 0, l = coords.length; i < l; ++i) {
                coord = this.coords(coords[i]);
                lat = coord.latitude * Geolib.TO_RAD;
                lon = coord.longitude * Geolib.TO_RAD;

                X += Math.cos(lat) * Math.cos(lon);
                Y += Math.cos(lat) * Math.sin(lon);
                Z += Math.sin(lat);

            }

            var nb_coords = coords.length;
            X = X / nb_coords;
            Y = Y / nb_coords;
            Z = Z / nb_coords;

            lon = Math.atan2(Y, X);
            hyp = Math.sqrt(X * X + Y * Y);
            lat = Math.atan2(Z, hyp);

            return {
                latitude: (lat * Geolib.TO_DEG).toFixed(6),
                longitude: (lon * Geolib.TO_DEG).toFixed(6)
            };

        },

        getBoundsZoomLevel: function(bounds, mapDim, worldDim) {
            worldDim = worldDim || 256;
            var zoomMax = 22;

            function latRad(lat) {
                var sin = Math.sin(lat * Math.PI / 180);
                var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
                return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
            }

            function zoom(mapPx, worldPx, fraction) {
                return Math.round(Math.log(mapPx / worldPx / fraction) / Math.LN2);
            }

            var ne = bounds.ne;
            var sw = bounds.sw;

            var latFraction = (latRad(ne.latitude) - latRad(sw.latitude)) / Math.PI;

            var lngDiff = ne.longitude - sw.longitude;
            var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

            var latZoom = zoom(mapDim.height, worldDim, latFraction);
            var lngZoom = zoom(mapDim.width, worldDim, lngFraction);

            return Math.min(Math.min(latZoom, lngZoom), zoomMax);
        },
        // getZoom: function(longDelta, pixelWidth) {
        //     var zoomScale = longDelta * 85445659.44705395 * Math.PI / 180.0 / pixelWidth;
        //     var regionZoom = 20 - Math.log(zoomScale);
        //     if (regionZoom < 0) regionZoom = 0;
        //     return regionZoom;
        // },

        getSpanFromPixels: function(pixelWidth, _pos, _zoom) {
            var mpp = this.getMetersPerPixel(_pos, _zoom);
            var meters = pixelWidth * mpp;
            return meters / this.earthRadius * 180 / Math.PI;
        },

        /**
         * Gets the max and min, latitude, longitude, and elevation (if provided).
         * @param        array       array with coords e.g. [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         * @return   object      {maxLat: maxLat,
         *                     minLat: minLat
         *                     maxLng: maxLng,
         *                     minLng: minLng,
         *                     maxElev: maxElev,
         *                     minElev: minElev}
         */
        getBounds: function(coords) {

            if (!coords.length) {
                return false;
            }
            var stats = {
                maxLat: -Infinity,
                minLat: Infinity,
                maxLng: -Infinity,
                minLng: Infinity,
                maxElev: -Infinity,
                minElev: Infinity
            };

            var coord;
            for (var i = 0, l = coords.length; i < l; ++i) {
                coord = this.coords(coords[i]);
                stats.maxLat = Math.max(coord['latitude'], stats.maxLat);
                stats.minLat = Math.min(coord['latitude'], stats.minLat);
                stats.maxLng = Math.max(coord['longitude'], stats.maxLng);
                stats.minLng = Math.min(coord['longitude'], stats.minLng);
                if (coord['elevation']) {
                    stats.maxElev = Math.max(coord['elevation'], stats.maxElev);
                    stats.minElev = Math.min(coord['elevation'], stats.minElev);
                }
            }
            if (stats.maxLat === stats.minLat) {
                stats.maxLat += 0.002;
                stats.minLat -= 0.002;
            }
            if (stats.maxLng === stats.minLng) {
                stats.maxLng += 0.002;
                stats.minLng -= 0.002;
            }

            return stats;

        },
        scaleBounds: function(_region, _deltaFactor) {
            if (_deltaFactor !== 0) {
                var delta = Math.max(_region.ne.latitude - _region.sw.latitude,
                    _region.ne.longitude - _region.sw.longitude) * _deltaFactor;
                _region.sw.latitude -= delta;
                _region.sw.longitude -= delta;
                _region.ne.latitude += delta;
                _region.ne.longitude += delta;
            }
            return _region;
        },
        getAroundData: function(bounds) {
            var center = this.getCenter([bounds.sw, bounds.ne]);
            sdebug('center', center);
            var distance = Math.max(
                this.getDistance({
                    latitude: bounds.sw.latitude,
                    longitude: bounds.sw.longitude
                }, center), this.getDistance({
                    latitude: bounds.ne.latitude,
                    longitude: bounds.ne.longitude
                }, center));
            sdebug('radius', distance);
            return {
                centerCoordinate: center,
                radius: distance
            }
        },
        getBoundsOfDistance: function(point, distance) {

            var latitude = this.latitude(point);
            var longitude = this.longitude(point);

            var radLat = latitude.toRad();
            var radLon = longitude.toRad();

            var radDist = distance / this.earthRadius;
            var minLat = radLat - radDist;
            var maxLat = radLat + radDist;

            var MAX_LAT_RAD = this.maxLat.toRad();
            var MIN_LAT_RAD = this.minLat.toRad();
            var MAX_LON_RAD = this.maxLon.toRad();
            var MIN_LON_RAD = this.minLon.toRad();

            var minLon;
            var maxLon;

            if (minLat > MIN_LAT_RAD && maxLat < MAX_LAT_RAD) {

                var deltaLon = Math.asin(Math.sin(radDist) / Math.cos(radLat));
                minLon = radLon - deltaLon;

                if (minLon < MIN_LON_RAD) {
                    minLon += Geolib.PI_X2;
                }

                maxLon = radLon + deltaLon;

                if (maxLon > MAX_LON_RAD) {
                    maxLon -= Geolib.PI_X2;
                }

            } else {
                // A pole is within the distance.
                minLat = Math.max(minLat, MIN_LAT_RAD);
                maxLat = Math.min(maxLat, MAX_LAT_RAD);
                minLon = MIN_LON_RAD;
                maxLon = MAX_LON_RAD;
            }

            return {
                sw: {
                    latitude: minLat.toDeg(),
                    longitude: minLon.toDeg()
                },
                ne: {
                    latitude: maxLat.toDeg(),
                    longitude: maxLon.toDeg()
                }
            };

        },

        /**
         * Checks whether a point is inside of a polygon or not.
         * Note that the polygon coords must be in correct order!
         *
         * @param        object      coordinate to check e.g. {latitude: 51.5023, longitude: 7.3815}
         * @param        array       array with coords e.g. [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         * @return       bool        true if the coordinate is inside the given polygon
         */
        isPointInside: function(latlng, coords) {
            var ci, cj, c = this.coords(latlng);
            for (var result = false, i = -1, l = coords.length, j = l - 1; ++i < l; j = i) {
                ci = this.coords(coords[i]);
                cj = this.coords(coords[j]);

                if (
                    (
                        (ci.longitude <= c.longitude && c.longitude <
                            cj.longitude) ||
                        (cj.longitude <= c.longitude && c.longitude <
                            ci.longitude)
                    ) &&
                    (
                        c.latitude < (cj.latitude - ci.latitude) *
                        (c.longitude - ci.longitude) /
                        (cj.longitude - ci.longitude) +
                        ci.latitude
                    )
                ) {
                    result = !result;
                }

            }

            return result;

        },

        /**
         * Pre calculate the polygon coords, to speed up the point inside check.
         * Use this function before calling isPointInsideWithPreparedPolygon()
         * @see          Algorythm from http://alienryderflex.com/polygon/
         * @param        array       array with coords e.g. [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         */
        preparePolygonForIsPointInsideOptimized: function(coords) {

            var ci, cj;
            for (var i = 0, j = coords.length - 1; i < coords.length; i++) {
                ci = this.coords(coords[i]);
                cj = this.coords(coords[j]);
                if (cj.longitude === ci.longitude) {

                    coords[i].constant = ci.latitude;
                    coords[i].multiple = 0;

                } else {

                    coords[i].constant = ci.latitude - (
                        ci.longitude * cj.latitude
                    ) / (
                        cj.longitude - ci.longitude
                    ) + (
                        ci.longitude * ci.latitude
                    ) / (
                        cj.longitude - ci.longitude
                    );

                    coords[i].multiple = (
                        cj.latitude - ci.latitude
                    ) / (
                        cj.longitude - ci.longitude
                    );

                }

                j = i;

            }

        },

        /**
         * Checks whether a point is inside of a polygon or not.
         * "This is useful if you have many points that need to be tested against the same (static) polygon."
         * Please call the function preparePolygonForIsPointInsideOptimized() with the same coords object before using this function.
         * Note that the polygon coords must be in correct order!
         *
         * @see          Algorythm from http://alienryderflex.com/polygon/
         *
         * @param     object      coordinate to check e.g. {latitude: 51.5023, longitude: 7.3815}
         * @param     array       array with coords e.g. [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         * @return        bool        true if the coordinate is inside the given polygon
         */
        isPointInsideWithPreparedPolygon: function(point, coords) {

            var flgPointInside = false,
                y = this.longitude(point),
                x = this.latitude(point),
                ci, cj;

            for (var i = 0, j = coords.length - 1; i < coords.length; i++) {
                ci = this.coords(coords[i]);
                cj = this.coords(coords[j]);
                if ((ci.longitude < y && cj.longitude >= y ||
                        cj.longitude < y && ci.longitude >= y)) {

                    flgPointInside ^= (y * coords[i].multiple + coords[i].constant < x);

                }

                j = i;

            }

            return flgPointInside;

        },

        /**
         * Shortcut for geolib.isPointInside()
         */
        isInside: function() {
            return this.isPointInside.apply(this, arguments);
        },

        /**
         * Checks whether a point is inside of a circle or not.
         *
         * @param        object      coordinate to check (e.g. {latitude: 51.5023, longitude: 7.3815})
         * @param        object      coordinate of the circle's center (e.g. {latitude: 51.4812, longitude: 7.4025})
         * @param        integer     maximum radius in meters
         * @return       bool        true if the coordinate is within the given radius
         */
        isPointInCircle: function(latlng, center, radius) {
            return this.getDistance(latlng, center) < radius;
        },

        /**
         * Shortcut for geolib.isPointInCircle()
         */
        withinRadius: function() {
            return this.isPointInCircle.apply(this, arguments);
        },

        /**
         * Gets rhumb line bearing of two points. Find out about the difference between rhumb line and
         * great circle bearing on Wikipedia. It's quite complicated. Rhumb line should be fine in most cases:
         *
         * http://en.wikipedia.org/wiki/Rhumb_line#General_and_mathematical_description
         *
         * Function heavily based on Doug Vanderweide's great PHP version (licensed under GPL 3.0)
         * http://www.dougv.com/2009/07/13/calculating-the-bearing-and-compass-rose-direction-between-two-latitude-longitude-coordinates-in-php/
         *
         * @param        object      origin coordinate (e.g. {latitude: 51.5023, longitude: 7.3815})
         * @param        object      destination coordinate
         * @return       integer     calculated bearing
         */
        getRhumbLineBearing: function(originLL, destLL) {

            // difference of longitude coords
            var diffLon = this.longitude(destLL).toRad() - this.longitude(originLL).toRad();

            // difference latitude coords phi
            var diffPhi = Math.log(
                Math.tan(
                    this.latitude(destLL).toRad() / 2 + Geolib.PI_DIV4
                ) /
                Math.tan(
                    this.latitude(originLL).toRad() / 2 + Geolib.PI_DIV4
                )
            );

            // recalculate diffLon if it is greater than pi
            if (Math.abs(diffLon) > Math.PI) {
                if (diffLon > 0) {
                    diffLon = (Geolib.PI_X2 - diffLon) * -1;
                } else {
                    diffLon = Geolib.PI_X2 + diffLon;
                }
            }

            //return the angle, normalized
            return (Math.atan2(diffLon, diffPhi).toDeg() + 360) % 360;

        },

        /**
         * Gets great circle bearing of two points. See description of getRhumbLineBearing for more information
         *
         * @param        object      origin coordinate (e.g. {latitude: 51.5023, longitude: 7.3815})
         * @param        object      destination coordinate
         * @return       integer     calculated bearing
         */
        getBearing: function(originLL, destLL) {

            var da = this.latitude(destLL),
                dl = this.longitude(destLL),
                al = this.latitude(originLL),
                ol = this.longitude(originLL);

            var bearing = (
                (
                    Math.atan2(
                        Math.sin(dl.toRad() - ol.toRad()) *
                        Math.cos(da.toRad()),
                        Math.cos(al.toRad()) *
                        Math.sin(da.toRad()) -
                        Math.sin(al.toRad()) *
                        Math.cos(da.toRad()) *
                        Math.cos(dl.toRad() - ol.toRad())
                    )
                ).toDeg() + 360
            ) % 360;

            return bearing;

        },

        /**
         * Gets the compass direction from an origin coordinate to a destination coordinate.
         *
         * @param        object      origin coordinate (e.g. {latitude: 51.5023, longitude: 7.3815})
         * @param        object      destination coordinate
         * @param        string      Bearing mode. Can be either circle or rhumbline
         * @return       object      Returns an object with a rough (NESW) and an exact direction (NNE, NE, ENE, E, ESE, etc).
         */
        getCompassDirection: function(originLL, destLL, bearingMode) {

            var direction;
            var bearing;

            if (bearingMode == 'circle') {
                // use great circle bearing
                bearing = this.getBearing(originLL, destLL);
            } else {
                // default is rhumb line bearing
                bearing = this.getRhumbLineBearing(originLL, destLL);
            }
            return this.getCompassInfo(bearing);
        },
        getCompassInfo: function(bearing) {
            var result;
            switch (Math.round(bearing / 22.5)) {
                case 1:
                    result = {
                        exact: "NNE",
                        rough: "N"
                    };
                    break;
                case 2:
                    result = {
                        exact: "NE",
                        rough: "N"
                    };
                    break;
                case 3:
                    result = {
                        exact: "ENE",
                        rough: "E"
                    };
                    break;
                case 4:
                    result = {
                        exact: "E",
                        rough: "E"
                    };
                    break;
                case 5:
                    result = {
                        exact: "ESE",
                        rough: "E"
                    };
                    break;
                case 6:
                    result = {
                        exact: "SE",
                        rough: "E"
                    };
                    break;
                case 7:
                    result = {
                        exact: "SSE",
                        rough: "S"
                    };
                    break;
                case 8:
                    result = {
                        exact: "S",
                        rough: "S"
                    };
                    break;
                case 9:
                    result = {
                        exact: "SSW",
                        rough: "S"
                    };
                    break;
                case 10:
                    result = {
                        exact: "SW",
                        rough: "S"
                    };
                    break;
                case 11:
                    result = {
                        exact: "WSW",
                        rough: "W"
                    };
                    break;
                case 12:
                    result = {
                        exact: "W",
                        rough: "W"
                    };
                    break;
                case 13:
                    result = {
                        exact: "WNW",
                        rough: "W"
                    };
                    break;
                case 14:
                    result = {
                        exact: "NW",
                        rough: "W"
                    };
                    break;
                case 15:
                    result = {
                        exact: "NNW",
                        rough: "N"
                    };
                    break;
                default:
                    result = {
                        exact: "N",
                        rough: "N"
                    };
            }

            result['bearing'] = bearing;
            return result;

        },
        getMppAtZoom: function(_zoom, pos) {
            var lat = this.latitude(pos);
            return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, _zoom);
        },
        getMapScale: function(_mpp, _maxWidth) {
            var distance = _mpp * _maxWidth;
            sdebug('Geolib.PX_PER_CM', Geolib.PX_PER_CM);
            var round = _getRoundNum(distance);
            var realMetersPerScreenCM = _mpp * Geolib.PX_PER_CM * 100;
            var roundMeters = _getRoundNum(realMetersPerScreenCM)
            var result = {
                width: _maxWidth * round / distance,
                distance:distance,
                scale: roundMeters,
                realScale: realMetersPerScreenCM,
                scaleWidth: _maxWidth * roundMeters / realMetersPerScreenCM,
                text: this.formatter.distance(round)
            }
            return result;
        },
        getMapScaleAtZoom: function(_zoom, pos) {
            var mpp = this.getMppAtZoom(_zoom, pos);
            var realMetersPerScreenCM = mpp * Geolib.PX_PER_CM * 100;
            var roundMeters = _getRoundNum(realMetersPerScreenCM)
            var result = {
                scale: roundMeters,
                realScale: realMetersPerScreenCM,
            }
            sdebug('getMapScaleAtZoom', _zoom, pos, mpp, result);
            return result;
        },
        /**
         * Shortcut for getCompassDirection
         */
        getDirection: function(originLL, destLL, bearingMode) {
            return this.getCompassDirection.apply(this, arguments);
        },

        /**
         * Sorts an array of coords by distance from a reference coordinate
         *
         * @param        object      reference coordinate e.g. {latitude: 51.5023, longitude: 7.3815}
         * @param        mixed       array or object with coords [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         * @return       array       ordered array
         */
        orderByDistance: function(latlng, coords) {

            var coordsArray = [];

            for (var coord in coords) {
                var c = this.coords(coords[coord]);
                var d = this.getDistance(latlng, c);

                coordsArray.push({
                    key: coord,
                    latitude: this.latitude(coords[coord]),
                    longitude: this.longitude(coords[coord]),
                    distance: d
                });

            }

            return coordsArray.sort(function(a, b) {
                return a.distance - b.distance;
            });

        },

        /**
         * Finds the nearest coordinate to a reference coordinate
         *
         * @param        object      reference coordinate e.g. {latitude: 51.5023, longitude: 7.3815}
         * @param        mixed       array or object with coords [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         * @return       array       ordered array
         */
        findNearest: function(latlng, coords, offset, limit) {

            offset = offset || 0;
            limit = limit || 1;
            var ordered = this.orderByDistance(latlng, coords);

            if (limit === 1) {
                return ordered[offset];
            } else {
                return ordered.splice(offset, limit);
            }

        },

        /**
         * Calculates the length of a given path
         *
         * @param        mixed       array or object with coords [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...]
         * @return       integer     length of the path (in meters)
         */
        getPathLength: function(coords) {

            var dist = 0;
            var last, coord;

            for (var i = 0, l = coords.length; i < l; ++i) {
                coord = this.coords(coords[i]);
                if (last) {
                    dist += this.getDistanceSimple(coord, last);
                }
                last = coord;
            }

            return dist;

        },

        /**
         * Calculates the speed between to points within a given time span.
         *
         * @param        object      coords with javascript timestamp {latitude: 51.5143, longitude: 7.4138, time: 1360231200880}
         * @param        object      coords with javascript timestamp {latitude: 51.5502, longitude: 7.4323, time: 1360245600460}
         * @param        object      options (currently "unit" is the only option. Default: km(h));
         * @return       float       speed in unit per hour
         */
        getSpeed: function(start, end, options) {

            var unit = options && options.unit || (this.metrics ? 'km' : 'mi');

            if (unit == 'mph') {
                unit = 'mi';
            } else if (unit == 'kmh') {
                unit = 'km';
            }

            var distance = geolib.getDistance(start, end);
            var time = ((end.timestamp * 1) / 1000) - ((start.timestamp * 1) / 1000);
            var mPerHr = (distance / time) * 3600;
            var speed = Math.round(mPerHr * this.measures[unit] * 10000) / 10000;
            return speed;

        },

        /**
         * Converts a distance from meters to km, mm, cm, mi, ft, in or yd
         *
         * @param        string      Format to be converted in
         * @param        float       Distance in meters
         * @param        float       Decimal places for rounding (default: 4)
         * @return       float       Converted distance
         */
        convertUnit: function(distance, unit, round) {

            if (distance === 0) {

                return 0;

            }

            unit = unit || (this.metrics ? 'm' : 'ft');

            if (typeof this.measures[unit] !== 'undefined') {
                var result = distance * this.measures[unit];
                if (round !== undefined) {
                    result = this.round(result, round);
                }
                return result;
            } else {
                throw new Error('Unknown unit for conversion.');
            }

        },
        getFormattedDistance: function(_ll1, _ll2) {
            if (_ll1 && _ll2) {
                var distance = this.getDistanceSimple(_ll1, _ll2);
                return this.formatter.distance(distance);
            }
            return '';

        },
        getMetersPerPixel: function(_pos, _zoom) {
            //156543.03392804097 == 2 * Math.PI * 6378137 / 256
            // return dpi undependant pixels
            return 156543.03392804097 * Math.cos(_pos.latitude * Math.PI / 180) / Math.pow(2, _zoom);
        },
        formatter: {
            altitude: function(_altitude, _unit) {
                _unit = _unit || (geolib.metrics ? 'm' : 'ft');
                return (_altitude * geolib.measures[_unit]).toFixed() + ' ' + _unit;
            },
            latLng: function(_obj, _format) {
                var c = geolib.coords(_obj);
                var result = {
                    latitude: c.latitude,
                    longitude: c.latitude,
                    elevation: c.elevation ? this.altitude(c.elevation) : undefined,
                };
                switch (_format) {
                    case 2:
                        result.latitude = c.latitude.toFixed(4) + '° N';
                        result.longitude = c.longitude.toFixed(4) + '° E';
                        break;
                    case 1:
                        result.latitude = geolib.decimal2sexagesimal(c.latitude);
                        result.longitude = geolib.decimal2sexagesimal(c.longitude);
                        break;
                    default:
                    case 0:
                        result.latitude = c.latitude.toFixed(4);
                        result.longitude = c.longitude.toFixed(4);
                        break;
                }
                return result;
            },
            latLngString: function(_obj, _format, _join) {
                var result = this.latLng(_obj, _format);

                return result.latitude + (_join || ' ') + result.longitude;
            },
            distance: function(_distance, _unit, _factor) {
                //input in meters!
                _unit = _unit || (geolib.metrics ? 'm' : 'ft');
                // var newunit = _unit;
                // sdebug('distance', _distance, _unit);
                _factor = _factor || 1;
                var dec = 0;

                if (_unit === 'm' && _distance >= _factor * 1000) {
                    dec = 1;
                    _unit = 'km';
                } else if (_unit === 'yd' && _distance >= _factor * 1760) {
                    dec = 1;
                    _unit = 'mi';
                } else if (_unit === 'ft' && _distance >= _factor * 5280) {
                    dec = 1;
                    _unit = 'mi';
                }
                var result = _distance * geolib.measures[_unit];
                // sdebug('distance2', result, dec);
                if (result >= 100) {
                    dec = 0;
                } else if (result < 10) {
                    dec *= 2;
                    result = Math.round(result * 100) / 100;
                    var decimal = result - Math.floor(result);
                    // sdebug('decimal', decimal);
                    if (decimal < 0.1) {
                        dec = 0;
                    }
                }

                return result.toFixed(dec) + ' ' + _unit;
            },
            address: function(_address, _multiline) {
                if (!!_multiline) {
                    return _address.display_name.replace(', ', '\n');
                }
                return _address.display_name;
            },
            speed: function(_speed, _unit) {
                _unit = _unit || (geolib.metrics ? 'km' : 'mi');

                var dec = 0;
                if (_unit == 'mph') {
                    _unit = 'mi';
                } else if (_unit == 'kmh') {
                    _unit = 'km';
                }
                var result = 1000 * _speed * geolib.measures[_unit];
                if (result >= 100) {
                    dec = 0;
                } else if (result < 10) {
                    dec *= 2;
                    result = Math.round(result * 100) / 100;
                    var decimal = result - Math.floor(result);
                    // sdebug('decimal', decimal);
                    if (decimal < 0.1) {
                        dec = 0;
                    }
                }
                return result.toFixed(dec) + ' ' + _unit.replace('mi', 'mp') + '/h';
            }
        },
        /**
         * Checks if a value is in decimal format or, if neccessary, converts to decimal
         *
         * @param        mixed       Value(s) to be checked/converted (array of latlng objects, latlng object, sexagesimal string, float)
         * @return       float       Input data in decimal format
         */
        useDecimal: function(value) {

            if (Object.prototype.toString.call(value) === '[object Array]') {

                var geolib = this;

                value = value.map(function(val) {

                    //if(!isNaN(parseFloat(val))) {
                    if (geolib.isDecimal(val)) {

                        return geolib.useDecimal(val);

                    } else if (typeof val == 'object') {

                        if (geolib.validate(val)) {

                            return geolib.coords(val);

                        } else {

                            for (var prop in val) {
                                val[prop] = geolib.useDecimal(val[prop]);
                            }

                            return val;

                        }

                    } else if (geolib.isSexagesimal(val)) {

                        return geolib.sexagesimal2decimal(val);

                    } else {

                        return val;

                    }

                });

                return value;

            } else if (typeof value === 'object' && this.validate(value)) {

                return this.coords(value);

            } else if (typeof value === 'object') {

                for (var prop in value) {
                    value[prop] = this.useDecimal(value[prop]);
                }

                return value;

            }

            if (this.isDecimal(value)) {

                return parseFloat(value);

            } else if (this.isSexagesimal(value) === true) {

                return parseFloat(this.sexagesimal2decimal(value));

            }

            throw new Error('Unknown format.');

        },

        /**
         * Converts a decimal coordinate value to sexagesimal format
         *
         * @param        float       decimal
         * @return       string      Sexagesimal value (XX° YY' ZZ")
         */
        decimal2sexagesimal: function(dec) {

            if (dec in this.sexagesimal) {
                return this.sexagesimal[dec];
            }

            var tmp = dec.toString().split('.');

            var deg = Math.abs(tmp[0]);
            var min = ('0.' + tmp[1]) * 60;
            var sec = min.toString().split('.');

            min = Math.floor(min);
            sec = (('0.' + sec[1]) * 60).toFixed(2);

            this.sexagesimal[dec] = (deg + '° ' + min + "' " + sec + '"');

            return this.sexagesimal[dec];

        },

        /**
         * Converts a sexagesimal coordinate to decimal format
         *
         * @param        float       Sexagesimal coordinate
         * @return       string      Decimal value (XX.XXXXXXXX)
         */
        sexagesimal2decimal: function(sexagesimal) {

            if (sexagesimal in this.decimal) {
                return this.decimal[sexagesimal];
            }

            var regEx = new RegExp(this.sexagesimalPattern);
            var data = regEx.exec(sexagesimal);
            var min = 0,
                sec = 0;

            if (data) {
                min = parseFloat(data[2] / 60);
                sec = parseFloat(data[4] / 3600) || 0;
            }

            var dec = ((parseFloat(data[1]) + min + sec)).toFixed(8);
            //var   dec = ((parseFloat(data[1]) + min + sec));

            // South and West are negative decimals
            dec = (data[7] == 'S' || data[7] == 'W') ? parseFloat(-dec) : parseFloat(dec);
            //dec = (data[7] == 'S' || data[7] == 'W') ? -dec : dec;

            this.decimal[sexagesimal] = dec;

            return dec;

        },

        /**
         * Checks if a value is in decimal format
         *
         * @param        string      Value to be checked
         * @return       bool        True if in sexagesimal format
         */
        isDecimal: function(value) {

            value = value.toString().replace(/\s*/, '');

            // looks silly but works as expected
            // checks if value is in decimal format
            return (!isNaN(parseFloat(value)) && parseFloat(value) == value);

        },

        /**
         * Checks if a value is in sexagesimal format
         *
         * @param        string      Value to be checked
         * @return       bool        True if in sexagesimal format
         */
        isSexagesimal: function(value) {

            value = value.toString().replace(/\s*/, '');

            return this.sexagesimalPattern.test(value);

        },

        round: function(value, n) {
            var decPlace = Math.pow(10, n);
            return Math.round(value * decPlace) / decPlace;
        }

    });

    // Node module
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        global.geolib = module.exports = geolib;

        // AMD module
    } else if (typeof define === "function" && define.amd) {

        define("geolib", [], function() {
            return geolib;
        });

        // we're in a browser
    } else {

        global.geolib = geolib;

    }

}(this));