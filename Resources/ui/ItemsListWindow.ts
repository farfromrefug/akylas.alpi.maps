
declare global {
    class MultiSelectView extends View {
        children: Label[]
    }
}
export function create(_args: WindowParams) {
    let htmlIcon = app.utilities.htmlIcon,
        mapHandler = _.remove(_args, 'mapHandler'),
        itemHandler = app.itemHandler,
        infoRowItemForItem = itemHandler.infoRowItemForItem,
        updateParamsForLocation = itemHandler.updateParamsForLocation,
        desc = _.remove(_args, 'itemDesc'),
        // items: Item[],
        rowItems: RowItem[] = [],
        editing: boolean,
        selectedItems: { [k: string]: boolean } = {},
        selectedItemIndexes: string[],
        isCollection = false;

    // }
    function setEditing(_editing, e?) {
        if (_editing === editing) {
            return;
        }
        editing = _editing;
        // console.debug('setEditing', editing);
        if (!editing && __ANDROID__) {
            // console.debug('t est', selectedItems);
            for (const key in selectedItems) {
                self.listView.updateItemAt(0, parseInt(key), {
                    properties: {
                        backgroundColor: null
                    }
                });
            }
            selectedItems = {};
        }

        self.listView.editing = editing;
        if (!editing) {
            self.hideBottomToolbar();
        } else if (__ANDROID__) {
            setItemSelected(e);
        }
    }

    function setItemSelected(e) {
        var index = e.itemIndex;
        console.debug('setItemSelected', e.itemIndex, selectedItems)
        if (selectedItems.hasOwnProperty(index)) {
            delete selectedItems[index];
            if (__ANDROID__) {
                e.section.updateItemAt(index, {
                    properties: {
                        backgroundColor: null
                    }
                });
            }
        } else {
            selectedItems[index] = true;
            if (__ANDROID__) {
                e.section.updateItemAt(index, {
                    properties: {
                        backgroundColor: $.cTheme.semi
                    }
                });
            }
        }
        selectedItemIndexes = _.keys(selectedItems);
        // selectedItemIndexes = _.map(self.listView.selectedItems, 'index');
        console.debug('selectedItemIndexes', selectedItemIndexes);
        var count = selectedItemIndexes.length;
        console.debug('multiselect', count);
        multiSelectView.applyProperties({
            countLabel: {
                text: trc("{1} item(s)").assign(count)
            }
        });
        if (count > 0) {

            // multiSelectView.animate({
            //     cancelRunningAnimations: true,
            //     height: $.navBarHeight,
            //     duration: 100
            // });
            // } else {
            // self.hideBottomToolbar();
            // multiSelectView.animate({
            //     cancelRunningAnimations: true,
            //     height: 0,
            //     duration: 100
            // });
        }
        self.showBottomToolbar();
    }

    // console.debug('items', items);
    Object.assign(_args, {
        title: htmlIcon(desc.icon, 1) + ' ' + desc.title,
        showBackButton: true,
        customNavBar: true,

        listViewArgs: {
            noPullView: true,
            isCollection: isCollection,
            canEdit: true,
            // canMove: true,
            allowsMultipleSelectionDuringEditing: true,
            templates: {
                default: app.templates.row.listitem,
                // admob: app.templates.row.admob
            },
            defaultItemTemplate: 'default',
            events: {
                itemclick: function (e) {
                    if (editing) {
                        setItemSelected(e);
                        return;
                    }
                    //     var item = e.item;
                    //     if (!item) {
                    //         return;
                    //     }
                    //     var callbackId = e.source.callbackId;
                    //     if (callbackId) {

                    //         app.handleItemAction(callbackId, item.item, desc, function(_option,
                    //             _result) {
                    //             if (_result === true) {
                    //                 if (_option === 'delete' || _option === 'move') {
                    //                     e.section.deleteItemsAt(e.itemIndex, 1, {
                    //                         animated: true
                    //                     });
                    //                 }
                    //             } else {
                    //                 self.listView.closeSwipeMenu();
                    //             }

                    //         }, self, mapHandler);
                    //     } else {

                    //         self.manager.createAndOpenWindow('GeoFeatureWindow', {
                    //             mapHandler: mapHandler,
                    //             item: item.item,
                    //             itemDesc: desc
                    //         });
                    //     }

                },
                click: app.debounce(function (e) {
                    console.debug('item click', e);

                    var item = e.item;
                    if (!item || !!editing) {
                        return;
                    }
                    var callbackId = e.source.callbackId || 'details';
                    itemHandler.handleItemAction(callbackId, item.item, desc, function (_option,
                        _result) {
                        if (_result === true) {
                            // if (_option === 'delete' || _option === 'move') {
                            //     e.section.deleteItemsAt(e.itemIndex, 1, {
                            //         animated: true
                            //     });
                            // }
                        } else {
                            self.listView.closeSwipeMenu();
                        }

                    }, self, mapHandler);

                }),
                longpress: function (e) {
                    // if (!editing) {
                    console.debug('longpress');
                    setEditing(!editing, e);
                    // }
                }
            }
        }
    });
    if (!!desc.isList) {
        _args.rightNavButtons = [{
            //     icon: $.sEditMove,
            //     callback: function() {
            //         self.listView.editing = !self.listView.editing;
            //     }
            // }, {
            icon: $.sEdit,
            callback: function () {
                self.manager.createAndOpenWindow('EditListWindow', {
                    mapHandler: mapHandler,
                    list: desc
                });
            }
        }];
    }
    var multiSelectView = _args.bottomToolbar = new View({
        layout: 'horizontal',
        height: $.navBarHeight,
        childTemplates: [app.templates.row.createToolbarButton('close', $.sClose, false), {
            type: 'Ti.UI.Label',
            bindId: 'countLabel',
            properties: {
                width: 'FILL',
                color: $.black,
                left: 5,
                height: 'FILL'
            }
        }, app.templates.row.createToolbarButton('move'),
        app.templates.row.createToolbarButton('delete')
        ],
        events: {
            click: app.debounce(function (e) {
                var callbackId = e.bindId || e.source.callbackId;
                if (callbackId === 'close') {
                    setEditing(false);
                    return;
                }
                var theItems: Item[] = _.map(_.at(rowItems, selectedItemIndexes), 'item');
                console.debug('click', callbackId, theItems, e);
                itemHandler.handleItemAction(callbackId, theItems, desc, function (_result) {
                    // setTimeout(function() {
                    setEditing(false);
                    // }, 300);
                    // self.hideBottomToolbar();
                }, self, mapHandler);

            })
        }
    }) as MultiSelectView;

    var self = new AppWindow(_args);
    function updateItems() {
        let items = _.flatten(mapHandler.runGetMethodOnModules('getItems', desc.id));
        rowItems = _.sortBy(_.reduce(items, function (result, value, index) {
            result.push(infoRowItemForItem(value, desc));
            return result;
        }, []), 'searchableText');

        var count = items.length;
        self.listView.sections = [{
            items: rowItems
        }];
        if (items.length > 0) {
            app.showTutorials(['items_listview']);
        }
    }

    function updateList() {
        self.setColors(desc.color);
        self.container.applyProperties({
            titleView: {
                html: htmlIcon(desc.icon, 1) + ' ' + desc.title
            }
        });
    }

    self.setColors = _.flow(self.setColors, function (colors) {
        if (self.isOpened) {
            multiSelectView.animate({
                backgroundColor: colors.color,
                // tintColor: colors.contrast,
                duration: 300
            });
        } else {
            multiSelectView.applyProperties({
                // tintColor: colors.contrast,
                backgroundColor: colors.color
            });
        }
        multiSelectView.children.forEach(function (child) {
            // if (child.color) {
            child.color = colors.contrast;
            // }
            child.children.forEach(function (child2) {
                // if (child2.color) {
                child2.color = colors.contrast;
                // }
            })
        });
    });

    function onListChanged(e: ListsEvent) {
        var list = e.list;
        if (list.id === desc.id) {
            desc = list;
            updateList();
        }
    }

    function onListRemoved(e: ListsEvent) {
        var list = e.list;
        if (e.list.id === desc.id) {
            self.closeMe();
        }
    }

    function onChanged(e: ItemChangedEvent) {
        if (e.desc.id !== desc.id) {
            return;
        }
        var item = e.item;
        var index = findItemIndex(item.id);

        if (index >= 0) {
            rowItems[index] = infoRowItemForItem(item, e.desc);
            self.listView.updateItemAt(0, index, rowItems[index]);
        }
    }

    function onRemoved(e: ItemsEvent) {
        console.debug('onRemoved', e);
        if (e.desc.id !== desc.id) {
            return;
        }
        e.items.forEach(function (item) {
            var index = findItemIndex(item.id);

            if (index >= 0) {
                rowItems.splice(index, 1);
                self.listView.deleteItemsAt(0, index, 1, {
                    animated: true
                });
            }
        });
        if (rowItems.length === 0) {
            self.closeMe();
        }
    }

    function findItemIndex(_id) {
        return _.findIndex(rowItems, function (item) {
            return item.item && item.item.id === _id;
        });
    }

    function onMoved(e: ItemsMovedEvent) {
        let value;
        for (const key in e.oldItems) {
            value = e.oldItems[key];
            if (value.desc.id === desc.id) {
                value.items.forEach(function (item) {
                    var index = findItemIndex(item.id);
                    if (index >= 0) {
                        rowItems.splice(index, 1);
                        self.listView.deleteItemsAt(0, index, 1, {
                            animated: true
                        });
                    }
                });
                return false;
            }
        };
        if (rowItems.length === 0) {
            self.closeMe();
        }
    }
    updateList();
    self.showLoading();
    self.onOpen = app.composeFunc(self.onOpen, function () {
        updateItems();
        self.hideLoading();
    });

    function onLocation(e) {
        var location = e.location;
        var update = _.reduce(rowItems, function (memo, item) {
            memo.push(updateParamsForLocation(item.item, location));
            return memo;
        }, []);
        self.listView.sections[0].updateItems(update);
    }

    app.on(__LIST__ + 'Changed', onListChanged)
        .on(__LIST__ + 'Removed', onListRemoved)
        .on(_EVENT_ITEMS_CHANGED_, onChanged)
        .on(_EVENT_ITEMS_MOVED_, onMoved)
        .on(_EVENT_ITEMS_REMOVED_, onRemoved)
        .on('location', onLocation);

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        app.off(__LIST__ + 'Changed', onListChanged)
            .off(__LIST__ + 'Removed', onListRemoved)
            .off(_EVENT_ITEMS_CHANGED_, onChanged)
            .off(_EVENT_ITEMS_MOVED_, onMoved)
            .off(_EVENT_ITEMS_REMOVED_, onRemoved)
            .off('location', onLocation);
        self = null;
        // sections = null;
        mapHandler = null;
        multiSelectView = null;
    });

    return self;
};