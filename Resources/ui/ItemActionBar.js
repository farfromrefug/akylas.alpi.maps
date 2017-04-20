ak.ti.constructors.createItemActionBar = function(_args) {
    var mapHandler = _.remove(_args, 'mapHandler'),
        window = _.remove(_args, 'window'),
        layout = _.remove(_args, 'layout', 'horizontal'),
        onMap = _.remove(_args, 'onMap', true),
        itemHandler = app.itemHandler,
        isVertical = layout === 'vertical',
        cancelClick = false,
        self = new View(_args),
        item, desc,
        currentView;
    // ak.ti.add(self, {
    //     type:'Ti.UI.View',
    //     properties:{
    //         right:0,
    //         width:5,
    //         zIndex:2,
    //         backgroundGradient:{
    //             type : 'linear',
    //             colors : ['#88888800','#888888ff'],
    //             startPoint : [0, 0],

    //             endPoint : ['100%', 0]
    //         }
    //     }
    // });
    function createViewForItem(_item, _desc) {
        return new ScrollView({
            properties: {
                rclass: 'ActionLine',
                height: _args.height || 'FILL',
                bottom: 0,
                contentHeight: isVertical ? 'SIZE' : 'FILL',
                // contentWidth: isVertical ? 'FILL' : 'SIZE',
                layout: layout
            },
            childTemplates: _.reduce(itemHandler.actionsForItem(mapHandler, _item, _desc, onMap), function(memo,
                value,
                key) {
                memo.push(new ActionButton(Object.assign({
                    id: value[0]
                }, value[1])));
                return memo;
            }, [])
        });
    }

    function clearView(_view) {
        if (_view) {
            _view.removeFromParent();
            _.each(_view.children, function(btn) {
                btn.GC();
            });
            _view = null;
        }
    }

    self.updateForItem = function(_item, _desc, _animated) {
        if (item === _item && desc === _desc) {
            return;
        }
        item = _item;
        desc = _desc;
        var oldView = currentView;
        currentView = createViewForItem(_item, _desc);

        if (isVertical) {
            self.animate({
                height: (Math.min(newView.children.length, 4)) * 54
            });
        }
        self.transitionViews(oldView, currentView, {
            style: Ti.UI.TransitionStyle.FADE,
            duration: 200
        }, function() {
            clearView(oldView);
        });

    };
    app.onDebounce(self, 'click', function(e) {
        if (cancelClick) {
            // sdebug('actionbar', 'canceledClick');
            cancelClick = false;
            return;
        }
        var callbackId = e.source.callbackId;
        if (callbackId) {

            itemHandler.handleItemAction(callbackId, item, desc, null, window, mapHandler);
        }
    });
    app.onDebounce(self, 'longpress', function(e) {
        // cancelClick = true;
        var callbackId = e.source.callbackId;
        if (callbackId) {
            itemHandler.handleItemAction(callbackId + '_long', item, desc, null, window, mapHandler, {
                onMap:onMap
            });
        }
    });

    self.onInit = function(_window, _mapHandler) {
        window = _window;
        mapHandler = _mapHandler;
    };

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function() {
        clearView(currentView);
        self = null;
        window = null;
        itemHandler = null;
        mapHandler = null;
    });
    return self;
};
