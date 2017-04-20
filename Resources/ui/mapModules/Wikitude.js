exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        getImagePath = app.getImagePath,
        utilities = app.utilities,
        arWindow,
        VIEW_DISTANCE = 10000,
        button = new Button({
            rclass: 'MapButton',
            bubbleParent: false,
            title: 'W',
            bottom: 106,
            top: null,
            visible: false,
            left: 8
        });

    var self = new _context.MapModule(_args);
    if (__APPLE__ && app.modules.wikitude.isDeviceSupported(["geo"])) {
        _additional.mapPaddedChildren.push(button);
    }

    button.on('click', function() {
        var win = new AppWindow({
            // title:'ARWINDOW',
            // orientationModes: [Ti.UI.UPSIDE_PORTRAIT, Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT],
            // fullscreen: true,
            withLoadingIndicator: true,
            verticalContainer: false,
            winOpeningArgs: {
                from: {
                    opacity: 0,
                },
                to: {
                    opacity: 1,
                },
                duration: 300
            },
            winClosingArgs: {
                opacity: 0,
                duration: 200
            },
            showBackButton: true,
            ownBackButtonTitle: $.sClose,
            customNavBar: true,
            barColor: '#00000055',
            rightNavButtons: [{
                icon: app.icons.nature,
                callback: function() {
                    self.parent.runMethodOnModules('spreadModuleAction', {
                        id: 'geofeature',
                        window: arWindow,
                        region: geolib.getBoundsOfDistance(app.currentLocation,
                            VIEW_DISTANCE),
                        callback: function(_addedItems) {
                            updateData();
                        }
                    });
                }
            }]
        });
        var itemInfoView = new ItemInfoView({
            bindId: 'infoview',
            showAccessory: false,
            bottom: 0
        });
        itemInfoView.onInit(self.window, self.parent);
        var view = app.modules.wikitude.createWikitudeView({
            bindId: 'arview',
            // top:40,
            licenseKey: 'B2iXngQehGmFkaDzxocqJ0MX/orNlXLN9QorqgTMpu3j6XjUYVVS6TWW6b4jK57lUR92a1LGXD6slI0tgt6pkrWQ6wTAc8WjzYBsvTCmj0c4JXHI2wkfgferRPhbPneMi7T1D18MDwkJgUCYUWaWdLf0UD/uqMFrjJSUahPfgbdTYWx0ZWRfX8uJqlGZn4h6T9IcuJBgQVbjq+P/rkaAMrWTUACp/jm/t0Nffo77NwHj/vRAAjEm3H4j0fBk1w9rqyyDzE92dG2sjbUFWVFmoGlyJ2cNXg2txF7l10kNkHxZ9JRXVnvm8wK3SAB2jmp9wKE+4et2yHfhMG4wKG4vm+C4pC7fYM4EpWmlYhhJWRFGsdfaGKKnRnRAw6J+pmJIJ4bxcfFqmnXFuZ0+Cv9Y0TZtA0MR1gwmQd1uDCmySe8Jk5LZqhPqRlmrYlZTYHA199b+bbgznZRRwFjGPRTLbSg2TKWChj+VOwpWRdQ/C7P1pK5xCTIpxI61uA6ob0MFsGo7LDuNxCg/nYzR9epZmr3nUaTHmIaAB0M4mQuFpo0GaRE6IP/UVMbHYuNB3+KqhaIAtbyMTRnzUj3T65YVH262uO2bDd1cfmJHHzgSM350oZoPqr5EaTgsef2qLyz2bbMPspA7InNeQYLAfotvEtJl+J+R1NoHa69la1GrgFiofn/qRLwhNHLrVVSfvpHD',
            augmentedRealityFeatures: ["geo"],
        });
        win.container.add(view, itemInfoView);
        // var ARchitectWindow = require('/ui/ARchitectWindow');

        // var requiredFeatures = [
        //     "geo"
        // ];
        // var startupConfiguration = {
        //     "camera_position": "back"
        // };
        view.loadArchitectWorldFromURL(
            'data/wikitude/index.html', ["geo"], null);

        view.on('WORLD_IS_LOADED', function() {
            arWindow = win;
            sdebug('WORLD_IS_LOADED');
            updateData();
        }).on('URL_WAS_INVOKED', function(e) {

            var url = e.url;
            var prefix = 'architectsdk://event?data=';
            handleWorldEvent(JSON.parse(decodeURIComponent(url.substring(prefix.length).replace(
                /\+/g, ' '))));
        });
        win.once('close', function() {
            arWindow = null;
        });
        app.ui.openWindow(win);
    });

    function handleWorldEvent(e) {
        // sdebug('handleWorldEvent', e);
        switch (e.type) {
            case 'selected':
                arWindow.container.infoview.setSelectedItem(e.poiData);
                arWindow.container.infoview.showMe();
                break;
            case 'unselected':
                arWindow.container.infoview.hideMe();
                break;
            case 'location':
                updateLocation(e.coords);
                break;
        }
    }

    function updateData() {
        var location = app.currentLocation;
        var items = self.parent.runReduceMethodOnModules('getItemsInRegion',
            location, VIEW_DISTANCE);
        if (_.size(items) == 0) {
            alert('no item');
            return true;
        }
        var poiData = [];

        _.each(items, function(list) {
            var defaultImage = getImagePath(list.desc.image);
            var defaultSelectedImage = getImagePath(list.desc.selectedImage);
            var defaultTitle = list.desc.defaultTitle;
            var defaultColor = Color(list.desc.color).toHexString() + '99';
            _.each(list.items, function(item) {
                var toAdd = _.defaults(_.pick(item, 'id', 'latitude',
                    'color',
                    // 'image',
                    // 'selectedImage',
                    'longitude', 'altitude',
                    'title', 'description'), {
                    color: defaultColor,
                    image: defaultImage,
                    selectedImage: defaultSelectedImage,
                    title: defaultTitle,
                })
                toAdd.item = item;
                toAdd.desc = list.desc;
                if (toAdd.altitude) {
                    toAdd.altitude = Math.floor(toAdd.altitude);
                    toAdd.description = geolib.formatter.altitude(toAdd.altitude);
                }
                poiData.push(toAdd);
            });
        });
        // creates dummy poi-data around given lat/lon

        updateLocation(location);
        callWorldMethod('loadPoisFromJsonData', poiData);
    }

    function callWorldMethod() {
        var args = Array.prototype.slice.call(arguments),
            method, mods;
        var method = args[0];
        var length = args.length;
        var string = "World." + method + '(';
        for (var i = 1; i < length - 1; i++) {
            string += JSON.stringify(args[i]) + ',';
        }
        if (length > 1) {
            string += JSON.stringify(args[length - 1]);
        }
        string += ');';
        arWindow.container.arview.callJavaScript(string);
    }

    function updateLocation(_location) {
        if (arWindow) {
            arWindow.container.infoview.updateLocation(_location);
        }
        // if (arView) {
        //     if (!_location.timestamp) {
        //         _location.timestamp = (new Date).getTime();
        //     }
        //     if (!_location.accuracy) {
        //         _location.accuracy = 1;
        //     }
        //     if (!_location.altitudeAccuracy && _location.hasOwnProperty('altitude')) {
        //         _location.altitudeAccuracy = 1;
        //     }
        //     sdebug('updateLocation', _location);
        //     // arView.injectLocation(_location);
        // }
    }
    Object.assign(self, {
        GC: app.composeFunc(self.GC, function() {}),
        onInit: function() {},
        onLocation: function(_location) {
            button.visible = true;
            updateLocation(_location);
        },

    });
    return self;
};