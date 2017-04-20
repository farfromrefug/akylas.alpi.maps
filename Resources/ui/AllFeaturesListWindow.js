ak.ti.constructors.createAllFeaturesListWindow = function(_args) {
    var lists = _.flatten(_.remove(_args, 'lists')),
        mapHandler = _.remove(_args, 'mapHandler');

    function getSectionKey(_list) {
        var desc = _.isObject(_list.description) ? _list.description : _list;
        var result = 'items';
        if (!!desc.isList) {
            result = 'lists';
        }
        return result;
    }
    var sections = _.reduce(['lists', 'items'], function(memo, type) {
        memo[type] = new ListSection({
            hideWhenEmpty: true,
            headerTitle: trc(type)
        });
        return memo;
    }, {});

    function getItemForList(desc, _count) {
        var textColor = (desc.colors.luminance > 0.8) ? desc.colors.contrast : desc.color;
        return {
            properties: {
                visible: !!desc.isList || _count > 0,
            },
            icon: {
                color: textColor,
                text: desc.icon
            },
            title: {
                // color: desc.color,
                text: desc.title
            },
            subtitle: {
                // color: desc.color,
                text: desc.description
            },
            countLabel: {
                text: _count || 0
            },
            switch: {
                visible: desc.canBeHidden !== false,
                onTintColor: textColor,
                value: desc.visible !== false
            },
            delete: {
                visible: !!desc.isList
            },
            edit: {
                visible: !!desc.isList
            },
            count: _count || 0,
            desc: desc,
            id: desc.id
        };
    }
    _.forEach(_.groupBy(lists, getSectionKey), function(_groupList, _key) {
        sections[_key].items = _.sortBy(_.reduce(_groupList, function(memo, value) {
            var desc = value.description;
            // sdebug('list', value.description.title, value.count);
            memo.push(getItemForList(value.description, value.count));
            return memo;
        }, []), 'name');
    });

    _args.rightNavButtons = [{
        icon: $.sAdd,
        callback: function() {
            self.manager.createAndOpenWindow('EditListWindow', {
                mapHandler: mapHandler
            });
        }
    }];
    _args.listViewArgs = {
        noPullView: true,
        templates: {
            'default': app.templates.row.list
        },
        defaultItemTemplate: 'default',
        sections: _.sortBy(sections, ['lists', 'items'])
    };

    //ADMOB
    if (app.shouldShowAds()) {
        _args.bottomToolbar = ak.ti.style({
            type: 'AkylasAdmob.View',
            properties: {
                rclass: 'AdmobView',
                location: app.currentLocation
            },
            events: {
                load: function(e) {
                    self.showBottomToolbar();
                }
            }
        });
    }
    //ADMOB

    var self = new AppWindow(_args);

    function handleListAction(_callbackId, e) {
        var item = e.item;
        mapHandler.runMethodOnModules('spreadModuleAction', {
            id: item.id,
            command: _callbackId + '_list',
            value: item.desc

        });
        if (_callbackId === 'clear') {
            e.section.updateItemAt(e.itemIndex, {
                count: 0,
                properties: {
                    visible: !!item.desc.isList,
                },
                countLabel: {
                    text: 0
                }
            }, {
                animated: true
            });
        }
    }

    app.onDebounce(self.listView, 'click', function(e) {
        var item = e.item;
        if (!item) {
            return;
        }
        var callbackId = e.source.callbackId;
        sdebug('click', callbackId, item.desc);
        if (callbackId) {
            if (callbackId === 'edit') {
                self.manager.createAndOpenWindow('EditListWindow', {
                    mapHandler: mapHandler,
                    list: item.desc
                });
            } else {

                if (!!item.desc.isList && (callbackId === 'clear' || callbackId === 'delete')) {
                    app.confirmAction({
                        message: trc('confirm_' + callbackId),
                        title: trc(callbackId)
                    }, function() {
                        self.listView.closeSwipeMenu();
                        handleListAction(callbackId, e);
                    });
                    return;
                } else {
                    handleListAction(callbackId, e);
                }

                // self.closeMe();
            }

            self.listView.closeSwipeMenu();
        } else {
            var desc = item.desc;
            self.manager.createAndOpenWindow('ItemsListWindow', {
                mapHandler: mapHandler,
                itemDesc: desc
            });
        }
    });
    self.listView.on('change', function(e) {
        sdebug('change', e);
        var item = e.item;
        if (!item) {
            return;
        }
        if (e.bindId === 'switch') {
            mapHandler.runMethodOnModules('spreadModuleAction', {
                id: item.id,
                command: 'visibility',
                value: e.value

            });
        }
    });

    function onListAdded(e) {
        sdebug('onListAdded', e);
        var list = e.list;
        var section = sections[getSectionKey(list)];
        section.insertItemsAt(0, [getItemForList(list)], {
            animated: true
        });
    }

    function onListChanged(e) {
        var list = e.list;
        var section = sections[getSectionKey(list)];
        var index = _.findIndex(section.items, {
            id: list.id
        });
        if (index >= 0) {
            section.updateItemAt(index, getItemForList(list), {
                animated: true
            });
        }
    }

    function onListRemoved(e) {
        var list = e.list;
        sdebug('onListRemoved', e);
        var section = sections[getSectionKey(list)];
        sdebug('section', section);
        var index = _.findIndex(section.items, {
            id: list.id
        });
        sdebug('index', index);
        if (index >= 0) {
            section.deleteItemsAt(index, 1, {
                animated: true
            });
        }
    }

    function updateSectionCount(desc, delta) {
        var section = sections[getSectionKey(desc)];
        var items = section.items;
        var index = _.findIndex(items, {
            id: desc.id
        });
        if (index >= 0) {
            var item = items[index];
            var count = item.count + delta;
            section.updateItemAt(index, {
                count: count,
                properties: {
                    visible: !!desc.isList || count > 0,
                },
                countLabel: {
                    text: count
                }
            });
        }
    }

    function onRemoved(e) {
        updateSectionCount(e.desc, -1);
    }

    function onMoved(e) {
        _.forEach(e.oldItems, function(value) {
            updateSectionCount(value.desc, -value.items.length);
        });
        updateSectionCount(e.desc, e.items.length);
    }

    app.on(__LIST__ + 'Created', onListAdded)
        .on(__LIST__ + 'Changed', onListChanged)
        .on(__LIST__ + 'Removed', onListRemoved)
        .on(__ITEMS__ + 'Moved', onMoved)
        .on(__ITEMS__ + 'Removed', onRemoved);

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
        app.off(__LIST__ + 'Created', onListAdded)
            .off(__LIST__ + 'Changed', onListChanged)
            .off(__LIST__ + 'Removed', onListRemoved)
            .off(__ITEMS__ + 'Moved', onMoved)
            .off(__ITEMS__ + 'Removed', onRemoved);
        self = null;
        sections = null;
        mapHandler = null;
    });
    return self;
};