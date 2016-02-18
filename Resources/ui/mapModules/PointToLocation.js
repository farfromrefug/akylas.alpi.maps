exports.settings = {};
exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        convert = app.utils.convert,
        utfGrid = app.modules.map.createUTFGrid({
            id: 'map1.utfGrid',
            url: 'http://beta.map1.eu/tiles/{z}/{x}/{y}.js.gz',
            maxZoom: 17
        });

    function prepareFeatures(_data) {
        if (!_data) {
            return;
        }
        var features = [];
        var data;
        for (i in _data) {
            data = _data[i];
            features[i] = {
                tags: {}
            }
            for (prop in data) {
                if (data.hasOwnProperty(prop)) {
                    if (prop == 'wikipedia') {
                        features[i]['wikipedia'] = data[prop].replace(':',
                            '.wikipedia.org/wiki/')
                    } else if (prop == 'name') {
                        features[i]['name'] = data[prop]
                    } else if (prop == 'osm_id') {
                        features[i]['osm_id'] = data[prop]
                    } else if (prop == 'website') {
                        features[i]['website'] = data[prop]
                    } else if (prop == 'way_area') {
                        features[i]['way_area'] = data[prop]
                    } else {
                        features[i]['tags'][prop] = data[prop];
                    }
                }
            }
        }
        // sdebug('prepareFeatures', _data, features);
        return {
            features: features
        };
    }
    self = new _context.MapModule(_args);

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            self.mapView.removeTileSource(utfGrid);
            utfGrid = null;
        }),
        onInit: function() {
            self.mapView.addTileSource(utfGrid);
        },
        shouldBeEnabledByDefault: function() {
            return false;
        },

        onMapPress: function(e) {
            var loc = _.pick(e, 'latitude', 'longitude', 'altitude');
            var datas = utfGrid.getData(loc, e.zoom);
            sdebug(datas);
            if (datas) {
                var data = prepareFeatures(datas);
                for (var i = 0; i < data.features.length; i++) {
                    var item = convert.prepareUtfGridResult(data.features[i]);
                    if (item) {
                        sdebug('item', item);
                        break;
                    }
                }
                var last = _.findLast(datas, function(o) {
                    return o.hasOwnProperty('name');
                });
                sdebug('last', last);
                if (last) {
                    app.showMessage(last.name);
                }
                if (__DEVELOPMENT__) {
                    self.parent.showDebugText(JSON.stringify(datas));
                }
            }
        },
        getDroppedExtra: function(_location, _zoom) {
            var data = prepareFeatures(utfGrid.getData(_location, _zoom));
            if (data) {
                sdebug('prepareFeatures', data);
                for (var i = 0; i < data.features.length; i++) {
                    var item = convert.prepareUtfGridResult(data.features[i]);
                    if (item) {
                        return item;
                        break;
                    }
                }
            }
        },
    });
    return self;
};