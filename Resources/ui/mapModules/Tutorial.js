exports.create = function(_context, _args, _additional) {

    var self = new _context.MapModule(_args);
    app.tutorialManager = self;

    // Ti.App.Properties.removeProperty('tutorials.done');

    var tutorials = {},
        doneTutorials = Ti.App.Properties.getObject('tutorials.done', []),
        tutorialWin,
        pendingTutorial = [];

    function createTutorialView(_id, _tut) {
        sdebug('handling', _id, _tut);
        var text;

        if (_tut.title) {
            text = '<b>' + trc(_tut.title) + '</b><br>';
        }
        text += trc(_tut.text);
        var textProps = {
            rclass: 'TutorialLabel',
            html: text
        };
        var arrowProps = {
            rclass: 'TutorialArrow',
        };
        var radius = _tut.radius;
        var arrowWidth = 16;
        var arrowHeight = 10;
        var anchor = _tut.anchor;
        var center = _tut.center.slice(0);

        if (!!_tut.onMap) {
            var padding = self.parent.getMapCurrentPadding();
            if (padding.top) {
                center[1] += padding.top / app.deviceinfo.densityFactor;
            }
            if (padding.bottom) {
                center[1] -= padding.bottom / app.deviceinfo.densityFactor;
            }
        }
        switch (anchor) {
            case 'bottomright':
                textProps.right = 0;

                arrowProps.right = center[0] - arrowWidth / 2;
                arrowProps.bottom = center[1] + radius + 5;
                textProps.bottom = arrowProps.bottom + arrowHeight;
                arrowProps.transform = 'r180';
                anchor = app.modules.shapes.RIGHT_BOTTOM;
                center[0] -= radius;
                center[1] -= radius;
                break;
            case 'bottomleft':
                textProps.left = 0;

                arrowProps.left = center[0] - arrowWidth / 2;
                arrowProps.bottom = center[1] + radius + 5;
                textProps.bottom = arrowProps.bottom + arrowHeight;
                arrowProps.transform = 'r180';
                anchor = app.modules.shapes.LEFT_BOTTOM;
                center[0] -= radius;
                center[1] -= radius;
                break;
            case 'bottom':

                arrowProps.bottom = center[1] + radius + 5;
                textProps.bottom = arrowProps.bottom + arrowHeight;
                arrowProps.transform = 'r180';
                anchor = app.modules.shapes.BOTTOM_MIDDLE;
                center[1] -= radius;
                break;
            case 'top':

                arrowProps.top = center[1] + radius + 5;
                textProps.top = arrowProps.top + arrowHeight;
                anchor = app.modules.shapes.TOP_MIDDLE;
                center[1] -= radius;
                break;
            case 'center':
                arrowProps.top = center[1] + app.deviceinfo.height / 2 + (radius + 5);
                textProps.top = arrowProps.top + arrowHeight;
                anchor = app.modules.shapes.CENTER;
                break;
            case 'topleft':
                textProps.left = 0;
                arrowProps.left = center[0] - arrowWidth / 2;
                arrowProps.top = center[1] + radius + 5;
                textProps.top = arrowProps.top + arrowHeight;
                anchor = app.modules.shapes.LEFT_TOP;
                center[0] -= radius;
                center[1] -= radius;
                break;
            case 'topright':
                textProps.right = 0;
                arrowProps.right = center[0] - arrowWidth / 2;
                arrowProps.top = center[1] + radius + 5;
                textProps.top = arrowProps.top + arrowHeight;
                anchor = app.modules.shapes.RIGHT_TOP;
                center[0] -= radius;
                center[1] -= radius;
                break;
        }

        return new View({
            properties: {
                tutId: _id,
                touchEnabled: false
            },
            childTemplates: [{
                type: 'AkylasShapes.View',
                properties: {
                },
                childTemplates: [{
                    type: 'AkylasShapes.Circle',
                    properties: {
                        rclass: 'TutorialShapeCircleView',
                        anchor: anchor,
                        center: [
                            center[0],
                            center[1]
                        ],
                        radius: radius
                    },
                }]
            }, {
                type: 'Ti.UI.View',
                properties: {
                    left: 5,
                    right: 5
                },
                childTemplates: [{
                    //     type: 'Ti.UI.View',
                    //     properties: viewParams
                    // }, {
                    type: 'Ti.UI.Label',
                    properties: arrowProps
                }, {
                    type: 'Ti.UI.Label',
                    properties: textProps
                }]
            }]
        });
    }
    _.assign(self, {
        onInit: function() {
        },
        enabled: Ti.App.Properties.getBool('tutorials.enabled', true),
        setEnabled: function(_value) {
            if (_value !== self.enabled) {
                sdebug('tutorialManager', 'setEnabled', _value);
                Ti.App.Properties.setBool('tutorials.enabled', _value);
                // if (_value) {
                //     app.showAlert('tutorial_restart_needed');
                // } else {
                self.enabled = _value;
                // }
            }
        },
        resetTutorials: function() {
            Ti.App.Properties.removeProperty('tutorials.done');
            doneTutorials = [];
        },
        addTutorials: function(_tutorials) {
            if (!self.enabled) {
                return;
            }
            _.defaults(tutorials, _tutorials);
        },
        getTutorials: function(_tuts, _force) {
            var result = _.pick(tutorials, _.filter(_tuts, function(n) {
                return _force || !_.contains(doneTutorials, n);
            }));
            return result;
        },
        showTutorials: function(_tuts, _force) {
            if (!self.enabled) {
                return;
            }
            var views = _.reduce(self.getTutorials(_tuts, _force), function(memo, value, key) {
                memo.push(createTutorialView(key, value));
                return memo;
            }, []);
            if (views.length === 0) {
                return;
            }
            if (tutorialWin) {
                views = _.uniq(tutorialWin.scrollView.views.concat(views), 'tutId');
                sdebug('updating tutorial window', _.pluck(views, 'tutId'));
                tutorialWin.applyProperties({
                    tutorials: _.pluck(views, 'tutId'),
                    scrollView: {
                        views: views
                    }
                });
                return;
            }
            tutorialWin = new AppWindow({
                rclass: 'TutorialWindow',
                tutorials: _.pluck(views, 'tutId'),
                containerView: {
                    type: 'Ti.UI.View',
                    properties: {},
                    childTemplates: [{
                        type: 'Ti.UI.ScrollableView',
                        bindId: 'scrollView',
                        properties: {
                            rclass: 'TutorialScrollableView',
                            views: views
                        },
                        events: {
                            change: function(e) {
                                var tutIds = tutorialWin.tutorials;
                                var currentTutId = tutIds[e.currentPage];
                                if (!_.contains(doneTutorials, currentTutId)) {
                                    doneTutorials.push(currentTutId);
                                    if (doneTutorials.length === _.size(tutorials)) {
                                        obj.setEnabled(false);
                                    }
                                }
                            }
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'quit',
                        properties: {
                            rclass: 'TutorialQuitLabel'
                        }
                    }]

                },
                events: {
                    click: function(e) {
                        var callbackId = e.bindId;
                        sdebug('callbackId', callbackId);
                        switch (callbackId) {
                            case 'scrollView':
                                var tutIds = tutorialWin.tutorials;
                                var currentPage = e.source.currentPage;
                                var currentTutId = tutIds[currentPage];
                                if (currentPage < tutIds.length - 1) {
                                    e.source.moveNext();
                                } else {
                                    tutorialWin.closeMe();
                                }
                                break;
                            case 'quit':
                                app.confirmAction({
                                    'title': trc('are_you_sure'),
                                    'message': trc('quit_tutorial_confirm'),
                                    buttonNames: [trc('no'), trc('yes')]
                                }, function() {
                                    if (tutorialWin) {
                                        tutorialWin.closeMe();
                                    }
                                    self.setEnabled(false);
                                });
                                break;
                        }
                    }
                }
            });

            // ak.ti.add(tutorialWin.container, [{,
            // }]);
            tutorialWin.onClose = app.composeFunc(tutorialWin.onClose, function() {
                Ti.App.Properties.setObject('tutorials.done', doneTutorials);
                tutorialWin = null;
            });
            app.ui.openWindow(tutorialWin);
        }
    });

    if (self.enabled) {
        tutorials = {
            'locationbutton': {
                title: 'location_button',
                text: 'location_button_tutorial',
                radius: 35,
                anchor: 'bottomright',
                center: [36, 84]
            },
            'follow_heading': {
                title: 'follow_heading',
                text: 'follow_heading_tutorial',
                radius: 35,
                anchor: 'bottomright',
                center: [36, 84]
            },
            'marker_info_details': {
                title: 'item_details',
                text: 'item_details_tutorial',
                radius: 26,
                anchor: 'bottomright',
                center: [72, 84]
            },
            'marker_info_details2': {
                title: 'item_details',
                text: 'item_details2_tutorial',
                radius: 34,
                anchor: 'bottom',
                center: [0, 84]
            },
            'menu': {
                title: 'menu',
                text: 'menu_tutorial',
                radius: $nbButtonWidth / 2 + 10,
                anchor: 'topleft',
                center: [$nbButtonWidth / 2, $navBarTop + $navBarHeight / 2]
            },
            'offline_mode': {
                title: 'offline_mode',
                text: 'offline_mode_tutorial',
                radius: 40,
                anchor: 'bottomright',
                center: [-$leftMenuWidth + 30, ((app.info.deployType === 'development' && app.modules.plcrashreporter) ?
                    3.5 : 2.5) * 50]
            },
            'map_settings': {
                title: 'map_settings',
                text: 'map_settings_tutorial',
                radius: $nbButtonWidth / 2 + 10,
                anchor: 'bottomleft',
                center: [$nbButtonWidth / 2, $nbButtonWidth / 2]
            },
            'gmaps_settings': {
                title: 'gmaps_settings',
                text: 'gmaps_settings_tutorial',
                radius: 30,
                anchor: 'bottomright',
                center: [Math.ceil(app.deviceinfo.width / 5 * 1.5), 27]
            },
            'custom_tilesource': {
                title: 'custom_map_source',
                text: 'custom_map_source_tutorial',
                radius: 30,
                anchor: 'bottomright',
                center: [Math.ceil(app.deviceinfo.width / 10), 27]
            },
            'tilesource_listview': {
                title: 'map_sources',
                text: 'map_sources_listview_tutorial',
                radius: 34,
                anchor: 'bottom',
                center: [0, $TSCountrolsHeight - 20]
            },
            'direction_listview': {
                title: 'initerary_points',
                text: 'direction_listview_tutorial',
                radius: 35,
                anchor: 'topleft',
                center: [90, $navBarTop + $navBarHeight + 20]
            },
            'direction_compute': {
                title: 'compute_initerary',
                text: 'compute_initerary_tutorial',
                radius: 20,
                anchor: 'topright',
                center: [0.5 * $nbButtonWidth, $navBarTop + $nbButtonWidth / 2]
            },
            'direction_select': {
                title: 'direction_select',
                text: 'direction_select_tutorial',
                radius: 34,
                anchor: 'center',
                center: [0, 0]
            },
            'direction_paintview': {
                title: 'direction_paint',
                text: 'direction_paint_tutorial',
                radius: 20,
                anchor: 'topleft',
                center: [1.5 * $nbButtonWidth, $navBarTop + $nbButtonWidth / 2]
            },
            'user_location': {
                title: 'user_location',
                text: 'user_location_tutorial',
                radius: 50,
                anchor: 'center',
                onMap: true,
                center: [0, -(2 * $navBarTop)]
            },
            'items_listview': {
                title: 'items_list',
                text: 'items_listview_tutorial',
                radius: 30,
                anchor: 'top',
                center: [0, $navBarTop + $navBarHeight + 50 + 40] //50 is for the ad
            },
            'item.firstchangemoved': {
                title: 'item_moved_on_update',
                text: 'item_moved_on_update_tutorial',
                radius: 50,
                anchor: 'top',
                center: [0, 0]
            },
            'position_share': {
                title: 'share_your_position',
                text: 'share_your_position_tutorial',
                radius: 30,
                anchor: 'top',
                center: [0, $navBarTop + $navBarHeight + 40]
            },
            'map_drop_pin': {
                title: 'adding_item',
                text: 'adding_item_tutorial',
                radius: 24,
                anchor: 'center',
                center: [0, 0]
            },
            'weather_route': {
                title: 'route_weather',
                text: 'route_weather_tutorial',
                radius: 0,
                anchor: 'center',
                center: [0, 100]
            },
            'action_bar_longpress': {
                title: 'long_press',
                text: 'action_bar_longpress_tutorial',
                radius: 30,
                anchor: 'bottom',
                center: [0, 30]
            }
        };
    }
    return self;
};