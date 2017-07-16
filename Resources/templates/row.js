function create(_context) {

    var templates = new TemplateModule({
        prepareTemplate: ak.ti.prepareListViewTemplate
    });
    var icons = {
        share: '\ue6c0',
        delete: '\ue287',
        edit: '\ue076',
        clear: '\ue070',
        move: '\ue103',
        locate: '\ue604',
    };

    var onChartTouch = function (e) {
        if (e.bindId === 'chart') {
            // var data = e.source.getHighlightByTouchPoint([e.x, e.y]);
            // sdebug('onChartTouch', e, data);
            var data = e.data;
            if (!data) {
                return;
            }
            var rect = e.source.rect;
            sdebug('onChartTouch', data, e.type, rect);
            var params = {
                popup: {
                    visible: true,
                },
                popupLabel: {
                    text: app.utils.geolib.formatter.altitude(data.y),
                },
                // userLocation: {
                //     visible: true,
                //     center: [e.line.x, e.line.y]
                // }
            };
            var x = Math.round(e.data.xPx);
            var y = Math.round(e.data.yPx);
            if (x <= 20 || x >= rect.width - 20) {
                var isLeft = x <= 20;
                Object.assign(params.popup, {
                    left: isLeft ? x : null,
                    right: isLeft ? null : (rect.width-x),
                    bottom: null,
                    top: null,
                    center: {
                        y: y
                    }
                });
                Object.assign(params.popupLabel, {
                    left: isLeft ? 7 : null,
                    right: isLeft ? null : 7,
                    bottom: null,
                    top: null
                });
                params.arrow = {
                    transform: isLeft ? 'r90' : 'r-90',
                    left: isLeft ? 0 : null,
                    right: isLeft ? null : 0,
                    bottom: null,
                    top: null,
                };
            } else {
                var isTop = y <= 23;
                Object.assign(params.popup, {
                    top: isTop ? y : null,
                    bottom: isTop ? null : (rect.height - y),
                    left: null,
                    right: null,
                    center: {
                        x: x
                    }
                });
                Object.assign(params.popupLabel, {
                    top: isTop ? 4 : null,
                    bottom: isTop ? null : 5,
                    left: null,
                    right: null
                });
                params.arrow = {
                    transform: isTop ? 'r180' : '',
                    top: isTop ? 0 : null,
                    bottom: isTop ? null : 0,
                    left: null,
                    right: null
                };
            }
            if (e.source.parent.popup) {
                e.source.parent.applyProperties(params);
            } else {
                e.source.parent.parent.applyProperties(params);
            }
            if (e.type === 'click') {
                e.source.emit('point', {
                    bubbles: true,
                    data: data,
                });
            }

        }

    };

    templates.createToolbarButton = function (_id, _icon, _showButton) {
        _showButton = _showButton !== false && app.tutorial;
        var result = {
            type: 'Ti.UI.Button',
            bindId: _id,
            properties: {
                rclass: 'ToolbarButton',
                dispatchPressed: true,
                callbackId: _id,
                title: _icon || icons[_id],
                padding: _showButton ? {
                    bottom: 10
                } : undefined,
            }
        };
        if (_showButton) {
            result.childTemplates = [{
                type: 'Ti.UI.Button',
                properties: {
                    touchPassThrough: true,
                    width: 'FILL',
                    height: 'FILL',
                    font: {
                        size: 9,
                        weight: 'bold'
                    },
                    maxLines: 1,
                    textAlign: 'center',
                    verticalAlign: 'bottom',
                    // color: $.white,
                    padding: {
                        bottom: 5,
                        left: 3,
                        right: 3
                    },
                    title: trc(_id),
                    ellipsize: Ti.UI.TEXT_ELLIPSIZE_WORD
                }
            }];
        }
        return result;
    };

    function createItemGeoInfoLabel(_id, _icon) {
        return {
            type: 'Ti.UI.Label',
            bindId: _id,
            properties: {
                rclass: 'ItemGeoInfoLabel',
                visible: false
            },
            childTemplates: [{
                bindId: _id + 'icon',
                type: 'Ti.UI.Label',
                properties: {
                    rclass: 'ItemGeoInfoIcon',
                    touchEnabled: false,
                    text: _icon
                }
            }]
        };
    }

    function createSwipeButton(_id, _color, _showText) {
        var result = {
            type: 'Ti.UI.Label',
            bindId: _id,
            properties: {
                callbackId: _id,
                width: 60,
                backgroundColor: app.colors[_color].color,
                backgroundSelectedColor: app.colors[_color].darker,
                color: $.white,
                height: 'FILL',
                font: {
                    family: $.iconicfontfamily,
                    size: 28
                },
                dispatchPressed: true,
                padding: app.tutorial ? {
                    bottom: 10
                } : undefined,
                textAlign: 'center',
                text: icons[_id]
            }
        };
        if (_showText !== false && app.tutorial) {
            result.childTemplates = [{
                type: 'Ti.UI.Label',
                properties: {
                    touchEnabled: false,
                    width: 'FILL',
                    height: 'FILL',
                    font: {
                        size: 9,
                        weight: 'bold'
                    },
                    maxLines: 1,
                    textAlign: 'center',
                    verticalAlign: 'bottom',
                    color: $.white,
                    padding: {
                        bottom: 5,
                        left: 3,
                        right: 3
                    },
                    text: trc(_id),
                    ellipsize: Ti.UI.TEXT_ELLIPSIZE_WORD
                }
            }];
        }
        return result;
    }

    function createSmallSwipeButton(_id, _color) {
        var result = {
            type: 'Ti.UI.Label',
            bindId: _id,
            properties: {
                callbackId: _id,
                width: 30,
                color: $.white,
                height: 'FILL',
                font: {
                    family: $.iconicfontfamily,
                    size: 20
                },
                textAlign: 'center',
                text: icons[_id]
            }
        };
        return result;
    }
    _.forEach({
        // noitem: {
        //     properties: {
        //         rclass: 'NoItemRow'
        //     },
        //     childTemplates: [{
        //         type: 'Ti.UI.Label',
        //         bindId: 'label',
        //         properties: {
        //             rclass: 'NoItemRowTitle'
        //         }
        //     }]
        // },
        // searchnoitem: {
        //     properties: {
        //         rclass: 'NoItemRow'
        //     },
        //     childTemplates: [{
        //         type: 'Ti.UI.Label',
        //         bindId: 'label',
        //         properties: {
        //             rclass: 'SearchNoItemRowTitle'
        //         }
        //     }]
        // },
        menu: {
            properties: {
                rclass: 'LeftMenuRow'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'LeftMenuRowIcon'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'label',
                properties: {
                    rclass: 'LeftMenuRowLabel'
                },
            }]
        },
        // menuswitch: {
        //     properties: {
        //         rclass: 'LeftMenuRowNoSelect'
        //     },
        //     childTemplates: [{
        //         type: 'Ti.UI.Label',
        //         bindId: 'icon',
        //         properties: {
        //             rclass: 'LeftMenuRowIcon'
        //         }
        //     }, {
        //         type: 'Ti.UI.Label',
        //         bindId: 'label',
        //         properties: {
        //             rclass: 'LeftMenuRowLabel'
        //         },
        //     }, {
        //         type: 'Ti.UI.Switch',
        //         bindId: 'switch',
        //         properties: {
        //             rclass: 'LeftMenuRowSwitch'
        //         }
        //     }]
        // },
        // option: {
        //     properties: {
        //         rclass: 'OptionRow'
        //     },
        //     childTemplates: [{
        //         type: 'Ti.UI.Label',
        //         bindId: 'icon',
        //         properties: {
        //             rclass: 'OptionRowIcon'
        //         }
        //     }, {
        //         type: 'Ti.UI.Label',
        //         bindId: 'label',
        //         properties: {
        //             rclass: 'OptionRowLabel'
        //         }
        //     }]
        // },
        // optionTitle: {
        //     properties: {
        //         rclass: 'OptionRowVertical'
        //     },
        //     childTemplates: [{
        //         type: 'Ti.UI.Label',
        //         bindId: 'title',
        //         properties: {
        //             rclass: 'OptionRowTitle'
        //         }
        //     }, {
        //         type: 'Ti.UI.Label',
        //         bindId: 'subtitle',
        //         properties: {
        //             rclass: 'OptionRowSubtitle'
        //         }
        //     }]
        // },
        // transparent: {
        //     properties: {
        //         touchEnabled: false
        //     }
        // },

        license: {
            properties: {
                rclass: 'LicenseRow'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'label',
                properties: {
                    rclass: 'LicenseRowLabel'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'sublabel',
                properties: {
                    rclass: 'LicenseRowSublabel'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'value',
                properties: {
                    rclass: 'LicenseRowValue'
                }
            }]
        },

        search: {
            properties: {
                rclass: 'SearchRow',
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'SearchRowIcon'
                }
            }, {
                type: 'Ti.UI.View',
                properties: {
                    layout: 'vertical',
                    width: 'FILL',
                },
                childTemplates: [{
                    type: 'Ti.UI.Label',
                    bindId: 'title',
                    properties: {
                        rclass: 'SearchRowLabel'
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'subtitle',
                    properties: {
                        rclass: 'SearchRowSublabel'
                    }
                }]
            }, {
                type: 'Ti.UI.Label',
                bindId: 'accessory',
                properties: {
                    rclass: 'SearchRowAccessory',
                    // visible: false
                }
            }]
        },

        // geoPhotoScroll: {

        //     properties: {
        //         height: 150,
        //     },
        //     childTemplates: [{
        //         type: 'Ti.UI.ScrollableView',
        //         bindId: 'photosView',
        //         properties: {
        //             overlayEnabled: true,
        //             pagingControlColor: 'transparent',
        //             showPagingControl: true
        //         }
        //     }]
        // },
        list: {
            properties: {
                rclass: 'ListRow',
                rightSwipeButtons: [
                    createSwipeButton('clear', 'blue'),
                    createSwipeButton('delete', 'red'),
                ],
                leftSwipeButtons: [
                    createSwipeButton('edit', 'green')
                ]
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'ListRowIcon'
                }
            }, {
                type: 'Ti.UI.View',
                properties: {
                    layout: 'vertical',
                    width: 'FILL',
                    touchPassThrough: true
                },
                childTemplates: [{
                    type: 'Ti.UI.Label',
                    bindId: 'title',
                    properties: {
                        rclass: 'ListRowLabel'
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'subtitle',
                    properties: {
                        rclass: 'ListRowSublabel'
                    }
                    // }, {
                    //     type: 'Ti.UI.View',
                    //     properties: {
                    //         rclass: 'ListRowBorderLine'
                    //     }
                }]
            }, {
                type: 'Ti.UI.Label',
                bindId: 'countLabel',
                properties: {
                    rclass: 'ListRowCountLabel'
                }
            }, {
                type: 'Ti.UI.Switch',
                bindId: 'switch',
                properties: {
                    rclass: 'ListRowSwitch',
                    visible: false
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'accessory',
                properties: {
                    rclass: 'ListRowAccessory'
                }
            }]
        },
        itemgeoinfo: {
            properties: {
                rclass: 'ListItemRow',
                height: 'SIZE',
                layout: 'vertical',
                preventListViewSelection: true
            },
            childTemplates: [
                createItemGeoInfoLabel('latlon', $.sPlace),
                createItemGeoInfoLabel('altitude', $.sElevation),
                createItemGeoInfoLabel('route', $.sDist), {
                    type: 'Ti.UI.View',
                    properties: {
                        layout: 'horizontal',
                        height: 'SIZE'
                    },
                    childTemplates: [
                        createItemGeoInfoLabel('sunrise', String.fromCharCode(0xf112)),
                        createItemGeoInfoLabel('noon', String.fromCharCode(0xf113)),
                        createItemGeoInfoLabel('sunset', String.fromCharCode(0xf110))
                    ]
                }
            ]
        },
        iconrow: {
            properties: {
                rclass: 'ListItemRow',
                // height: 40,
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'ListItemRowIcon',
                    visible: false
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'ListItemRowLabel'
                }
            }]
        },
        gfoptionitem: {
            properties: {
                rclass: 'GFOptionRow',
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'GFOptionRowIcon'
                }
            }, {
                type: 'Ti.UI.View',
                bindId: 'holder',
                properties: {
                    touchPassThrough: true,
                    layout: 'vertical',
                    width: 'FILL',
                },
                childTemplates: [{
                    type: 'Ti.UI.Label',
                    bindId: 'title',
                    properties: {
                        rclass: 'GFOptionRowLabel'
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'subtitle',
                    properties: {
                        rclass: 'GFOptionRowSublabel'
                    }
                    // }, {
                    //     type: 'Ti.UI.View',
                    //     properties: {
                    //         rclass: 'GFOptionRowBorderLine'
                    //     }
                }]
            }, {
                type: 'Ti.UI.Label',
                bindId: 'accessory',
                properties: {
                    rclass: 'GFOptionRowAccessory',
                    visible: false
                }
            }]
        },
        gfoptionttextitem: {
            properties: {
                rclass: 'GFOptionRow',
                height: 'SIZE'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'GFOptionRowIcon',
                    font: {
                        size: 18
                    },
                    text: app.icons.note
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'GFOptionRowLabel',
                    touchPassThrough: false,
                    autoLink: Ti.UI.AUTOLINK_ALL,
                    // padding: {
                    // top: 10,
                    // bottom: 10
                    // },
                    height: 'SIZE'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'accessory',
                properties: {
                    // top: 10,
                    rclass: 'GFOptionRowAccessory',
                    text: $.sDown
                }
            }]
        },
        gfoptionthoursitem: {
            properties: {
                rclass: 'GFOptionRow',
                // height: 'SIZE'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'GFOptionRowIcon',
                    font: {
                        size: 18
                    },
                    text: app.icons.note
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'GFOptionRowLabel',
                    verticalAlign: 'top',
                    top: 0,
                    ellipsize: false,
                    multiLineEllipsize: Ti.UI.TEXT_ELLIPSIZE_TAIL,
                    padding: {
                        top: 12,
                        bottom: 12
                    },
                    width: 'SIZE',
                    height: 'SIZE'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title2',
                properties: {
                    rclass: 'GFOptionRowLabel',
                    ellipsize: false,
                    padding: {
                        top: 10,
                        bottom: 10
                    },
                    verticalAlign: 'top',
                    multiLineEllipsize: Ti.UI.TEXT_ELLIPSIZE_TAIL,
                    textAlign: 'right',
                    visible: false,
                    height: 'SIZE'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'accessory',
                properties: {
                    // top: 10,
                    rclass: 'GFOptionRowAccessory',
                    text: $.sDown
                }
            }]
        },
        colPhoto: {
            properties: {
                height: 'SIZE',
                layout: 'vertical'
            },
            childTemplates: [{

                type: 'Ti.UI.ImageView',
                bindId: 'image',
                properties: {
                    width: 'FILL',
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5,
                    dispatchPressed: true,
                    transition: {
                        style: Ti.UI.TransitionStyle.FADE
                    },
                    scaleType: Ti.UI.SCALE_TYPE_ASPECT_FILL

                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    backgroundColor: '#000000aa',
                    width: 'FILL',
                    textAlign: 'center',
                    color: 'black',
                    left: 5,
                    right: 5,
                    bottom: 5,
                    font: {
                        fontSize: 20,
                        fontWeight: 'bold'
                    },
                    height: 'SIZE',
                    maxLines: 2,
                    ellipsize: Ti.UI.TEXT_ELLIPSIZE_TAIL
                }
            }]
        },
        color: {
            properties: {
                rclass: 'ListItemRow',
            },
            childTemplates: [{
                type: 'Ti.UI.View',
                bindId: 'colorBubble',
                properties: {
                    rclass: 'ColorBubble'
                }
            }, {

                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'ListItemRowLabel'
                }

            }]
        },
        tilesourceControl: {
            properties: {
                rclass: 'TSControlRow',
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'enable',
                properties: {
                    rclass: 'OptionButton'
                },
            }, {
                type: 'Ti.UI.View',
                bindId: 'holder',
                properties: {
                    touchPassThrough: true,
                    height: 'FILL',
                    width: 'FILL',
                },
                childTemplates: [{
                    bindId: 'title',
                    type: 'Ti.UI.Label',
                    properties: {
                        rclass: 'TSControlsLabel',
                        top: 0,
                        height: '50%'
                    }
                }, {
                    bindId: 'subtitle',
                    type: 'Ti.UI.Label',
                    properties: {
                        rclass: 'TSControlsLabel',
                        font: {
                            size: __APPLE__ ? 12 : 14
                        },
                        color: 'lightgray',
                        bottom: 0,
                        height: '50%'
                    }
                }, {
                    type: 'Ti.UI.Slider',
                    bindId: 'slider',
                    properties: {
                        rclass: 'TSControlSlider',
                        bubbleParent: true
                    }

                }]

            }, {
                type: 'Ti.UI.Label',
                bindId: 'download',
                properties: {
                    rclass: 'OptionButton',
                    visible: false,
                    color: $.white,
                    text: '\ue0fb'
                },
            }, {
                type: 'Ti.UI.Label',
                bindId: 'options',
                properties: {
                    rclass: 'OptionButton',
                    color: $.white,
                    text: $.sOptions
                },
            }]
        },
        mbtilesGenerator: {
            properties: {
                rclass: 'TSControlRow',
                height: 60
            },
            childTemplates: [{
                type: 'Ti.UI.ActivityIndicator',
                bindId: 'loading',
                properties: {
                    rclass: 'OptionButton'
                },
            }, {
                type: 'Ti.UI.View',
                bindId: 'holder',
                properties: {
                    touchPassThrough: true,
                    layout: 'vertical',
                    width: 'FILL',
                },
                childTemplates: [{
                    bindId: 'title',
                    type: 'Ti.UI.Label',
                    properties: {
                        rclass: 'TSControlsLabel',
                        verticalAlign: 'middle',
                        padding: null,
                        maxLines: 1,
                        height: 'SIZE'
                    }
                }, {
                    bindId: 'subtitle',
                    type: 'Ti.UI.Label',
                    properties: {
                        rclass: 'TSControlsLabel',
                        maxLines: 2,
                        height: 'SIZE',
                        font: {
                            size: 12,
                        },
                        color: 'lightgray'
                    }
                }, {
                    bindId: 'progress',
                    type: 'Ti.UI.ProgressBar',
                    properties: {
                        width: 'FILL',
                        height: 'FILL',
                        min: 0,
                        value: 0,
                        // trackTintColor: $.cTheme.main,
                        max: 100
                    },
                }]
            }, {
                type: 'Ti.UI.Label',
                bindId: 'pause',
                properties: {
                    rclass: 'OptionButton',
                    color: $.white,
                    text: '\ue018'
                },
            }, {
                type: 'Ti.UI.Label',
                bindId: 'delete',
                properties: {
                    rclass: 'OptionButton',
                    color: $.white,
                    text: icons.delete
                },
            }]
        },
        colTileSource: {
            properties: {
                rclass: 'TSSelectRow'
            },
            childTemplates: [{
                type: __ANDROID__ ? 'Ti.UI.Android.CardView' : 'Ti.UI.View',
                properties: {
                    rclass: 'TSSelectRowHolder'
                },
                childTemplates: [{
                    bindId: 'imageView',
                    type: 'Ti.UI.ImageView',
                    properties: {
                        rclass: 'TSSelectRowImageView'
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        bindId: 'delete',
                        properties: {
                            rclass: 'EditPhotoRemoveBtn',
                            visible: false
                        }
                    }]
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'title',
                    properties: {
                        rclass: 'TSSelectRowTitle'
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'subtitle',
                    properties: {
                        rclass: 'TSSelectRowSubtitle'
                    }
                }, {
                    type: 'Ti.UI.Label',
                    bindId: 'attribution',
                    properties: {
                        rclass: 'TSSelectRowAttribution'

                    }
                }]
            }]
        },
        elevationProfile: {
            properties: {
                rclass: 'ElevationProfileRow'
            },
            childTemplates: [{
                bindId: 'chartDesc',
                type: 'Ti.UI.Label',
                properties: {
                    rclass: 'ElevationProfileRowLabel'
                }
            }, {
                // type: 'AkylasCharts.LineChart',
                bindId: 'chart',
                type: 'Akylas.Charts2.LineChart',
                properties: {
                    rclass: 'ElevationProfileRowLineChart',
                    clipChildren: false
                },
                childTemplates: [{
                    //     type: 'AkylasCharts.PlotLine',
                    //     bindId: 'line',
                    //     properties: {
                    //         rclass: 'ElevationProfileRowPlotLine'
                    //     }
                    // }, {
                    type: 'Ti.UI.Label',
                    bindId: 'userLocation',
                    properties: {
                        touchEnabled: false,
                        visible: false,
                        width: 20,
                        height: 20,
                        color: $.cTheme.main,
                        shadowColor: $.white,
                        font: {
                            family: $.iconicfontfamily,
                            size: 18
                        },
                        text: $.sGps,
                    }
                }, {
                    type: 'Ti.UI.View',
                    bindId: 'popup',
                    properties: {
                        visible: false,
                        touchEnabled: false,
                        height: 22,
                        width: 'SIZE'
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        bindId: 'popupLabel',
                        properties: {
                            backgroundColor: '#00000088',
                            borderRadius: 2,
                            // padding: 3,
                            padding: {
                                left: 3,
                                right: 3
                            },
                            // width: 20,
                            // height: 20,
                            color: $.white,
                            font: {
                                size: 11
                            },
                            height: __APPLE__ ? 17 : 18,
                            bottom: 6
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'arrow',
                        properties: {
                            // backgroundColor:'red',
                            color: '#00000088',
                            font: {
                                family: $.iconicfontfamily,
                                size: 10
                            },
                            bottom: 0,
                            transform: 'r180',
                            width: 10,
                            height: 5,
                            verticalAlign: 'top',
                            // wordWrap:false,
                            // maxLines:1,
                            text: String.fromCharCode(0xe810),
                        }
                    }]
                }],
                events: {
                    click: onChartTouch,
                    touchstart: onChartTouch,
                    touchmove: onChartTouch,
                }
            }]
        },
        // elevationProfileHTML: {
        //     properties: {
        //         rclass: 'ElevationProfileRow',
        //     },
        //     childTemplates:[{
        //         bindId: 'chartDesc',
        //         type: 'Ti.UI.Label',
        //         properties: {
        //             rclass: 'ElevationProfileRowLabel'
        //         }
        //     }, {
        //         bindId:'chart',
        //         type:'Ti.UI.WebView',
        //         properties:{
        //             rclass:'ElevationProfileRowLineChart',
        //             url:'data/highcharts/index.html'
        //         }
        //     }]
        // },
        weather: {
            properties: {
                rclass: 'ListItemRow',
                layout: 'absolute',
                preventListViewSelection: true,
                height: 60,
            },
            childTemplates: [{
                type: 'Ti.UI.CollectionView',
                bindId: 'collectionview',
                properties: {
                    exclusiveTouch: true,
                    scrollsToTop: false,
                    clipChildren: false,
                    scrollDirection: 'horizontal',
                    stickyHeaders: true,
                    width: 'FILL',
                    columnWidth: 59,
                    rowHeight: 60,
                    defaultItemTemplate: 'default',
                    templates: {
                        default: ak.ti.style({
                            properties: {

                            },
                            childTemplates: [{
                                type: 'Ti.UI.Label',
                                bindId: 'hour',
                                properties: {
                                    top: 4,
                                    height: 'FILL',
                                    width: 'FILL',
                                    verticalAlign: 'top',
                                    color: 'darkgray',
                                    textAlign: 'center',
                                    font: {
                                        size: 12
                                    }
                                }
                            }, {
                                type: 'Ti.UI.Label',
                                bindId: 'temp',
                                properties: {
                                    bottom: 2,
                                    height: 'FILL',
                                    width: 'FILL',
                                    verticalAlign: 'bottom',
                                    color: 'darkgray',
                                    textAlign: 'center',
                                    font: {
                                        size: 12
                                    }
                                }
                            }, {
                                type: 'Ti.UI.ImageView',
                                bindId: 'icon',
                                properties: {
                                    scaleType: Ti.UI.SCALE_TYPE_ASPECT_FIT,
                                    transition: {
                                        style: Ti.UI.TransitionStyle.FADE,
                                        duration: 200
                                    },
                                    width: 35,
                                    height: 35,
                                }
                            }]
                        }),
                        header: ak.ti.style({
                            properties: {
                                width: 1,
                                height: 'FILL',
                                clipChildren: false
                            },
                            childTemplates: [{
                                type: 'Ti.UI.View',
                                properties: {
                                    left: 0,
                                    clipChildren: false,
                                    top: 4,
                                    height: 14,
                                    layout: 'horizontal',
                                    width: 30,
                                },
                                childTemplates: [{
                                    bindId: 'label',
                                    type: 'Ti.UI.Label',
                                    properties: {
                                        backgroundColor: '#00000088',
                                        borderRadius: 4,
                                        color: $.white,
                                        font: {
                                            size: 11
                                        },
                                        padding: {
                                            left: 3,
                                            right: 3
                                        },
                                        left: -2,
                                        width: 'SIZE',
                                        height: 'FILL',
                                    }

                                }]
                            }]

                        })
                    }
                },
                // childTemplates: _.times(20, function(index) {
                //     return {
                //         type: 'Ti.UI.Label',
                //         bindId: 'hour' + index,
                //         properties: {
                //             height: 'FILL',
                //             width: 50,
                //             verticalAlign: 'top',
                //             color: '#CECECE',
                //             textAlign: 'center',
                //             font: {
                //                 size: 12
                //             },
                //             visible: false
                //         },
                //         childTemplates: [{
                //             type: 'Ti.UI.Label',
                //             bindId: 'temp' + index,
                //             properties: {
                //                 height: 'FILL',
                //                 width: 'FILL',
                //                 verticalAlign: 'bottom',
                //                 color: '#CECECE',
                //                 textAlign: 'center',
                //                 font: {
                //                     size: 12
                //                 }
                //             }
                //         }, {
                //             type: 'Ti.UI.ImageView',
                //             bindId: 'icon' + index,
                //             properties: {
                //                 scaleType: Ti.UI.SCALE_TYPE_ASPECT_FIT,
                //                 width: 35,
                //                 height: 35,
                //             }
                //         }]
                //     };
                // })
            }]
        },
        iteminfo: {
            properties: {
                rclass: 'ItemInfoRow'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'ItemInfoRowIcon'
                },
                // childTemplates: [{
                //     type: 'Ti.UI.Label',
                //     bindId: 'opened',
                //     properties: {
                //         rclass: 'ItemInfoRowExtraIcon',
                //         right:null,
                //         verticalAlign:'bottom',
                //         padding:{bottom:3},
                //         text: app.icons.hours,
                //         visible: false
                //     }
                // }]
            }, {
                type: 'Ti.UI.View',
                bindId: 'labelHolder',
                properties: {
                    rclass: 'ItemInfoRowLabelHolder',
                    // backgroundColor:'green'
                },
                childTemplates: [{
                    type: 'Ti.UI.View',
                    bindId: 'titleHolder',
                    properties: {
                        layout: 'horizontal',
                        left: 30,
                        right: 20,
                        weight: 2,
                        top: 6,
                        height: 'FILL',
                        // backgroundColor:'blue'
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        bindId: 'title',
                        properties: {
                            rclass: 'ItemInfoRowTitle',
                            // backgroundColor:'brown'
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'opendetails',
                        properties: {
                            rclass: 'ItemInfoRowOpenDetails',
                            visible: false
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'opened',
                        properties: {
                            rclass: 'ItemInfoRowOpenIcon',
                            visible: false
                        }
                    }]
                }, {
                    type: 'Ti.UI.View',
                    bindId: 'extraHolder',
                    properties: {
                        rclass: 'ItemInfoRowExtraHolder',
                        visible: false,
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        bindId: 'orientation',
                        properties: {
                            rclass: 'ItemInfoRowExtraIcon',
                            text: $.sNav,
                            visible: false
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'distance',
                        properties: {
                            rclass: 'ItemInfoRowExtraLabel',
                            width: 70,
                            visible: false
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'altitudeIcon',
                        properties: {
                            rclass: 'ItemInfoRowExtraIcon',
                            text: app.icons.peak,
                            visible: false
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'altitude',
                        properties: {
                            rclass: 'ItemInfoRowExtraLabel',
                            visible: false
                        }
                    }]

                }, {
                    type: 'Ti.UI.View',
                    bindId: 'subtitleHolder',
                    properties: {
                        layout: 'horizontal',
                        left: 7,
                        bottom: 4,
                        height: 17,
                    },
                    childTemplates: [{
                        type: 'Ti.UI.Label',
                        bindId: 'subtitle',
                        properties: {
                            rclass: 'ItemInfoRowSubtitle'
                        }
                    }, {
                        type: 'Ti.UI.Label',
                        bindId: 'description',
                        properties: {
                            rclass: 'ItemInfoRowDescription',
                            visible: false
                        }
                    }]
                }]
                // }, {
                //     type: 'Ti.UI.ImageView',
                //     bindId: 'image',
                //     properties: {
                //         rclass: 'ItemInfoRowImage',
                //         visible: false
                //     }
            }, {
                type: 'Ti.UI.Button',
                bindId: 'accessory',
                properties: {
                    rclass: 'ItemInfoRowAccessory'
                }
            }]
        },
        // admob: {
        //     properties: {
        //         height: 'SIZE',
        //         canEdit: false,
        //         canMove: false,
        //     },
        //     childTemplates: [{
        //         type: 'AkylasAdmob.View',
        //         bindId: 'admob',
        //         properties: {
        //             rclass: 'AdmobViewRow'
        //         },
        //         // events: {
        //         //     load: function(e) {
        //         //         if (e.item.loaded !== true) {
        //         //             e.section.updateItemAt(e.itemIndex, {
        //         //                 loaded: true,
        //         //                 properties: {
        //         //                     height: 50,
        //         //                 }
        //         //             }, {
        //         //                 animated: true
        //         //             });
        //         //         }

        //         //     }
        //         // }
        //     }]
        // },
        settings: {
            properties: {
                rclass: 'SettingsRow'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'SettingsRowIcon',
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'SettingsRowLabel'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'subtitle',
                properties: {
                    rclass: 'SettingsRowSublabel'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'accessory',
                properties: {
                    rclass: 'SettingsRowAccessory'
                }
            }]
        },
        settingsswitch: {
            properties: {
                rclass: 'SettingsRow'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'SettingsRowIcon',
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'SettingsRowLabel'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'subtitle',
                properties: {
                    rclass: 'SettingsRowSublabel'
                }
            }, {
                type: 'Ti.UI.Switch',
                bindId: 'switch',
                properties: {
                    rclass: 'SettingsRowSwitch'
                }
            }]
        },
        settingsbutton: {
            properties: {
                rclass: 'SettingsRow'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'SettingsRowIcon',
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'SettingsRowLabel',
                    color: $.cTheme.main
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'subtitle',
                properties: {
                    rclass: 'SettingsRowSublabel'
                }
            }]
        },
        moduleheader: {
            properties: {
                rclass: 'ModuleHeader'
            },
            childTemplates: [{
                type: 'Ti.UI.Label',
                bindId: 'icon',
                properties: {
                    rclass: 'ModuleHeaderIcon',
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'title',
                properties: {
                    rclass: 'ModuleHeaderLabel'
                }
            }, {
                type: 'Ti.UI.Label',
                bindId: 'subtitle',
                properties: {
                    rclass: 'ModuleHeaderSublabel'
                }
            }, {
                type: 'Ti.UI.Switch',
                bindId: 'switch',
                properties: {
                    rclass: 'ModuleHeaderSwitch'
                }
            }]
        },
    }, templates.addTemplate, templates);

    templates.iteminfosmall = templates.cloneTemplateAndFill('iteminfo', {
        properties: {
            height: 56
        },
        titleHolder: {
            top: 1
        },
        subtitleHolder: {
            bottom: 1
        },
        icon: {
            width: 30,
            top: 2,
        },
        extraHolder: {
            left: 25,
        },
        title: {
            font: {
                size: 15
            },
        },
    });
    templates.iteminfoextrasmall = templates.cloneTemplateAndFill('iteminfosmall', {
        properties: {
            height: 44
        },
        extraHolder: {
            height: 0,
            visible: false,
        },
        accessory: {
            visible: false
        }
    });
    templates.iteminfosmallanimated = templates.cloneTemplateAndFill('iteminfosmall', {
        icon: {
            transition: {
                style: Ti.UI.TransitionStyle.FADE,
                duration: 200
            }
        },
        title: {
            transition: {
                style: Ti.UI.TransitionStyle.FADE,
                duration: 200
            }
        },
        subtitle: {
            transition: {
                style: Ti.UI.TransitionStyle.FADE,
                duration: 200
            }
        }

    });
    templates.listitem = templates.cloneTemplateAndFill(
        'iteminfo', {
            properties: {
                rightSwipeButtons: [
                    createSwipeButton('delete', 'red'),
                ],
                leftSwipeButtons: [
                    createSwipeButton('locate', 'blue'),
                    createSwipeButton('move', 'green'),
                ]
            }
        });
    templates.gfoptionfileitem = templates.cloneTemplateAndFill(
        'gfoptionitem', {
            properties: {
                rightSwipeButtons: [
                    createSwipeButton('delete', 'red'),
                ],
                leftSwipeButtons: [
                    createSwipeButton('share', 'blue'),
                    //     createSwipeButton('move', 'green'),
                ]
            }
        });

    templates.createSwipeButton = createSwipeButton;
    return templates;
}

exports.load = function (_context) {
    return create(_context);
};