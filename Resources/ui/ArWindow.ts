
import { deltaAngle, DistanceOffsetMode, ARAnnotationView, UiOptions, normalizeDegree2, CoordinateIsValid, normalizeDegree, degreesToRadians, radiansToDegrees, ARTrackingManager, ReloadType, ARTrackingManagerDelegate, Location, ARAnnotation, ARStatus } from '../lib/ar'


export declare class ArWindowContainer extends Container {
    presenter: View
    debugLabel?: titanium.UILabel
    debugHeadingSlider?: titanium.UISlider
    debugPitchSlider?: titanium.UISlider
    cameraView?: titanium.UIView & {
        getFOV()
    }
}
declare global {
    class ArWindow extends AppWindow implements ARTrackingManagerDelegate {
        container: ArWindowContainer
        startCameraAndTracking(notifyLocationFailure: boolean)
        stopCameraAndTracking()
        appDidEnterBackground(notification: Notification)
        appWillEnterForeground(notification: Notification)
        didUpdateUserLocation(trackingManager: ARTrackingManager, location: Location)
        didUpdateReloadLocation(trackingManager: ARTrackingManager, location: Location)
        didFailToFindLocationAfter(trackingManager: ARTrackingManager, elapsedSeconds: number)
        didUpdateMotion(trackingManager: ARTrackingManager, pitch: number, heading: number, orientation?: number[])
        // didUpdateHeading(trackingManager: ARTrackingManager, heading: number)
        setAnnotations(annotations: ARAnnotation[])
        getAnnotations()
        reload(currentReload: ReloadType)
        calculateDistancesForAnnotations()
        calculateAzimuthsForAnnotations()
        displayTimerTick()
        layoutAndReloadOnOrientationChange()
        calculateFOV()
        logText(text: string)
        centerLocationFromAnnotations(annotations: ARAnnotation[])
        reloadAnnotations(annots: ARAnnotation[], reloadType: ReloadType)
        activeAnnotationsFromAnnotations(annotations: ARAnnotation[])
        adjustDistanceOffsetParameters()
        createAnnotationViews(force: boolean)
        addRemoveAnnotationViews(arStatus: ARStatus)
        clear()
        updateView(arStatus: ARStatus, reloadType: ReloadType, needsRelayout: boolean)
    }
}

declare interface Annotation extends ARAnnotation {
    item: Item
    image: string
    selectedImage: string
}

