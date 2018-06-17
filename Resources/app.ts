console.time('start');

import * as processModule from 'process';
process = processModule;
if (Ti.App.deployType !== 'production') {
    require('source-map-support').install();
}

import * as momentModule from 'moment';
moment = momentModule;

interface MetaData {
    [k: string]: any;
    file: titanium.FilesystemFile;
    bounds?: { sw: { latitude: number; longitude?: number }; ne: { latitude: number; longitude?: number } };
}

require('akylas.commonjs/akylas.commonjs').load(this, {
    userCoreJS: false,
    underscore: 'lodash',
    modulesDir: null,
    modules: ['ti', 'lang'],
    additions: ['string']
});

console.debug('test simu', __SIMULATOR__, Ti.Platform.model);

require('moment-duration-format');

import API from './lib/api';
import AKApp from 'akylas.commonjs/AkInclude/App';
import { ItemHandler } from './lib/itemHandler';
import { LocationManager } from './lib/locationManager';
import * as Color from 'tinycolor2';
import * as Utils from './lib/utilities';
import geolib from './lib/geolib';

declare global {
    var moment: typeof momentModule;
    var Color: Color;
    interface ContrastColor {
        isLight: boolean;
        luminance: number;
        color: string;
        contrast: string;
        contrastGray: string;
        darkerRel: string;
        lightenRel: string;
        darker: string;
        darkest: string;
        darkestRel: string;
    }
}
export function getContrastColors(_color): ContrastColor {
    let color = Color(_color);
    //light means dark content and thus white contrast
    var light = color.getBrightness() < 140;

    var color1 = Color(light ? '#fff' : '#222');
    var method = light ? 'darken' : 'lighten';
    var result = {
        isLight: light,
        luminance: color.getLuminance(),
        color: color.toHex8String(),
        contrast: color1.toHex8String(),
        contrastGray: color1
            .clone()
            [method].apply(color1, [0.2])
            .toHex8String(),
        darkerRel: color
            .clone()
            [method].apply(color, [0.2])
            .toHex8String(),
        lightenRel: color
            .clone()
            [method].apply(color, [-0.2])
            .toHex8String(),
        darker: color
            .clone()
            .darken(8)
            .toHex8String(),
        darkest: color
            .clone()
            .darken(20)
            .toHex8String(),
        darkestRel: color[method].apply(color, [20]).toHex8String()
    };
    return result;
}
var dataDir = Ti.Filesystem.applicationDataDirectory;
var paths = {};
['images', 'files', 'mbtiles'].forEach(function(key) {
    var holdingDir = Ti.Filesystem.getFile(dataDir, key);
    if (!holdingDir.exists()) {
        let result = holdingDir.createDirectory();
        console.debug('createDirectory', holdingDir, result);
    }
    var theDir = holdingDir.nativePath;
    if (!_.endsWith(theDir, '/')) {
        theDir += '/';
    }
    paths[key] = theDir;
});

// var externalDataDir = Ti.Filesystem.externalStorageDirectory;
// ['mbtiles'].forEach(function(key) {
//     var holdingDir = Ti.Filesystem.getFile(externalDataDir, key);
//     if (!holdingDir.exists()) {
//         let result = holdingDir.createDirectory();
//         console.debug('createExternalDirectory', holdingDir, result);
//     }
//     var theDir = holdingDir.nativePath;
//     if (!_.endsWith(theDir, '/')) {
//         theDir += '/';
//     }
//     paths[key] = theDir;
// });

function getDataPath(_dir, _path) {
    if (_.startsWith(_path, 'http')) {
        return _path;
    }
    return paths[_dir] + _path;
}

