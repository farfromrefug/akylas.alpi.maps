ak.ti.constructors.createEditListWindow = function (_args) {
    var list = _.remove(_args, 'list'),
        currentItem = _.remove(_args, 'item'),
        mapHandler = _.remove(_args, 'mapHandler'),
        isItem = !!currentItem,
        isEdit = isItem || !!list,
        // palette = require('data/palette').colors,
        // indexedPalette = _.values(palette),
        changes: {
            newPhotos?: ItemPhoto[]
            deletedPhotos?: string[]
            icon?: string
            color?: string
            title?: string
            customTitle?: boolean
        } = {},
        letters = 'abcdefghijklmnopqrstuvwxyz',
        itemHandler = app.itemHandler,
        cancelled = true;
    // indexedIcons = _.values(app.icons);
    var icons = app.indexedIcons;
    var colors = app.indexedColors;
    // sdebug('icons', icons);
    // sdebug('colors', colors);

    var color = (currentItem && currentItem.color) || (list && list.color);
    var icon = (currentItem && currentItem.icon) || (list && list.icon);
    var title = (currentItem && itemHandler.itemTitle(currentItem, list)) || (list && list.title);

    _args.titleView = {

        properties: {
            width: 'FILL',
            height: 'FILL',
        },
        childTemplates: [{
            type: 'Ti.UI.Label',
            bindId: 'titleView',
            properties: {
                rclass: 'EditListTitleLabel',
                text: isItem ? trc('item_name') : trc('list_name'),

            },
            childTemplates: [{
                bindId: 'icon',
                type: 'Ti.UI.Label',
                properties: {
                    rclass: 'EditListTitleIcon',
                }
            }, {
                bindId: 'tf',
                type: 'Ti.UI.TextField',
                properties: {
                    rclass: 'EditListTitleTF',
                },
                events: {
                    change: function (e) {
                        changes.title = e.value;
                    }
                }
            }]
        }]
    };
    _args.rightNavButtons = [{
        icon: $.sCheck,
        callback: function () {
            var theTitle = changes.title || title;
            if (!theTitle || theTitle.length === 0) {
                app.emit('error', {
                    message: trc('please_enter_a_name')
                });
                return;
            } else if (changes.title && isItem) {
                changes.customTitle = true;
            }
            var theColor = changes.color || color;
            if (!theColor) {
                app.emit('error', {
                    message: trc('please_choose_a_color')
                });
                return;
            }

            if (_.size(changes)) {
                if (isItem) {
                    itemHandler.updateItem(currentItem, list, changes, mapHandler);
                } else {
                    if (isEdit) {
                        mapHandler.runMethodOnModules('spreadModuleAction', {
                            id: __ITEMS__,
                            command: 'update_list',
                            list: list,
                            changes: changes

                        });
                    } else {
                        mapHandler.runMethodOnModules('spreadModuleAction', {
                            id: __ITEMS__,
                            command: 'create_list',
                            list: Object.assign(list, changes)

                        });
                    }
                }
            }
            cancelled = false;
            self.closeMe();
        }
    }];

    // var icons = _.mapKeys(app.icons, function(value, key) {
    //     return trc(key);
    // });

    var iconItems = [],
        pair,
        i, j,
        currentIndex = 0,
        currentLetterIndex = 0,
        currentLetter = letters[currentLetterIndex],
        value, key, firstLetter, letterIndex,
        iconIndexes = [{
            title: currentLetter.toUpperCase(),
            index: 0
        }];

    // var iconIndexes = [];
    // _.each(letters, function(letter) {
    //     var newIndex = _.findIndex(iconItems, function(item) {
    //         return (item.searchableText.charAt(0).toLowerCase() === letter);
    //     });
    //     if (newIndex >= 0) {
    //         index = newIndex;
    //     }
    //     iconIndexes.push({
    //         title: letter.toUpperCase(),
    //         index: index
    //     });
    // });

    var tabView = new AppTabView({
        nativeControls: true,
        tabsControllerClass: 'EditListTabController',
        tintColor: color,
        tabs: [{
            title: trc('color'),
            type: 'Ti.UI.ListView',
            properties: {
                rclass: 'EditListListView',
                templates: {
                    'default': app.templates.row.color
                },
                defaultItemTemplate: 'default',
                sections: [{
                    // headerTitle: trc('color'),
                    // items: colorItems
                }]
            },
            events: {
                indexclick: function (e) {
                    e.source.scrollToItem(0, e.sectionIndex, {
                        animated: true,
                        position: 1
                    });
                },
                first_load: function (e) {
                    var colorItems = _.reduce(colors, function (memo, pair) {
                        memo.push({
                            colorBubble: {
                                backgroundColor: pair[1]
                            },
                            title: {
                                // text: _.startCase(key)
                                text: pair[0]
                            },
                            color: pair[1]
                        });
                        return memo;
                    }, []);
                    e.source.sections = [{
                        items: colorItems
                    }];
                    // e.source.appendItems(0, colorItems);
                }
            }
        }, {
            title: trc('icon'),
            type: 'Ti.UI.ListView',
            properties: {
                rclass: 'EditListListView',
                templates: {
                    'default': app.templates.row.iconrow
                },
                defaultItemTemplate: 'default',
                sections: [{
                    items: []
                }]
            },
            events: {
                indexclick: function (e) {
                    e.source.scrollToItem(0, e.sectionIndex, {
                        animated: true,
                        position: 1
                    });
                },
                first_load: function (e) {
                    sdebug('first_load');
                    for (i = 0; i < icons.length; i++) {
                        pair = icons[i];
                        key = pair[0];
                        value = pair[1];
                        firstLetter = key.charAt(0).toLowerCase();
                        if (firstLetter !== currentLetter) {
                            letterIndex = letters.indexOf(firstLetter);
                            for (j = currentLetterIndex + 1; j < letterIndex; j++) {
                                iconIndexes.push({
                                    title: currentLetter.toUpperCase(),
                                    index: currentIndex
                                });
                            }
                            iconIndexes.push({
                                title: firstLetter.toUpperCase(),
                                index: i
                            });
                            currentLetterIndex = letterIndex;
                            currentLetter = firstLetter;
                            currentIndex = i;
                        }
                        iconItems.push({
                            icon: {
                                text: value,
                                visible: true
                            },
                            delete: {
                                visible: false
                            },
                            title: {
                                text: key
                            },
                            searchableText: key,
                            iconValue: value
                        });
                    }
                    e.source.applyProperties({
                        sectionIndexTitles: iconIndexes,
                        sections: [{
                            items: iconItems
                        }]
                    });
                    // e.source.appendItems(0, iconItems);
                    // e.source.sections[0].items = colorItems;
                }
            }

        }]
    }).on('change', function (e) {
        self.blur();
    });

    var self = new AppWindow(_args) as AppWindow & {
        container: Container & {
            tf: TextField
        }
    };
    self.closeMe = app.composeFunc(self.closeMe, function () {
        if (cancelled) {
            _.forEach(changes.newPhotos, function (photo) {
                Ti.Filesystem.getFile(app.getImagePath(photo.image)).deleteFile();
            });
        }
    });

    if (currentItem) {
        var nbPhotos = 0;
        var photos = [];
        var photoItem = function (_photo, _index: number, _aboutToAnimate?: boolean) {
            return {
                type: 'Ti.UI.View',
                properties: {
                    width: (!!_aboutToAnimate) ? 0 : 'SIZE'
                },
                childTemplates: [{
                    type: 'Ti.UI.View',
                    properties: {
                        rclass: 'EditPhotoHolder',
                        transform: (!!_aboutToAnimate) ? 's0.1' : undefined
                    },
                    childTemplates: [{
                        type: 'Ti.UI.ImageView',
                        properties: {
                            rclass: 'EditPhotoImageView',
                            image: app.getThumbnailImagePath(_photo),
                            callbackId: 'photo',
                            imageIndex: _index
                        },
                    }, {
                        type: 'Ti.UI.Label',
                        properties: {
                            rclass: 'EditPhotoRemoveBtn',
                            callbackId: 'remove',
                            photoId: _photo.image,
                            imageIndex: _index
                        }
                    }]
                }]
            };
        };
        ak.ti.add(self.container, {
            type: 'Ti.UI.ScrollView',
            properties: {
                rclass: 'EditPhotoScrollView'
            },
            childTemplates: _.reduce(currentItem.photos, function (memo, photo, index) {
                nbPhotos++;
                photos.push(photo);
                memo.push(photoItem(photo, index));
                return memo;
            }, []).concat({
                type: 'Ti.UI.Label',
                properties: {
                    rclass: 'EditPhotoAdd',
                    callbackId: 'add',
                }
            }),
            events: {
                click: app.debounce(function (e) {
                    var callbackId = e.source.callbackId;
                    if (callbackId == 'photo') {
                        app.showImageFullscreen(photos, e.source.imageIndex, e.source);
                    } else if (callbackId == 'remove') {
                        if (!changes.deletedPhotos) {
                            changes.deletedPhotos = [];
                        }
                        photos = _.reject(photos, { image: e.source.photoId });
                        changes.deletedPhotos.push(e.source.photoId);
                        var holder = e.source.parent;
                        holder.animate({
                            transform: 's0.1',
                            duration: 200
                        });
                        holder.parent.animate({
                            width: 0,
                            duration: 200
                        }, function () {
                            holder.parent.removeFromParent();
                        });
                        nbPhotos--;
                    } else if (callbackId == 'add') {
                        itemHandler.handleItemAction('acquire_photo', currentItem, list, function (
                            options, newPhoto, image) {
                            if (newPhoto) {
                                if (!changes.newPhotos) {
                                    changes.newPhotos = [];
                                }
                                photos.push(newPhoto);
                                changes.newPhotos.push(newPhoto);
                                var photoView = new View(photoItem(newPhoto, nbPhotos, true));
                                e.source.parent.add(photoView, nbPhotos);
                                photoView.children[0].animate({
                                    transform: null,
                                    duration: 200
                                });
                                photoView.animate({
                                    width: 'SIZE',
                                    duration: 200
                                });
                                nbPhotos++;
                            }
                        }, self, mapHandler);
                    }

                })
            }
        });
    }

    self.container.add(tabView);

    function updateForColor(_color) {
        var colors = self.setColors(_color);

        self.container.applyProperties({
            tf: {
                color: colors.contrast,
                borderColor: colors.contrast,
                tintColor: colors.contrast,
                hintColor: colors.contrastGray
            },
            icon: {
                color: colors.contrast
            }
        });
        var current = tabView.pager.strip || {};
        tabView.applyProperties({
            tintColor: colors.color,
            pager: {
                strip: Object.assign(current, {
                    backgroundColor: colors.color,
                    indicatorColor: colors.contrast,
                    color: colors.contrast
                })
            }

        });
    }

    self.on('click', function (e) {
        var item = e.item;
        if (!item) {
            return;
        }
        if (item.color) {
            changes.color = item.color;
            updateForColor(changes.color);
        } else if (item.iconValue) {
            changes.icon = item.iconValue;
            self.container.applyProperties({
                icon: {
                    text: changes.icon
                }
            });
        }
    });

    if (!isItem && !list) {
        list = {
            icon: $.sPlace
        };
    }

    self.container.applyProperties({
        tf: {
            value: title
        },
        icon: {
            text: icon
        }
    });

    if (color) {
        updateForColor(color);
    } else {
        updateForColor($.cTheme.main);
    }
    self.container.tf.once('postlayout', function (e) {
        e.source.focus();
    });

    // self.once('open', function() {
    // var views = tabView.pager.views;
    // for (i = 0; i < icons.length; i++) {
    //     pair = icons[i];
    //     key = pair[0];
    //     value = pair[1];
    //     firstLetter = key.charAt(0).toLowerCase();
    //     if (firstLetter !== currentLetter) {
    //         letterIndex = letters.indexOf(firstLetter);
    //         for (j = currentLetterIndex + 1; j < letterIndex; j++) {
    //             iconIndexes.push({
    //                 title: currentLetter.toUpperCase(),
    //                 index: currentIndex
    //             });
    //         }
    //         iconIndexes.push({
    //             title: firstLetter.toUpperCase(),
    //             index: i
    //         });
    //         currentLetterIndex = letterIndex;
    //         currentLetter = firstLetter;
    //         currentIndex = i;
    //     }
    //     iconItems.push({
    //         icon: {
    //             text: value,
    //             visible: true
    //         },
    //         delete: {
    //             visible: false
    //         },
    //         title: {
    //             text: key
    //         },
    //         searchableText: key,
    //         iconValue: value
    //     });
    // }

    //     var index = _.findIndex(colors, function(c) {
    //         return c[1] == color;
    //     });
    //     if (index >= 0) {
    //         views[0].selectItem(0, index, {
    //             animated: false
    //         });
    //     }
    //     index = _.findIndex(icons, function(c) {
    //         return c[1] == icon;
    //     });
    //     if (index >= 0) {
    //         views[1].selectItem(0, index, {
    //             animated: false
    //         });
    //     }
    // });

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        tabView = null;
        mapHandler = null;
        self = null;
    });
    return self;
};