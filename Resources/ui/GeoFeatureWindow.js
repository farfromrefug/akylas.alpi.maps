ak.ti.constructors.createGeoFeatureWindow = function(_args) {
    var itemHandler = app.itemHandler,
        geolib = itemHandler.geolib,
        formatter = geolib.formatter,
        suncalc = app.utils.suncalc,
        htmlIcon = app.utilities.htmlIcon,
        htmlColor = app.utilities.htmlColor,
        mapHandler = _.remove(_args, 'mapHandler'),
        currentItem,
        itemDesc,
        isRoute,
        ohInfos,
        colors,
        iconicColor,
        hasPhotos,
        hasExtraInfo,
        staticAnnot,
        sectionHeaderViewAtTop = false,
        staticRoute,
        templates = Object.assign({
            default: app.templates.row.cloneTemplateAndFill('gfoptionitem', {
                accessory: {
                    visible: false,
                    text: $.sQuery
                }
            }),
            geoinfo: app.templates.row.itemgeoinfo,
            text: app.templates.row.gfoptionttextitem,
            hours: app.templates.row.gfoptionthoursitem,
            // admob: app.templates.row.admob
        }, mapHandler.runReduceMethodOnModules('getSupplyTemplates')),
        contentTemplates,
        actionBar = new ItemActionBar({
            onMap: false
        }),
        lastPosition = app.locationManager.getLastPosition();

    function runAction(_action, _callback, _params) {
        itemHandler.handleItemAction(_action, currentItem, itemDesc, _callback, self, mapHandler, _params);
    }
    _args.bottomToolbar = actionBar;
    _args.bottomToolbarVisible = true;
    _args.rightNavButtons = [{
        icon: $.sEdit,
        callback: _.partial(runAction, 'edit')
    }];

    var mapView = new MapView({
            height: 'FILL',
            canSelectRoute: true,
            animateChanges: false,
            regionFits: true,
            touchEnabled: false,
            buildings: false,
            mapType: app.modules.map.MapType.satellite
        }),
        sectionHeaderView = new View({
            properties: {
                height: 'SIZE',
                minHeight: $.navBarHeight + $.navBarTop + 30
            },
            childTemplates: [app.templates.view.cloneTemplateAndFill('gfheader')]
        }),
        headerView = new View({
            properties: {
                height: $.gfHeaderHeight,
                top: 0,
            },
            childTemplates: [{
                type: 'Ti.UI.ScrollableView',
                bindId: 'scrollableView',
                properties: {
                    rclass: 'GFHeaderScrollableView',
                    bubbleParent: false
                },
                events: {
                    click: app.debounce(function(e) {
                        sdebug(e.source);
                        if (e.source.imageIndex >= 0) {
                            app.showImageFullscreen(currentItem.photos, e.source.imageIndex, e.source);
                        }
                    })
                }
            }, {
                type: 'Ti.UI.View',
                properties: {
                    touchEnabled: false,
                    backgroundGradient: {
                        type: 'linear',
                        colors: ['#000000aa', '#00000066', '#00000000'],
                        startPoint: [0, 0],
                        endPoint: [0, "50%"]
                    }
                }
            }]
        }),
        self = new AppWindow(_args);

    actionBar.onInit(self, mapHandler);

    function createItem(_args) {
        var result = {
            callbackId: _args.callbackId,
            icon: {
                color: iconicColor,
                text: _args.icon
            },
            title: {
                // text: _args.text,
                html: _args.html || _args.text,
                padding: _args.padding,
                touchPassThrough: !!!_args.selectable,
                color: !!_args.isLink ? $.cLink : undefined
            },
            accessory: {
                color: iconicColor,
                visible: !!_args.accessory
            },
            data: _args.data
        };
        return result;
    }

    function createTextItem(_args) {
        var text = _args.text;
        var html = _args.html;
        var maxLines = _args.maxLines;
        var result = {
            callbackId: _args.callbackId,
            properties: {
                height: 44
            },
            template: !!_args.isHours ? 'hours' : 'text',
            icon: {
                color: iconicColor,
                text: _args.icon
            },
            title: {
                text: text,
                html: html,
                maxLines: maxLines
            },
            accessory: {
                visible: _args.hasOwnProperty('accessory') ? _args.accessory : (maxLines > 0 && ((text || html)
                    .length >
                    maxLines * 40))
            },
            data: _args.data
        };
        if (!!_args.isHours) {
            result.title2 = {
                visible: true
            }
        }
        return result;
    }

    function setDataFromItem() {
        sdebug('setDataFromItem', currentItem.id, itemDesc.id, currentItem);
        colors = currentItem.color ? app.getContrastColors(currentItem.color) : itemDesc.colors;
        var isDark = colors.luminance > 0.8;
        iconicColor = isDark ? colors.contrast : colors.color;
        hasPhotos = currentItem.photos && currentItem.photos.length > 0;
        var tags = currentItem.tags;
        hasExtraInfo = !!tags;
        var title = itemHandler.itemTitle(currentItem, itemDesc);
        var infoIcons = '';

        sectionHeaderView.applyProperties({
            gfheader: {
                backgroundColor: isDark ? colors.contrast : colors.color,
            },
            title: {
                text: title,
                color: isDark ? colors.color : colors.contrast
            },
            icon: {
                text: currentItem.icon || '',
                visible: !!currentItem.icon,
                color: colors.contrast
            },
            subtitle: {
                color: colors.darkestRel,
                html: htmlIcon(itemDesc.icon, 1) + ' ' + itemDesc.title,
            },
            info: {
                color: colors.darkestRel,
                html: itemHandler.itemIcons(currentItem, colors.darkerRel),
            }
        });
        actionBar.updateForItem(currentItem, itemDesc, true);
        // var offset = $.gfHeaderHeight - $.navBarTop - $.navBarHeight;
        contentTemplates = mapHandler.runReduceMethodOnModules('getDetailsTemplates');
        var geoItem = {
            template: 'geoinfo',
            latlon: {
                visible: !isRoute,
                text: isRoute ? '' : formatter.latLngString(currentItem, 2),
                format: 2
            },
            latlonicon: {
                color: iconicColor
            },
            altitudeicon: {
                color: iconicColor
            },
            routeicon: {
                color: iconicColor
            },
            sunriseicon: {
                color: iconicColor
            },
            sunseticon: {
                color: iconicColor
            },
            noonicon: {
                color: iconicColor
            },
        };
        var items = [geoItem].concat(mapHandler.runGetMethodOnModules('getItemSupplViews', currentItem, itemDesc));

        if (app.shouldShowAds()) {
            items.unshift({
                template: 'admob',
            });
        }
        if (currentItem.description) {
            items.push(createTextItem({
                callbackId: 'description',
                html: currentItem.description,
                maxLines: 2
            }));
        }

        var hasValue;
        if (isRoute) {
            geoItem.route = {
                visible: true,
                html: itemHandler.itemSubtitle(currentItem, itemDesc)
            };

            title = trc('query_profile');
            hasValue = !!currentItem.profile;
            if (!hasValue) {
                items.push(createItem({
                    text: title,
                    icon: $.sElevation,
                    callbackId: 'query_profile',
                    accessory: !hasValue
                }));
            }
        } else {
            hasValue = !!currentItem.altitude;
            if (!hasValue) {

                items.push(createItem({
                    text: trc('query_altitude'),
                    icon: $.sElevation,
                    callbackId: 'consolidate_alt',
                    accessory: true
                }));
            } else {
                title = formatter.altitude(currentItem.altitude);
                var myAltitude = lastPosition ? lastPosition.altitude : -1;
                if (myAltitude >= 0) {
                    if (myAltitude >= 0) {
                        title += ' (' + htmlIcon($.sVDist) + ' ' + formatter.altitude(altitude - myAltitude) + ')';
                    }
                }
                geoItem.altitude = {
                    visible: true,
                    text: title
                };
            }

            var sundata = suncalc.getTimes(new Date(), currentItem.latitude, currentItem.longitude);
            geoItem.sunrise = {
                visible: true,
                text: moment(sundata.sunrise).format('LT')
            };
            geoItem.noon = {
                visible: true,
                text: moment(sundata.solarNoon).format('LT')
            };
            geoItem.sunset = {
                visible: true,
                text: moment(sundata.sunset).format('LT')
            };

            ohInfos = itemHandler.itemOHInfos(currentItem);
            if (ohInfos) {

                var text = '<b>{1}</b>'.assign(trc(ohInfos.opened ? 'opened' : 'closed'));
                if (ohInfos.nextTime) {
                    text += ': ' + trc(ohInfos.opened ? 'close_at' : 'open_at') + ' ' + ohInfos.nextTime.format(
                        'LT');
                }
                items.push(createTextItem({
                    callbackId: 'hours',
                    html: text,
                    isHours: true,
                    accessory: true,
                    icon: app.icons.hours,
                    data: false,
                }));
            }

            title = trc('lookup_address');
            hasValue = !!currentItem.address;
            if (hasValue) {
                title = formatter.address(currentItem.address, true);
            }
            items.push(createItem({
                text: title,
                icon: $.sPlace,
                callbackId: hasValue ? 'address' : 'reverse_geo',
                selectable: hasValue,
                accessory: !hasValue
            }));
        }

        if (currentItem.notes) {
            _.each(currentItem.notes, function(note, index) {
                items.push(createTextItem({
                    callbackId: 'note',
                    html: '<b>{1}</b>'.assign(note.title),
                    data: {
                        noteIndex: index,
                        showingFull: false
                    },
                    accessory: true
                }));
            });
        }

        if (currentItem.tags) {
            if (tags.population) {
                items.push(createItem({
                    text: String.formatDecimal(parseInt(tags.population), app.localeInfo.currentLanguage,
                        '##0,000'),
                    icon: app.icons.people,
                }));
            }
            if (tags.wikipedia) {
                items.push(createItem({
                    text: trc('wikipedia'),
                    icon: app.icons.wikipedia,
                    callbackId: 'wikipedia',
                    isLink: true
                }));
            }
            if (tags.website) {
                items.push(createItem({
                    text: trc('website'),

                    icon: app.icons.website,
                    callbackId: 'url',
                    data: {
                        url: tags.website
                    },
                    // callbackId: 'website',
                    isLink: true
                }));
            }
            if (tags.facebook) {
                items.push(createItem({
                    text: 'Facebook',
                    icon: app.icons.facebook,
                    callbackId: 'url',
                    data: {
                        url: tags.facebook
                    },
                    // url: tags.facebook,
                    isLink: true
                }));
            }
            if (tags.phone) {
                items.push(createItem({
                    text: tags.phone,
                    icon: app.icons.phone,
                    callbackId: 'phone',
                    selectable: true,
                    isLink: true
                }));
            }
        }
        var sections = [{
            headerView: sectionHeaderView,
            items: items
        }];
        mapHandler.runMethodOnModules('prepareDetailsListView', currentItem, itemDesc, sections, createItem, colors, iconicColor);

        listView.applyProperties({
            templates: Object.assign(contentTemplates, templates),
            sections: sections
        });
        // listView.sections[0].items = items;
        headerView.applyProperties({
            scrollableView: {
                showPagingControl: !!hasPhotos,
                currentPage: hasPhotos ? 1 : 0,
                views: _.reduce(currentItem.photos, function(memo, photo) {
                    var ratio = photo.width / photo.height;
                    var banner = ratio > 2;
                    var densityFactor = app.deviceinfo.densityFactor;
                    var scale = Math.min(app.deviceinfo.width * densityFactor / photo.width,
                        $.gfHeaderHeight * densityFactor / photo.height);
                    memo.push({
                        type: 'Ti.UI.ImageView',
                        properties: {
                            scaleType: banner ? Ti.UI.SCALE_TYPE_ASPECT_FIT : Ti.UI.SCALE_TYPE_ASPECT_FILL,
                            transition: {
                                style: Ti.UI.TransitionStyle.FADE
                            },
                            filterOptions: {
                                colorArt: banner,
                                // scale:scale
                            },
                            localLoadSync: false,
                            onlyTransitionIfRemote: false,
                            width: 'FILL',
                            height: 'FILL',
                            imageIndex: memo.length - 1,
                            image: app.getThumbnailImagePath(photo)
                        },
                        events: banner ? {
                            load: function(e) {
                                if (e.colorArt) {
                                    e.source.backgroundColor = e.colorArt.backgroundColor;
                                }
                            }
                        } : undefined,
                        childTemplates: photo.attribution ? [{
                            type: 'Ti.UI.Label',
                            properties: {
                                color: $.white,
                                width: 'FILL',
                                height: 30,
                                bottom: 0,
                                padding: {
                                    left: 10
                                },
                                font: {
                                    size: 10
                                },
                                verticalAlign: 'top',
                                backgroundColor: '#000000aa',
                                html: app.utilities.photoAttribution(photo)
                            }
                        }, {
                            type: 'Ti.UI.ImageView',
                            properties: {
                                width: 'SIZE',
                                height: 10,
                                bottom: 18,
                                right: 10,
                                image: photo.attribution ? (photo.attribution.logo) : undefined
                            }
                        }] : undefined

                    });
                    return memo;
                }, [mapView])
            }
        });
        var params;
        var mapArgs = {
            animated: false
        };
        if (isRoute) {
            if (!staticRoute) {
                staticRoute = new MapRoute();
            }
            mapArgs.routes = [staticRoute];
            mapArgs.annotations = [];
            // mapArgs.padding = {
            //     top: 20,
            //     bottom: 10,
            // };
            params = itemHandler.routeParamsFromItem(currentItem, itemDesc);
            staticRoute.applyProperties(params, true);
            mapView.applyProperties(mapArgs);
            itemHandler.setMapRegion(mapView, staticRoute.region, 0.05, true);
            mapView.selectAnnotation(staticRoute);
        } else {
            mapArgs.zoom = 17;
            if (!staticAnnot) {
                staticAnnot = new MapAnnotation({
                    appearAnimation: false,
                    animateChanges: false
                });
            }
            mapArgs.annotations = [staticAnnot];
            mapArgs.routes = [];
            mapArgs.region = null;
            // mapArgs.padding = {
            // top: 50
            // };
            params = itemHandler.annotationParamsFromItem(currentItem, itemDesc);
            mapArgs.centerCoordinate = [currentItem.latitude, currentItem.longitude];
            staticAnnot.applyProperties(params, true);
            mapView.applyProperties(mapArgs);
        }
        self.setColors('transparent', false, iconicColor);
    }

    function scrollToItem(itemIndex) {
        setTimeout(function() {
            listView.scrollToItem(0, itemIndex, {
                position: 1
            });
        }, 20);
    }

    var listView = new ListView({
        rclass: 'GeoFeatureListView',
        headerView: {
            type: 'Ti.UI.View',
            properties: {
                height: $.gfHeaderHeight - $.navBarTop,
                touchEnabled: false
            },
        },
        defaultItemTemplate: 'default',
        events: {
            scroll: {
                variables: {
                    offset: 'contentOffset.y'
                },
                expressions: {
                    b: 'min(max(_offset' + '/' + ($.gfHeaderHeight - $.navBarTop) + ', 0), 1)',
                    // c: 'min(_offset, 0) / 60',
                    d: '1-(min(_offset, 0) / 60)',
                },
                targets: [{
                    target: headerView,
                    properties: {
                        transform: 'os_d'
                    }

                }, {
                    target: sectionHeaderView.titleHolder,
                    properties: {
                        left: '_b*20',
                        right: '_b*40',
                        top: '_b*' + $.navBarTop
                    }
                }, {
                    target: sectionHeaderView.gfheader,
                    properties: {
                        top: '(1-_b)*' + $.navBarTop
                    }
                }]

            },
            longpress: function(e) {
                var callbackId = e.item && e.item.callbackId || e.bindId;
                if (!callbackId) {
                    return;
                }
                var item = e.item;
                var options = ['copy', 'share'];
                var data;
                sdebug('longpress', callbackId, item);
                switch (callbackId) {
                    case 'latlon':
                        options.shift();
                        if (currentItem.hasOwnProperty('altitude')) {
                            options.unshift('copy_altitude');
                        }
                        options.unshift('copy_position');
                        data = formatter.latLngString(currentItem, item.latlon.format);
                        break;
                        // case 'website':
                    case 'url':
                        data = item.data.url;
                        break;
                    case 'address':
                        data = formatter.address(currentItem.address, true);
                        break;
                    case 'note':
                        if (e.phoneNumber) {
                            data = e.phoneNumber;
                        } else if (e.link) {
                            data = e.link.replace('mailto:', '');
                        } else {
                            var noteIndex = item.data.noteIndex;
                            var note = currentItem.notes[noteIndex];
                            data = note.text;
                        }
                        break;
                }
                if (data) {
                    sdebug('longpress data', data);
                    new OptionDialog({
                        options: _.map(options, function(value,
                            index) {
                            return trc(value);
                        }),
                        buttonNames: [trc('cancel')],
                        cancel: 0,
                        tapOutDismiss: true
                    }).on('click', (function(e) {
                        if (!e.cancel) {
                            var option = options[e.index];
                            switch (option) {
                                case 'copy':
                                case 'copy_position':
                                case 'copy_altitude':
                                    if (option === 'copy_altitude') {
                                        data = formatter.altitude(currentItem.altitude);
                                    }
                                    Ti.UI.Clipboard.setText(data);
                                    app.showMessage(trc('sent_to_clipboard'), itemDesc.colors);
                                    break;
                                case 'share':
                                    app.share({
                                        text: data
                                    });
                                    break;
                            }
                        }
                    }).bind(this)).show();
                }
            },
            click: app.debounce(function(e) {
                var callbackId = e.item && e.item.callbackId || e.bindId;
                if (!callbackId) {
                    return;
                }
                var item = e.item;
                var isShowingFull, today;
                sdebug('click', callbackId, item);
                if (e.phoneNumber || e.link) {
                    if (e.phoneNumber) {
                        app.confirmAction({
                            buttonNames: [trc('cancel'), trc('call')],
                            message: e.phoneNumber,
                            title: null
                        }, function() {
                            Ti.Platform.openURL('tel:' + e.phoneNumber);
                        });
                    } else if (/http/.test(e.link)) {
                        itemHandler.showFloatingWebView(' ', e.link, currentItem,
                            itemDesc, self,
                            mapHandler);
                    } else if (!e.link[0] === '#') {
                        Ti.Platform.openURL(e.link);
                    }
                    // sdebug(e.phoneNumber || e.link);
                    return;
                }
                switch (callbackId) {
                    case 'url':
                        itemHandler.showFloatingWebView(' ', item.data.url, currentItem, itemDesc,
                            self,
                            mapHandler);
                        break;
                    case 'file':
                        if (e.bindId === 'delete') {
                            itemHandler.updateItem(currentItem, itemDesc, {
                                deletedFiles: [item.data.fileName]
                            }, mapHandler);
                            e.section.deleteItemsAt(e.itemIndex, 1, {
                                animated: true
                            });
                        } else {
                            var file = Ti.Filesystem.getFile(app.getFilePath(item.data.fileName));
                            if (__ANDROID__) {
                                try {

                                    if (Ti.Filesystem.isExternalStoragePresent()) {
                                        var filenameBase = new Date().getTime();
                                        tmpFile = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory,
                                            filenameBase + '.' + item.data.type);
                                        tmpFile.write(file);
                                        if (tmpFile.exists()) {
                                            var intent = Ti.Android.createIntent({
                                                action: Ti.Android.ACTION_VIEW,
                                                type: "application/" + item.data.type,
                                                data: tmpFile.nativePath
                                            });
                                            try {
                                                Ti.Android.currentActivity.startActivity(intent);
                                            } catch (e) {
                                                Ti.API.debug(e);
                                                alert('No apps PDF apps installed!');
                                            }
                                        } else {
                                            Ti.API.info('starting intent tmpFile exists: ' +
                                                tmpFile.exists());
                                            alert('error while reading pdf file');
                                        }
                                    }
                                    // Ti.Android.currentActivity.startActivity(Ti.Android.createIntent({
                                    //     action: Ti.Android.ACTION_VIEW,
                                    //     type: 'application/' + item.data.type,
                                    //     data: filePath
                                    // }));
                                } catch (e) {
                                    Ti.API.info('error trying to launch activity, e = ' + e);
                                    alert('No PDF apps installed!');
                                }
                            } else {
                                Ti.UI.iOS.createDocumentViewer({
                                    title: item.data.title,
                                    url: file.nativePath
                                }).show();
                            }

                        }

                        // if (e.bindId === 'accessory') {
                        //     runAction(callbackId, null, {
                        //         moreAction:true
                        //     });

                        // } else {
                        // self.manager.createAndOpenWindow('PDFWindow', {
                        //     mapHandler: mapHandler,
                        //     showBackButton: true,
                        //     file: item.data,
                        //     item: currentItem,
                        //     itemDesc: itemDesc,
                        //     itemHandler: itemHandler

                        // });
                        // }
                        break;
                    case 'hours':
                        {
                            today = moment().day();
                            isShowingFull = item.data;
                            var text = '',
                                text2 = '';
                            if (isShowingFull) {
                                text = '<b>{1}</b>'.assign(trc(ohInfos.opened ? 'opened' : 'closed'));
                                if (ohInfos.nextTime) {
                                    text += ': ' + trc(ohInfos.opened ? 'close_at' : 'open_at') +
                                        ' ' + ohInfos.nextTime.format('LT');
                                }
                            } else {
                                text += '<small>';
                                text2 += '<small>';
                                var data = app.utilities.ohWeekString(ohInfos.oh);
                                var length = data.length,
                                    isLast;
                                _.each(data, function(value, index) {
                                    isLast = index === length - 1;
                                    isToday = value[0].day() === today;
                                    if (isToday) {
                                        text += '<b>';
                                        text2 += '<b>';
                                    }
                                    text += _.startCase(value[0].format('ddd'));
                                    if (value.length > 1) {
                                        for (var i = 0; i < value.length; i += 2) {
                                            text2 += value[i].format('LT') + '-' +
                                                value[i + 1].format('LT') + ', ';
                                        }
                                        text2 = text2.slice(0, -2);
                                    } else {
                                        text2 += trc('closed');
                                    }
                                    if (isToday) {
                                        text += '</b>';
                                        text2 += '</b>';
                                    }
                                    if (!isLast) {
                                        text += '<br>';
                                        text2 += '<br>';
                                    }
                                });
                                text += '</small>';
                                text2 += '</small>';
                            }

                            e.section.updateItemAt(e.itemIndex, {
                                properties: {
                                    height: isShowingFull ? 44 : 'SIZE'
                                },
                                title: {
                                    html: text,
                                },
                                title2: {
                                    html: text2,
                                    visible: !isShowingFull
                                },
                                accessory: {
                                    text: isShowingFull ? $.sDown : $.sUp
                                },
                                data: !isShowingFull
                            }, {
                                animated: true
                            });
                            if (!isShowingFull) {
                                scrollToItem(e.itemIndex);
                            }
                            break;
                        }
                    case 'note':
                        {
                            var noteIndex = item.data.noteIndex;
                            var note = currentItem.notes[noteIndex];
                            isShowingFull = item.data.showingFull;
                            var title = '<b>{1}</b>'.assign(note.title);
                            if (!isShowingFull) {
                                title += '<br>' + note.text;
                            }
                            console.log('updating showing note', isShowingFull);
                            e.section.updateItemAt(e.itemIndex, {
                                properties: {
                                    height: isShowingFull ? 44 : 'SIZE'
                                },
                                title: {
                                    html: title
                                },
                                accessory: {
                                    text: isShowingFull ? $.sDown : $.sUp
                                },
                                data: {
                                    noteIndex: noteIndex,
                                    showingFull: !isShowingFull
                                }
                            }, {
                                animated: true,
                                // maintainPosition:true
                            });
                            if (!isShowingFull) {
                                scrollToItem(e.itemIndex);
                            }
                            break;
                        }
                    case 'description':
                        isShowingFull = item.data;
                        e.section.updateItemAt(e.itemIndex, {
                            properties: {
                                height: isShowingFull ? 44 : 'SIZE'
                            },
                            title: {
                                maxLines: isShowingFull ? 2 : 0,
                            },
                            accessory: {
                                text: isShowingFull ? $.sDown : $.sUp
                            },
                            data: !isShowingFull
                        }, {
                            animated: true
                        });
                        break;
                    case 'subtitle':
                        {
                            runAction('items_list');
                            break;
                        }
                    case 'latlon':
                        {
                            var newFormat = (item.latlon.format + 1) % 3;
                            e.section.updateItemAt(e.itemIndex, {
                                latlon: {
                                    text: formatter.latLngString(currentItem, newFormat),
                                    format: newFormat
                                }
                            });

                            break;
                        }
                    case 'noon':
                    case 'sunrise':
                    case 'sunset':
                        var showingTomorrow = !!item.showTomorrowSuncalc;
                        showingTomorrow = !showingTomorrow;
                        today = moment();
                        if (showingTomorrow) {
                            today.add('days', 1);
                        }
                        var sundata = suncalc.getTimes(today.toDate(), currentItem.latitude,
                            currentItem.longitude);

                        e.section.updateItemAt(e.itemIndex, {
                            showTomorrowSuncalc: showingTomorrow,
                            sunrise: {
                                text: moment(sundata.sunrise).format('LT'),
                                color: showingTomorrow ? $.cTheme.main : $.black
                            },
                            noon: {
                                text: moment(sundata.solarNoon).format('LT'),
                                color: showingTomorrow ? $.cTheme.main : $.black
                            },
                            sunset: {
                                text: moment(sundata.sunset).format('LT'),
                                color: showingTomorrow ? $.cTheme.main : $.black
                            }
                        });
                        break;
                    default:
                        {
                            runAction(callbackId);
                            break;
                        }
                }
            }),
        }
    });

    // listView.on('scroll', function(e) {
    //     sdebug('scroll', e.contentOffset.y);
    // });

    var limit = (__APPLE__ ? -$.navBarTop : 1);

    function onPostLayout(e) {
        var top = e.source.absoluteRect.y;
        // sdebug('postlayout', top, sectionHeaderViewAtTop);
        if (top <= limit && !sectionHeaderViewAtTop) {
            sectionHeaderViewAtTop = true;
            self.setColors(iconicColor, false);
        } else if (top > limit && sectionHeaderViewAtTop) {
            sectionHeaderViewAtTop = false;
            self.setColors('transparent', false, iconicColor);
        }
    }

    self.container.add(listView, 0);
    self.container.add(headerView, 0);
    self.container.navBar.backgroundOpacity = 0;

    function onChanged(e) {
        var item = e.item;
        if (item.id === currentItem.id) {
            currentItem = item;

            //if only removing file no need to update all listview
            if (_.xor(_.keys(e.changes), ['deletedFiles']).length == 0) {

            } else {
                setDataFromItem();
            }
        }
    }

    function onRemoved(e) {
        sdebug('onRemoved', e);
        var index = _.findIndex(e.items, function(item) {
            return item.id === currentItem.id;
        });
        if (index >= 0) {
            self.closeMe();
        }
    }

    function onMoved(e) {
        var index = _.findIndex(e.items, 'id', currentItem.id);
        if (index >= 0) {
            sdebug('onMapMarkerMoved', e);
            currentItem = e.items[index];
            itemDesc = e.desc;
            setDataFromItem();
        }
    }

    function onItemSupplyViewUpdate(e) {
        if (currentItem.id === e.item.id) {
            setDataFromItem();
        }
    }

    // self.showLoading();

    self.onOpen = app.composeFunc(self.onOpen, function() {
        sectionHeaderView.gfheader.on('postlayout', onPostLayout);
        sdebug('onOpen');
        app.on(__ITEMS__ + 'Changed', onChanged)
            .on(__ITEMS__ + 'Moved', onMoved)
            .on(__ITEMS__ + 'Removed', onRemoved)
            .on('ItemSupplyViewUpdate', onItemSupplyViewUpdate);
        if (currentItem) {
            setDataFromItem();
        }
        // self.hideLoading();
    });
    self.onClose = app.composeFunc(self.onClose, function() {
        sectionHeaderView.gfheader.off('postlayout', onPostLayout);
        sdebug('onClose');
        self.setColors('transparent', false, iconicColor);
        sectionHeaderViewAtTop = false;
        sectionHeaderView.applyProperties({
            gfheader: {
                top: $.navBarTop
            },
            titleHolder: {
                top: 0,
                left: 0
            }
        });
        headerView.applyProperties({
            scrollableView: {
                showPagingControl: false,
                currentPage: 0,
                views: []
            }
        });
        listView.applyProperties({
            sections: []
        });
        app.off(__ITEMS__ + 'Changed', onChanged)
            .off(__ITEMS__ + 'Moved', onMoved)
            .off(__ITEMS__ + 'Removed', onRemoved)
            .off('ItemSupplyViewUpdate', onItemSupplyViewUpdate);
        app.showInterstitialIfNecessary();
    });

    self.handleArgs = function(_args) {
       mapHandler = _.remove(_args, 'mapHandler', mapHandler);
        currentItem = _.remove(_args, 'item', currentItem);
        itemDesc = _.remove(_args, 'itemDesc', itemDesc);
        isRoute = currentItem && !!currentItem.route;
        // if (currentItem) {
        //     setDataFromItem();
        // }
    };
    self.handleArgs(_args);

    //END OF CLASS. NOW GC 
    self.GC = app.composeFunc(self.GC, function() {

        if (actionBar) {
            actionBar.GC();
            actionBar = null;
        }
        staticAnnot = null;
        staticRoute = null;
        mapView = null;
        listView = null;
        headerView = null;
        sectionHeaderView = null;
        self = null;
        mapHandler = null;
        itemHandler = null;
    });
    return self;
};