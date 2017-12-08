declare global {
    class CameraView extends View {
        getCurrentImage(): titanium.Blob
        showLoading()
        hideLoading()
    }
}
export function create(_argså) {
    const neededRatio = 0.88;
    var self: CameraView = <CameraView>new View({
        properties: Object.assign({
            bubbleParent: false,
            layout: 'vertical',
            // backgroundImage: '/images/background.png',
        }),
        // childTemplates: [{
        //     top: $.navBarTop,
        //     height: $.navBarHeight,
        //     type: 'Ti.UI.Label',
        //     font: { size: 17 },
        //     textAlign: 'center',
        //     text: tr('camera_instructions').toUpperCase()
        // }, {
        childTemplates: [{
            type: 'Akylas.Camera.View',
            bindId: 'camera',
            borderColor: $.white,
            focus: 'auto',
            pictureSize: [640, 480],
            jpegQuality: 80,
            borderPadding: [0, -1, -0, -1],
            width: 'fill',
            autoFocusOnTakePicture: false,
            // sizeRatio: 1 / neededRatio,
            // childTemplates: [{
            //     backgroundImage: '/images/photo_mask.png',
            //     bindId: 'cameraOverlay',
            //     type: 'Ti.UI.ImageView',
            //     localLoadSync: false,
            //     touchEnabled: false,
            //     width: 'fill',
            //     height: 'fill',
            //     // backgroundColor: '#77ff0000',
            //     scaleType: Ti.UI.SCALE_TYPE_ASPECT_FIT,
            //     transition: {
            //         style: Ti.UI.TransitionStyle.FADE
            //     }
            // }],
            events: {
                click: app.debounce(function (e) {
                    e.source.cameraAutoFocus(null);
                })
            }
        }]
        // }, {
        //     height: 70,
        //     childTemplates: [{
        //         type: 'Ti.UI.Button',
        //         rclass: 'NonFilledAtionButton',
        //         left: 0,
        //         bindId: 'cameracancel',
        //         title: '\ue901'
        //     }, {
        //         type: 'Ti.UI.Button',
        //         rclass: 'NonFilledAtionButton',
        //         right: 0,
        //         visible: false,
        //         bindId: 'camerause',
        //         title: '\ueadb'
        //     }, {
        //         type: 'Ti.UI.Button',
        //         bindId: 'take',
        //         rclass: 'ActionButtonFilled',
        //         title: '\ue412'
        //     }, {
        //         type: 'Ti.UI.Button',
        //         bindId: 'retake',
        //         rclass: 'NonFilledAtionButton',
        //         visible: false,
        //         title: '\ue042'
        //     }]
        // }]
    });

    let currentImage:titanium.Blob;

    self.getCurrentImage = function () {
        return currentImage;
    }
    self.showLoading = function () {
    }
    self.hideLoading = function () {
    }
    app.onDebounce(self, 'click', function (e) {
        var callbackId = e.bindId || e.source.callbackId || (e.item && e.item.callbackId);
        console.log('click', callbackId, e);
        switch (callbackId) {
            case 'take':
                self.showLoading();
                self['camera'].takePicture({
                    callback: function (e) {
                        console.log('on takePicture', e);
                        console.log('image width', e.image.width);
                        console.log('image height', e.image.height);
                        let width, height;
                        const needsFlip = e.orientation === 90 || e.orientation === 270;
                        if (needsFlip) {
                            width = e.image.height;
                            height = e.image.width;
                        } else {
                            width = e.image.width;
                            height = e.image.height;
                        }
                        const ratio = Math.min(app.deviceinfo.pixelWidth / width, 1);

                        let x = 0.094 * width;
                        let finalWidth = width - 2 * x;
                        let finalHeight = Math.min(finalWidth / neededRatio, height);
                        let y = Math.max((height - finalHeight) / 2, 0);
                        // let finalHeight = height - 2 * y;
                        // if (needsFlip) {
                        //     finalHeight = Math.min(finalWidth / neededRatio, height);
                        //     y = Math.max((height - finalHeight) / 2, 0);
                        // }

                        console.log('ratio', ratio);
                        console.log('x', x);
                        console.log('y', y);
                        console.log('width', width);
                        console.log('height', height);
                        console.log('finalWidth', finalWidth);
                        console.log('finalHeight', finalHeight);

                        var image = e.image.imageAsCropped({
                            x: x,
                            y: y,
                            width: finalWidth,
                            height: finalHeight
                        }, {
                                scale: ratio
                            });
                        if (image) {
                            currentImage = image;
                            console.log('result image', image, image.width, image.height);
                            self.applyProperties({
                                cameraOverlay: {
                                    image: image
                                },
                                take: {
                                    visible: false
                                },
                                retake: {
                                    visible: true
                                },
                                camerause: {
                                    visible: true
                                }
                            })
                        } else {
                            app.showAlert(trc('could not show image'));
                        }
                        if (e.image.file) { // this is representated by a file (android)
                            e.image.file.deleteFile();
                        }
                        self.hideLoading();

                    }
                });
                break;
            case 'retake':
                currentImage = null;
                self.applyProperties({
                    cameraOverlay: {
                        image: null
                    },
                    take: {
                        visible: true
                    },
                    retake: {
                        visible: false
                    },
                    use: {
                        visible: false
                    }
                })
                break;
        }
    });
    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function () {
        self = null;
    });
    return self;
};