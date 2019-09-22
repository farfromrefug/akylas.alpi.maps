import geolib from '../lib/geolib';

export function create(_args) {
    var distance_units = ['kilometers', 'miles'],
        temp_units = ['°C (degrees)', '°F (fahrenheit)'],
        formatter = geolib.formatter,
        gpsLevels = _(app.locationManager.getLevels())
            .map('distanceFilter')
            .map(function(d) {
                return formatter.distance(d);
            })
            .value();

    gpsLevels[0] += ' (' + trc('low_battery_usage') + ')';
    gpsLevels[gpsLevels.length - 1] += ' (' + trc('high_battery_usage') + ')';

    function createSectionItem(_text: string, _subtitle?: string) {
        return {
            callbackId: _text,
            // icon: {
            //     text: _icon
            // },
            title: {
                text: trc(_text)
            },
            subtitle: {
                html: _subtitle
            }
            // template:1,
            // title:trc(_text),
            // accessoryType:1
        };
    }

    function createButtonItem(_text: string, _subtitle?: string) {
        return {
            template: 'button',
            callbackId: _text,
            title: {
                text: trc(_text)
            },
            subtitle: {
                text: _subtitle
            }
        };
    }

    function createSwitchItem(_id: string, _text: string, _value) {
        return {
            template: 'switch',
            callbackId: _id,
            title: {
                text: trc(_text)
            },
            switch: {
                value: _value
            }
        };
    }

    // function createModuleItem(_id, _text) {
    //     return createSwitchItem('module_' + _id, _text || _id, Ti.App.Properties.getBool('module_' + _id +
    //         '_enabled', false));
    // }

    function showLicenses() {
        var licenses = Ti.App.license;
        var commonLicenses = licenses.commonLicences;
        var items = [];
        for (const key in licenses) {
            if (key !== 'commonLicences') {
                let value = licenses[key];
                items.push({
                    label: {
                        text: value.title
                    },
                    sublabel: {
                        text: value.copyright
                    },
                    value: {
                        text: value.licenseId ? commonLicenses[value.licenseId] : value.license
                    }
                });
            }
        }

        var currentItem;
        var args = {
            title: tr('licenses'),
            showBackButton: true,
            customNavBar: true,
            listViewArgs: {
                templates: {
                    default: app.templates.row.license
                },
                backgroundColor: $.backgroundColor,
                // backgroundColor:'blue',
                disableHW: true,
                noPullView: true,
                defaultItemTemplate: 'default',
                sections: [
                    {
                        items: items
                    }
                ]
            }
        };

        function updateAndScroll() {
            var item = currentItem;
            item.section.updateItemAt(item.itemIndex, item.item, {
                animated: true
            });
            setTimeout(function() {
                listView.scrollToItem(0, item.itemIndex, {
                    position: 1
                });
            }, 100);
        }
        var win = new AppWindow(args);
        var listView = win.listView;
        var defaultRowHeight = app.templates.row.license.properties.height;
        app.onDebounce(listView, 'click', function(e) {
            if (e.link) {
                self.manager.createAndOpenWindow('WebWindow', {
                    url: e.link,
                    title: e.item.label.text
                });
            } else if (e.item) {
                var item = e.item;
                var key = e.sectionIndex + '_' + e.itemIndex;
                if (!currentItem || currentItem.id !== key) {
                    if (currentItem) {
                        currentItem.item = {
                            value: {
                                visible: false
                            }
                        };
                        currentItem.section.updateItemAt(currentItem.itemIndex, currentItem.item);
                    }

                    currentItem = {
                        id: key,
                        section: e.section,
                        itemIndex: e.itemIndex,
                        item: {
                            value: {
                                visible: true
                            }
                        }
                    };
                    updateAndScroll();
                } else {
                    currentItem.item = {
                        value: {
                            visible: false
                        }
                    };
                    updateAndScroll();
                    currentItem = undefined;
                }
            }
        });
        self.manager.navOpenWindow(win);
        win = null;
    }

    // var moduleItems = [];
    // _.forEach(app.contentModules, function(moduleKey) {
    //     moduleItems.push(createModuleItem(moduleKey));
    // })

    var self = (_args.window = new AppWindow({
        rclass: 'SettingsRealWindow',
        listViewArgs: {
            templates: {
                default: app.templates.row.settings,
                switch: app.templates.row.settingsswitch,
                button: app.templates.row.settingsbutton
            },
            defaultItemTemplate: 'default',
            sections: [
                {
                    headerTitle: trc('units/time'),
                    items: [createSectionItem('distance_units', trc(distance_units[geolib.metrics ? 0 : 1])), createSectionItem('temperature_units', trc(temp_units[app.tempMetrics ? 0 : 1]))]
                },
                {
                    headerTitle: trc('GPS'),
                    items: [createSectionItem('gps_accuracy', gpsLevels[app.locationManager.getLevel()])]
                },
                {
                    headerTitle: trc('settings'),
                    items: [createSwitchItem('move_first_change', 'move_item_on_first_change', app.itemHandler.moveOnFirstChange)],
                    footerTitle: trc('move_item_on_first_change_desc')
                },
                {
                    items: [
                        createSectionItem('language', trc(ak.locale.currentLanguage)),
                        createSectionItem('mapStyleFile', Ti.App.Properties.getString('mapStyleFile', 'Resources/styles/cartostyles-v1.zip'))
                    ]
                },
                {
                    items: [createSwitchItem('tutorial', 'tutorial_enabled', app.tutorialManager.enabled), createButtonItem('tutorial_reset')]
                },
                {
                    //     headerTitle: trc('modules'),
                    //     items: moduleItems,
                    //     footerTitle: trc('modules_settings_footer')
                    // }, {
                    headerTitle: trc('copyright/licenses'),
                    items: [createSectionItem('powered_by_akylas'), createSectionItem('licenses'), createSectionItem('openstreetmap', '<small>ODbL</small>'), createSectionItem('noun_project')]
                }
            ]
        }
    }));

    function showSettingSelection(_title: string, _values: string[], _selectedIndex: number, callback: (index: number) => void) {
        if (__APPLE__) {
            var win = new AppWindow({
                rclass: 'SettingsSelectionWindow',
                title: trc(_title),
                listViewArgs: {
                    templates: {
                        default: app.templates.row.settings
                    },
                    defaultItemTemplate: 'default',
                    sections: [
                        {
                            items: _.reduce(
                                _values,
                                function(memo, value, index) {
                                    memo.push({
                                        title: {
                                            text: trc(value)
                                        },
                                        accessory: {
                                            color: $.cTheme.main,
                                            text: index === _selectedIndex ? $.sCheck : ''
                                        }
                                    });
                                    return memo;
                                },
                                []
                            )
                        }
                    ]
                },
                events: {
                    click: app.debounce(function(e) {
                        if (e.item) {
                            callback(e.itemIndex);
                            win.closeMe();
                        }
                        win = null;
                    })
                }
            });
            self.manager.navOpenWindow(win);
        } else {
            new OptionDialog({
                title: trc(_title),
                options: _.map(_values, function(value, index) {
                    return trc(value);
                }),
                buttonNames: [trc('cancel')],
                cancel: 0,
                selectedIndex: _selectedIndex,
                tapOutDismiss: true
            })
                .on(
                    'click',
                    function(e) {
                        if (!e.cancel) {
                            callback(e.index);
                        }
                    }.bind(this)
                )
                .show();
        }
    }

    function nativeListViewWindow(_title, _sections) {
        self.manager.createAndOpenWindow('AppWindow', {
            rclass: 'NativeListWindow',
            title: trc(_title),
            showBackButton: true,
            listViewArgs: {
                rclass: 'SettingsListView',
                templates: {
                    default: app.templates.row.settings
                },
                defaultItemTemplate: 'default',
                sections: _sections
            }
        });
    }

    function handleCallbackId(e) {
        if (!e.item) {
            return;
        }
        if (e.type == 'click' && e.item.template === 'switch') {
            var newValue = (e.value = !e.item.switch.value);
            e.section.updateItemAt(e.itemIndex, {
                switch: {
                    value: newValue
                }
            });
        }
        var callbackId: string = e.item.callbackId || e.bindId,
            currentValue,
            currentIndex: number;
        console.debug(callbackId, e.value);
        // if (_.startsWith(callbackId, 'module_')) {
        //     Ti.App.Properties.setBool(callbackId + '_enabled', e.value);
        //     return;
        // }
        switch (callbackId) {
            case 'language':
                var langs = ['fr', 'en'];
                currentIndex = langs.indexOf(Ti.App.Properties.getString('language'));
                showSettingSelection(callbackId, langs, currentIndex, function(_index) {
                    if (currentIndex !== _index) {
                        Ti.App.Properties.setString('language', langs[_index]);
                        app.showAlert({
                            title: trc('warning'),
                            message: trc('restard_needed')
                        });
                        e.section.updateItemAt(
                            e.itemIndex,
                            {
                                subtitle: {
                                    text: trc(langs[_index])
                                }
                            },
                            {
                                animated: true
                            }
                        );
                    }
                });
                break;
            case 'mapStyleFile':
                var files = [
                    'Resources/styles/alpimaps.zip',
                    'Resources/styles/bright.zip',
                    'Resources/styles/carto.zip',
                    'Resources/styles/carto2.zip',
                    'Resources/styles/cartostyles-v1.zip',
                    'Resources/styles/mapbox.zip'
                ];
                currentIndex = files.indexOf(Ti.App.Properties.getString('mapStyleFile', 'Resources/styles/cartostyles-v1.zip'));
                showSettingSelection(callbackId, files, currentIndex, function(_index) {
                    if (currentIndex !== _index) {
                        Ti.App.Properties.setString('mapStyleFile', files[_index]);
                        e.section.updateItemAt(
                            e.itemIndex,
                            {
                                subtitle: {
                                    text: trc(files[_index])
                                }
                            },
                            {
                                animated: true
                            }
                        );
                    }
                });
                break;
            case 'distance_units':
                currentIndex = geolib.metrics ? 0 : 1;
                showSettingSelection(callbackId, distance_units, currentIndex, function(_index) {
                    if (currentIndex !== _index) {
                        app.setMetrics(_index === 0);
                        e.section.updateItemAt(
                            e.itemIndex,
                            {
                                subtitle: {
                                    text: trc(distance_units[_index])
                                }
                            },
                            {
                                animated: true
                            }
                        );
                    }
                });
                break;
            case 'temperature_units':
                currentIndex = app.tempMetrics ? 0 : 1;
                showSettingSelection(callbackId, temp_units, currentIndex, function(_index) {
                    if (currentIndex !== _index) {
                        app.setTempMetrics(_index === 0);
                        e.section.updateItemAt(
                            e.itemIndex,
                            {
                                subtitle: {
                                    text: trc(temp_units[_index])
                                }
                            },
                            {
                                animated: true
                            }
                        );
                    }
                });
                break;
            case 'gps_accuracy':
                currentIndex = app.locationManager.getLevel();
                showSettingSelection(callbackId, gpsLevels, currentIndex, function(_index) {
                    if (currentIndex !== _index) {
                        app.locationManager.setLevel(_index);
                        e.section.updateItemAt(
                            e.itemIndex,
                            {
                                subtitle: {
                                    text: gpsLevels[_index]
                                }
                            },
                            {
                                animated: true
                            }
                        );
                    }
                });
                break;
            case 'licenses':
                showLicenses();
                break;
            case 'move_first_change':
                app.itemHandler.moveOnFirstChange = e.value;
                break;
            case 'tutorial':
                app.tutorialManager.setEnabled(e.value);
                break;
            case 'powered_by_akylas':
                self.manager.createAndOpenWindow('WebWindow', {
                    url: 'http://www.akylas.fr'
                });
                break;
            case 'openstreetmap':
                self.manager.createAndOpenWindow('WebWindow', {
                    url: 'http://www.openstreetmap.org/copyright'
                });
                break;
            case 'noun_project':
                {
                    var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'data', 'credits.json');
                    if (file.exists()) {
                        var json = eval.call(this, '(' + file.read().text + ')');
                        nativeListViewWindow('noun_project', [
                            {
                                items: _.reduce(
                                    json.icons,
                                    function(memo, value, index) {
                                        memo.push({
                                            title: {
                                                text: value,
                                                font: {
                                                    size: 14
                                                }
                                            },
                                            accessory: {
                                                visible: false
                                            }
                                        });
                                        return memo;
                                    },
                                    []
                                )
                            }
                        ]);
                    }
                }

                break;
            case 'tutorial_reset':
                console.debug('tutorial_reset');
                app.tutorialManager.resetTutorials();
                app.showAlert({
                    title: trc('tutorials_were_reset'),
                    message: trc('tutorials_were_reset_desc')
                });
                break;
        }
    }

    self.listView.on('click', handleCallbackId);
    // app.onDebounce(self.listView, 'click', handleCallbackId);
    self.listView.on('change', handleCallbackId);
    var navWindow = new AppWindow(_args);

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        navWindow = null;
        self = null;
    });
    return navWindow;
}
