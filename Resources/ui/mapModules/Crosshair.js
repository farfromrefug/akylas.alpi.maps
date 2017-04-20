exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        visible = false,
        formatter = app.utils.geolib.formatter,
        self = new _context.MapModule(_args),
        animationDuration = 150,
        height_2 = 42,
        width_2 = 35,
        icon = String.fromCharCode(0xe6d3),
        currentLatLong,
        view = new View({
            touchPassThrough: true,
            opacity: 0,
            // visible:false,
            height: 2 * height_2,
            width: 2 * width_2,
            childTemplates: [{
                bindId: 'crosshair',
                type: 'Ti.UI.Label',
                properties: {
                    width: 2 * width_2,
                    height: 2 * width_2,
                    color: $.black,
                    font: {
                        family: $.iconicfontfamily,
                        size: 30
                    },
                    shadowColor: '#fff',
                    shadowOffset: [0, 0],
                    shadowRadius: 1.5,
                    textAlign: 'center',
                    text: icon
                }
            }, {
                bindId: 'label',
                type: 'Ti.UI.Label',
                properties: {
                    touchEnabled: false,
                    width: 'FILL',
                    height: 28,
                    color: $.black,
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    shadowColor: '#fff',
                    shadowOffset: [0, 0],
                    shadowRadius: 1.5,
                    textAlign: 'center',
                    bottom: 0
                }
            }]
        }),
        button = new Button({
            rclass: 'MapButton',
            // backgroundColor: '#000000cc',
            bubbleParent: false,
            title: icon,
            bottom: 56,
            top: null,
            left: 8,
        }).on('click', app.debounce(function(e) {
            if (!visible) {
                show();
            } else {
                hide();
            }
        }));

    function hide() {
        if (visible) {
            visible = false;
            currentLatLong = undefined;
            delete self.onMapRegionChanged;
            view.animate({
                opacity: 0,
                duration: animationDuration
            // }, function(){
                // view.visible = false;
            });
        }

    }

    function show() {
        if (!visible) {
            visible = true;
            self.onMapRegionChanged = update;
            update();
            // view.visible = true;
            view.animate({
                opacity: 1,
                cancelRunningAnimations: true,
                duration: animationDuration
            });
        }

    }

    function update() {
        var point = view.convertPointToView([width_2, height_2], self.mapView);
        currentLatLong = self.mapView.coordinateForPoints([point])[0];
        // sdebug('update', currentLatLong);
        view.applyProperties({
            label: {
                text: formatter.latLngString(currentLatLong, 0, '\n')
            }
        });
    }

    Object.assign(self, {
        GC: app.composeFunc(self.GC, function() {
            view = null;
        }),
        onInit: function() {

        },
        onMapReset: function(_params) {
            _params = _params || {};
            if (!!_params.bottom) {
                button.animate({
                    opacity: 1,
                    duration: 100
                });
            }
        },
        hideModule: function(_params) {
            _params = _params || {};
            if (!!_params.bottom) {
                button.animate({
                    opacity: 0,
                    duration: 100
                });
            }
        },
        onHighlightingPoint: function() {
            if (!visible) {
                view.applyProperties({
                    label: {
                        text: ''
                    }
                });
                view.animate({
                    opacity: 1,
                    duration: 400,
                    autoreverse: true
                });
            }
        },
        onModuleAction: function(_params) {
            if (_params.id === 'crosshair') {
                if (!visible) {
                    show();
                } else {
                    hide();
                }
            } else {
                return false;
            }
            return true;
        },
        onMapHolderDoubleTap: function(e) {
            if (e.bindId !== 'crosshair') {
                return false;
            }
            var point = view.convertPointToView([width_2, height_2], self.mapView);
            self.mapView.zoomIn(point);
            return true;

        },
        onMapHolderLongPress: function(e) {
            if (e.bindId !== 'crosshair') {
                return false;
            }
            sdebug('currentLatLong', currentLatLong);
            self.parent.runMethodOnModules('onMapLongPress', {
                latitude: currentLatLong[0],
                longitude: currentLatLong[1]
            });
            return true;
        },
    });
    _additional.mapPaddedChildren.push(view);
    _additional.mapPaddedChildren.push(button);
    return self;
};