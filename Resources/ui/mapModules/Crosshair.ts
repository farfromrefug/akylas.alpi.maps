
import { MapModule } from './MapModule'
import geolib from '../../lib/geolib';
export class Crosshair extends MapModule {
    visible = false
    formatter = geolib.formatter
    animationDuration = 150
    height_2 = 42
    width_2 = 35
    icon = String.fromCharCode(0xe6d3)
    currentLatLong
    view: View
    button: Button
    constructor(_context, _args, _additional) {
        super(_args);
        this.view = new View({
            touchPassThrough: true,
            opacity: 0,
            // visible:false,
            height: 2 * this.height_2,
            width: 2 * this.width_2,
            childTemplates: [{
                bindId: 'crosshair',
                type: 'Ti.UI.Label',
                properties: {
                    width: 2 * this.width_2,
                    height: 2 * this.width_2,
                    color: $.black,
                    font: {
                        family: $.iconicfontfamily,
                        size: 30
                    },
                    shadowColor: '#fff',
                    shadowOffset: [0, 0],
                    shadowRadius: 1.5,
                    textAlign: 'center',
                    text: this.icon
                }
            }, {
                bindId: 'label',
                type: 'Ti.UI.Label',
                properties: {
                    touchEnabled: false,
                    width: 'FILL',
                    height: 28,
                    color: $.black,
                    font: {
                        size: 11,
                        weight: 'bold'
                    },
                    shadowColor: '#fff',
                    shadowOffset: [0, 0],
                    shadowRadius: 1.5,
                    textAlign: 'center',
                    bottom: 0
                }
            }]
        })
        this.button = new Button({
            rclass: 'MapButton',
            // backgroundColor: '#000000cc',
            bubbleParent: false,
            title: this.icon,
            bottom: 56,
            top: null,
            left: 8,
        }).on('click', app.debounce((e) => {
            if (!this.visible) {
                this.show();
            } else {
                this.hide();
            }
        }));

        _additional.mapPaddedChildren.push(this.view);
        _additional.mapPaddedChildren.push(this.button);
    }
    onMapRegionChanged?(e:MapRegionChangedEvent)
    hide() {
        if (this.visible) {
            this.visible = false;
            this.currentLatLong = undefined;
            delete this.onMapRegionChanged;
            this.view.animate({
                opacity: 0,
                duration: this.animationDuration
                // }, function(){
                // view.visible = false;
            });
        }

    }

    show() {
        if (!this.visible) {
            this.visible = true;
            this.onMapRegionChanged = this.update;
            this.update();
            // view.visible = true;
            this.view.animate({
                opacity: 1,
                cancelRunningAnimations: true,
                duration: this.animationDuration
            });
        }

    }

    update() {
        var point = this.view.convertPointToView([this.width_2, this.height_2], this.mapView);
        this.currentLatLong = this.mapView.coordinateForPoints([point])[0];
        // console.debug('update', currentLatLong);
        this.view.applyProperties({
            label: {
                text: this.formatter.latLngString(this.currentLatLong, 0, '\n')
            }
        });
    }
    GC() {
        super.GC();
        this.view = null;
        this.button = null;
    }
    onMapReset(_params) {
        _params = _params || {};
        if (!!_params.bottom) {
            this.button.animate({
                opacity: 1,
                duration: 100
            });
        }
    }
    hideModule(_params) {
        _params = _params || {};
        if (!!_params.bottom) {
            this.button.animate({
                opacity: 0,
                duration: 100
            });
        }
    }
    onHighlightingPoint() {
        if (!this.visible) {
            this.view.applyProperties({
                label: {
                    text: ''
                }
            });
            this.view.animate({
                opacity: 1,
                duration: 400,
                autoreverse: true
            });
        }
    }
    onModuleAction(_params) {
        if (_params.id === 'crosshair') {
            if (!this.visible) {
                this.show();
            } else {
                this.hide();
            }
        } else {
            return false;
        }
        return true;
    }
    onMapHolderDoubleTap(e) {
        if (e.bindId !== 'crosshair') {
            return false;
        }
        var point = this.view.convertPointToView([this.width_2, this.height_2], this.mapView);
        this.mapView.zoomIn(point);
        return true;

    }
    onMapHolderLongPress(e) {
        if (e.bindId !== 'crosshair') {
            return false;
        }
        console.debug('currentLatLong', this.currentLatLong);
        this.parent.runMethodOnModules('onMapLongPress', {
            latitude: this.currentLatLong[0],
            longitude: this.currentLatLong[1]
        });
        return true;
    }
}

export function create(_context, _args, _additional) {
    return new Crosshair(_context, _args, _additional);
};