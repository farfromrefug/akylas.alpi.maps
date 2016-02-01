ak.ti.constructors.createCustomAlertView = function(_args) {
    var cancel = _.remove(_args, 'cancel'),
        hideOnClick = _.remove(_args, 'hideOnClick'),
        buttonNames = _.remove(_args, 'buttonNames', [trc('ok').toUpperCase()]),
        message = _.remove(_args, 'message'),
        image = _.remove(_args, 'image'),
        color = _.remove(_args, 'color', $cTheme.main),
        title = _.remove(_args, 'title'),
        customView = _.remove(_args, 'customView'),
        textAlign = _.remove(_args, 'textAlign', 'center'),
        blurBackground = _.remove(_args, 'blurBackground');

    if (!title) {
        title = message;
        message = undefined;
    }
    var children = [{
        type: 'Ti.UI.Label',
        properties: {
            font: {
                size: 16,
                weight: 'bold'
            },
            textAlign: textAlign,
            backgroundColor: color,
            color: $white,
            visible: !!title,
            html: title,
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10,
            },
            // bottom: 10,
            width: 'FILL'
        }
    }];
    if (customView) {
        children.push(customView);
    }
    sdebug(message);
    children = children.concat([{
        type: 'Ti.UI.Label',
        properties: {
            top: 15,
            font: {
                size: 13,
            },
            visible: !!message,
            html: message,
            color: $black,
            left: 10,
            right: 10,
            maxHeight:250,
            width: 'FILL',
            ellipsize:Ti.UI.TEXT_ELLIPSIZE_TAIL,
            textAlign: textAlign
        }
    }, {
        type: 'Ti.UI.ImageView',
        properties: {
            top: 15,
            font: {
                size: 14,
            },
            visible: !!image,
            image: image,
            left: 10,
            right: 10,
            width: 'FILL',
            maxHeight: 150,
            scaleType: Ti.UI.SCALE_TYPE_ASPECT_FIT
        }
    }]);
    children.push({
        type: 'Ti.UI.View',
        properties: {
            top: (!!message || !!image) ? 15 : 0,
            layout: 'horizontal',
            borderPadding: [0, -1, -1, -1],
            borderColor: '#ddd',
            height: 44
        },
        childTemplates: _.reduce(buttonNames, function(memo, value, index) {
            memo.push({
                type: 'Ti.UI.Button',
                properties: {
                    callbackIndex: index,
                    title: value,
                    width: 'FILL',
                    height: 'FILL',
                    textAlign: 'center',
                    tintColor: color,
                    font: {
                        size: 16,
                        weight: (index === cancel) ? 'bold' : undefined
                    }
                }
            });
            return memo;
        }, [])
    });

    var backView = new View({
        childTemplates: [{
            type: 'Ti.UI.View',
            properties: {
                backgroundColor: '#77000000',
            }
        }]
    });
    var self = new AppWindow(_.assign(_args, {
        backgroundColor: 'transparent',
        underContainerView: backView,
        verticalContainer: false
    }));
    ak.ti.add(self.container, {
        bindId:'alertView',
        properties: {
            borderRadius: 2,
            backgroundColor: $white,
            width: 'SIZE',
            minWidth: 250,
            maxWidth: 274,
            height: 'SIZE',
            layout: 'vertical'
        },
        childTemplates: children
    });
    self.container.bubbleParent = false;
    self.container.touchPassThrough = false;

    function onClick(e) {
        sdebug(index, theCancel, e.source === backView);
        var index = e.source.callbackIndex;
        var shouldHide = e.source === self.container || index !== undefined;
        if (shouldHide) {
            var theCancel = e.source === self.container || index === cancel;
            self.emit('click', {
                source:self.container,
                index: index,
                cancel: theCancel
            });
            if (shouldHide && hideOnClick !== false) {
                self.closeMe();
            }
        }

    }

    app.onDebounce(self.container, 'click', onClick);

    self.showMe = function(_force) {
        sdebug('showMe');
        self.container.alertView.opacity = 0;
        self.container.alertView.animate({
            from: {
                opacity: 0,
                transform: 's1.2',
            },
            to: {
                opacity: 1,
                transform: null,
            },
            duration: 300
        });
        backView.opacity = 0;
        backView.animate({
            from: {
                opacity: 0,
            },
            to: {
                opacity: 1,
            },
            duration: 300
        });
        app.ui.openWindow(self, {animated:false});
    };
    self.closeMe = function(_args) {

        self.animate({
            opacity: 0,
            duration: 200
        }, function() {
            app.ui.closeWindow(self, _args);
        });
    };

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        backView = null;
        self = null;
    });
    return self;
};