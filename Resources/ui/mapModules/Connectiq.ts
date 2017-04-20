var iqsdkReady = false;
var CIQ_APP_UUID = '4346c75cc36a4ae3aadaa85492288be7';
var connectIqModule;

function selectDevice(callback) {
    var devices = app.modules.connectiq.getKnownDevices();
    console.log('devices', devices);
    if (!devices) {
        return;
    }
    new OptionDialog({
        options: _.map(devices, function (value: any,
            index) {
            return value.name;
        }),
        buttonNames: [trc('cancel')],
        cancel: 0,
        tapOutDismiss: true
    }).on('click', (function (e) {
        if (!e.cancel) {
            var device = devices[e.index];
            connectIqModule && connectIqModule.onDeviceSelected(device);
            callback(device);
        }
    }).bind(this)).show();
}
export function onSettingsClick(e) {
    if (e.item && e.item.callbackId) {
        switch (e.item.callbackId) {
            case 'connect':
                if (e.item.deviceId == -1) {
                    app.modules.connectiq.init(function (err) {
                        console.log('on init from button 1', err, iqsdkReady);
                        if (connectIqModule) {
                            console.log('on init from button 2', err, iqsdkReady);
                            connectIqModule.onSDKInit(err);
                        } else if (err) {
                            app.emit('error', err);
                        } else {
                            iqsdkReady = true;
                        }
                        console.log('on init from button', err, iqsdkReady);
                        if (!err && iqsdkReady) {
                            selectDevice(function (device) {
                                e.section.updateItemAt(e.itemIndex, {
                                    title: {
                                        text: 'disconnect'
                                    },
                                    subtitle: {
                                        text: device.name
                                    }
                                });
                            });
                        }
                    });
                } else {
                    connectIqModule && connectIqModule.onDeviceRemoved();
                    e.section.updateItemAt(e.itemIndex, {
                        title: {
                            text: 'connect'
                        },
                        deviceId: -1,
                        subtitle: {
                            text: trc('connectiq_connect_desc')
                        }
                    });
                }
                break;
        }
    }
};

export function settings(enabled) {
    if (!enabled) {
        return {
            name: trc('connectiq'),
            description: 'connectiq_desc'
        };
    }
    var deviceId = Ti.App.Properties.getInt('connectiq.deviceId', -1);
    var sections = [];
    sections.push({
        items: [{
            template: 'button',
            callbackId: 'connect',
            deviceId: deviceId,
            title: {
                text: trc((deviceId == -1) ? 'connect' : 'disconnect')
            },
            subtitle: {
                text: trc('connectiq_connect_desc')
            }
        }]
    });
    return {
        name: trc('connectiq'),
        description: 'connectiq_desc',
        preferencesSections: sections
    }
};

class ConnectIqModule extends MapModule {
    deviceId = Ti.App.Properties.getInt('connectiq.deviceId', -1)
    app: any
    constructor(_args) {
        super(_args);
        if (!iqsdkReady) {
            app.modules.connectiq.initSDK(this.onSDKInit);
        }
    }
    shouldBeEnabledByDefault() {
        return false;
    }
    createApp = () => {
        if (!this.app) {
            console.log('creating app');
            this.app = app.modules.connectiq.createApp({
                id: this.deviceId,
                appId: CIQ_APP_UUID
            }).on('message', this.onMessage);
            this.app.getInfo(function (result) {
                if (result.error) {
                    app.emit('error', result);
                } else {
                    console.log('appInfo', result);
                }
            });
        }
    }
    onMessage = (e) => {
        console.log(e, e.data, e.status);
        try {
            let toParse = e.data[0].split('=>').join(':');
            console.log('toParse', toParse);
            
            let json = JSON.parse(toParse);
            app.setCurrentLocation({
                coords:{
                    latitude:json.location[0],
                    longitude:json.location[1],
                    altitude:json.altitude,
                    accuracy:json.accuracy,
                    speed:json.speed,
                    heading:json.heading,
                    timestamp:json.timestamp * 1000
                }
            });
            //{altitude=>2265.995850, accuracy=>4, timestamp=>1487838128, heading=>0.000000, speed=>9.200062, location=>[38.896074, -94.760896]}

        } catch(e) {
            console.error('Connectiq','onMessage', e.toString());
        }
    }
    onSDKInit = (err) => {
        console.log('connectiq', 'init', err)
        if (err) {
            app.emit('error', err);
            return;
        }
        iqsdkReady = true;
        console.log('connectiq', 'init done', iqsdkReady, CIQ_APP_UUID)
        if (this.deviceId != -1) {
            this.createApp();
        }
    }
    onDeviceSelected = (device) => {
        Ti.App.Properties.setInt('connectiq.deviceId', device.id);
        this.createApp();
    }
    onDeviceRemoved = (device) => {
        Ti.App.Properties.removeProperty('connectiq.deviceId');
        this.deviceId = -1;
        if (this.app) {
            this.app.removeAllListeners();
            this.app = null;
        }

    }
}

export function create(_context, _args, _additional) {
    // var settings = _args.settings,
    //     deviceId = Ti.App.Properties.getInt('connectiq.deviceId', -1),
    //     iqApp,
    // itemHandler = app.itemHandler,
    // geolib = itemHandler.geolib,
    // getImagePath = app.getImagePath,
    // utilities = app.utilities,
    // button = new Button({
    //     rclass: 'MapButton',
    //     bubbleParent: false,
    //     title: 'W',
    //     bottom: 106,
    //     top: null,
    //     visible: false,
    //     left: 8
    // });
    connectIqModule = new ConnectIqModule(_args);

    // button.on('click', function () {

    // });
    return connectIqModule;
};