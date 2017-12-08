
declare global {
    class ModulesWindow extends NavWindow {
    }
    class ModuleWindow extends AppWindow {
        showSettingSelection(_title: string, _values: string[], _selectedIndex: number, callback: (index: number) => void)
    }
}

export function create(_args) {
    var modules: { [k: string]: MapModule } = {};

    function showSettingSelection(_title: string, _values: string[], _selectedIndex: number, callback: (index: number) => void) {
        if (__APPLE__) {
            var win = new AppWindow({
                rclass: 'SettingsSelectionWindow',
                title: trc(_title),
                listViewArgs: {
                    templates: {
                        'default': app.templates.row.settings
                    },
                    defaultItemTemplate: 'default',
                    sections: [{
                        items: _.reduce(_values, function (memo, value, index) {
                            memo.push({
                                title: {
                                    text: trc(value)
                                },
                                accessory: {
                                    color: $.cTheme.main,
                                    text: (index === _selectedIndex) ? $.sCheck : ''
                                },
                            });
                            return memo;
                        }, [])
                    }]
                },
                events: {
                    click: app.debounce(function (e) {
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
                options: _.map(_values, function (value,
                    index) {
                    return trc(value);
                }),
                buttonNames: [trc('cancel')],
                cancel: 0,
                selectedIndex: _selectedIndex,
                tapOutDismiss: true
            }).on('click', (function (e) {
                if (!e.cancel) {
                    callback(e.index);
                }
            }).bind(this)).show();
        }
    }

    function createSectionItem(_id, _text, _subtitle, _data) {
        return Object.assign({
            callbackId: _id,
            // icon: {
            //     text: _icon
            // },
            title: {
                text: trc(_text)
            },
            subtitle: {
                html: _subtitle
            },
            // template:1,
            // title:trc(_text),
            // accessoryType:1
        }, _data);
    }

    function createButtonItem(_text: string, _subtitle: string) {
        return {
            template: 'button',
            callbackId: _text,
            title: {
                text: trc(_text)
            },
            subtitle: {
                text: _subtitle
            },
        };
    }

    function createSwitchItem(_id: string, _text: string, _value: boolean) {
        return {
            template: 'switch',
            callbackId: _id,
            title: {
                text: trc(_text)
            },
            'switch': {
                value: _value
            }
        };
    }

    // function createRow(_module, _item) {
    //     var html = (_item.title || _item.id);
    //     if (_item.summary)
    //         html += '<br><small><small>' + _item.summary + '</small></small>';
    //     var args: any = {
    //         title: (_item.title || _item.id),
    //         type: (_item.type || 'value'),
    //         propId: _item.id,
    //         titleLabel: {
    //             html: html
    //         }
    //     };
    //     if (args.type === 'switch') {
    //         args.template = args.type;
    //         var value = Ti.App.Properties.getBool(_module + '_' + _item.id, false);
    //         args.switchLabel = _item.properties || {};
    //         args.switchLabel.value = value;
    //     } else if (args.type === 'list') {
    //         args.values = _item.values;
    //         var index = Ti.App.Properties.getInt(args.propId, 0);
    //         args.valueLabel = {
    //             text: args.values[index]
    //         };
    //     } else if (args.type === 'filelist') {
    //         args.path = _item.path;
    //         args.filter = _item.filter;
    //         args.valueLabel = {
    //             text: Ti.App.Properties.getString(args.propId, "")
    //         };
    //     } else {
    //         args.textfieldArgs = _item.properties;
    //         args.valueLabel = {
    //             text: getValueForKey(args)
    //         };
    //     }
    //     return args;
    // }

    function handlePropertyChange(_moduleId, _id, _value) {
        Ti.App.Properties.setObject('module_' + _moduleId + '_' + _id, _value);


        app.emit('module_prop', {
            moduleId: _moduleId,
            id: _id,
            value: _value
        });
        if (_id === 'enabled') {
            var index = _.findIndex(items, {
                id: _moduleId
            });
            if (index >= 0) {
                self.listView.updateItemAt(0, index, {
                    subtitle: {
                        text: trc(_value ? 'on' : 'off')
                    },
                });
            }
        }
    }

    function getSections(moduleId: string, enabled: boolean, settings: ModuleSettings) {
        if (_.isFunction(settings)) {
            settings = settings(enabled);
        }
        var sections = [];
        if (settings.canBeDisabled !== false) {
            sections.push({
                items: [
                    createSwitchItem('enabled', 'enabled', enabled),
                ],
                footerTitle: settings.description && trc(settings.description)

            });
        }
        settings.preferencesSections.forEach(function (section) {
            sections.push({
                headerTitle: section.title,
                items: _.reduce(section.items, function (memo, value) {
                    if (value.type) {
                        switch (value.type) {
                            case 'link':
                                {
                                    memo.push(createSectionItem(value.type, value.title ||
                                        value.id, value.subtitle, {
                                            url: value.url
                                        }));
                                    break;
                                }
                        }
                    } else {
                        memo.push(value);
                    }

                    return memo;
                }, [])
            });
        });
        return sections;
    }

    function handleClickOrChange(_id, module, win, e) {
        if (!e.item) {
            return;
        }
        var callbackId = (e.item && e.item.callbackId) || e.bindId,
            currentValue;
        sdebug(callbackId, e.item, e.value);
        switch (callbackId) {
            case 'link':
                self.manager.createAndOpenWindow('WebWindow', {
                    title: e.item.title.text,
                    url: e.item.url
                });
                break;
            default:
                if (e.item.template === 'switch' && e.item.callbackId == 'enabled') {
                    var newValue = e.hasOwnProperty('value') ? e.value : !e.item.switch.value;
                    var settings = modules[_id].settings;
                    if (_.isFunction(settings)) {
                        app.once(newValue ? 'module_loaded' : 'module_unloaded', function () {
                            win.listView.sections = getSections(_id, newValue, settings);
                        });
                    }
                    handlePropertyChange(_id, e.item.callbackId, newValue);
                    e.section.updateItemAt(e.itemIndex, {
                        switch: {
                            value: newValue
                        },
                    });
                    return;
                }
                else if (_.isFunction(module.onSettingsClickOrChange)) {
                    module.onSettingsClickOrChange(e, self);
                }
                break;
        }
    }

    function showModulesSetting(_id: string) {
        var enabled = Ti.App.Properties.getBool('module_' + _id + '_enabled', false);
        var module = modules[_id];
        var settings = module.settings;
        var sections = getSections(_id, enabled, settings);
        var win = new AppWindow({
            rclass: 'ModulesSettingsWindow',
            title: settings.name || _id,
            listViewArgs: {
                templates: {
                    'default': app.templates.row.settings,
                    'switch': app.templates.row.settingsswitch,
                    'button': app.templates.row.settingsbutton,
                },
                defaultItemTemplate: 'default',
                sections: sections
            },
            events: {
                change: function (e) {
                    handleClickOrChange(_id, module, win, e);
                },
                click: app.debounce(function (e) {
                    handleClickOrChange(_id, module, win, e)
                })
            }
        });
        self.manager.navOpenWindow(win);
    }

    function addModule(_isContent, memo, moduleKey) {
        // sdebug('addModule', moduleKey, _isContent);
        var module = modules[moduleKey] = require((_isContent ? '/contentModules' : '/ui/mapModules') + '/' + moduleKey);
        var settings = module.settings;
        var enabled = Ti.App.Properties.getBool('module_' + moduleKey +
            '_enabled', false);
        if (_isContent || settings) {
            if (_.isFunction(settings)) {
                settings = settings(enabled);
            } else {
                settings = settings || {};
            }

            memo.push({
                settings: settings,
                id: moduleKey,
                subtitle: {
                    text: trc(enabled ? 'on' : 'off')
                },
                title: {
                    text: settings.name || moduleKey
                }
            });
        }
        return memo;

    }

    var items = _.reduce(app.contentModules, _.partial(addModule, true), _.reduce(app.mapModules, _.partial(addModule, false), []));

    var self = _args.window = new AppWindow({
        rclass: 'ModulesRealWindow',
        listViewArgs: {
            templates: {
                'default': app.templates.row.settings,
            },
            defaultItemTemplate: 'default',
            sections: [{
                items: items
            }]
        }
    }) as ModuleWindow;
    self.showSettingSelection = showSettingSelection;
    app.onDebounce(self.listView, 'click', function (e) {
        if (e.item) {
            showModulesSetting(e.item.id);
        }
    });
    var navWindow = new AppWindow(_args) as ModulesWindow;

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        modules = null;
        navWindow = null;
        self = null;
    });
    return navWindow;
};