
declare class PullToRefresh extends View {
    goToLoading()
    arrow: View
    label: Label
    reset()
    setListView(listView: ListView | CollectionView)
}
ak.ti.constructors.createPullToRefresh = function (_args) {
    var rclass = _args.rclass || '';
    var needsReset = true;
    var unrotate = '';
    var rotate = 'or180';
    var listView;
    var pullMessage = _args.pullMessage || trc('pull_down_refresh').toUpperCase();
    var releaseMessage = _args.releaseMessage || trc('pull_down_release').toUpperCase();
    var loadingMessage = _args.loadingMessage || trc('pull_down_loading').toUpperCase();
    var self = new View({
        properties: _args,
        childTemplates: [{
            type: 'Ti.UI.View',
            properties: {
                rclass: 'Size HHolder',
            },
            childTemplates: [{
                bindId: 'arrow',
                type: 'Ti.UI.Label',
                properties: {
                    rclass: _args.arrowClass || 'PullToRefreshArrow'
                },
            }, {
                bindId: 'label',
                type: 'Ti.UI.Label',
                properties: {
                    rclass: _args.labelClass || 'PullToRefreshLabel',
                    text: pullMessage
                },
            }]
        }]
    }) as PullToRefresh;

    function pullchangedListener(e) {
        if (e.active === false) {
            self.arrow.animate({
                transform: unrotate,
                duration: 180
            });
            self.label.text = pullMessage;
        } else {
            self.arrow.animate({
                transform: rotate,
                duration: 180
            });
            self.label.text = releaseMessage;
        }
    };

    self.goToLoading = function () {
        self.label.text = loadingMessage;
        self.arrow.hide();
    };

    function pullendListener(e) {
        listView.addEventListener('pull', self.reset);
        if (e.active === false) return;
        self.goToLoading();
        self.fireEvent('pulled');
    };
    self.reset = function() {
        listView.removeEventListener('pull', self.reset);
        self.label.text = pullMessage;
        self.arrow.transform = unrotate;
        self.arrow.show();
    };

    self.setListView = function (_listview) {
        listView = _listview;
        _listview.addEventListener('pullchanged', pullchangedListener);
        _listview.addEventListener('pullend', pullendListener);
    };
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        listView = null;
        self = null;
    });
    return self;
};