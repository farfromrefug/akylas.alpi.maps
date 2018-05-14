var constructors = ['Ti.UI.createScrollableView'];

type Tabs = Array<TiDictT<View> | View>;
export function create(_args) {
    let tabs: Tabs = _args.tabs;
    let currentPage = _args.currentPage || 0;
    let showControls = _.remove(_args, 'showControls', true);
    let createTab = _.remove(_args, 'createTab');
    let nativeControls = _.remove(_args, 'nativeControls', false);
    let tabsControllerClass = _args.tabsControllerClass;
    let tabControllerParams = _args.tabControllerParams;
    let pagerClass = _args.pagerClass || 'AppTabViewScrollableView';
    let loadedTabs = [];
    delete _args.tabs;
    _args = {
        properties: _args,
        childTemplates: []
    };

    let tabController: AppTabController | ButtonBar;

    _args.childTemplates.push({
        type: 'Ti.UI.ScrollableView',
        bindId: 'pager',
        properties: {
            rclass: pagerClass,
            views: tabs
        },
        'events': {
            scrollend: function (e) {
                if (e.hasOwnProperty('currentPage')) {
                    if (tabController) {
                        tabController.setIndex(e.currentPage);
                    }
                    var oldTab = tabs[currentPage],
                        newTab = e.view;
                    currentPage = e.currentPage;
                    e.oldView = oldTab;
                    if (oldTab && oldTab.blur) {
                        oldTab.blur();
                    }
                    if (newTab) {
                        if (newTab && newTab.focus) {
                            newTab.focus();
                        }

                    }
                    self.emit('change', e);
                }

            },
            change: function (e) {
                if (!e.hasOwnProperty('currentPage')) {
                    return;
                }
                self.currentView = e.view;
                let firstLoad = false;
                if (loadedTabs.indexOf(e.currentPage) === -1) {
                    loadedTabs.push(e.currentPage);
                    firstLoad = true;
                    e.view.emit('first_load');
                }
                self.emit('change', Object.assign(e, {
                    firstLoad:firstLoad
                }));
                
            }
        }
    });
    if (showControls !== false) {
        var titles = tabs.map(t=>t.title);
        console.log('titles', titles);
        if (nativeControls === true) {
            if (__APPLE__) {
                tabController = new ButtonBar({
                    bindId: 'buttonbar',
                    index: 0,
                    rclass: tabsControllerClass,
                    labels: titles
                });
                tabController.on('click', function (_event) {
                    console.log('tab1 click', _event.index);
                    self.setTab(_event.index);
                });
            } else {
                _args.childTemplates[0].properties.strip = ak.ti.style({
                    titles: titles,
                    rclass: tabsControllerClass,
                });
            }

        } else {
            tabController = new AppTabController(Object.assign({
                rclass: tabsControllerClass,
                createTab: createTab,
                labels: titles
            }, tabControllerParams));
            tabController.addEventListener('request_tab', function (_event) {
                console.log('tab2click', _event.index);
                self.setTab(_event.index);
            });
        }

        if (tabController) {
            _args.childTemplates.unshift(tabController);
        }

    }

    var self: AppTabView = Object.assign(new View(_args), {
        setTab: function (_index) {
            console.log('setTab', _index, currentPage);
            if (currentPage != _index) {
                self.pager.scrollToView(_index);
            } else {
                self.fireEvent('tab_should_go_back', { index: _index, view: self.pager.views[_index] });
            }
        },
        setTabs: function (_tabs: Tabs) {
            tabs = _tabs;
            self.pager.views = tabs;
            if (tabController) {
                tabController.setLabels(_.map(tabs, 'title') as string[]);
            }
        },
        getTab: function (_index) {
            return tabs[_index];
        },
        getTabs: function () {
            return tabs;
        },

        moveNext: function () {
            self.pager.moveNext();
        }
    }) as AppTabView;

    self.setTab(currentPage);

    //END OF CLASS. NOW GC
    self.GC = app.composeFunc(self.GC, function () {
        if (tabController && tabController.GC) {
            tabController.GC();
        }
        self.currentView = null;
        tabController = null;
        if (tabs && tabs !== null) {
            tabs.forEach(function (value, key, list) {
                if (value.GC) {
                    value.GC();
                }
            });
            tabs = null;
        }
        self = null;
    });
    return self;
};