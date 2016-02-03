exports.create = function(_context, _args, _additional) {
    var TAG = 'UserLocation',
        settings = _args.settings,
        utilities = app.utilities,
        accuracyLevels = {
            'off': 'gray',
            'bad': 'red',
            'middle': 'orange',
            'good': $cTheme.main
        },

        accuracyImages = {},
        getAccuracyImage = function(_level) {
            if (!accuracyImages.hasOwnProperty(_level)) {
                accuracyImages[_level] = app.getFilteredImage('/images/userLoc.png', {
                    tint: accuracyLevels[_level],
                    blend: Ti.UI.BlendMode.LIGHTEN
                });
            }
            return accuracyImages[_level];
        },
        currentAccuracyLevel = 'good',
        visible = false;

    function update(_location) {
        var updateArgs = {};
        // sdebug('userlocation update', _location);
        if (_location) {
            // updateArgs.customView = {
            //     template: 'userLocation',
            //     type: {
            //         html: utilities.htmlIcon($sGps, 4) + ((_location.altitude >= 0) ? ('<br>' + _location.altitude.toFixed() + 'm') : '')
            //     },
            //     line1: {
            //         text: _location.latitude.toFixed(4) + "° N, " + _location.longitude.toFixed(4) + "° E"
            //     },
            //     line2: {
            //         visible: false
            //     },
            //     line3: {
            //         visible: false
            //     }
            // };
            var newValue = 'good';
            // if (settings.enabledGPS === false) {
            //      sdebug('update', 'enabledGPS', settings.enabledGPS);
            //    newValue = 'off';
            // } else 
            if (moment().diff(_location.timestamp, 'minutes', true) > 2) {
                newValue = 'off';
            } else {
                var accuracy = _location.accuracy || 0;
                if (accuracy > 1000) {
                    newValue = 'bad';
                } else if (accuracy > 10) {
                    newValue = 'middle';
                }
            }

            if (newValue !== currentAccuracyLevel) {
                // sdebug('updateAccuracy', newValue);
                currentAccuracyLevel = newValue;
                updateArgs.image = getAccuracyImage(newValue);
            }
            if (!visible) {
                updateArgs.visible = true;
                visible = true;
            }
            _.assign(updateArgs, _location);
            // sdebug('userLocationAnnot update', updateArgs);
            userLocationAnnot.applyProperties(updateArgs);
            self.parent.updateUserLocation();
            app.showTutorials(['user_location']);
        }
    }

    var self = new _context.MapModule(_args),
        userLocationAnnot = settings.userAnnotation = new MapAnnotation({
            flat: true,
            // bubbleParent: true,
            visible: false,
            hasInfo: false,
            zIndex: 799,
            selectable: false,
            anchorPoint: [0.5, 0.5],
            // touchable:false,
            title: trc('your_location'),
            // image: getAccuracyImage(currentAccuracyLevel)
        });

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            userLocationAnnot = null;
            delete settings.userAnnotation;
        }),
        onLocation: update,
        onGPSEnabled: function(_enabled) {
            update(settings.currentLocation);
        },
        onAnnotationPress: function(e) {
            // sdebug('userlocation', 'onAnnotationPress', e.annotation.title);
            if (e.annotation === userLocationAnnot) {
                sdebug('userlocation', 'onAnnotationPress done!');
                self.parent.runMethodOnModules('onModuleAction', {
                    id: 'positioninfo'
                });
            }
        },
        onSetUserFollow: function(_enabled) {
            if (_enabled) {
                self.parent.updateUserLocation();
            }
        }
    });
    var mapArgs = _additional.mapArgs;
    // mapArgs.calloutTemplates = mapArgs.calloutTemplates || {};
    // mapArgs.calloutTemplates.userLocation = ak.ti.style({
    //     type: 'Ti.UI.View',
    //     properties: {
    //         layout: 'horizontal',
    //         height: 50,
    //         width:200
    //     },
    //     childTemplates: [{
    //         type: 'Ti.UI.Label',
    //         bindId: 'type',
    //         properties: {
    //             rclass: 'MarkerInfoType',
    //             backgroundColor: $cTheme.main,
    //             color: $white,
    //             text: $sGps
    //         }
    //     }, {
    //         type: 'Ti.UI.View',
    //         properties: {
    //             layout: 'vertical',
    //             width: 'FILL',
    //             height: 'SIZE',
    //             clipChildren: false,
    //             left: 10,
    //             right: 10
    //         },
    //         childTemplates: [{
    //             type: 'Ti.UI.Label',
    //             bindId: 'line1',
    //             properties: {
    //                 rclass: 'MarkerInfoLine1'
    //             }
    //         }, {
    //             type: 'Ti.UI.Label',
    //             bindId: 'line2',
    //             properties: {
    //                 rclass: 'MarkerInfoLine2'
    //             }
    //         }, {
    //             type: 'Ti.UI.Label',
    //             bindId: 'line3',
    //             properties: {
    //                 rclass: 'MarkerInfoLine3'
    //             }
    //         }]
    //     }, {
    //         type: 'Ti.UI.Label',
    //         bindId: 'options',
    //         properties: {
    //             rclass: 'MarkerInfoButton',
    //             text: $sOptions
    //         }
    //     }]
    // });
    mapArgs.annotations = mapArgs.annotations || [];
    mapArgs.annotations.push(userLocationAnnot);
    return self;
};