declare global {
    interface IApp extends App {}
}
export class App extends AKApp {
    ui: WindowManager;
    templates: { view: ViewTemplates; row: RowTemplates };
    api: API;
    offlineMode = false;
    servicesKeys = require('API_KEYS').keys;
    utilities = Utils;
    indexedIcons: [string, string][];
    constructor(context) {
        super(context, {
            modules: {
                shapes: 'akylas.shapes',
                slidemenu: 'akylas.slidemenu',
                charts2: 'akylas.charts2',
                paint: 'ti.paint',
                zoomableimage: 'akylas.zoomableimage',
                // opencv: 'akylas.opencv',
                motion: 'akylas.motion',
                camera: 'akylas.camera',
                ios: {
                    map: 'akylas.googlemap'
                },
                android: {
                    map: 'akylas.carto'
                    // connectiq: 'akylas.connectiq',
                    // crosswalk: 'com.universalavenue.ticrosswalk'
                }
            },

            defaultLanguage: 'en',
            forceLanguage: Ti.App.Properties.getString('language'),
            templates: ['row', 'view'],
            mappings: {
                SlideMenu: ['slidemenu', 'SlideMenu'],
                MapView: ['map', 'View'],
                MapAnnotation: ['map', 'Annotation'],
                MapRoute: ['map', 'Route'],
                MapTileSource: ['map', 'TileSource'],
                MapCluster: ['map', 'Cluster'],
                ShapeView: ['shapes', 'View'],
                ShapeCircle: ['shapes', 'Circle'],
                ShapeArc: ['shapes', 'Arc'],
                ShapePieSlice: ['shapes', 'PieSlice']
                // 'LineChart': ['charts', 'LineChart'],
                // 'PlotLine': ['charts', 'PlotLine'],
                // },
                // android: {
                // 'WebView': ['crosswalk', 'WebView']
            },
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
                // androidNav: true
            }
        });
        if (this.modules.connectiq) {
            this.mapModules.push('Connectiq');
        }
        if (Ti.App.Properties.getString('update.check.version', '') !== this.info.version) {
            this.updates = {
                annot_images: true
            };
            Ti.App.Properties.setString('update.check.version', this.info.version);
            console.debug('app.updates', this.updates);
        }
        this.developerMode = Ti.App.Properties.getBool('developerMode', __DEVELOPMENT__);

