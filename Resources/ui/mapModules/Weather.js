// import MapModule from './MapModule'
const MapModule = require('./MapModule').MapModule;
exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        suncalc = app.utils.suncalc,
        utilities = app.utilities,
        animationDuration = 200,
        type = itemHandler.initializeType('weather_station', _.cloneDeep(require('data/markertypes').data.weather_station)),
        stations = {},
        annotations = {},
        convertTemp = function(_temp, _unit) {
            //input in meters!
            _unit = _unit || (app.tempMetrics ? 'c' : 'f');
            if (_unit === 'f') {
                _temp = _temp * 1.8 + 32.00;
            }
            return Math.round(_temp);
        },
        DAILY_MS = 24 * 3600 * 1000,
        itemWeatherData = Ti.App.Properties.getObject('weather', {}),
        cluster,
        iconStyleView = new View({
            properties: {
                layout: 'vertical',
                width: 50,
                height: 70,
            },
            childTemplates: [{
                type: 'Ti.UI.ImageView',
                bindId: 'image',
                properties: {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#393939cc',
                    scaleType: Ti.UI.SCALE_TYPE_ASPECT_FILL
                }
            }, {

                type: 'Ti.UI.Label',
                bindId: 'label',
                properties: {
                    font: {
                        size: 13,
                        weight: 'bold'
                    },
                    width: 'FILL',
                    height: 'FILL',
                    strokeWidth: 2,
                    verticalAlign: 'top',
                    textAlign: 'center',
                    color: '#2B292B',
                    strokeColor: '#F6F6F6'
                }
            }]
        }),
        self = new MapModule(_args);

    function getCluster() {
        if (!cluster) {
            cluster = new MapCluster({
                image: app.getImagePath(itemHandler.getAnnotImage(type, {
                    iconSettings: {
                        style: 10,
                        scale: 0.3
                    },
                    color: 'transparent'
                })),
                touchable: false,
                maxDistance: 20,
                showText: false,
            });
            self.mapView.addCluster(cluster);
        }
        return cluster;
    }

    function getAnnotImage(_item) {
        iconStyleView.applyProperties({
            image: {
                image: 'http://raw.githubusercontent.com/farfromrefug/akylas.alpi.maps/master/images/weather3/' +
                    _item.weather[0].icon + '.png'
            },
            label: {
                text: Math.round(_item.main.temp) + '˚'
            }
        });
        return iconStyleView.toImage();
    }

    function cleanup() {
        var now = moment().valueOf();
        var data;
        for (var key in itemWeatherData) {
            data = itemWeatherData[key];
            var lastTime = _.last(data.list).dt;
            if (lastTime >= now) {
                delete itemWeatherData[key];
            }
        }
    }
    save(); //cleanup on start

    function save() {
        cleanup();
        Ti.App.Properties.setObject('weather', itemWeatherData);
    }

    function weatherView(_data, _moment, _now, _color, _specific) {
        var timeText = (_specific && _moment.format('LT')) || _moment.format('LT');
        if (!_specific) {
            timeText = (_moment.valueOf() <= _now) ? trc('now') : (timeText.split(':')[0] + (timeText.split(' ')[1] ||
                ''));
            delta = convertTemp((_data.main.temp_max - _data.main.temp_min) / 2);
        }
        var result = {
            hour: {
                text: timeText,
                color: _color
            },
            temp: {
                html: (_specific && tr(_data.id)) || (
                    convertTemp(_data.main.temp) + '°' + (delta && ('<font color="#bbb">± ' +
                        delta + '</font>') || ''))
            },
            icon: {
                image: 'http://raw.githubusercontent.com/farfromrefug/akylas.alpi.maps/master/images/weather3/' +
                    ((_specific &&
                        _data.id) || _data.weather[
                        0].icon) + '.png',
                scaleType: Ti.UI.SCALE_TYPE_ASPECT_FIT
            }
        };

        return result;
    }

    function onRemoved(e) {
        sdebug('onRemoved', e);
        e.items.forEach(function(item) {
            delete itemWeatherData[item.id];
        });
        Ti.App.Properties.setObject('weather', itemWeatherData);
    }

    Object.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            app.off(_EVENT_ITEMS_REMOVED_, onRemoved);
            cluster = null;
        }),
        onInit: function() {
            app.on(_EVENT_ITEMS_REMOVED_, onRemoved);
        },
        clear: function() {
            if (cluster) {
                cluster.removeAllAnnotations();
            }
            stations = {};
        },
        onModuleLongAction: function(_params) {
            if (_params.id === 'weather') {
                self.clear();
            }
        },
        actionsForItem: function(_item, _desc, _onMap, result) {
            result.splice(result.length - 1, 0, ['weather', {
                icon: app.icons.weather,
                color: '#D77825',
                text: 'weather'
            }]);
        },
        getSupplyTemplates: function(memo) {
            memo.weather = app.templates.row.weather;
        },
        getItemSupplViews: function(_item, _desc) {
            var data = itemWeatherData[_item.id];
            var hasData = false;
            if (data) {
                var momentTime, time, now = moment(),
                    nextTime,
                    count = 0,
                    nowms = now.valueOf(),
                    nowDay = now.dayOfYear(),
                    lastTime,
                    currentDay,
                    sundata, currentDate,
                    isSunset, isSunrise;
                // sdebug('found getItemSupplViews', data);
                var sections = [{
                    // headerView: {
                    //     label: {
                    //         text: ''
                    //     }
                    // },
                    items: []
                }];
                var items = sections[0].items,
                    color = 'darkgray',
                    theData, nexData;
                for (var i = 0; i < data.list.length; i++) {
                    theData = data.list[i];
                    nextData = data.list[i + 1];
                    nextTime = nextData && moment(nextData.dt * 1000);

                    momentTime = moment(theData.dt * 1000);
                    currentDay = momentTime.dayOfYear();
                    time = momentTime.valueOf();

                    if (nextTime && nextTime.valueOf() < nowms) { //check last time to get the first one
                        continue;
                    }

                    // sdebug('handling', i, momentTime.format('LT'));
                    isSunrise = sundata && sundata.sunrise < time && sundata.sunrise >
                        lastTime;
                    hasData = count >= 2;
                    if (isSunrise) {
                        items.push(weatherView({
                            id: 'sunrise'
                        }, moment(sundata.sunrise), nowms, color, true));
                    } else {
                        isSunset = !isSunrise && sundata && sundata.sunset < time && sundata.sunset >
                            lastTime;
                        if (isSunset) {
                            items.push(weatherView({
                                id: 'sunset'
                            }, moment(sundata.sunset), nowms, color, true));
                        }
                    }
                    if (currentDate != momentTime.dayOfYear()) {
                        currentDate = momentTime.dayOfYear();
                        sundata = _.mapValues(suncalc.getTimes(momentTime.toDate(), _item.latitude,
                            _item.longitude), function(date) {
                            return date.getTime();
                        });
                    }
                    count++;
                    items.push(weatherView(theData, momentTime, nowms, color));
                    if (nextTime && currentDay !== nextTime.dayOfYear()) {
                        if ((nextTime.dayOfYear() - nowDay) >= 3) {
                            break;
                        }
                        items = [];
                        sections.push({
                            headerView: {
                                label: {
                                    text: nextTime.format('ddd')
                                }
                            },
                            items: items
                        });
                        var step = Math.round(360 / 6);
                        color = Color({
                            h: (nextTime.dayOfYear() % step) * step,
                            s: 1,
                            l: 0.3
                        }).toHex8String();
                    }
                    lastTime = time;
                }
                // sdebug(sections);
                if (hasData) {
                    return {
                        template: 'weather',
                        collectionview: {
                            sections: sections
                        }
                    };
                } else {
                    delete itemWeatherData[_item.id];
                    Ti.App.Properties.setObject('weather', itemWeatherData);
                }

            }
        },
        onModuleAction: function(_params) {
            if (_params.id === 'weather') {

                var request = app.api.openWeatherMapRegion({
                    region: self.mapView.region,
                    zoom: self.mapView.zoom,
                }).then(function(_stations) {
                    var annotsToAdd = [];
                    var count = _stations.length;
                    // var cluster = getCluster();
                    var item,
                        sId, annot;
                    for (var i = 0; i < count; i++) {
                        item = _stations[i];
                        sId = item.id + '';
                        if (!stations[sId]) {
                            stations[sId] = item;
                            annotations[sId] = annot = new MapAnnotation({
                                // selectable: false,
                                zIndex: 0,
                                image: getAnnotImage(item),
                                hasInfo: false,
                                item: item,
                                latitude: item.coord.lat,
                                longitude: item.coord.lon,
                            });
                            annotsToAdd.push(annot);
                        } else {
                            stations[sId] = item;
                            annot = annotations[sId];
                            annot.applyProperties({
                                image: getAnnotImage(item),
                                item: item
                            });
                        }
                    }
                    getCluster().addAnnotation(annotsToAdd);
                    if (count === 1) {
                        self.mapView.centerCoordinate = [_stations[0].coord.lat, _stations[0].coord
                            .lon
                        ];
                    }
                    (_params.parent || self.window).hideLoading();
                }, function(err) {
                    (_params.parent || self.window).hideLoading();
                });
                (_params.parent || self.window).showLoading({
                    request: request,
                    label: {
                        html: utilities.htmlIcon(type.icon, 1) + ' ' + trc('loading') +
                            '...'
                    }
                });
            } else if (_params.command === 'weather') {

                var item = _params.item;
                var isRoute = itemHandler.isItemARoute(item);

                var request = app.api.openWeatherForecast(item.start || item).then(function(_result) {
                    // sdebug(_result);
                    itemWeatherData[item.id] = Object.assign(_result, {
                        timestamp: moment().valueOf()
                    });
                    save();
                    app.emit('ItemSupplyViewUpdate', {
                        item: item
                    });
                    if (isRoute) {
                        app.showTutorials(['weather_route'], true);
                    }
                    // sdebug(itemWeatherData);

                    (_params.parent || self.window).hideLoading();
                }, function(err) {
                    (_params.parent || self.window).hideLoading();
                });
                (_params.parent || self.window).showLoading({
                    request: request,
                    label: {
                        html: utilities.htmlIcon(type.icon, 1) + ' ' + trc('loading') +
                            '...'
                    }
                });
            }
            else if(_params.command === 'weather_long') {

                var item = _params.item;

                var options = ['meteoblue', 'clear_data'];

                new OptionDialog({
                    options: _.map(options, function(value,
                        index) {
                        return trc(value);
                    }),
                    buttonNames: [trc('cancel')],
                    cancel: 0,
                    tapOutDismiss: true
                }).on('click', (function(e) {
                    if (!e.cancel) {
                        var option = options[e.index];
                        switch (option) {
                            case 'meteoblue':
                                var url = _.deburr('https://www.meteoblue.com/' + tr(
                                        'en') +
                                    '/' +
                                    tr(
                                        'weather') + '/' + tr('forecast') + '/' +
                                    tr(
                                        'week') +
                                    '/' + item.latitude.toFixed(4) + 'N' + item.longitude
                                    .toFixed(
                                        4) + 'E');
                                itemHandler.showFloatingWebView(trc(option), url, item,
                                    _params.desc, (
                                        _params.parent || self.window), _params.mapHandler
                                );
                                break;
                            case 'clear_data':
                                if (itemWeatherData[item.id]) {
                                    delete itemWeatherData[item.id];
                                    Ti.App.Properties.setObject('weather',
                                        itemWeatherData);
                                    app.emit('ItemSupplyViewUpdate', {
                                        item: item
                                    });
                                }

                                break;
                        }

                    }
                }).bind(this)).show();
            } else {
                return false;
            }
            return true;
        }
    });
    return self;
};