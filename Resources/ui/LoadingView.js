ak.ti.constructors.createLoadingView = function(_args) {

    var self = new View({
        properties: _args,
        childTemplates: [{
            type: 'Ti.UI.View',
            properties: {
                rclass: 'LoadingViewHolder'
            },
            childTemplates: [{
                type: 'Ti.UI.ActivityIndicator',
                bindId: 'indicator',
                properties: {
                    rclass: 'LoadingViewIndicator'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'label',
                properties: {
                    rclass: 'LoadingViewLabel'
                }
            }]
        }]
    });

    self.startLoading = function(_args) {
        _args = _args || {};
        _args.label = _args.label || {
            text: ''
        };
        self.applyProperties(_args);
        // self.indicator.show();
    };

    self.stopLoading = function() {
        // self.indicator.hide();
    };
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
        self = null;
    });
    return self;
};