ak.ti.constructors.createOptionsListWindow = function(_args) {
    var options = _.remove(_args, 'options'),
        hideOnClick = _args.hideOnClick !== false,
        color = options.color || $cTheme.main,
        blurBackground = options.blurBackground,
        count = options.items.length,
        small = !!options.small,
        templates = _.remove(_args, 'templates', {
            'default': small ? app.templates.row.list : app.templates.row.listitem
        }),
        closeY = 60,
        dataToSend,
        topRect = app.ui.topWindow.rect;

    function cancel() {
        sdebug('cancel');
        dataToSend = {
            cancel: true
        };
        if (hideOnClick) {
            self.closeMe();
        }
        // self.emit('click', {
        //     cancel: true
        // });

    }

    var cancelBtn = new Label({
        bindId: 'cancel',
        text: trc(options.cancelText || 'cancel').toUpperCase(),
        // transform: 'ot0,100%',
        bottom: 0,
        width: 'FILL',
        textAlign: 'center',
        bubbleParent: false,
        color: app.colors.red.color,
        height: 40,
        backgroundColor: $white,
        backgroundSelectedColor: app.colors.red.darker,
        events: {
            click: cancel
        }
    });

    var headerView = new Label({
        rclass: 'OptionsListHeader',
        backgroundColor: color,
        html: options.title
    });

    var self = new AppWindow(_args);
    self.underContainer.on('singletap', cancel);

    var listView = new ListView({
        bindId: 'listView',
        properties: {
            canFade: true,
            rclass: 'OptionsListListView',
            // touchPassThrough: true,
            bubbleParent: false,
            // backgroundColor:'#77000000',
            // transform: 'ot0,100%',

            templates: templates,
            defaultItemTemplate: 'default',
            sections: [{
                headerView: headerView,
                items: _.reduce(options.items, function(memo, value, key, list) {
                    memo.push(value);
                    return memo;
                }, [])
            }]
        },
        events: __APPLE__?{
            scroll: {
                variables: {
                    tx: 'contentOffset.y',
                    canFade: 'source.canFade'
                },
                condition: '_canFade',
                targets: [{
                    target: self.underContainer,
                    properties: {
                        opacity: '1+(_tx/' + closeY + ')/2',
                    }
                }]
            },
            dragend: function(e) {
                if (e.contentOffset.y < -closeY) {
                    listView.canFade = false;
                    cancel();
                }
                // sdebug(e.contentOffset.y);
            }
        }:undefined
    });
    var rowHeight = templates.default.properties.height || listView.rowHeight;
    var heightForListView = topRect.height - 40;
    var listViewHeight = (count) * rowHeight + ($navBarHeight + $navBarTop); // the end is the section header height
    var percent = Math.min(Math.floor(listViewHeight / heightForListView * 100), 60);
    listView.headerView = {
        type: 'Ti.UI.View',
        properties: {
            // touchEnabled: false,
            bubbleParent:false,
            height: Math.round(app.deviceinfo.height * (100 - percent) / 100)
        },
        events: {
            click: cancel
        }

    };
    self.container.add([listView, cancelBtn]);

    app.onDebounce(listView, 'itemclick', function(e) {
        dataToSend = {
            cancel: false,
            index: e.itemIndex,
            item: e.item
        };
        if (hideOnClick) {
            self.closeMe();
        }
        // self.emit('click', {
        //     cancel: false,
        //     index: e.itemIndex,
        //     item: e.item
        // });
    });
    // self.toDoAfterOpening = function() {
    // listView.animate({
    //     transform: null,
    //     // delay: 10,
    //     duration: 300
    // });
    // cancelBtn.animate({
    //     transform: null,
    //     duration: 300
    // });
    self.animate({
        underContainer: {
            from: {
                opacity: 0,
            },
            to: {
                opacity: 1,
            }
        },
        container: {
            cancel: {
                from: {
                    transform: 'ot0,100%',
                },
                to: {
                    transform: null,
                }
            },
            listView: {
                from: {
                    transform: 'ot0,100%',
                },
                to: {
                    transform: null,
                }
            }
        },

        duration: 300
    });
    // };

    self.closeMe = function(_args) {
        self.animate({
            underContainer: {
                opacity: 0,

            },
            container: {
                cancel: {
                    transform: 'ot0,100%',
                },
                listView: {
                    transform: 'ot0,100%',
                },
            },
            duration: 200
        }, function() {
            app.ui.closeWindow(self, _args);
            self.emit('click', dataToSend);
        });
        // backView.animate({
        //     opacity: 0,
        //     duration: 200
        // });
        // cancelBtn.animate({
        //     transform: 'ot0,100%',
        //     duration: 200
        // });
    };

    self.updateTitle = function(_title) {
        headerView.html = _title;
    };

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        cancelBtn = null;
        listView = null;
        headerView = null;
        self = null;
    });
    return self;
};