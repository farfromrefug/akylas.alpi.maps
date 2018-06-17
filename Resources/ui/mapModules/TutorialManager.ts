import { MapModule } from './MapModule'

declare global {
    type TutorialManager = TutorialMgr
    interface Tutorial {
        title: string
        text: string
        anchor: string
        radius: number
        onMap?: boolean
        center: [number, number]
    }
}
export class TutorialMgr extends MapModule {
    tutorials: {
        [k: string]: Tutorial
    } = {}
    doneTutorials: string[] = Ti.App.Properties.getObject('tutorials.done', [])
    tutorialWin
    pendingTutorial = []
    constructor(_context, _args, _additional) {
        super(_args);
        app.tutorialManager = this;
        if (this.enabled) {
            this.tutorials = require('/data/tutorials').tutorials;
        }
    }
    createTutorialView(_id: string, _tut: Tutorial) {
        console.debug('handling', _id, _tut);
        var text;

        if (_tut.title) {
            text = '<b>' + trc(_tut.title) + '</b><br>';
        }
        text += trc(_tut.text);
        var textProps: TiProperties = {
            rclass: 'TutorialLabel',
            html: text
        };
        var arrowProps: TiProperties = {
            rclass: 'TutorialArrow',
        };
        var radius = _tut.radius;
        var arrowWidth = 16;
        var arrowHeight = 10;
        var anchor = _tut.anchor;
        var center = _tut.center.slice(0);

        if (!!_tut.onMap) {
            var padding = this.parent.getMapCurrentPadding();
            if (padding.top) {
                center[1] += padding.top / app.deviceinfo.densityFactor;
            }
            if (padding.bottom) {
                center[1] -= padding.bottom / app.deviceinfo.densityFactor;
            }
        }
        switch (anchor) {
            case 'bottomright':
                textProps.right = 0;

                arrowProps.right = center[0] - arrowWidth / 2;
                arrowProps.bottom = center[1] + radius + 5;
                textProps.bottom = arrowProps.bottom as number + arrowHeight;
                arrowProps.transform = 'r180';
                anchor = app.modules.shapes.RIGHT_BOTTOM;
                center[0] -= radius;
                center[1] -= radius;
                break;
            case 'bottomleft':
                textProps.left = 0;

                arrowProps.left = center[0] - arrowWidth / 2;
                arrowProps.bottom = center[1] + radius + 5;
                textProps.bottom = arrowProps.bottom as number + arrowHeight;
                arrowProps.transform = 'r180';
                anchor = app.modules.shapes.LEFT_BOTTOM;
                center[0] -= radius;
                center[1] -= radius;
                break;
            case 'bottom':

                arrowProps.bottom = center[1] + radius + 5;
                textProps.bottom = arrowProps.bottom as number + arrowHeight;
                arrowProps.transform = 'r180';
                anchor = app.modules.shapes.BOTTOM_MIDDLE;
                center[1] -= radius;
                break;
            case 'top':

                arrowProps.top = center[1] + radius + 5;
                textProps.top = arrowProps.top as number + arrowHeight;
                anchor = app.modules.shapes.TOP_MIDDLE;
                center[1] -= radius;
                break;
            case 'center':
                arrowProps.top = center[1] + app.deviceinfo.height / 2 + (radius + 5);
                textProps.top = arrowProps.top as number + arrowHeight;
                anchor = app.modules.shapes.CENTER;
                break;
            case 'topleft':
                textProps.left = 0;
                arrowProps.left = center[0] - arrowWidth / 2;
                arrowProps.top = center[1] + radius + 5;
                textProps.top = arrowProps.top as number + arrowHeight;
                anchor = app.modules.shapes.LEFT_TOP;
                center[0] -= radius;
                center[1] -= radius;
                break;
            case 'topright':
                textProps.right = 0;
                arrowProps.right = center[0] - arrowWidth / 2;
                arrowProps.top = center[1] + radius + 5;
                textProps.top = arrowProps.top as number + arrowHeight;
                anchor = app.modules.shapes.RIGHT_TOP;
                center[0] -= radius;
                center[1] -= radius;
                break;
        }

        return new View({
            properties: {
                tutId: _id,
                touchEnabled: false
            },
            childTemplates: [{
                type: 'AkylasShapes.View',
                properties: {},
                childTemplates: [{
                    type: 'AkylasShapes.Circle',
                    properties: {
                        rclass: 'TutorialShapeCircleView',
                        anchor: anchor,
                        center: [
                            center[0],
                            center[1]
                        ],
                        radius: radius
                    },
                }]
            }, {
                type: 'Ti.UI.View',
                properties: {
                    left: 5,
                    right: 5
                },
                childTemplates: [{
                    //     type: 'Ti.UI.View',
                    //     properties: viewParams
                    // }, {
                    type: 'Ti.UI.Label',
                    properties: arrowProps
                }, {
                    type: 'Ti.UI.Label',
                    properties: textProps
                }]
            }]
        });
    }
    enabled = Ti.App.Properties.getBool('tutorials.enabled', false)
    setEnabled(_value: boolean) {
        if (_value !== this.enabled) {
            console.debug('tutorialManager', 'setEnabled', _value);
            Ti.App.Properties.setBool('tutorials.enabled', _value);
            // if (_value) {
            //     app.showAlert('tutorial_restart_needed');
            // } else {
            this.enabled = _value;
            if (this.enabled && !this.tutorials) {
                this.tutorials = require('/data/tutorials').tutorials;
            }
            // }
        }
    }
    resetTutorials() {
        Ti.App.Properties.removeProperty('tutorials.done');
        this.doneTutorials = [];
    }
    addTutorials(_tutorials: Tutorial) {
        if (!this.enabled) {
            return;
        }
        _.defaults(this.tutorials, _tutorials);
    }
    getTutorials(_tuts: string[], _force) {
        var result = _.pick(this.tutorials, _.filter(_tuts, (n) => {
            return _force || !_.includes(this.doneTutorials, n);
        }));
        return result as {
            [k: string]: Tutorial
        };
    }
    showTutorials(_tuts: string[], _force?: boolean) {
        // console.log('showTutorials');
        if (!this.enabled) {
            return;
        }
        var views: View[] = _.reduce(this.getTutorials(_tuts, _force), (memo, value, key) => {
            if (value) {
                memo.push(this.createTutorialView(key, value));
            }
            return memo;
        }, []);
        if (views.length === 0) {
            return;
        }
        if (this.tutorialWin) {
            views = _.uniqBy(this.tutorialWin.scrollView.views.concat(views), 'tutId');
            console.debug('updating tutorial window', _.map(views, 'tutId'));
            this.tutorialWin.applyProperties({
                tutorials: _.map(views, 'tutId'),
                scrollView: {
                    views: views
                }
            });
            return;
        }
        this.tutorialWin = new AppWindow({
            rclass: 'TutorialWindow',
            tutorials: _.map(views, 'tutId'),
            containerView: {
                type: 'Ti.UI.View',
                properties: {},
                childTemplates: [{
                    type: 'Ti.UI.ScrollableView',
                    bindId: 'scrollView',
                    properties: {
                        rclass: 'TutorialScrollableView',
                        views: views
                    },
                    events: {
                        change: (e) => {
                            var tutIds = this.tutorialWin.tutorials;
                            var currentTutId = tutIds[e.currentPage];
                            if (!_.includes(this.doneTutorials, currentTutId)) {
                                this.doneTutorials.push(currentTutId);
                                if (this.doneTutorials.length === _.size(this.tutorials)) {
                                    this.setEnabled(false);
                                }
                            }
                        }
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'quit',
                    properties: {
                        rclass: 'TutorialQuitLabel'
                    }
                }]

            },
            events: {
                click: (e) => {
                    var callbackId = e.bindId;
                    console.debug('callbackId', callbackId);
                    switch (callbackId) {
                        case 'scrollView':
                            var tutIds = this.tutorialWin.tutorials;
                            var currentPage = e.source.currentPage;
                            var currentTutId = tutIds[currentPage];
                            if (currentPage < tutIds.length - 1) {
                                e.source.moveNext();
                            } else {
                                this.tutorialWin.closeMe();
                            }
                            break;
                        case 'quit':
                            app.confirmAction({
                                'title': trc('are_you_sure'),
                                'message': trc('quit_tutorial_confirm'),
                                buttonNames: [trc('no'), trc('yes')]
                            }, () => {
                                if (this.tutorialWin) {
                                    this.tutorialWin.closeMe();
                                }
                                this.setEnabled(false);
                            });
                            break;
                    }
                }
            }
        });

        // ak.ti.add(tutorialWin.container, [{,
        // }]);
        this.tutorialWin.onClose = app.composeFunc(this.tutorialWin.onClose, () => {
            Ti.App.Properties.setObject('tutorials.done', this.doneTutorials);
            this.tutorialWin = null;
        });
        app.ui.openWindow(this.tutorialWin);
    }
}

export function create(_context, _args, _additional) {
    return new TutorialMgr(_context, _args, _additional);
};