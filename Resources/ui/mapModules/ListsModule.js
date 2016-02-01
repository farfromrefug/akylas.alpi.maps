exports.create = function(_context, _args, _additional) {
    var settings = _args.settings,
        self = new _context.MapModule(_args);

    _.assign(self, {
        GC: app.composeFunc(self.GC, function() {}),
        onModuleAction: function(_params) {
            sdebug('onModuleAction',_params.id );
            if (_params.id === 'list') {
                self.window.manager.createAndOpenWindow('AllFeaturesListWindow', {
                    lists: self.parent.runGetMethodOnModules('getLists'),
                    mapHandler:self.parent
                });
            } else {
                return false;
            }
            return true;
        }
    });
    return self;
};