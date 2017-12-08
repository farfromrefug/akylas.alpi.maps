
import TemplateModule from 'akylas.commonjs/TemplateModule'
export default class CViewTemplates extends TemplateModule {    
    constructor() {
        super({
            prepareTemplate: ak.ti.prepareListViewTemplate
        });
        let toAdd = {
            calloutPhoto: {
                type: 'Ti.UI.View',
                properties: {
                    layout: 'vertical',
                    width: 150,
                    height: 100
                },
                childTemplates: [{
                    type: 'Ti.UI.ImageView',
                    bindId: 'image',
                    properties: {
                        width: 'FILL',
                        height: 'FILL',
                        scaleType: Ti.UI.SCALE_TYPE_ASPECT_FILL,
                        transition: {
                            style: Ti.UI.TransitionStyle.FADE
                        },
                        // filterOptions:{
                        //     scale:0.5
                        // },
                        localLoadSync: false,
                        onlyTransitionIfRemote: false,
                    },
                    childTemplates: [{
                        type: 'Ti.UI.ActivityIndicator',
                        bindId: 'loading',
                        properties: {
                            touchEnabled: false,
                            width: 'FILL',
                            height: 'FILL',
                            style: Ti.UI.ActivityIndicatorStyle.BIG_DARK
                        }
                    // }, {
                    //     type: 'Ti.UI.Label',
                    //     bindId: 'time',
                    //     properties: {
                    //         color: $.white,
                    //         font: {
                    //             size: 14
                    //         },
                    //         padding: {
                    //             left: 5
                    //         },
                    //         backgroundColor: '#00000088',
                    //         bottom: 0,
                    //         left: 0,
                    //         width: 'FILL',
                    //         height: 18,
                    //         touchEnabled: false
                    //     }
    
                    }]
                // }, {
                //     type: 'Ti.UI.Label',
                //     bindId: 'title',
                //     properties: {
                //         width: 'FILL',
                //         top: 4,
                //         ellipsize: Ti.UI.TEXT_ELLIPSIZE_TAIL,
                //         font: {
                //             size: 14
                //         },
                //     }
    
                }]
    
            },
            gfheader: {
                type: 'Ti.UI.View',
                bindId: 'gfheader',
                properties: {
                    bottom: 0,
                    top: $.navBarTop,
                    height: 'SIZE',
                    layout: 'vertical'
                },
                childTemplates: [{
                    type: 'Ti.UI.View',
                    height: 'SIZE',
                    minHeight: $.navBarHeight,
                    bindId: 'titleHolder',
                    layout: 'horizontal',
                    childTemplates: [{
                        type: 'Ti.UI.View',
                        properties: {
                            width: 20,
                            height: 1
                        }
                    }, {
                            type: 'Ti.UI.Label',
                            bindId: 'icon',
                            properties: {
                                rclass: 'GFHeaderIcon'
                            }
                        }, {
                        type: 'Ti.UI.Label',
                        bindId: 'title',
                        properties: {
                            rclass: 'GFHeaderTitle'
                        },
                        // childTemplates: []
                    }]
                }, {
                    type: 'Ti.UI.View',
                    height: 30,
                    layout: 'horizontal',
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        bindId: 'subtitle',
                        properties: {
                            rclass: 'GFHeaderSubtitle'
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'info',
                        properties: {
                            rclass: 'GFHeaderInfo'
                        }
                    }]
                }]
            }
        }
        for (const key in toAdd) {
            this.addTemplate(toAdd[key], key);
        }    
    }
}

declare global {
    type ViewTemplates = CViewTemplates
}

export function load (_context) {
    return new CViewTemplates();
};