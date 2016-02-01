exports.init = function(_context) {
    var MapModule = _context.MapModule = _context.MicroEvent.extend({
            GC: function() {
                this.markers = null;
                this.window = null;
                this.parent = null;
                this.mapView = null;
            },
            spreadModuleAction: function(_params) {
                return (this.onModuleAction && this.onModuleAction(_params)) ||
                    (this.canSpreadModuleAction && !this.canSpreadModuleAction(_params));
            },
            spreadLongModuleAction: function(_params) {
                return (this.onModuleLongAction && this.onModuleLongAction(_params)) ||
                    (this.canSpreadLongModuleAction && !this.canSpreadLongModuleAction(_params));
            },
            runAction: function(_action, _item, _desc, _callback) {
                app.itemHandler.handleItemAction(_action, _item, _desc, _callback, this.window,
                    this.parent);
            },
        });
};