export function create(_args: WindowParams) {

    const width = app.deviceinfo.width;
    const height = app.deviceinfo.height;
    const getImagePath = app.getImagePath;
    const mapHandler = _.remove(_args, 'mapHandler');
    const itemHandler = _.remove(_args, 'itemHandler');
    const VIEW_DISTANCE = 10000;
    _args.rightNavButtons = [{
        icon: app.icons.nature,
        callback: function () {
            // mapHandler.runMethodOnModules('spreadModuleAction', {
            //     id: 'geofeature',
            //     window: self,
            //     region: app.utils.geolib.getBoundsOfDistance(app.currentLocation,
            //         VIEW_DISTANCE),
            //     callback: function (_addedItems) {
            updateData();
            // }
            // });
        }
    }]
    // const callback:Function = _.remove(_args, 'callback');

    const getPathLength = app.utils.geolib.getPathLength;

    let self = new AppWindow(_args) as ArWindow;
    let trackingManager = new ARTrackingManager();
    // let cameraView = new CameraView();
    let arStatus = new ARStatus()
    let lastLocation: Location
    let pendingHighestRankingReload: ReloadType

    const uiOptions = new UiOptions()
    //===== Private
    let annotations: Annotation[] = []
    let activeAnnotations: Annotation[] = []
    /// AnnotionViews for all active annotations, this is set in createAnnotationViews.
    let annotationViews: ARAnnotationView[] = []
    /// AnnotationViews that are on visible part of the screen or near its border.
    let visibleAnnotationViews: ARAnnotationView[] = []
    /**
     How low on the screen is nearest annotation. 0 = top, 1  = bottom.
    */
    let bottomBorder = 0.55,
        maxDistance = 0,
        /**
           All annotations farther(from user) than this value will be offset using distanceOffsetMultiplier. Use it if distanceOffsetMode is manual.
           Also look at distanceOffsetMultiplier and distanceOffsetMode.
          */
        distanceOffsetMinThreshold = 0,
        /**
            How much to vertically offset annotations by distance, in pixels per meter. Use it if distanceOffsetMode is manual or automaticOffsetMinDistance.
            Also look at distanceOffsetMinThreshold and distanceOffsetMode.
        */
        distanceOffsetMultiplier: number,
        /**
            Distance offset mode, it affects vertical offset of annotations by distance.
        */
        distanceOffsetMode = DistanceOffsetMode.automatic,
        /**
            If set, it will be used instead of distanceOffsetMultiplier and distanceOffsetMinThreshold if distanceOffsetMode != none
            Use it to calculate vartical offset by given distance.
        */
        distanceOffsetFunction: (distance: number) => number

    const maxVisibleAnnotations = 100;

    var itemInfoView = new ItemInfoView({
        bindId: 'infoview',
        showAccessory: false,
        bottom: 0
    });
    itemInfoView.onInit(self, mapHandler);

    function createAnnotationView(annotation: Annotation) {
        const WIDTH = 40;
        // console.debug('createAnnotationView', annotation);
        return new Label({
            annotation: annotation,
            // backgroundColor: 'red',
            text: annotation.title,
            padding: [0, WIDTH, 0, 0],
            minHeight: WIDTH,
            childTemplates: [{
                type: 'Ti.UI.ImageView',
                left: 0,
                height: WIDTH,
                // width: WIDTH,
                image: annotation.image,
                // backgroundSelectedImage: annotation.selectedImage
            }]
        }) as ARAnnotationView
    }

    function updateData() {
        var location = lastLocation;
        console.debug('updateData', location);
        var items: {
            [k: string]: {
                desc: ItemType,
                items: Item[]
            }
        } = mapHandler.runReduceMethodOnModules('getItemsInRegion', location, VIEW_DISTANCE);
        if (_.size(items) == 0) {
            alert('no item');
            return true;
        }
        console.debug('updateData2', items);
        let list, poiData: Annotation[] = [];
        for (const key in items) {
            list = items[key];
            var defaultImage = getImagePath(list.desc.image);
            var defaultSelectedImage = getImagePath(list.desc.selectedImage);
            var defaultTitle = list.desc.defaultTitle;
            // var defaultColor = Color(list.desc.color).toHexString() + '99';
            let toAdd: Annotation;
            list.items.forEach(function (item) {
                toAdd = {
                    id: item.id,
                    item: item,
                    title: itemHandler.itemTitle(item, list),
                    image: item.image ? getImagePath(item.image) : defaultImage,
                    selectedImage: item.selectedImage ? getImagePath(item.selectedImage) : defaultSelectedImage,
                    location: {
                        latitude: item.latitude,
                        longitude: item.longitude,
                        altitude: item.altitude
                    }
                }
                // var toAdd = _.defaults(_.pick(item, 'id', 'latitude',
                //     'color',
                //     // 'image',
                //     // 'selectedImage',
                //     'longitude', 'altitude',
                //     'title', 'description'), {
                //         color: defaultColor,
                //         image: defaultImage,
                //         selectedImage: defaultSelectedImage,
                //         title: defaultTitle,
                //     })
                // toAdd.item = item;
                // toAdd.desc = list.desc;
                // if (toAdd.altitude) {
                //     toAdd.altitude = Math.floor(toAdd.altitude);
                //     toAdd.description = this.geolib.formatter.altitude(toAdd.altitude);
                // }
                poiData.push(toAdd);
            });
        });
        // creates dummy poi-data around given lat/lon

        // this.updateLocation(location);
        self.setAnnotations(poiData);
    }

    // cameraView.showLoading = self.showLoading;
    // cameraView.hideLoading = self.hideLoading;

    ak.ti.add(self.container, [{
        type: 'Akylas.Camera.View',
        backgroundColor: 'red',
        width: 'fill',
        height: 'fill',
        bindId: 'cameraView',
        focus: 'auto',
        pictureSize: [640, 480],
        // jpegQuality: 80,
        // width: 'fill',
        // autoFocusOnTakePicture: false,
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
    }, {
        bindId: 'presenter',
        events: {
            click: function (e) {
                if (e.source.annotation) {
                    itemInfoView.setSelectedItem(e.source.annotation.item);
                } else {
                    itemInfoView.setSelectedItem(null);
                }
            }
        }
        // backgroundColor: '#ff000044'
    }, {
        layout: 'vertical',
        top: $.navBarTop + $.navBarHeight,
        childTemplates: [{
            type: 'Ti.UI.Slider',
            bindId: 'debugHeadingSlider',
            height: 40,
            bubbleParent: true,
            value: 0,
            min: -180,
            max: 180
        }, {
            type: 'Ti.UI.Slider',
            bindId: 'debugPitchSlider',
            height: 40,
            bubbleParent: true,
            value: 0,
            min: -180,
            max: 180
        }, { touchEnabled: false }, {
            touchEnabled: false,
            type: 'Ti.UI.Label',
            bindId: 'debugLabel',
            textAlign: 'left',
            verticalAlign: 'bottom',
            color: 'white',
            font: { size: 12 },
            bottom: 0,
            width: 'fill',
            height: 60
        }],
        events: {
            change: function (e) {
                switch (e.bindId) {
                    case 'debugPitchSlider':
                        trackingManager.startDebugMode(undefined, undefined, e.value);
                        break;
                    case 'debugHeadingSlider':
                        trackingManager.startDebugMode(undefined, e.value, undefined);
                        break;
                }
            }
        }

    }, itemInfoView]);
    self.container.cameraView.once('previewstarted', () => {
        console.log('previewstarted');
        self.calculateFOV();
    });

    // app.onDebounce(cameraView, 'click', function (e) {
    //     var callbackId = e.bindId || e.source.callbackId || (e.item && e.item.callbackId);
    //     console.log('click', callbackId, e);
    //     switch (callbackId) {

    //         case 'close':
    //         case 'cameracancel':
    //             app.ui.closeWindow(self);
    //             break;
    //         // case 'camerause':
    //         //     callback(cameraView.getCurrentImage());
    //         //     app.ui.closeWindow(self);
    //         //     break;
    //     }
    // });
    Object.bindAssign(self, {
        startCameraAndTracking(notifyLocationFailure: boolean) {
            // this.cameraView.startRunning()
            trackingManager.startTracking(notifyLocationFailure)
            // this.displayTimer = CADisplayLink(target: self, selector: #selector(ARViewController.displayTimerTick))
            // this.displayTimer && this.displayTimer.add(to: RunLoop.current, forMode: RunLoopMode.defaultRunLoopMode)
        },

        stopCameraAndTracking() {
            // this.cameraView.stopRunning()
            trackingManager.stopTracking()
            // this.displayTimer ?.invalidate()
            // this.displayTimer = null
        },
        appDidEnterBackground(notification: Notification) {
            // if (self.view.window) {
            // Stopping tracking and clearing presenter, it will restart and reload on appWillEnterForeground
            self.stopCameraAndTracking()
            self.clear()
            // }
        },

        appWillEnterForeground(notification: Notification) {
            // if (self.view.window) {
            // This will make presenter reload
            self.startCameraAndTracking(true)
            // }
        },

        didUpdateUserLocation(trackingManager: ARTrackingManager, location: Location) {
            arStatus.userLocation = location
            arStatus.heading = trackingManager.filteredHeading
            lastLocation = location
            // console.debug('didUpdateUserLocation', lastLocation);
            self.reload(ReloadType.userLocationChanged)

        },

        didUpdateReloadLocation(trackingManager: ARTrackingManager, location: Location) {
            arStatus.userLocation = location
            lastLocation = location
            updateData();
            // Manual reload?
            // let dataSource = self.dataSource;
            // if (dataSource.ar) {
            //     let annotations = dataSource.ar(this, location)
            //     if (annotations) {
            //         self.setAnnotations(annotations)
            //     }
            // }
            // If no manual reload, calling reload with .reloadLocationChanged, this will give the opportunity to the presenter
            // to filter existing annotations with distance, max count etc.
            // else {
            // self.reload(ReloadType.reloadLocationChanged)
            // }

            // Debug view, indicating that update was done
            // if (self.uiOptions.debugLabel) { self.showDebugViewWithColor('blue') }
        },

        didFailToFindLocationAfter(trackingManager: ARTrackingManager, elapsedSeconds: number) {
            // self.onDidFailToFindLocation && self.onDidFailToFindLocation(elapsedSeconds, self.lastLocation != null)
        },
        setAnnotations(annots: Annotation[]) {
            console.debug('setAnnotations', annots);
            // If simulatorDebugging is true, getting center location from all annotations and setting it as current user location
            // if (self.uiOptions.setUserLocationToCenterOfAnnotations) {
            //     let location = self.centerLocationFromAnnotations(annotations)
            //     arStatus.userLocation = location
            //     trackingManager.startDebugMode(location)
            // }

            annotations = annots
            self.reload(ReloadType.annotationsChanged)
        },

        getAnnotations() {
            return annotations
        },
        reload(currentReload: ReloadType) {
            // Explanation why pendingHighestRankingReload is used: if this method is called in this order:
            // 1. currentReload = annotationsChanged, arStatus.ready = false
            // 2. currentReload = headingChanged, arStatus.ready = false
            // 3. currentReload = headingChanged, arStatus.ready = true
            // We want to use annotationsChanged because that is most important reload even if currentReload is headingChanged.
            // Also, it is assumed that ARPresenter will on annotationsChanged do everything it does on headingChanged, and more probably.


            if (pendingHighestRankingReload == null || currentReload.valueOf() > pendingHighestRankingReload.valueOf()) {
                pendingHighestRankingReload = currentReload
            }
            const ready = arStatus.ready
            if (!ready) { return }
            let highestRankingReload = pendingHighestRankingReload
            // if (!highestRankingReload) { return }
            pendingHighestRankingReload = null

            // Relative positions of user and annotations changed so we recalculate azimuths.
            // When azimuths are calculated, presenter should restack annotations to prevent overlapping.
            if (highestRankingReload == ReloadType.annotationsChanged || highestRankingReload == ReloadType.reloadLocationChanged || highestRankingReload == ReloadType.userLocationChanged) {
                self.calculateDistancesForAnnotations()
                self.calculateAzimuthsForAnnotations()
            }

            self.reloadAnnotations(annotations, highestRankingReload)
        },

        calculateDistancesForAnnotations() {
            const userLocation = arStatus.userLocation
            if (!userLocation) { return }
            const altitude = userLocation.altitude || 0;

            annotations.forEach(annotation => {
                annotation.distanceFromUser = getPathLength(annotation.location, userLocation)
                annotation.pitch = normalizeDegree2(Math.atan2((annotation.location.altitude || 0) - altitude, annotation.distanceFromUser))
            })

            annotations = annotations.sort(function (a, b) { return (a.distanceFromUser < b.distanceFromUser) ? 1 : -1 })
        },

        calculateAzimuthsForAnnotations() {
            const userLocation = arStatus.userLocation;
            if (!userLocation) { return }

            annotations.forEach(annotation => {
                let azimuth = trackingManager.azimuthFromUserToLocation(userLocation, annotation.location)
                annotation.azimuth = azimuth
            })
        },
        didUpdateMotion(trackingManager: ARTrackingManager, pitch: number, heading: number, orientation?: number[]) {
            arStatus.heading = trackingManager.heading
            arStatus.filteredPitch = trackingManager.filteredPitch
            arStatus.filteredHeading = trackingManager.filteredHeading
            arStatus.orientation = orientation
            // console.debug('didUpdateGyro', heading, pitch);
            self.reload(ReloadType.headingChanged)
        },
        layoutAndReloadOnOrientationChange() {
            // CATransaction.begin()
            // CATransaction.setValue(kCFbooleaneanTrue, forKey: kCATransactionDisableActions)
            trackingManager.catchupHeadingPitch()
            self.reload(ReloadType.annotationsChanged)
            // CATransaction.commit()
        },
        calculateFOV() {
            // var hFov = 0
            let vFov = 0
            let hFov = 0


            const isLandscape = Ti.Gesture.isLandscape();

            if (__SIMULATOR__) {
                if (Ti.Gesture.isLandscape()) {
                    hFov = 58   // This is horizontal FOV - FOV of the wider side of the screen
                    vFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(hFov / 2)) * height / width))
                }
                else {
                    vFov = 58   // This is horizontal FOV - FOV of the wider side of the screen
                    hFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(vFov / 2)) * width / height))
                }
            } else {
                hFov = self.container.cameraView.getFOV(); // This is horizontal FOV - FOV of the wider side of the screen
                // Formula: hFOV = 2 * atan[ tan(vFOV/2) * (width/height) ]
                // width, height are camera width/height

                if (isLandscape) {
                    vFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(hFov / 2)) * (height / width)))
                }
                else {
                    vFov = hFov;
                    hFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(vFov / 2)) * (width / height)))
                }
            }
            // Used in simulator
            // else {
            //     if (Ti.Gesture.isLandscape()) {
            //         hFov = 58   // This is horizontal FOV - FOV of the wider side of the screen
            //         vFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(hFov / 2)) * height / width))
            //     }
            //     else {
            //         vFov = 58   // This is horizontal FOV - FOV of the wider side of the screen
            //         hFov = radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(vFov / 2)) * width / height))
            //     }
            // }

            arStatus.hFov = hFov
            arStatus.vFov = vFov
            arStatus.hPixelsPerDegree = hFov > 0 ? width / hFov : 0
            arStatus.vPixelsPerDegree = vFov > 0 ? height / vFov : 0
            // console.log('calculateFOV', width, height, arStatus);
        },
        logText(text: string) {
            self.container.debugLabel && (self.container.debugLabel.text = text);
        },

        centerLocationFromAnnotations(annotations: ARAnnotation[]) {
            if (annotations.length <= 0) { return null }

            let location: Location = null
            let minLat = 1000
            let maxLat = -1000
            let minLon = 1000
            let maxLon = -1000

            annotations.forEach(annotation => {
                let latitude = annotation.location.latitude
                let longitude = annotation.location.longitude

                if (latitude < minLat) { minLat = latitude }
                if (latitude > maxLat) { maxLat = latitude }
                if (longitude < minLon) { minLon = longitude }
                if (longitude > maxLon) { maxLon = longitude }
            });

            let coordinate = { latitude: (minLat + maxLat) * 0.5, longitude: (minLon + maxLon) * 0.5 }
            if (CoordinateIsValid(coordinate)) {
                location = { latitude: coordinate.latitude, longitude: coordinate.longitude }
            }

            return location
        },
        /**
     Stacks annotationViews vertically if they are overlapping. This works by comparing frames of annotationViews.
     
     This must be called if parameters that affect relative x,y of annotations changed.
     - if azimuths on annotations are calculated(This can change relative horizontal positions of annotations)
     - when adjustVerticalOffsetParameters is called because that can affect relative vertical positions of annotations
     
     Pitch/heading of the device doesn't affect relative positions of annotationViews.
     */
        // stackAnnotationViews() {
        //     if (annotationViews.length <= 0) { return }

        //     // Sorting makes stacking faster
        //     let sortedAnnotationViews = annotationViews.sort(function (a, b) { return a.frame.y > b.frame.y ? 1 : -1 })
        //     let centerX = width * 0.5
        //     let totalWidth = arStatus.hPixelsPerDegree * 360
        //     let rightBorder = centerX + totalWidth / 2
        //     let leftBorder = centerX - totalWidth / 2

        //     // This is simple brute-force comparing of frames, compares annotationView1 to all annotationsViews beneath(before) it, if overlap is found,
        //     // annotationView1 is moved above it. This is done until annotationView1 is not overlapped by any other annotationView beneath it. Then it moves to
        //     // the next annotationView.
        //     sortedAnnotationViews.forEach(annotationView1 => {
        //         //===== Alternate frame
        //         // Annotation views are positioned left(0° - -180°) and right(0° - 180°) from the center of the screen. So if annotationView1
        //         // is on -180°, its x position is ~ -6000px, and if annoationView2 is on 180°, its x position is ~ 6000px. These two annotationViews
        //         // are basically on the same position (180° = -180°) but simply by comparing frames -6000px != 6000px we cannot know that.
        //         // So we are construcing alternate frame so that these near-border annotations can "see" each other.
        //         var hasAlternateFrame = false
        //         let left = annotationView1.frame.x;
        //         let right = left + annotationView1.frame.width
        //         // Assuming that annotationViews have same width
        //         if (right > (rightBorder - annotationView1.frame.width)) {
        //             annotationView1.arAlternateFrame = annotationView1.frame
        //             annotationView1.arAlternateFrame.x = annotationView1.frame.x - totalWidth
        //             hasAlternateFrame = true
        //         }
        //         else if (left < (leftBorder + annotationView1.frame.width)) {
        //             annotationView1.arAlternateFrame = annotationView1.frame
        //             annotationView1.arAlternateFrame.x = annotationView1.frame.x + totalWidth
        //             hasAlternateFrame = true
        //         }

        //         //====== Detecting collision
        //         var hasCollision = false
        //         let y = annotationView1.frame.y;
        //         var i = 0
        //         while (i < sortedAnnotationViews.length) {
        //             let annotationView2 = sortedAnnotationViews[i]
        //             if (annotationView1 == annotationView2) {
        //                 // If collision, start over because movement could cause additional collisions
        //                 if (hasCollision) {
        //                     hasCollision = false
        //                     i = 0
        //                     continue
        //                 }
        //                 break
        //             }

        //             let collision = annotationView1.frame.intersects(annotationView2.frame)

        //             if (collision) {
        //                 annotationView1.frame.y = annotationView2.frame.y - annotationView1.frame.height - 5
        //                 annotationView1.arAlternateFrame.y = annotationView1.frame.y
        //                 hasCollision = true
        //             }
        //             else if (hasAlternateFrame && annotationView1.arAlternateFrame.intersects(annotationView2.frame)) {
        //                 annotationView1.frame.y = annotationView2.frame.y - annotationView1.frame.height - 5
        //                 annotationView1.arAlternateFrame.y = annotationView1.frame.y
        //                 hasCollision = true
        //             }

        //             i = i + 1
        //         }
        //         annotationView1.arPositionOffset.y = annotationView1.frame.y - y;
        //     })
        // },
        reloadAnnotations(annots: Annotation[], reloadType: ReloadType) {
            // console.debug('reloadAnnotations', reloadType, arStatus.ready, annots.length);
            if (!arStatus.ready) { return }

            // Detecting some rare cases, e.g. if clear was called then we need to recreate everything.
            let changeDetected = annots.length != annotations.length
            // needsRelayout indicates that position of user or positions of annotations have changed. e.g. user moved, annotations moved/changed.
            // This means that positions of annotations on the screen must be recalculated.
            let needsRelayout = reloadType == ReloadType.annotationsChanged || reloadType == ReloadType.reloadLocationChanged || reloadType == ReloadType.userLocationChanged || changeDetected
            // console.debug('reloadAnnotations', needsRelayout, reloadType, changeDetected);

            // Doing heavier stuff here
            if (needsRelayout) {
                annotations = annots

                // Filtering annotations and creating annotation views. Doing this only on big location changes, not on any user location change.
                if ((reloadType != ReloadType.userLocationChanged) || changeDetected) {
                    activeAnnotations = self.activeAnnotationsFromAnnotations(annotations)
                    self.createAnnotationViews(reloadType != ReloadType.headingChanged)
                }

                self.adjustDistanceOffsetParameters()

                // annotationViews.forEach(annotationView => {
                //     annotationView.bindUi()
                // })

                // This must be done before layout
                // self.resetLayoutParameters()
            }
            self.addRemoveAnnotationViews(arStatus)

            // this.preLayout(this.arViewController.arStatus, reloadType, needsRelayout)
            self.updateView(arStatus, reloadType, needsRelayout)
            // if (needsRelayout) {
            //     self.stackAnnotationViews();
            // }
            // this.postLayout(this.arViewController.arStatus, reloadType, needsRelayout)
        },

        //==========================================================================================================================================================
        // MARK:                                                               Filtering(Active annotations)
        //==========================================================================================================================================================

        /**
         Gives opportunity to the presenter to filter annotations and reduce number of items it is working with.
         
         Default implementation filters by maxVisibleAnnotations and maxDistance.
         */
        activeAnnotationsFromAnnotations(annotations: ARAnnotation[]): ARAnnotation[] {
            var activeAnnotations: ARAnnotation[] = []

            annotations.forEach(annotation => {
                // maxVisibleAnnotations filter
                // console.debug('activeAnnotationsFromAnnotations', annotation.distanceFromUser, maxVisibleAnnotations, maxDistance);
                if (activeAnnotations.length >= maxVisibleAnnotations) {
                    annotation.active = false
                    return
                }

                // maxDistance filter
                if (maxDistance != 0 && annotation.distanceFromUser > maxDistance) {
                    annotation.active = false
                    return
                }

                annotation.active = true
                activeAnnotations.push(annotation)
            })

            return activeAnnotations
        },

        //==========================================================================================================================================================
        // MARK:                                                               Creating annotation views
        //==========================================================================================================================================================

        /**
         Creates views for active annotations and removes views from inactive annotations.
         @IMPROVEMENT: Add reuse logic
        */
        createAnnotationViews(force: boolean) {
            // console.debug('createAnnotationViews', force, annotationViews.length);

            if (!force && annotationViews.length > 0) {
                return;
            }
            let res: ARAnnotationView[] = []


            self.container.presenter.removeAllChildren();

            // Removing existing annotation views and reseting some properties
            // annotationViews.forEach(annotationView => {
            //     annotationView.removeFromSuperview()
            // })

            // Destroy views for inactive anntotations
            annotations.forEach(annotation => {
                if (!annotation.active) {
                    annotation.annotationView = null;
                } else {
                    let annotationView = annotation.annotationView;
                    if (!annotationView) {
                        annotation.annotationView = annotationView = createAnnotationView(annotation)
                    }
                    res.push(annotationView)
                }
            })
            annotationViews = res
            self.container.presenter.add(annotationViews);
        },

        /// Removes all annotation views from screen and resets annotations
        clear() {
            annotations.forEach(annotation => {
                annotation.active = false
                annotation.annotationView = null
            })

            self.container.presenter.removeAllChildren();

            annotations = []
            activeAnnotations = []
            annotationViews = []
            visibleAnnotationViews = []
        },


        //==========================================================================================================================================================
        // MARK:                                                               Add/Remove
        //==========================================================================================================================================================

        /**
         Adds/removes annotation views to/from superview depending if view is on visible part of the screen.
         Also, if annotation view is on visible part, it is added to visibleAnnotationViews.
        */
        addRemoveAnnotationViews(arStatus: ARStatus) {
            let degreesDeltaH = arStatus.hFov
            let degreesDeltaV = arStatus.vFov
            let heading = arStatus.filteredHeading
            let pitch = arStatus.pitch
            // console.debug('addRemoveAnnotationViews', degreesDeltaH, degreesDeltaV, heading, pitch, activeAnnotations.length);
            visibleAnnotationViews = []

            activeAnnotations.forEach(annotation => {
                let annotationView = annotation.annotationView
                if (!annotationView) { return }

                // This is distance of center of annotation to the center of screen, measured in degrees
                let deltaX = deltaAngle(heading, annotation.azimuth)
                let deltaY = deltaAngle(pitch, annotation.pitch)
                // console.debug('addRemoveAnnotationViews test', annotation.azimuth, annotation.pitch, deltaX, deltaY);

                if (Math.abs(deltaX) < degreesDeltaH && Math.abs(deltaY) < degreesDeltaV) {
                    // if (annotationView.superview == null) {
                    //     // insertSubview at 0 so that farther ones are beneath nearer ones
                    //     this.insertSubview(annotationView, 0)
                    // }
                    // console.debug('showing anot', annotation.title, deltaX, deltaY);
                    visibleAnnotationViews.push(annotationView)
                }
                else {
                    annotationView.visible = false;
                }
            })
        },

        //==========================================================================================================================================================
        // MARK:                                                               Layout
        //==========================================================================================================================================================
        /**
        Layouts annotation views.
        - Parameter relayoutAll: If true it will call xPositionForAnnotationView/yPositionForAnnotationView for each annotation view, else
                               it will only take previously calculated x/y positions and add heading/pitch offsets to visible annotation views.
        */
        updateView(arStatus: ARStatus, reloadType: ReloadType, needsRelayout: boolean) {
            // console.debug('updateView', needsRelayout, visibleAnnotationViews.length);
            // let pitchYOffset = arStatus.pitch * arStatus.vPixelsPerDegree
            let views = needsRelayout ? annotationViews : visibleAnnotationViews
            const centerX = width / 2;
            const centerY = height / 2;
            // console.debug('relayout', needsRelayout, views.length);
            const hPixelsPerDegree = arStatus.hPixelsPerDegree;
            const vPixelsPerDegree = arStatus.vPixelsPerDegree;
            const heading = arStatus.heading;
            const filteredHeading = arStatus.filteredHeading;
            const altitude = lastLocation.altitude || 0;
            const pitch = arStatus.filteredPitch;

            self.container.debugLabel.applyProperties({
                text: `location: ${lastLocation.latitude.toFixed(3)}, ${lastLocation.longitude.toFixed(3)}, ${altitude.toFixed(3)}, ${lastLocation.heading && lastLocation.heading.toFixed(3)}
                heading: ${filteredHeading.toFixed(3)}, ${heading.toFixed(3)}
                pitch: ${pitch.toFixed(3)}
                orientation: ${arStatus.orientation && arStatus.orientation.map(s=>s.toFixed(3))}`
            })
            views.forEach(annotationView => {
                let annotation = annotationView.annotation
                if (!annotation) { return }

                let centerX = width * 0.5
                let centerY = height * 0.5
                // if (needsRelayout) {
                //     let x = this.xPositionForAnnotationView(annotationView, arStatus)
                //     let y = this.yPositionForAnnotationView(annotationView, arStatus)
                //     annotationView.arPosition = { x, y }
                // }
                let headingXOffset = deltaAngle(annotation.azimuth, filteredHeading) * hPixelsPerDegree
                let headingYOffset = deltaAngle(annotation.pitch, pitch) * vPixelsPerDegree

                const center = {
                    x: centerX + headingXOffset,
                    y: centerY - headingYOffset
                }
                // console.debug('update annot x', annotation.azimuth, heading, hPixelsPerDegree, deltaAngle(annotation.azimuth, heading), headingXOffset);
                // console.debug('update annot y', annotation.pitch, pitch, vPixelsPerDegree, deltaAngle(annotation.pitch, pitch), headingYOffset);
                annotationView.applyProperties({
                    visible: true,
                    center: center
                });
                // annotationView.center = center
                // annotationView.center = center
                // var xDelta = deltaAngle(relAngleH);
                // Titanium.API.debug("   xDelta: " + Math.round(xDelta.toString()));

                // var yDelta = deltaAngle(relAngleV);
                // Final position of annotation
                // annotationView.frame = { x, y, width: annotationView.bounds.width, height: annotationView.bounds.height }
            })
        },

        /**
         x position without the heading, heading offset is added in layoutAnnotationViews due to performance.
         */
        // xPositionForAnnotationView(annotationView: ARAnnotationView, arStatus: ARStatus) {
        //     let x = centerX - (annotationView.bounds.width * annotationView.centerOffset.x)
        //     return x
        // },

        /**
         y position without the pitch, pitch offset is added in layoutAnnotationViews due to performance.
         */
        // yPositionForAnnotationView(annotationView: ARAnnotationView, arStatus: ARStatus) {
        //     let annotation = annotationView.annotation
        //     if (!annotation) { return 0 }
        //     let bottomY = height * bottomBorder
        //     let distance = annotation.distanceFromUser

        //     // Offset by distance
        //     var distanceOffset: number = 0
        //     if (distanceOffsetMode != DistanceOffsetMode.none) {
        //         let func = distanceOffsetFunction
        //         if (func) {
        //             distanceOffset = func(distance)
        //         }
        //         else if (distance > distanceOffsetMinThreshold) {
        //             let distanceForOffsetCalculation = distance - distanceOffsetMinThreshold
        //             distanceOffset = -(distanceForOffsetCalculation * distanceOffsetMultiplier)
        //         }
        //     }

        //     // y
        //     let y = bottomY - (annotationView.bounds.height * annotationView.centerOffset.y) + distanceOffset
        //     return y
        // },

        /**
         Resets temporary stacking fields. This must be called before stacking and before layout.
         */
        // resetLayoutParameters() {
        //     annotationViews.forEach(annotationView => {
        //         annotationView.arPositionOffset = { x: 0, y: 0 }
        //         annotationView.arAlternateFrame = { x: 0, y: 0, width: 0, height: 0 }
        //     })
        // },

        //==========================================================================================================================================================
        // MARK:                                                               DistanceOffset
        //==========================================================================================================================================================
        adjustDistanceOffsetParameters() {
            var minDistance = activeAnnotations.length > 0 && activeAnnotations[0].distanceFromUser || -1
            let maxDistance = activeAnnotations.length > 0 && activeAnnotations[activeAnnotations.length - 1].distanceFromUser || -1
            if (minDistance == -1 || maxDistance == -1) {
                return;
            }
            if (minDistance > maxDistance) { minDistance = maxDistance }
            let deltaDistance = maxDistance - minDistance
            let availableHeight = height * bottomBorder - 30 // 30 because we don't want them to be on top but little bit below

            if (distanceOffsetMode == DistanceOffsetMode.automatic) {
                distanceOffsetMinThreshold = minDistance
                distanceOffsetMultiplier = deltaDistance > 0 ? availableHeight / deltaDistance : 0
            }
            else if (distanceOffsetMode == DistanceOffsetMode.automaticOffsetMinDistance) {
                distanceOffsetMinThreshold = minDistance
            }
        }

    })

    trackingManager.delegate = self;
    self.once('open', () => {
        if (__SIMULATOR__ && !app.locationManager.getLastPosition()) {
            self.calculateFOV();
            trackingManager.startDebugMode({
                latitude: 45.1918,
                longitude: 5.728318,
                altitude: 270.5
            }, 0, 0);
        } else {
            trackingManager.startTracking(true)
        }
    })

    trackingManager

    //END OF CLASS. NOW GC 
    Ti.App.on('pause', self.appDidEnterBackground)
    Ti.App.on('resume', self.appWillEnterForeground)
    self.GC = app.composeFunc(self.GC, function () {
        Ti.App.off('pause', self.appDidEnterBackground)
        Ti.App.off('resume', self.appWillEnterForeground)
        trackingManager.dealloc();
        trackingManager = null;
        self = null;
    });
    return self;
};