export class ListModule extends MapModule {
    constructor(_context, _args, _additional) {
        super(_args);
    }
    onModuleAction(_params) {
        sdebug('onModuleAction', _params.id);
        if (_params.id === 'list') {
            this.window.manager.createAndOpenWindow('AllFeaturesListWindow', {
                lists: this.parent.runGetMethodOnModules('getLists'),
                mapHandler: this.parent
            });
        } else {
            return false;
        }
        return true;
    }
}
export function create(_context, _args, _additional) {
    return new ListModule(_context, _args, _additional);
};
