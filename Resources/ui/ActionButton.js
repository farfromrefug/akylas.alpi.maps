ak.ti.constructors.createActionButton = function(_args) {
    // sdebug(_args);
    var icon = _.remove(_args, 'icon');
    var color = _.remove(_args, 'color', $cTheme.main);
    var enabled = _.remove(_args, 'enabled', true);
    var id = _.remove(_args, 'id');
    var text = _.remove(_args, 'text', id);
    // sdebug('ActionButton', text);
    // function highlight(e) {
    //     // sdebug('highlight');
    //     self.animate({
    //         transform: 's0.9',
    //         duration: 100
    //     });
    // }

    // function unhighlight(e) {
    //     // sdebug('unhighlight');
    //     self.animate({
    //         cancelRunningAnimations:true,
    //         transform: null,
    //         duration: 100
    //     });
    // }
    var args = {
        properties: _.assign(_args, {
            callbackId: id,
            selector:color,
            text: icon,
            color: color,
            states:{
                pressed:{
                    duration:100,
                    transform:'s1.05',
                    tutorial:{
                        transform:'s1.05',
                    }
                }
            }
        })
    };
    // if (app.tutorialManager.enabled) {
        if (!_args.width) {
            args.properties.width = 70;
        }
        args.properties.padding = {bottom:10};
        args. childTemplates = [{
            type: 'Ti.UI.Label',
            bindId: 'tutorial',
            properties: {
                rclass: 'ActionButtonLabel',
                width:'FILL',
                text: trc(text).toUpperCase(),
                color: color
            }
        }];
    // }

    var self = new Label(args);
    self.setEnabled = function(_enabled) {
        var theColor = _enabled ? color : $gray;
        // sdebug('setEnabled', _enabled, theColor);
        self.applyProperties({
            color: theColor,
            tutorial: {
                color: theColor,
            }
        });
        enabled = _enabled;

    };
    self.isEnabled = function() {
        return enabled;
    };
    self.setEnabled(enabled);
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {
        self = null;
    });
    return self;
};