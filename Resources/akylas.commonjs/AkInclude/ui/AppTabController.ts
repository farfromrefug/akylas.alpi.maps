

export function create(_args) {
    var createTab = _.remove(_args, 'createTab');
    var self: AppTabController = new View(_args) as AppTabController;
    var tabRClass = _args.rclassTab || 'AppTab';
    var rclassContainer = _args.rclassContainer || 'AppTabControllerContainer';
    self.add(ak.ti.style({
        type: 'Ti.UI.View',
        bindId: 'container',
        properties: {
            rclass: rclassContainer
        }
    }), 0);
    var currentTab = 0;

    createTab = createTab || function (_tab, index, selected, tabRClass) {
        return {
            type: 'Ti.UI.Label',
            properties: Object.assign({
                html: _tab,
                index: index,
                rclass: tabRClass,

            }, __APPLE__ ? { selected: selected } : { enabled: !selected })
        }
    }

    function prepareTabs(_tabs) {
        var currentCount = self ? self.container.children.length : 0;
        var selected = currentCount === 0;
        var tabsToAdd = [];
        for (var i = 0; i < _tabs.length; i++) {
            tabsToAdd.push(createTab(_tabs[i], currentCount, selected, tabRClass));
            currentCount++;
            selected = false;
        }
        return tabsToAdd;
    }
    if (_args.labels) {
        ak.ti.add(self.container, prepareTabs(_args.labels));
    }

    self.setLabels = function (_tabs) {
        self.removeAllChildren();
        self.add(prepareTabs(_tabs));
    };

    self.addTab = function (_title) {
        self.add(prepareTabs([_title]));
    };

    self.on('click', function (_event) {
        console.log('on tab view click');
        if (self.containsView(_event.source)) {
            console.log('on tab2 view click');
            self.setIndex(_event.source.index);
            self.fireEvent('request_tab', {
                index: _event.source.index
            });
        }

    });

    self.setIndex = function (_index) {
        if (_index !== undefined && _index !== currentTab) {
            var children = self.container.children;
            if (__APPLE__) {
                children[currentTab].selected = false;
                children[_index].selected = true;
            } else {
                children[currentTab].enabled = true;
                children[_index].enabled = false;
            }

            currentTab = _index;
        }
    };

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        self = null;
    });
    return self;
};