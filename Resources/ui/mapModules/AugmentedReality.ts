import { MapModule } from './MapModule'
export class AugmentedReality extends MapModule {
    // geolib = app.itemHandler.geolib
    // getImagePath = app.getImagePath
    // utilities = app.utilities
    arWindow: ArWindow
    // icon = String.fromCharCode(0xe6d3)
    icon = 'AR'
    button: Button

    showArWindow() {
        if (!Ti.Media.hasCameraPermissions()) {
            Ti.Media.requestCameraPermissions((e) => {
                if (!!e.success) {
                    this.showArWindow();
                }
            });
            return;
        }
        this.arWindow = new ArWindow({
            mapHandler: this.parent,
            itemHandler: this.itemHandler,
            // title:'ARWINDOW',
            orientationModes: [Ti.UI.UPSIDE_PORTRAIT, Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT, Ti.UI.LANDSCAPE_RIGHT],
            fullscreen: true,
            withLoadingIndicator: true,
            verticalContainer: false,
            winOpeningArgs: {
                from: {
                    opacity: 0,
                },
                to: {
                    opacity: 1,
                },
                duration: 300
            },
            winClosingArgs: {
                opacity: 0,
                duration: 200
            },
            showBackButton: true,
            ownBackButtonTitle: $.sClose,
            customNavBar: true,
            backgroundColor:'black',
            barColor: '#00000055',

        });

        // var view = app.modules.wikitude.createWikitudeView({
        //     bindId: 'arview',
        //     // top:40,
        //     licenseKey: 'B2iXngQehGmFkaDzxocqJ0MX/orNlXLN9QorqgTMpu3j6XjUYVVS6TWW6b4jK57lUR92a1LGXD6slI0tgt6pkrWQ6wTAc8WjzYBsvTCmj0c4JXHI2wkfgferRPhbPneMi7T1D18MDwkJgUCYUWaWdLf0UD/uqMFrjJSUahPfgbdTYWx0ZWRfX8uJqlGZn4h6T9IcuJBgQVbjq+P/rkaAMrWTUACp/jm/t0Nffo77NwHj/vRAAjEm3H4j0fBk1w9rqyyDzE92dG2sjbUFWVFmoGlyJ2cNXg2txF7l10kNkHxZ9JRXVnvm8wK3SAB2jmp9wKE+4et2yHfhMG4wKG4vm+C4pC7fYM4EpWmlYhhJWRFGsdfaGKKnRnRAw6J+pmJIJ4bxcfFqmnXFuZ0+Cv9Y0TZtA0MR1gwmQd1uDCmySe8Jk5LZqhPqRlmrYlZTYHA199b+bbgznZRRwFjGPRTLbSg2TKWChj+VOwpWRdQ/C7P1pK5xCTIpxI61uA6ob0MFsGo7LDuNxCg/nYzR9epZmr3nUaTHmIaAB0M4mQuFpo0GaRE6IP/UVMbHYuNB3+KqhaIAtbyMTRnzUj3T65YVH262uO2bDd1cfmJHHzgSM350oZoPqr5EaTgsef2qLyz2bbMPspA7InNeQYLAfotvEtJl+J+R1NoHa69la1GrgFiofn/qRLwhNHLrVVSfvpHD',
        //     augmentedRealityFeatures: ["geo"],
        // });
        // win.container.add(view, itemInfoView);
        // var ARchitectWindow = require('/ui/ARchitectWindow');

        // var requiredFeatures = [
        //     "geo"
        // ];
        // var startupConfiguration = {
        //     "camera_position": "back"
        // };
        // view.loadArchitectWorldFromURL(
        //     'data/wikitude/index.html', ["geo"], null);

        // view.on('WORLD_IS_LOADED', function () {
        //     arWindow = win;
        //     sdebug('WORLD_IS_LOADED');
        //     updateData();
        // }).on('URL_WAS_INVOKED', function (e) {

        //     var url = e.url;
        //     var prefix = 'architectsdk://event?data=';
        //     handleWorldEvent(JSON.parse(decodeURIComponent(url.substring(prefix.length).replace(
        //         /\+/g, ' '))));
        // });
        this.arWindow.once('close', () => {
            this.arWindow = null;
        });
        app.ui.openWindow(this.arWindow);
    }

    constructor(_context, _args, _additional) {
        super(_args);
        // if (__APPLE__ && app.modules.wikitude.isDeviceSupported(["geo"])) {
        // }
        this.button = new Button({
            rclass: 'MapButton',
            bubbleParent: false,
            title: this.icon,
            bottom: 106,
            top: null,
            visible: !!__SIMULATOR__,
            left: 8
        });
        this.button.on('click', () => {

            this.showArWindow();

        });
        _additional.mapPaddedChildren.push(this.button);
    }

    // handleWorldEvent(e) {
    //     // sdebug('handleWorldEvent', e);
    //     switch (e.type) {
    //         case 'selected':
    //             arWindow.container.infoview.setSelectedItem(e.poiData);
    //             arWindow.container.infoview.showMe();
    //             break;
    //         case 'unselected':
    //             arWindow.container.infoview.hideMe();
    //             break;
    //         case 'location':
    //             updateLocation(e.coords);
    //             break;
    //     }
    // }



    // callWorldMethod() {
    //     var args = Array.prototype.slice.call(arguments),
    //         method, mods;
    //     var method = args[0];
    //     var length = args.length;
    //     var string = "World." + method + '(';
    //     for (var i = 1; i < length - 1; i++) {
    //         string += JSON.stringify(args[i]) + ',';
    //     }
    //     if (length > 1) {
    //         string += JSON.stringify(args[length - 1]);
    //     }
    //     string += ');';
    //     this.arWindow.container.arview.callJavaScript(string);
    // }

    // updateLocation(_location) {
    //     if (this.arWindow) {
    //         this.arWindow.updateLocation(_location);
    //     }
    // }
    GC() {
        super.GC();
        this.button = null;
    }
    onInit() { }
    onLocation(_location) {
        this.button.visible = true;
        // this.updateLocation(_location);
    }

}


export function create(_context, _args, _additional) {
    return new AugmentedReality(_context, _args, _additional);
};