        var indexIcons: [string, string][] = [];
        for (let key in this.icons) {
            indexIcons.push([trc(key), this.icons[key]]);
        }
        this.indexedIcons = _.sortBy(indexIcons, function(n) {
            return n[0];
        });
    }
    mapModules = [
        'TutorialManager',
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
        'AugmentedReality',
        // 'PointToLocation',
        'Weather'
    ];
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
    showMessage(_text, _colors?) {
        var args: any = {
            text: _text
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
            Ti.UI.showSnackbar(
                Object.assign(args, {
                    gravity: 48
                })
            );
        }
    }
    tutorial = Ti.App.Properties.getBool('tutorial', true);
    icons = _.mapValues(require('data/icons').icons, function(value) {
        return String.fromCharCode(value);
    });
    colors: { [k: string]: ContrastColor } = _.mapValues(
        {
            red: '#B03621',
            green: '#82E182',
            blue: '#375EC6'
        },
        getContrastColors
    );
    loadVariables() {
        Ti.include('$variables.js');
    }
    getContrastColors = getContrastColors;
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
        var filename = _image.split('/').pop();
        var ext = filename.split('.').pop();
        var imageId =
            _.reduce(
                _options,
                function(memo, value, key) {
                    return memo + '_' + key + '_' + value.toString().replace('#', '');
                },
                filename
            ) +
            '.' +
            ext;
        var result = app.getImagePath(imageId);
        var file = Ti.Filesystem.getFile(result);

        if (!file.exists()) {
            console.log('getFilteredImage', _image, _options, result, file.exists());
            file.write(Ti.Image.getFilteredImage(_image, _options));
        }
        return result;
    }
    getImagePath = _.partial(getDataPath, 'images');
    getFilePath = _.partial(getDataPath, 'files');
    getPath(_path) {
        return paths[_path];
    }
    getThumbnailImagePath = _photo => {
        return this.getImagePath(_photo.thumbnailImage || _photo.thumbnail || _photo.image);
    };
    updates: { [key: string]: any };
    needsUpdate = _key => {
        return this.updates && !!this.updates[_key];
    };
    indexedColors: [string, string][];
    developerMode = false;
    texts: { [key: string]: string };
    utils = {
        // openingHours: require('lib/opening_hours'),
        // humanizeDuration: require('lib/humanize-duration'),
        suncalc: require('suncalc') as {
            getTimes(date: number | Date, latitude: number, longitude: number);
        }
    };
    locationManager = new LocationManager();
    itemHandler: ItemHandler;
    tempMetrics = false;
    setMetrics = _value => {
        if (geolib.metrics !== _value) {
            console.debug('setMetrics', _value);
            geolib.metrics = _value;
            Ti.App.Properties.setBool('distance_metric', _value);
            this.emit('distance_metric_changed');
        }
    };
    setTempMetrics = _value => {
        if (this.tempMetrics !== _value) {
            console.debug('setTempMetrics', _value);
            this.tempMetrics = _value;
            Ti.App.Properties.setBool('temp_metric', _value);
            this.emit('temp_metric_changed');
        }
    };
    setDeveloperMode = _value => {
        if (this.developerMode !== _value) {
            console.debug('setDeveloperMode', _value);
            this.showMessage('may the force be with you!');
            this.developerMode = _value;
            Ti.App.Properties.setBool('developerMode', _value);
        }
    };
    localeInfo = ak.getLocaleInfo();
    setOfflineMode = _value => {
        if (this.offlineMode !== _value) {
            console.debug('setOfflineMode', _value);
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
    };
    // openingHours(_value, _args) {
    //     const OpeningHours = require('lib/opening_hours');
    //     return new OpeningHours(_value, _args, 2);
    // }
    currentLocation: TiLocation;
    setCurrentLocation = e => {
        // console.debug('setCurrentLocation', e);
        var coords = e.coords;
        this.currentLocation = coords;
        this.emit('location', {
            location: coords
        });
    };
    getBluredScreenshot(_args) {
        return Ti.Image.getFilteredScreenshot(
            _.merge(
                {
                    scale: 0.4,
                    filters: [
                        {
                            radius: 2,
                            type: Ti.Image.FILTER_IOS_BLUR
                        }
                    ],
                    tint: '#00000044',
                    blend: Ti.UI.BlendMode.DARKEN
                },
                _args
            )
        );
    }
    showOptionsListDialog(_options, _callback?) {
        console.log('showOptionsListDialog', _options);
        app.ui.openWindow(
            new OptionsListWindow({
                options: _options
            }).on('click', _callback)
        );
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
        }).on('click', function() {
            win.closeMe();
        });
        win.underContainer.opacity = 0;
        var startRect = {
            left: sourceRect.x,
            top: sourceRect.y + (__APPLE__ ? $.navBarTop : 0),
            width: sourceRect.width,
            height: sourceRect.height
        };
        console.debug('startRect', startRect);
        _view.applyProperties(startRect);
        win.closeMe = function() {
            win.animate(
                {
                    underContainer: {
                        opacity: 0
                    },
                    container: startRect,
                    duration: 200
                },
                function() {
                    app.ui.closeWindow(win, {
                        animated: false
                    });
                    win = null;
                }
            );
        };
        win.once('open', function() {
            win.animate({
                underContainer: {
                    opacity: 1
                },
                container: {
                    left: originalLeft,
                    top: originalTop,
                    width: originalWidth,
                    height: originalHeight
                },
                duration: 200
            });
        });
        app.ui.openWindow(win);
    }
    //TODO: bring back c2c
    contentModules = Ti.Filesystem.getFile('contentModules')
        .getDirectoryListing()
        .filter(function(name) {
            return _.endsWith(name, 'js') && !/c2c/.test(name);
        })
        .map(function(value) {
            return value.slice(0, -3);
        });
    tutorialManager: TutorialManager;
    showTutorials(...args) {
        if (this.tutorialManager) {
            return this.tutorialManager.showTutorials(args);
        }
    }

    handleCustomMbTile(files: titanium.FilesystemFile[]) {
        const destPath = Ti.Filesystem.getFile();
        return Promise.all(
            files.map(file => {
                return new Promise<MetaData>(function(resolve, reject) {
                    var db = Ti.Database.open(file.nativePath);
                    var rows = db.execute('SELECT name,value FROM metadata');
                    var metadata: MetaData = { file: file };
                    var value, name;
                    while (rows.isValidRow()) {
                        name = rows.fieldByName('name');
                        value = rows.fieldByName('value');
                        console.log('row read', name, value);
                        switch (name) {
                            case 'bounds':
                                var bounds = value.split(',');
                                metadata['bounds'] = {
                                    sw: { latitude: parseFloat(bounds[1]), longitude: parseFloat(bounds[0]) },
                                    ne: { latitude: parseFloat(bounds[3]), longitude: parseFloat(bounds[2]) }
                                };
                                break;
                            default:
                                metadata[name] = value;
                        }
                        rows.next();
                    }
                    rows.close();
                    db.close();
                    resolve(metadata);
                })
                    .then(metadata => {
                        if (!metadata.hasOwnProperty('minZoom') || !metadata.hasOwnProperty('maxZoom')) {
                            var db = Ti.Database.open(file.nativePath);
                            var result = db.execute('SELECT min(zoom_level) as min_zoom, max(zoom_level) as max_zoom FROM tiles');
                            const minZoom = result.field(0);
                            const maxZoom = result.field(1);
                            result.close();
                            db.close();
                        }
                        return metadata;
                    })
                    .then(metadata => {
                        var bounds = metadata.bounds;
                        var center = geolib.getCenter([bounds.sw, bounds.ne]);
                        return app.api
                            .reverseGeocode({
                                latitude: center.latitude,
                                longitude: center.longitude
                                // zoom:request.minZoom
                            })
                            .then(function(e) {
                                metadata['address'] = e;
                                return metadata;
                            });
                    })
                    .then(metadata => {
                        var theFile = metadata.file;
                        metadata.file = theFile.name;
                        metadata.id = metadata.file;
                        metadata.token = metadata.file;
                        metadata.layer = {
                            token: metadata.id,
                            name: metadata.id
                                .split('.')
                                .slice(0, -1)
                                .join('')
                        };
                        var mbtiles = Ti.App.Properties.getObject('mbtiles', {});
                        mbtiles[metadata.id] = metadata;
                        Ti.App.Properties.setObject('mbtiles', mbtiles);

                        console.log('adding custom mbtiles', metadata, theFile.nativePath);
                        theFile.move(app.getPath('mbtiles') + '/' + metadata.file);
                    });
            })
        );
        // app.ui.mainwindow.hideLoading();
    }
    showImageFullscreen = (_photos, _index, _fromView) => {
        this.ui.createAndOpenWindow('FullscreenImageWindow', {
            photos: _photos,
            photoIndex: _index,
            fromView: _fromView
        });
    };
}

