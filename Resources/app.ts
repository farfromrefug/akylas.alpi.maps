
import * as process from 'process'

require('akylas.commonjs.dev/akylas.commonjs').load(this, {
    // app = require('akylas.commonjs').createApp(this, {
    // not using var seems very important, cant really see why!
    underscore: '../lodash',
    modules: ['ti', 'moment', 'lang'],
    additions: ['string']
});

Ti.include('ui/mapModules/MapModule.js');
require('lib/moment-duration-format');
const OpeningHours = require('lib/opening_hours');
const chain = require('lib/chain');
_.mixin({
    getKeyByValue: function (object, value) {
        return _.findKey(object, function (hashValue) {
            return value === hashValue;
        });
    },
    mapIfDefined: function (array, func) {
        return _.reduce(array, function (memo, value, key) {
            var item = func(value, key);
            if (item) {
                memo.push(item);
            }
            return memo;
        }, []);
    },
    mod: function (n, m) {
        return ((n % m) + m) % m;
    },
    move: function (array, oldIndex, newIndex) {
        array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
    }
});
import { AKApp } from './akylas.commonjs.dev/AkInclude/App'
import * as Color from 'tinycolor2';
declare global {
    var Color: Color;
}

export interface ContrastColor {
    isLight: boolean
    luminance: number
    color: string
    contrast: string
    contrastGray: string
    darkerRel: string
    lightenRel: string
    darker: string
    darkest: string
    darkestRel: string
}

export function getContrastColors(_color): ContrastColor {
    let color: tinycolorInstance = Color(_color);
    //light means dark content and thus white contrast
    var light = color.getBrightness() < 140;

    var color1 = Color(light ? '#fff' : '#222');
    var method = light ? 'darken' : 'lighten';
    var result = {
        isLight: light,
        luminance: color.getLuminance(),
        color: color.toRgbString(),
        contrast: color1.toRgbString(),
        contrastGray: color1.clone()[method].apply(color1, [0.2])
            .toRgbString(),
        darkerRel: color.clone()[method].apply(color, [0.2])
            .toRgbString(),
        lightenRel: color.clone()[method].apply(color, [-0.2])
            .toRgbString(),
        darker: color.clone()
            .darken(8)
            .toRgbString(),
        darkest: color.clone()
            .darken(20)
            .toRgbString(),
        darkestRel: color[method].apply(color, [20])
            .toRgbString()
    };
    return result;
}
export function showMessage(_text, _colors?) {
    var args: any = {
        text: _text,
    };
    if (_colors && _colors.color) {
        args.backgroundColor = _colors.color;
        args.color = _colors.contrast;
    } else {
        args.backgroundColor = _colors || $.cTheme.main;
    }
    if (__APPLE__) {
        app.modules.statusbarnotification.showMessage(args);
    } else {
        Ti.UI.showSnackbar(Object.assign(args, {
            gravity: 48
        }));
    }
}
var dataDir = Ti.Filesystem.applicationDataDirectory;
var paths = {};
_.each(['images', 'files', 'mbtiles'], function (key) {
    var holdingDir = Ti.Filesystem.getFile(dataDir, key);
    if (!holdingDir.exists()) {
        holdingDir.createDirectory();
    }
    var theDir = holdingDir.nativePath;
    if (!_.endsWith(theDir, '/')) {
        theDir += '/';
    }
    paths[key] = theDir;
});

function getDataPath(_dir, _path) {
    if (_.startsWith(_path, 'http')) {
        return _path;
    }
    return paths[_dir] + _path;
}

