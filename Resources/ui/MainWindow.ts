
declare global {
    class MainWindow extends NavWindow {
        stackSize: number
        handleOpenWindow(_id: string, _args)
    }
}
export function create(_args) {

    var windowsMap = {
        'map': 'MapWindow',
        'geofeature': 'GeoFeatureWindow'
    },
        rootWindow = ak.ti.createFromConstructor(windowsMap['map'], {
            showLeftMenuButton: true,
            winGCId: 'map'
        }) as MapWindow,
        // geoFeatureWindow = ak.ti.createFromConstructor(windowsMap['geofeature'], {
        //     // showLeftMenuButton: true,
        //     mapHandler: rootWindow,
        //     winGCId: 'geofeature'
        // }) as GeoFeatureWindow,
        windows = {
            'map': rootWindow,
            // 'geofeature': geoFeatureWindow,
        },
        self = new AppWindow(Object.assign(_args, {
            window: rootWindow
        })) as MainWindow;
    windows[rootWindow.winGCId] = rootWindow;

    rootWindow.on('androidback', function () {
        if (rootWindow.onBack) {
            rootWindow.onBack();
        } else {
            app.closeApp();
        }
    });

    self.handleOpenWindow = function (_id: string, _args) {
        if (_id === 'settings') {
            self.createAndOpenWindow('SettingsWindow');
            app.ui.slidemenu.closeViews();
            return;
        } else {
            var win;
            if (!windows.hasOwnProperty(_id)) {
                if (windowsMap[_id]) {
                    if (_id === 'geofeature') {
                        win = ak.ti.createFromConstructor(windowsMap[_id], {
                            mapHandler: rootWindow,
                            showLeftMenuButton: true
                        })
                    } else {
                        win = ak.ti.createFromConstructor(windowsMap[_id], {
                            showLeftMenuButton: true
                        })
                    }
                }
                if (win) {
                    win.winGCId = _id;
                    windows[_id] = win;
                }
            }
            if (!windows.hasOwnProperty(_id)) return;
            win = windows[_id];

            if (_args && win.handleArgs) {
                win.handleArgs(_args);
            }
            console.debug('opening existing window');
            app.ui.slidemenu.closeViews();
            self.navOpenWindow(win);
        }
    };

    self.canGCWindow = function (_win: TiWindow) {
        console.debug('canGCWindow', _win.title, _win.winGCId);
        var canGC = !_win.winGCId || !(windows.hasOwnProperty(_win.winGCId));
        return canGC;
    };

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        windows = null;
        rootWindow = null;
        self = null;
    });
    return self;
};