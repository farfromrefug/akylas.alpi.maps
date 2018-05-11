if (typeof(String.prototype.assign) === "undefined") {

    function handleElement(_assign, element, key, _prefix) {
        var prefix = _prefix ? (_prefix + '.') : '';
        if ((typeof element === 'object') && !Array.isArray(element)) {
            fillAssign(_assign, element, key);
        } else {
            _assign[(typeof key === 'string') ? (prefix + key) : (key + 1)] =
                element;
        }
    }
    function fillAssign(_assign, _args, _prefix) {
        if (Array.isArray(_args)) {
            _args.forEach(function(element, key) {
                handleElement(_assign, element, key, _prefix);
            });
        } else {
            for(let key in _args) {
                handleElement(_assign, _args[key], key, _prefix);
            }
        }


    }

    String.prototype.assign = function(...args) {
        var assign = {};
        fillAssign(assign, args);
        return this.replace(/\{([^{]+?)\}/g, function(m, key) {
            return assign[key] || m;
        });
    };
}