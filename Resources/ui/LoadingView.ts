declare global {
    class LoadingView extends View {
        stopLoading()
        startLoading(args?)
        holder: View
    }
}
export function create(_args) {

    var self = new View({
        properties: _args,
        childTemplates: [{
            type: 'Ti.UI.View',
            bindId: 'holder',
            properties: {
                rclass: 'LoadingViewHolder'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'label',
                properties: {
                    rclass: 'LoadingViewLabel',
                    padding: { bottom: 0 },
                }
            }, {
                type: 'Ti.UI.ActivityIndicator',
                bindId: 'indicator',
                properties: {
                    rclass: 'LoadingViewIndicator'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'sublabel',
                properties: {
                    padding: { top: 0 },
                    rclass: 'LoadingViewLabel'
                }
            }]
        }]
    }) as LoadingView;

    self.startLoading = function (_args) {
        _args = _args || {};
        _args.label = _args.label || {
            text: ''
        };
        self.applyProperties(_args);
        // self.indicator.show();
    };

    self.stopLoading = function () {
        // self.indicator.hide();
    };
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        self = null;
    });
    return self;
};