var lang = Ti.App.Properties.getString('language');
// app = require('akylas.commonjs.dev/akylas.commonjs').createApp(this, { // not using var seems very important, cant really see why!
    app = require('akylas.commonjs').createApp(this, { // not using var seems very important, cant really see why!
    modules: {
        admob: 'akylas.admob',
        shapes: 'akylas.shapes',
        slidemenu: 'akylas.slidemenu',
        map: 'akylas.googlemap',
        charts: 'akylas.charts',
        paint: 'ti.paint',
        zoomableimage: 'akylas.zoomableimage',
        ios:{
            wikitude: 'com.wikitude.ti'
        }
        // crosswalk: 'com.universalavenue.ticrosswalk',
    },
    showAds: Ti.App.Properties.getBool('show_ads', true),
    offlineMode: Ti.App.Properties.getBool('offline', false),

    servicesKeys: require('API_KEYS').keys,
    defaultLanguage: 'en',
    forceLanguage: lang,
    commonjsOptions: {
        underscore: 'lodash',
        modules: ['ti', 'moment', 'lang'],
        additions: ['string']
    },
    // templatesPreRjss: ['text'],
    templates: ['row', 'view'],
    utilities: true,
    mappings: [
        // ['crosswalk', 'WebView', 'WebView'],
        ['slidemenu', 'SlideMenu', 'SlideMenu'],
        ['map', 'View', 'MapView'],
        ['map', 'Annotation', 'MapAnnotation'],
        ['map', 'Route', 'MapRoute'],
        ['map', 'TileSource', 'MapTileSource'],
        ['map', 'Cluster', 'MapCluster'],
        ['shapes', 'View', 'ShapeView'],
        ['shapes', 'Circle', 'ShapeCircle'],
        ['shapes', 'Arc', 'ShapeArc'],
        ['shapes', 'PieSlice', 'ShapePieSlice'],
        ['charts', 'LineChart', 'LineChart'],
        ['charts', 'PlotLine', 'PlotLine'],
        // ['admob', 'Interstitial', 'Interstitial']
    ],
    ifApple: function(app) {
        if (app.info.deployType !== 'development') {
            app.modules.plcrashreporter = require('akylas.plcrashreporter');
            //     app.modules.testfairy = require('akylas.testfairy');
        }
        app.modules.statusbarnotification = require('akylas.statusbarnotification');
    },
    // ifAndroid: function(app) {
    //     ak.ti.redux.fn.addNaturalConstructor(this, 'crosswalk', 'WebView', 'WebView');
    // },
    windowManager: {
        androidNav: true
    }
});