__LIST__ = 'list';
__MARKERS__ = 'markers';
__ITEMS__ = 'items';
_EVENT_ITEMS_ADDED_ = __ITEMS__ + 'Added';
_EVENT_ITEMS_MOVED_ = __ITEMS__ + 'Moved';
_EVENT_ITEMS_CHANGED_ = __ITEMS__ + 'Changed';
_EVENT_ITEMS_REMOVED_ = __ITEMS__ + 'Removed';
__ROUTES__ = 'routes';
_EVENT_ROUTES_ADDED_ = __ROUTES__ + 'Added';
_EVENT_ROUTES_MOVED_ = __ROUTES__ + 'Moved';
_EVENT_ROUTES_CHANGED_ = __ROUTES__ + 'Changed';
_EVENT_ROUTES_REMOVED_ = __ROUTES__ + 'Removed';

console.timeEnd('start');

app = new App(this);
console.timeEnd('start');

// ak.locale.storeMissingTranslations = true;
app.main();
app.texts = {
    ccopyright: '<small><font color="gray">' + app.utilities.htmlIcon($.sCC) + 'BY-SA 2.0</font></small>'
};
console.timeEnd('start');

app.api = new API(app);
console.timeEnd('start');

app.itemHandler = new ItemHandler();
console.timeEnd('start');

if (__APPLE__) {
    app.modules.map.googleMapAPIKey = app.servicesKeys.google;
} else {
    app.modules.map.license = app.servicesKeys.carto;
}

app.setMetrics(Ti.App.Properties.getBool('distance_metric', true));
console.timeEnd('start');

app.setTempMetrics(Ti.App.Properties.getBool('temp_metric', true));
app.setOfflineMode(Ti.App.Properties.getBool('offline', false));
app.locationManager.watchPosition(app.setCurrentLocation);
console.timeEnd('start');

// console.debug(app.modules.map.getOfflineServerPackages());

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
console.timeEnd('start');

// if (app.tutorialManager.enabled) {
app.ui.slidemenu.once('openmenu', function() {
    // app.showTutorials(['offline_mode']);
});
// }

