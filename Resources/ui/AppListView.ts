declare class AppListView extends ListView {
    startLoading()
    stopLoading()
    update()
    showPullView()
    closePullView()
    doneLoading()
}

ak.ti.constructors.createAppListView = function(_args) {

    _args = _args || {};
    var pullToRefresh: PullToRefresh;
    if (_args.noPullView !== true) {
        pullToRefresh = new PullToRefresh({
            rclass: _args.pullToRefreshClass || 'PullToRefresh'
        });
        _args.pullView = pullToRefresh;
    }
    var self = ((_args.isCollection === true) ? new CollectionView(_args) : new ListView(_args)) as AppListView;

    let firstLoaded = false;
    self.update = function() {};

    if (pullToRefresh) {
        pullToRefresh.setListView(self);
        app.onDebounce(pullToRefresh, 'pulled', function() {
            self.showPullView();
            self.update();
        });
    }
    var loadingTimer = null;

    function cancelLoadingTimer() {
        if (loadingTimer !== null) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
        }
    }

    function onTimerComplete() {
        if (loadingTimer !== null) {
            loadingTimer = null;
        }
    }

    function startLoadingTimer() {
        cancelLoadingTimer();
        loadingTimer = setTimeout(onTimerComplete, 50);
    }

    let updating = false;
    self.startLoading = function() {
        if (updating === true) return;
        updating = true;
    };
    self.doneLoading = function() {
        if (firstLoaded === false) {
            firstLoaded = true;
        }
        self.closePullView();
        if (pullToRefresh) {
            pullToRefresh.reset();
        }
        updating = false;
    };

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
        if (pullToRefresh) {
            pullToRefresh.GC();
            pullToRefresh = null;
        }
        self = null;
    });
    return self;
};