declare global {
    interface IApp extends App { }
}
export class App extends AKApp {
    ui: WindowManager
    templates: { view: TemplateModule, row: TemplateModule }
    api: any
    showAds = Ti.App.Properties.getBool('show_ads', true)
    offlineMode = false
    servicesKeys = require('API_KEYS').keys
    utilities: Utils = require('lib/utilities')
    constructor(context) {
        super(context, {
            modules: {
                // admob: 'akylas.admob',
                shapes: 'akylas.shapes',
                slidemenu: 'akylas.slidemenu',
                map: 'akylas.googlemap',
                charts: 'akylas.charts',
                charts2: 'akylas.charts2',
                paint: 'ti.paint',
                zoomableimage: 'akylas.zoomableimage',
                ios: {
                    wikitude: 'com.wikitude.ti',
                },
                android: {
                    // connectiq: 'akylas.connectiq',
                    // crosswalk: 'com.universalavenue.ticrosswalk'
                }
            },

            defaultLanguage: 'en-US',
            forceLanguage: Ti.App.Properties.getString('language'),
            templates: ['row', 'view'],
            mappings: {
                'SlideMenu': ['slidemenu', 'SlideMenu'],
                'MapView': ['map', 'View',],
                'MapAnnotation': ['map', 'Annotation'],
                'MapRoute': ['map', 'Route'],
                'MapTileSource': ['map', 'TileSource'],
                'MapCluster': ['map', 'Cluster'],
                'ShapeView': ['shapes', 'View'],
                'ShapeCircle': ['shapes', 'Circle'],
                'ShapeArc': ['shapes', 'Arc'],
                'ShapePieSlice': ['shapes', 'PieSlice'],
                'LineChart': ['charts', 'LineChart'],
                'PlotLine': ['charts', 'PlotLine'],
                // },
                // android: {
                // 'WebView': ['crosswalk', 'WebView']
            },
            ifApple: function (app) {
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
        if (__ANDROID__) {
            // this.mapModules.push('Connectiq');
        }
        __DEVELOPMENT__ = this.info.deployType === 'development';
        if (Ti.App.Properties.getString('update.check.version', '') !== this.info.version) {
            this.updates = {
                annot_images: true
            };
            Ti.App.Properties.setString('update.check.version', this.info.version);
            sdebug('app.updates', this.updates);
        }
        this.developerMode = Ti.App.Properties.getBool('developerMode', __DEVELOPMENT__)

        var indexIcons = [];
        for (var key in this.icons) {
            indexIcons.push([trc(key), this.icons[key]]);
        }
        this.indexedIcons = _.sortBy(indexIcons, function (n) {
            return n[0];
        })
    }
    mapModules = [
        'Tutorial',
        'ListsModule',
        'Items',
        'UserLocation',
        'MarkerInfo',
        'SearchAround',
        'Search',
        'MapActionButtons',
        'PositionInfo',
        'Crosshair',
        'Directions',
        'LocationButton',
        'TileSourceManager',
        'Wikitude',
        'PointToLocation',
        'Weather'
    ]
    errorToString(error) {
        try {
            let errorMessage;
            if (_.isString(error)) {
                errorMessage = error;
            } else {
                errorMessage = error.message || error.error;
            }
            return errorMessage;
        } catch (err) {
            console.log('errorToString error', err);
        }
    }
    showMessage = showMessage
    tutorial = Ti.App.Properties.getBool('tutorial', false)
    icons = _.mapValues(require('data/icons')
        .icons,
        function (value) {
            return String.fromCharCode(value);
        })
    colors = _.mapValues({
        red: '#B03621',
        green: '#82E182',
        blue: '#375EC6'
    }, getContrastColors)
    loadVariables() {
        Ti.include('$variables.js');
    }
    getContrastColors = getContrastColors
    createThemeColors(_mainColor) {
        return {
            main: _mainColor,
            semi: Color(_mainColor)
                .darken(8)
                .setAlpha(0.7)
                .toHex8String(),
            dark: Color(_mainColor)
                .darken(15)
                .toHex8String(),
            selector: _mainColor
        };
    }
    getColors(_item, _desc) {
        var colors = _desc && _desc.colors;
        if (_item && _item.color) {
            colors = app.getContrastColors(_item.color);
        }
        if (!colors) {
            colors = app.getContrastColors($.cTheme.main);
        }
        return colors;
    }
    getFilteredImage(_image, _options) {
        var filename = _image.split('/')
            .pop();
        var ext = filename.split('.')
            .pop();
        var imageId = _.reduce(_options, function (memo, value, key) {
            return memo + '_' + key + '_' + value.toString().replace('#', '');
        }, filename) + '.' + ext;
        var result = app.getImagePath(imageId);
        var file = Ti.Filesystem.getFile(result);
        console.log('getFilteredImage', _image, _options, result, file.exists());

        // if (!file.exists()) {
        file.write(Ti.Image.getFilteredImage(_image, _options));
        // }
        return result;
    }
    getImagePath = _.partial(getDataPath, 'images')
    getFilePath = _.partial(getDataPath, 'files')
    getPath(_path) {
        return paths[_path];
    }
    getThumbnailImagePath = (_photo) => {
        return this.getImagePath(_photo.thumbnailImage || _photo.thumbnail || _photo.image);
    }
    updates: { [key: string]: any }
    needsUpdate = (_key) => {
        return this.updates && !!this.updates[_key];
    }
    indexedIcons: string[]
    indexedColors = _(require('data/palette').colors).toPairs().value()
    developerMode = false
    texts: { [key: string]: string }
    utils: { [key: string]: any }
    locationManager = require('lib/locationManager').create(this)
    itemHandler: any
    tempMetrics = false
    setMetrics = (_value) => {
        if (this.utils.geolib.metrics !== _value) {
            sdebug('setMetrics', _value);
            app.utils.geolib.metrics = _value;
            Ti.App.Properties.setBool('distance_metric', _value);
            this.emit('distance_metric_changed');
        }
    }
    setTempMetrics = (_value) => {
        if (this.tempMetrics !== _value) {
            sdebug('setTempMetrics', _value);
            this.tempMetrics = _value;
            Ti.App.Properties.setBool('temp_metric', _value);
            this.emit('temp_metric_changed');
        }
    }
    setDeveloperMode = (_value) => {
        if (this.developerMode !== _value) {
            sdebug('setDeveloperMode', _value);
            this.showMessage('may the force be with you!');
            this.developerMode = _value;
            Ti.App.Properties.setBool('developerMode', _value);
        }
    }
    localeInfo = ak.getLocaleInfo()
    setOfflineMode = (_value) => {
        if (this.offlineMode !== _value) {
            sdebug('setOfflineMode', _value);
            this.offlineMode = _value;
            this.api.offlineMode = _value;
            this.modules.map.offlineMode = _value;
            Ti.App.Properties.setBool('offline', _value);
            if (_value === false) {
                this.showAlert(trc('restart_for_the_map_to_refresh'));
            }
            this.emit('offline_changed', {
                value: _value
            });
        }
    }
    openingHours(_value, _args) {
        return new OpeningHours(_value, _args, 2);
    }
    shouldShowAds() {
        // sdebug('shouldShowAds', app.showAds, app.offlineMode);
        return false;
        // return !__DEVELOPMENT__ && app.showAds && !app.offlineMode && app.api.networkConnected;
        // return app.showAds && !app.offlineMode && app.api.networkConnected;
    }
    currentLocation: { latitude: number, longitude: number }
    setCurrentLocation = (e) => {
        // sdebug('setCurrentLocation', e);
        var coords = e.coords;
        this.currentLocation = coords;
        this.emit('location', {
            location: coords
        });
    }
    getBluredScreenshot(_args) {
        return Ti.Image.getFilteredScreenshot(_.merge({
            scale: 0.4,
            filters: [{
                radius: 2,
                type: Ti.Image.FILTER_IOS_BLUR
            }],
            tint: '#00000044',
            blend: Ti.UI.BlendMode.DARKEN
        }, _args));
    }
    showOptionsListDialog(_options, _callback) {

        app.ui.openWindow((new OptionsListWindow({
            options: _options
        })
            .on('click', _callback)));
    }
    showViewFullScreen(_view, _fromView) {
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
        })
            .on('click', function () {
                win.closeMe();
            });
        win.underContainer.opacity = 0;
        var startRect = {
            left: sourceRect.x,
            top: sourceRect.y + (__APPLE__ ? $.navBarTop : 0),
            width: sourceRect.width,
            height: sourceRect.height
        };
        sdebug('startRect', startRect);
        _view.applyProperties(startRect);
        win.closeMe = function () {
            win.animate({
                underContainer: {
                    opacity: 0
                },
                container: startRect,
                duration: 200
            }, function () {
                app.ui.closeWindow(win, {
                    animated: false
                });
                win = null;
            });
        };
        win.once('open', function () {
            win.animate({
                underContainer: {
                    opacity: 1
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
    contentModules = Ti.Filesystem.getFile('contentModules')
        .getDirectoryListing().filter(function (name) {
            return _.endsWith(name, 'js');
        }).map(
        function (value) {
            return value.slice(0, -3);
        })
    showInterstitialIfNecessary() {
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
    };
    tutorialManager: any
    showTutorials(args) {
        if (this.tutorialManager) {
            return this.tutorialManager.showTutorials(args);
        }

    }
    showImageFullscreen = (_photos, _index, _fromView) => {
        this.ui.createAndOpenWindow('FullscreenImageWindow', {
            photos: _photos,
            photoIndex: _index,
            fromView: _fromView,
        });
    }
}

__LIST__ = 'list';
__MARKERS__ = 'markers';
__ITEMS__ = 'items';
__ROUTES__ = 'routes';



require('lib/string_score.min');
app = new App(this);

// ak.locale.storeMissingTranslations = true;
app.main();
app.utils = {
    filesize: require('lib/filesize'),
    geolib: require('lib/geolib'),
    // FuzzySet: require('lib/fuzzyset'),
    // openingHours: require('lib/opening_hours'),
    convert: require('lib/convert'),
    humanizeDuration: require('lib/humanize-duration'),
    suncalc: require('suncalc'),
}
app.texts = {
    ccopyright: '<small><font color="gray">' + app.utilities.htmlIcon($.sCC) +
    'BY-SA 2.0</font></small>'
};
app.api = require('lib/api').init(this)
app.itemHandler = require('lib/itemHandler')
app.modules.map.googleMapAPIKey = app.servicesKeys.google;

app.setMetrics(Ti.App.Properties.getBool('distance_metric', true));
app.setTempMetrics(Ti.App.Properties
    .getBool('temp_metric', true));
app.setOfflineMode(Ti.App.Properties.getBool('offline', false));
app.locationManager
    .watchPosition(app.setCurrentLocation);

// if (__APPLE__) {
//     app.mapModules.push('Weather');
// }
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

// if (app.tutorialManager.enabled) {
app.ui.slidemenu.once('openmenu', function () {
    // app.showTutorials(['offline_mode']);
});
// }

app.showAlert = _.flowRight(app.showAlert, function (_args) {
    console.log('showAlert', _args);
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
app.confirmAction = function (_args, _c1, _c2) {
    _args.constructorName = 'CustomAlertView';
    return oldFunc.apply(this, [_args, _c1, _c2]);
};

/// !RATING
var shouldShowRatingAlert = Ti.App.Properties.getBool('show_rating_alert', true);
var appRatingTimingCount = Ti.App.Properties.getInt('rating_count', 0);
Ti.App.Properties.setInt(
    'rating_count', appRatingTimingCount);

function showRatingAlert() {
    var title = trc('rate')
        .assign(app.info.name);
    var dialog = Ti.UI.createAlertDialog({
        cancel: 1,
        persistent: true,
        buttonNames: [trc('rate_now'), trc('later'), trc('no_thanks')],
        message: trc('rate_question')
            .assign(app.info.name),
        title: title
    });
    dialog.addEventListener('click', function (e) {
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

// }
Ti.App.on('resume', function (e) {
    appRatingTimingCount++;
    if (shouldShowRatingAlert && appRatingTimingCount % 10 === 0) {
        showRatingAlert();
    }
    // app.showInterstitialIfNecessary();
});

/// !ADMOB
app.ui.slidemenu.once('open', function () {
    Ti.App.emit('resume');
});
app.ui.openWindow(app.ui.slidemenu);

Ti.Network.on('change', app.api.updateNetwork);
process.on("unhandledRejection", (reason, promise) => {
    app.emit('error', { error: reason })
});
app.on('error', function (e) {
    console.log('on app error', typeof e.error, e.error);
    if (!e.error.isCustomError && (e.error.stack || e.error.longStack || e.error.nativeLocation)) {
        console.log('throwing error so that it shows in Ti');
        throw e.error;
    }
    let errorMessage = app.errorToString(e.error);
    if (!e.silent) {
        app.showAlert({
            title: trc('error'),
            message: errorMessage
        });
    } else {
        showMessage(errorMessage, app.colors.red);
    }
    // }
});
app.api.updateNetwork();

sdebug(app.deviceinfo);
sdebug(app.info);
sdebug(app.localeInfo);

if (app.modules.plcrashreporter) {
    var writeCrashLog = function (_data) {
        var crashDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'crashlogs');
        if (!crashDir.exists()) {
            crashDir.createDirectory();
        }
        Ti.Filesystem.getFile(crashDir.resolve(), moment()
            .toString() + '.log')
            .write(_data);
    };

    var sendCrashLogs = function () {
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
            })
                .on('click', function (e) {
                    if (e.index === 0) {
                        var emailDialog = Ti.UI.createEmailDialog({
                            subject: '[' + app.info.name + '][CrashReport]',
                            toRecipients: ['contact@akylas.fr'],
                            // barColor: $.cTheme.main,
                            // html:true,
                            messageBody: (JSON.stringify(app.deviceinfo, null, 2) +
                                '\n' + JSON.stringify(
                                    app.info, null, 2))
                        });
                        emailDialog.on('complete', function (e2) {
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
                })
                .show();
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
sdebug('Google Maps SDK', app.modules.map.googleMapSDKVersion);
