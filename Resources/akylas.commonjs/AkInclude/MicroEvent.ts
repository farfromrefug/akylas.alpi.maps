/// <reference path="../akylas.commonjs.d.ts" />
export class EventEmitter implements AK.Emitter {
    private _events: any
    constructor(options?) {
        for (var key in options) {
            this[key] = options[key];
        }
    }
    on(event, fct): this {
        if (!fct) {
            return this;
        }
        this._events = this._events || {};
        this._events[event] = this._events[event] || [];
        this._events[event].push(fct);
        return this;
    }
    off(event, fct): this {
        if (!fct) {
            return this;
        }
        this._events = this._events || {};
        if (event in this._events === false) return;
        this._events[event].splice(this._events[event].indexOf(fct), 1);
        return this;
    }
    emit(event, ...args) {
        this._events = this._events || {};
        var events = this._events[event];
        if (events) {
            for (var i = 0; i < events.length; i++) {
                events[i].apply(this, args);
            }
        }
        return this;
    }
    once(event, fct) {
        if (!fct) {
            return;
        }
        var self = this;

        function g() {
            self.off(event, g);
            fct.apply(this, arguments);
        }
        self.on(event, g);

        return this;
    }
    removeAllListeners(event?: string) {
        if (event) {
            delete this._events[event];
        } else {
            this._events = {};
        }
        return this;
    }
};

export class TiEventEmitter extends EventEmitter implements AK.TiEmitter {
    addEventListener(name: string, callback: (...args: any[]) => any): this { return this; }
    addListener(name: string, callback: (...args: any[]) => any): this { return this; }
    removeEventListener(name: string, callback: (...args: any[]) => any): this { return this; }
    fireEvent(name: string, ...args) { }
}
TiEventEmitter.prototype.addEventListener = TiEventEmitter.prototype.on;
TiEventEmitter.prototype.addListener = TiEventEmitter.prototype.on;
TiEventEmitter.prototype.removeEventListener = TiEventEmitter.prototype.off;
TiEventEmitter.prototype.fireEvent = TiEventEmitter.prototype.emit;
