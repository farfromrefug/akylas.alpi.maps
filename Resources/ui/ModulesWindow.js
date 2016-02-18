ak.ti.constructors.createModulesWindow = function(_args) {

    function createSectionItem(_id, _text, _subtitle, _data) {
        return _.assign({
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

    function createButtonItem(_text, _subtitle) {
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

    function createSwitchItem(_id, _text, _value) {
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

    function createRow(_module, _item) {
        var html = (_item.title || _item.id);
        if (_item.summary)
            html += '<br><small><small>' + _item.summary + '</small></small>';
        var args = {
            title: (_item.title || _item.id),
            type: (_item.type || 'value'),
            propId: _item.id,
            titleLabel: {
                html: html
            }
        };
        if (args.type === 'switch') {
            args.template = args.type;
            var value = Ti.App.Properties.getBool(_module + '_' + _item.id, false);
            args.switchLabel = _item.properties || {};
            args.switchLabel.value = value;
        } else if (args.type === 'list') {
            args.values = _item.values;
            var index = Ti.App.Properties.getInt(args.propId, 0);
            args.valueLabel = {
                text: args.values[index]
            };
        } else if (args.type === 'filelist') {
            args.path = _item.path;
            args.filter = _item.filter;
            args.valueLabel = {
                text: Ti.App.Properties.getString(args.propId, "")
            };
        } else {
            args.textfieldArgs = _item.properties;
            args.valueLabel = {
                text: getValueForKey(args)
            };
        }
        return args;
    }

    function handlePropertyChange(_moduleId, _id, _value) {
        sdebug('handlePropertyChange', _moduleId, _id, _value);
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

    function showModulesSetting(_id, _settings) {
        var enabled = Ti.App.Properties.getBool('module_' + _id + '_enabled', false);
        var sections = [{
            items: [
                createSwitchItem('enabled', 'enabled', enabled),
            ],
            footerTitle: _settings.description && trc(_settings.description)

        }];
        _.forEach(_settings.preferencesSections, function(section) {
            sections.push({
                headerTitle: section.title,
                items: _.reduce(section.items, function(memo, value) {
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
                    return memo;
                }, [])
            });
        });
        var win = new AppWindow({
            rclass: 'ModulesSettingsWindow',
            title: _settings.name || _id,
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
                change: function(e) {
                    handlePropertyChange(_id, e.item.callbackId, e.value);
                },
                click: app.debounce(function(e) {
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
                            if (e.item.template === 'switch') {
                                var newValue = !e.item.switch.value;
                                handlePropertyChange(_id, e.item.callbackId, newValue);
                                e.section.updateItemAt(e.itemIndex, {
                                    switch: {
                                        value: newValue
                                    },
                                });
                            }
                            break;
                    }
                })
            }
        });
        self.manager.navOpenWindow(win);
    }

    function addModule(_isContent, memo, moduleKey) {
        sdebug('addModule',  moduleKey, _isContent);
        var settings = require((_isContent ? '/contentModules' : '/ui/mapModules') + '/' + moduleKey).settings;
        if (_isContent || settings) {
            settings = settings || {};
            var enabled = Ti.App.Properties.getBool('module_' + moduleKey +
                '_enabled', false);
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
    });
    app.onDebounce(self.listView, 'click', function(e) {
        if (e.item) {
            showModulesSetting(e.item.id, e.item.settings);
        }
    });
    var navWindow = new AppWindow(_args);

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        navWindow = null;
        self = null;
    });
    return navWindow;
};