function main() {

    __LIST__ = 'list';
    __MARKERS__ = 'markers';
    __ITEMS__ = 'items';
    __ROUTES__ = 'routes';

    _.mixin({
        getKeyByValue: function(object, value) {
            return _.findKey(object, function(hashValue) {
                return value === hashValue;
            });
        },
        mapIfDefined: function(array, func) {
            return _.reduce(array, function(memo, value, key) {
                var item = func(value, key);
                if (item) {
                    memo.push(item);
                }
                return memo;
            }, []);
        },
        mod: function(n, m) {
            return ((n % m) + m) % m;
        },
        move: function(array, oldIndex, newIndex) {
            array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);

        }
    });

    Color = require('lib/tinycolor');
    require("lib/string_score.min");

    function getContrastColor(_color) {
        var color = Color(_color);
        var light = color.isLight();
        // var test = ((color.red * 299) + (color.green * 587) + (color.blue * 114)) * 255 / 1000;

        // var light = (test > 144);
        var color1 = Color(light ? '#222' : '#fff');
        var method = light ? 'darken' : 'lighten';
        var result = {
            isLight: light,
            luminance: color.getLuminance(),
            color: color.toHex8String(),
            contrast: color1.toHex8String(),
            contrastGray: color1.clone()[method].apply(color1, [0.2]).toHex8String(),
            darkerRel: color.clone()[method].apply(color, [0.2]).toHex8String(),
            lightenRel: color.clone()[method].apply(color, [-0.2]).toHex8String(),
            darker: color.clone().darken(8).toHex8String(),
            darkest: color.clone().darken(20).toHex8String(),
            darkestRel: color[method].apply(color, [20]).toHex8String()
        };
        return result;
    }

    var dataDir = Ti.Filesystem.applicationDataDirectory;
    var imageHoldingDir = Ti.Filesystem.getFile(dataDir, 'images');
    if (!imageHoldingDir.exists()) {
        imageHoldingDir.createDirectory();
    }
    var imageDir = imageHoldingDir.nativePath;
    if (!_.endsWith(imageDir, '/')) {
        imageDir += '/';
    }
    imageHoldingDir = null;

    function showMessage(_text, _colors) {
        var args = {
            text: _text,
        };
        if (_colors.color) {
            args.backgroundColor = _colors.color;
            args.color = _colors.contrast;
        } else {
            args.backgroundColor = _colors || $cTheme.main;
        }
        if (__APPLE__) {
            app.modules.statusbarnotification.showMessage(args);
        } else {

        }
    }
    _.assign(app, {
        showMessage: showMessage,
        tutorial: Ti.App.Properties.getBool('tutorial', true),
        icons: _.mapValues(require('data/icons').icons, function(value) {
            return String.fromCharCode(value);
        }),
        colors: _.mapValues({
            'red': '#B03621',
            'green': '#82E182',
            'blue': '#375EC6'
        }, getContrastColor),

        getContrastColor: getContrastColor,
        createThemeColors: function(_mainColor) {
            return {
                main: _mainColor,
                semi: Color(_mainColor).darken(8).setAlpha(0.7).toHex8String(),
                dark: Color(_mainColor).darken(15).toHex8String(),
                selector: _mainColor
            };
        },
        getColors: function(_item, _desc) {
            var colors = _desc && _desc.colors;
            if (_item && _item.color) {
                colors = app.getContrastColor(_item.color);
            }
            if (!colors) {
                colors = app.getContrastColor($cTheme.main);
            }
            return colors;
        },
        getFilteredImage: function(_image, _options) {
            var filename = _image.split('/').pop();
            var ext = filename.split('.').pop();
            var imageId = _.reduce(_options, function(memo, value, key) {
                return memo + '_' + key + '_' + value;
            }, filename) + '.' + ext;
            var result = app.getImagePath(imageId);
            var file = Ti.Filesystem.getFile(result);

            if (!file.exists()) {
                file.write(Ti.Image.getFilteredImage(_image, _options));
            }
            return result;
        },
        getImagePath: function(_image) {
            if (_.startsWith(_image, 'http')) {
                return _image;
            }
            return imageDir + _image;
        },
        getThumbnailImagePath:function(_photo){
        return app.getImagePath(_photo.thumbnailImage || _photo.thumbnail || _photo.image);
    }

    });

    // ak.locale.storeMissingTranslations = true;
    app.main();

    app.needsUpdate = function(_key) {
        return app.updates && !!app.updates[_key];
    }

    if (Ti.App.Properties.getString('update.check.version', '') !== app.info.version) {
        app.updates = {
            annot_images: true
        };
        Ti.App.Properties.setString('update.check.version', app.info.version);
        sdebug('app.updates', app.updates);
    }

    __DEVELOPMENT__ = app.info.deployType === 'development';
    var indexIcons = [];
    for (var key in app.icons) {
        indexIcons.push([trc(key), app.icons[key]]);
    }
    app.indexedIcons = _.sortBy(indexIcons, function(n) {
        return n[0];
    });
    app.indexedColors = _(require('data/palette').colors).pairs().value();

    // SunCalc = require('suncalc');
    _.assign(app, {
        texts: {
            'ccopyright': '<small><font color="gray">' + app.utilities.htmlIcon($sCC) +
                'BY-SA 2.0</font></small>'
        },
        utils: {
            geolib: require('lib/geolib'),
            FuzzySet: require('lib/fuzzyset'),
            // openingHours: require('lib/opening_hours'),
            convert: require('lib/convert'),
            suncalc: require('suncalc')
        }
    });
    // SunCalc = undefined;
    app.modules.map.googleMapAPIKey = app.servicesKeys.google;
    var openingHours = require('lib/opening_hours');
    require('ui/mapModules/MapModule').init(this);
    require(
        "lib/moment-duration-format");

    _.assign(app, {
        api: require('lib/api').init(this, app.global),
        locationManager: require('lib/locationManager').create(this),
        itemHandler: require('lib/itemHandler'),
        setMetrics: function(_value) {
            if (app.utils.geolib.metrics !== _value) {
                sdebug('setMetrics', _value);
                app.utils.geolib.metrics = _value;
                Ti.App.Properties.setBool('distance_metric', _value);
                app.emit('distance_metric_changed');
            }
        },
        setTempMetrics: function(_value) {
            if (app.tempMetrics !== _value) {
                sdebug('setTempMetrics', _value);
                app.tempMetrics = _value;
                Ti.App.Properties.setBool('temp_metric', _value);
                app.emit('temp_metric_changed');
            }
        },
        localeInfo: ak.getLocaleInfo(),
        offlineMode: false,
        setOfflineMode: function(_value) {
            if (app.offlineMode !== _value) {
                sdebug('setOfflineMode', _value);
                app.offlineMode = _value;
                app.api.offlineMode = _value;
                app.modules.map.offlineMode = _value;
                Ti.App.Properties.setBool('offline', _value);
                if (_value === false) {
                    app.showAlert(trc('restart_for_the_map_to_refresh'));
                }
                app.emit('offline_changed', {
                    value: _value
                });
            }
        },
        openingHours: function(_value, _args) {
            return new openingHours(_value, _args, 2);
        },
        shouldShowAds: function() {
            sdebug('shouldShowAds', app.showAds, app.offlineMode);
            return !__DEVELOPMENT__ && app.showAds && !app.offlineMode && app.api.networkConnected;
            // return app.showAds && !app.offlineMode && app.api.networkConnected;
        },
        setCurrentLocation: function(e) {
            // sdebug('setCurrentLocation', e);
            var coords = e.coords;
            app.currentLocation = coords;
            app.emit('location', {
                location: coords
            });
        },
        getBluredScreenshot: function(_args) {
            return Ti.Image.getFilteredScreenshot(_.merge({
                scale: 0.4,
                filters: [{
                    radius: 2,
                    type: Ti.Image.FILTER_IOS_BLUR
                }],
                tint: '#44000000',
                blend: Ti.UI.BlendMode.DARKEN
            }, _args));
        },
        showOptionsListDialog: function(_options, _callback) {

            app.ui.openWindow((new OptionsListWindow({
                options: _options
            }).on('click', _callback)));
        },
        showViewFullScreen: function(_view, _fromView) {
            var originalWidth = _view.width || 'FILL';
            var originalHeight = _view.height || 'FILL';
            var originalLeft = _view.left || null;
            var originalTop = _view.top || null;
            var sourceRect = _fromView.absoluteRect;
            var win = new AppWindow({

                blurredBackground: true,
                navBarHidden: true,
                customNavBar: false,
                backgroundColor: 'transparent',
                // underContainerView: backView,
                lightweight: true,
                verticalContainer: false,
                containerView: _view
            }).on('click', function() {
                win.closeMe();
            });
            win.underContainer.opacity = 0;
            var startRect = {
                left: sourceRect.x,
                top: sourceRect.y + (__APPLE__ ? $navBarTop : 0),
                width: sourceRect.width,
                height: sourceRect.height
            };
            sdebug('startRect', startRect);
            _view.applyProperties(startRect);
            win.closeMe = function() {
                win.animate({
                    underContainer:{
                        opacity:0
                    },
                    container: startRect,
                    duration: 200
                }, function() {
                    app.ui.closeWindow(win, {
                        animated: false
                    });
                    win = null;
                });
            };
            win.once('open', function() {
                win.animate({
                    underContainer:{
                        opacity:1
                    },
                    container: {
                        left: originalLeft,
                        top: originalTop,
                        width: originalWidth,
                        height: originalHeight,
                    },
                    duration: 200
                });

            });
            app.ui.openWindow(win);
        }
    });
    app.setMetrics(Ti.App.Properties.getBool('distance_metric', true));
    app.setTempMetrics(Ti.App.Properties
        .getBool('temp_metric', true));
    app.setOfflineMode(Ti.App.Properties.getBool('offline', false));
    app.locationManager
        .watchPosition(app.setCurrentLocation);

    app.contentModules = _.map(Ti.Filesystem.getFile('contentModules').getDirectoryListing(), function(value) {
        return value.slice(0, -3);
    });
    // app.contentModules = [
    //     'panoramio',
    //     'facebook',
    //     'refuges.info',
    //     'c2c',
    //     'wikipedia',
    //     // 'wikitude',
    // ],
    // app.locationManager.start();
    app.ui.leftmenu = new LeftMenu();
    app.ui.mainwindow = new MainWindow();
    app.ui.topWindow = app.ui.rootWindow = app.ui.slidemenu = new SlideMenu({
        exitOnClose: true,
        leftView: app.ui.leftmenu,
        centerView: app.ui.mainwindow
    });
    if (app.tutorialManager) {
        app.showTutorials = app.tutorialManager.showTutorials;
    } else {
        app.showTutorials = function() {}
    }

    // if (app.tutorialManager.enabled) {
    app.ui.slidemenu.once('openmenu', function() {
        app.showTutorials(['offline_mode']);
    });
    // }

    app.showAlert = _.flowRight(app.showAlert, function(_args) {
        if (_.isString(_args)) {
            return {
                message: _args,
                constructorName: 'CustomAlertView'
            };
        }
        _args.constructorName = 'CustomAlertView';
        return _args;
    });
    var oldFunc = app.confirmAction;
    app.confirmAction = function(_args, _c1, _c2) {
        _args.constructorName = 'CustomAlertView';
        return oldFunc.apply(this, [_args, _c1, _c2]);
    };

    /// !RATING
    var shouldShowRatingAlert = Ti.App.Properties.getBool('show_rating_alert', true);
    var appRatingTimingCount = Ti.App.Properties.getInt('rating_count', 0);
    Ti.App.Properties.setInt(
        'rating_count', appRatingTimingCount);

    function showRatingAlert() {
        var title = trc('rate').assign(app.info.name);
        var dialog = Ti.UI.createAlertDialog({
            cancel: 1,
            persistent: true,
            buttonNames: [trc('rate_now'), trc('later'), trc('no_thanks')],
            message: trc('rate_question').assign(app.info.name),
            title: title
        });
        dialog.addEventListener('click', function(e) {
            if (e.index === 2) {
                Ti.App.Properties.setBool('show_rating_alert', false);
                alert(tr('rate_expl_false'));
            } else if (e.cancel === false) {
                if (__APPLE__) {
                    Ti.Platform.openURL('itms-apps://itunes.apple.com/app/id1045609978');
                } else {
                    Ti.Platform.openURL('market://details?id=' + app.info.id);
                }
            }
        });
        dialog.show();
    }
    /// !RATING

    /// !ADMOB
    app.showInterstitialIfNecessary = function() {};
    // if (app.showAds) {
    // var interstitialTimingCount = 0;
    // var interstitial = new Interstitial();

    // app.showInterstitialIfNecessary = function() {
    //     interstitialTimingCount++;
    //     if (app.shouldShowAds() && interstitialTimingCount % 6 === 0) {
    //         sdebug('showInterstitial');
    //         if (interstitial.loaded) {
    //             interstitial.show();
    //         } else {
    //             interstitial.load();
    //         }
    //     }
    // };

    // }
    Ti.App.on('resume', function(e) {
        appRatingTimingCount++;
        if (shouldShowRatingAlert && appRatingTimingCount % 10 === 0) {
            showRatingAlert();
        }
        // app.showInterstitialIfNecessary();
    });

    /// !ADMOB
    app.ui.slidemenu.once('open', function() {
        Ti.App.emit('resume');
    });
    app.ui.openWindow(app.ui.slidemenu);

    Ti.Network.on('change', app.api.updateNetwork);
    app.on('error', function(e) {
        sdebug(e);
        if (!e.silent) {
            if (app.api.networkConnected && !app.offlineMode) {
                app.showAlert(e);
            } else {
                showMessage(e.message, app.colors.red);
            }
        }
    });
    app.api.updateNetwork();

    app.showImageFullscreen = function(_photos, _index, _fromView) {
        app.ui.createAndOpenWindow('FullscreenImageWindow', {
            photos: _photos,
            photoIndex: _index,
            fromView: _fromView,
        });
    };

    sdebug(app.deviceinfo);
    sdebug(app.info);
    sdebug(app.localeInfo);

    if (app.modules.plcrashreporter) {
        var writeCrashLog = function(_data) {
            var crashDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'crashlogs');
            if (!crashDir.exists()) {
                crashDir.createDirectory();
            }
            Ti.Filesystem.getFile(crashDir.resolve(), moment().toString() + '.log').write(_data);
        };

        var sendCrashLogs = function() {
            var crashDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'crashlogs');
            var logs = crashDir.getDirectoryListing();
            if (!logs || logs.length === 0)
                return;
            sdebug('logs', logs);
            if (app.api.networkConnected) {
                Ti.UI.createAlertDialog({
                    cancel: 1,
                    persistent: true,
                    buttonNames: [trc('yes'), trc('later'), trc('no')],
                    message: trc('send_crash_report'),
                    title: trc('found_a_crash')
                }).on('click', function(e) {
                    if (e.index === 0) {
                        var emailDialog = Ti.UI.createEmailDialog({
                            subject: "[" + app.info.name + "][CrashReport]",
                            toRecipients: ['contact@akylas.fr'],
                            // barColor: $cTheme.main,
                            // html:true,
                            messageBody: (JSON.stringify(app.deviceinfo, null,
                                    2) +
                                '\n' + JSON.stringify(
                                    app.info, null, 2))
                        });
                        emailDialog.on('complete', function(e2) {
                            if (!!e2.success) {
                                crashDir.deleteDirectory(true);
                            }
                        });
                        for (var i = 0; i < logs.length; i++) {
                            emailDialog.addAttachment(Titanium.Filesystem.getFile(crashDir.resolve(),
                                logs[
                                    i]));
                        }
                        emailDialog.open();
                    } else if (e.cancel === false) {
                        crashDir.deleteDirectory(true);
                    }
                }).show();
            }
        };
        app.modules.plcrashreporter.enableCrashReporter();
        var data = app.modules.plcrashreporter.loadPendingCrashReport();
        if (data && !data.error) {
            sdebug('found a crash log');
            writeCrashLog(data);
            app.modules.plcrashreporter.purgePendingCrashReport();
        }
        sendCrashLogs();
        // setTimeout(function() {
        //     app.modules.plcrashreporter.triggerCrash();
        // }, 5000);
    }
    // sdebug(app.modules.map.googleMapLicenses);
}
main();