app.showAlert = _.flowRight(app.showAlert, function(_args) {
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
app.confirmAction = function(_args, _c1, _c2) {
    _args.constructorName = 'CustomAlertView';
    return oldFunc.apply(this, [_args, _c1, _c2]);
};

/// !RATING
var shouldShowRatingAlert = Ti.App.Properties.getBool('show_rating_alert', true);
var appRatingTimingCount = Ti.App.Properties.getInt('rating_count', 0);
Ti.App.Properties.setInt('rating_count', appRatingTimingCount);

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

app.ui.slidemenu.once('open', function() {
    Ti.App.emit('resume');
});

console.timeEnd('start');

app.ui.openWindow(app.ui.slidemenu);

Ti.Network.on('change', app.api.updateNetwork);
process.on('unhandledRejection', (reason, promise) => {
    app.emit('error', { error: reason });
});

app.api.on('error', function(err) {
    app.emit('error', { error: err });
});
Ti.App.on('error', function(e) {
    app.emit('error', e);
});
app.on('error', e => {
    if (!e.error) {
        return;
    }
    console.log('on app error', typeof e.error, e.error);
    if (!e.error.isCustomError && (e.error.stack || e.error.longStack || e.error.nativeLocation)) {
        console.log('throwing error so that it shows in Ti');
        setTimeout(() => {
            throw e.error;
        }, 0);
    }
    let errorMessage = app.errorToString(e.error);
    if (!e.silent) {
        app.showAlert({
            title: trc('error'),
            message: errorMessage
        });
    } else {
        app.showMessage(errorMessage, app.colors.red);
    }
    // }
});
app.api.updateNetwork();

console.debug(app.deviceinfo);
console.debug(app.info);
console.debug(app.localeInfo);

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
        if (!logs || logs.length === 0) return;
        console.debug('logs', logs);
        if (app.api.networkConnected) {
            Ti.UI.createAlertDialog({
                cancel: 1,
                persistent: true,
                buttonNames: [trc('yes'), trc('later'), trc('no')],
                message: trc('send_crash_report'),
                title: trc('found_a_crash')
            })
                .on('click', function(e) {
                    if (e.index === 0) {
                        var emailDialog = Ti.UI.createEmailDialog({
                            subject: '[' + app.info.name + '][CrashReport]',
                            toRecipients: ['contact@akylas.fr'],
                            // barColor: $.cTheme.main,
                            // html:true,
                            messageBody: JSON.stringify(app.deviceinfo, null, 2) + '\n' + JSON.stringify(app.info, null, 2)
                        });
                        emailDialog.on('complete', function(e2) {
                            if (!!e2.success) {
                                crashDir.deleteDirectory(true);
                            }
                        });
                        for (var i = 0; i < logs.length; i++) {
                            emailDialog.addAttachment(Titanium.Filesystem.getFile(crashDir.resolve(), logs[i]));
                        }
                        emailDialog.open(undefined);
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
        console.debug('found a crash log');
        writeCrashLog(data);
        app.modules.plcrashreporter.purgePendingCrashReport();
    }
    sendCrashLogs();
    // setTimeout(function() {
    //     app.modules.plcrashreporter.triggerCrash();
    // }, 5000);
}
// console.debug('Google Maps SDK', app.modules.map.googleMapSDKVersion);

var inMbTiles = [],
    folder,
    dirList;
if (__ANDROID__) {
    folder = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory);
    var dirList = folder.getDirectoryListing();
    // console.log('files', folder.nativePath, dirList)
    if (dirList) {
        inMbTiles = inMbTiles.concat(dirList.filter(s => s.endsWith('.mbtiles')).map(f => Ti.Filesystem.getFile(folder.nativePath, f)));
    }
}

if (__APPLE__) {
    folder = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'Inbox');
    dirList = folder.getDirectoryListing();
    // console.log('files', folder.nativePath, dirList)
    if (dirList) {
        inMbTiles = inMbTiles.concat(dirList.filter(s => s.endsWith('.mbtiles')).map(f => Ti.Filesystem.getFile(folder.nativePath, f)));
    }
    folder = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
    var dirList = folder.getDirectoryListing();
    // console.log('files', folder.nativePath, dirList)
    if (dirList) {
        inMbTiles = inMbTiles.concat(dirList.filter(s => s.endsWith('.mbtiles')).map(f => Ti.Filesystem.getFile(folder.nativePath, f)));
    }
    var cmd = Ti.App.getArguments();
    if (cmd && cmd.url && cmd.url.indexOf('file://') === 0 && cmd.url.endsWith('.mbtiles')) {
        inMbTiles.push(Ti.Filesystem.getFile(cmd.url));
    }
}

if (inMbTiles.length > 0) {
    app.handleCustomMbTile(inMbTiles);
}

if (app.modules.motion.hasBarometer) {
    console.log('hasBarometer');
    app.modules.motion.once('pressure', function(e) {
        console.log(e);
    });
}
