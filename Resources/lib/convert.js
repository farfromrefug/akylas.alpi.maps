var OSMIgnoredSubtypes = ['parking_entrance', 'tram_stop', 'platform', 'bus_stop', 'tram', 'track'];
var OSMIgnoredClasses = [];
var OSMReplaceKeys = {
    'contact:phone': 'phone',
    'via_ferrata_scale': 'difficulty'
};
var htmlIcon = app.utilities.htmlIcon;
var OSMClassProps = ['amenity', 'natural', 'leisure', 'shop', 'sport', 'place', 'highway', 'waterway',
    'historic', 'railway',
    'landuse', 'aeroway', 'boundary', 'office', 'tourism'
];
var osmIcons = _.mapValues({
    'administrative': 0xe639,
    'drinking_water': 0xe611,
    'wilderness_hut': 0xe29e,
    'alpine_hut': 0xe29e,
    'shelter': 0xe29e,
    'saddle': 0xe605,
    'tourism': 0xe69c,
    'art_center': 0xe625,
    'convention_center': 0xe62d,
    'glacier': 0xe61e,
    'railway': 0xe681,
}, function(value) {
    return String.fromCharCode(value);
});

function osmAddress(result) {
    // result.osm_display_name = result.display_name;
    var count = 0;
    var streetParams = ['street', 'road', 'footway', 'pedestrian', 'address26'];
    var params = ['townhall', 'house_number', streetParams, ['postcode', 'zip'],
        ['city', 'town', 'village'], 'state', 'country'
    ];
    result = {
        address: _.pick(result.address, _.flatten(params), 'country_code', 'state'),
        display_name: result.display_name
    };
    if (!result.hasOwnProperty('house_number')) {
        _.each(streetParams, function(param) {
            if (result.address[param]) {
                var match = result.address[param].match(/^([0-9]+)[,]?\s(.*)/);
                if (match) {
                    result.address.house_number = match[1];
                    result.address[param] = match[2];
                }
                return false;
            }
        });
    }

    result.display_name = _.reduce(params, function(memo, value, index) {
        if (count < 3 || index < 5) {
            var handleValue = function(_value) {
                if (_value) {
                    _value = _value.split(';')[0];
                    memo += _value;
                    if (!parseInt(_value)) {
                        memo += ', ';
                    } else {
                        memo += ' ';
                    }
                    count++;
                    return false;
                }
            };
            if (_.isArray(value)) {
                _.forEach(value, function(key) {
                    return handleValue(result.address[key]);
                });
            } else {
                handleValue(result.address[value]);
            }

        }
        return memo;
    }, '').slice(0, -2);
    return result;
};

function osmIcon(osmClass, osmSub, osmSubValue) {
    sdebug('osmIcon', osmClass, osmSub, osmSubValue);
    return osmIcons[osmSubValue] || app.icons[osmSubValue] || osmIcons[osmSub] || app.icons[osmSub] || osmIcons[osmClass] ||
        app.icons[osmClass];
}

function osmIsGeoFeature(osmClass, osmSub, osmSubValue) {
    return /natur/.test(osmClass) || /hut|shelter|guidepost|water/.test(osmSub);
}

function filterTag(tag, key, tags) {
    if (_.contains(OSMReplaceKeys, key)) {
        tags[tag] = tags[key];
        delete tags[key];
    }
    if (_.startsWith(key, 'addr:')) {
        delete tags[key];
    }

}

function prepareOSMObject(ele, _withIcon, _testForGeoFeature) {
    // sdebug('prepareOSMObject', ele, _withIcon, _testForGeoFeature);
    var tags = ele.tags;
    var id = isNaN(ele.id) ? ele.id : ele.id.toString();
    var result = {
        osm: {
            id: ele.id,
            type: ele.type,
        },
        id: id,
        tags: ele.tags,

    };
    _.each(OSMClassProps, function(key) {
        if (ele.tags[key]) {
            result.osm.class = key;
            result.osm.subtype = ele.tags[key];
            return false;
        }
    });
    //ignores 
    if (_.contains(OSMIgnoredSubtypes, result.osm.subtype)) {
        return;
    }
    if (ele.center) {
        result.latitude = ele.center.lat;
        result.longitude = ele.center.lon;
    } else if (ele.hasOwnProperty('lat')) {
        result.latitude = ele.lat;
        result.longitude = ele.lon;
    } else if (ele.type == 'relation' && ele.members) {
        var index = _.findIndex(ele.members, function(member) {
            return /centre/.test(member.role);
        });
        if (index != -1) {
            var realCenter = ele.members[index];
            result.latitude = realCenter.lat;
            result.longitude = realCenter.lon;
        } else if (ele.bounds) {
            var bounds = ele.bounds;
            result.latitude = (bounds.maxlat + bounds.minlat) / 2;
            result.longitude = (bounds.maxlon + bounds.minlon) / 2;
        }
    }

    if (ele.tags) {
        _.each(ele.tags, filterTag);
        if (ele.tags.ele) {
            result.altitude = parseFloat(ele.tags.ele);
        }
        result.title = ele.tags.name;
        if (ele.tags.note) {
            if (ele.tags.description) {
                result.description = ele.tags.description;
                result.notes = [{
                    title: 'note',
                    text: ele.tags.note
                }];
            } else {
                result.description = ele.tags.note;
            }
        } else if (ele.tags.description) {
            result.description = ele.tags.description;
        }
        var osmClass = result.osm.class;
        var osmSub = result.osm.subtype;
        if (_withIcon !== false) {
            result.icon = osmIcon(osmClass, osmSub, result.tags[osmSub]);
        }
        if (_testForGeoFeature !== false) {
            result.settings = {
                geofeature: osmIsGeoFeature(osmClass, osmSub)
            };
        }
    }
    return result;
}

function prepareOSMWay(way, nodes, geolib) {
    var points = [];
    if (_.size(nodes) > 0) {
        _.each(way.nodes,
            function(node) {
                // sdebug('handling', node);
                node = nodes[node +
                    ''][0];
                points.push([node.lat,
                    node.lon
                ]);
            });
    } else {
        _.each(way.geometry,
            function(node) {
                // sdebug('handling', node);
                // node = nodes[node +
                //     ''][0];
                points.push([node.lat,
                    node.lon
                ]);
            });
    }

    var region = geolib.getBounds(points);
    var result = {
        route: {
            distance: geolib.getPathLength(
                points),
            region: {
                ne: {
                    latitude: region.maxLat,
                    longitude: region.maxLng,
                },
                sw: {
                    latitude: region.minLat,
                    longitude: region.minLng,
                }
            },
            points: points
        },
        id: way.id,
        osm: {
            id: way.id,
            type: way.type,
        },
        tags: way.tags,
        start: points[0],
        startOnRoute: true,
        endOnRoute: true,
        end: _.last(points),
    };
    _.each(OSMReplaceKeys, function(value, key) {
        if (way.tags[key]) {
            way.tags[value] = way.tags[key];
            delete way.tags[key];
        }
    });
    if (way.tags) {
        result.title = way.tags.name;
        if (way.tags.note) {
            if (way.tags.description) {
                result.description = way.tags.description;
                result.notes = [{
                    title: 'note',
                    text: way.tags.note
                }];
            } else {
                result.description = way.tags.note;
            }
        } else {
            result.description = way.tags.description;
        }
        result.tags = _.mapValues(_.omit(way.tags, 'source'), function(value, key) {
            if (!_.startsWith(key, 'addr:')) {
                return value;
            }
        });
        var osmClass = result.osm.class;
        var osmSub = result.osm.subtype;
        result.icon = osmIcon(osmClass, osmSub, result.tags[osmSub]);
    }
    return result;
}

function prepareUtfGridResult(ele) {
    if (!ele.name) {
        return;
    }

    if (!ele.osm_id) {
        return {
            title: ele.name
        }
    }
    var id = isNaN(ele.osm_id) ? ele.osm_id : ele.osm_id.toString();
    var result = {
        title:ele.name,
        osm: {
            id: ele.osm_id,
            type: ele.hasOwnProperty('way_area') ? 'way' : 'node'
        },
        id: id,
        tags: ele.tags,

    };
    var osmClass;
    var osmSub;
    _.each(OSMClassProps, function(key) {
        if (ele.tags[key]) {
            osmClass = key;
            osmSub = ele.tags[key];
            return false;
        }
    });
    //ignores 
    if (osmSub && _.contains(OSMIgnoredSubtypes, osmSub)) {
        return;
    }
    if (osmClass && osmSub) {
        result.osm.class = osmClass;
        result.osm.subtype = osmSub;
        result.icon = osmIcon(osmClass, osmSub, ele.extratags && ele.extratags[osmSub]);
        result.settings = {
            geofeature: osmIsGeoFeature(osmClass, osmSub)
        };
    }

    return result;
}

function prepareNominatimResult(ele) {
    //ignores 
    if (_.contains(OSMIgnoredSubtypes, ele.type)) {
        return;
    }
    var title = ele.address[ele.type];
    var id = isNaN(ele.osm_id) ? ele.osm_id : ele.osm_id.toString();
    if (!title) {
        var first = Object.keys(ele.address)[0];
        title = ele.address[first];
    }
    var osmClass = ele.class;
    var osmSub = ele.type;
    var result = {
        // title: name,
        title: title,
        latitude: parseFloat(ele.lat),
        longitude: parseFloat(ele.lon),
        id: id,
        osm: {
            class: osmClass,
            subtype: osmSub,
            id: ele.osm_id,
            type: ele.osm_type
        },
        tags: ele.extratags,
        address: osmAddress(ele),
        icon: osmIcon(osmClass, osmSub, ele.extratags[osmSub]),
        settings: {
            geofeature: osmIsGeoFeature(osmClass, osmSub)
        }
    };
    if (result.tags) {
        _.each(OSMReplaceKeys, function(value, key) {
            if (result.tags[key]) {
                result.tags[value] = result.tags[key];
                delete result.tags[key];
            }
        });
    }
    // sdebug('prepareNominatimResult', ele, result);
    return result;
}

function preparePhotonObject(ele) {
    //ignores 
    var osmType = ele.properties.osm_type;
    switch (osmType) {
        case 'W':
            osmType = 'way';
            break;
        case 'R':
            osmType = 'relation';
            break;
        case 'A':
            osmType = 'area';
            break;
        case 'N':
            osmType = 'node';
            break;
    }
    var props = ele.properties;
    var osmClass = props.osm_key;
    var osmSub = props.osm_value;
    if (_.contains(OSMIgnoredClasses, osmClass) || _.contains(OSMIgnoredSubtypes, osmSub)) {
        return;
    }
    var pos = ele.geometry.coordinates;
    var result = {
        // title: name,
        title: props.name,
        latitude: parseFloat(pos[1]),
        longitude: parseFloat(pos[0]),
        id: props.osm_id + '',
        osm: {
            class: osmClass,
            subtype: osmSub,
            id: props.osm_id + '',
            type: osmType
        },
        address: osmAddress({
            address: props
        }),
        icon: osmIcon(osmClass, osmSub),
        settings: {
            geofeature: osmIsGeoFeature(osmClass, osmSub)
        }
    };
    return result;
}

// var OSMTagsDetailsWithoutKey = ['cuisine', 'sport'];
var OSMTagsWithoutKey = ['cuisine', 'sport'];
var OSMTagsWithKey = ['fee', 'capacity', 'maxheight'];
var OSMTagsIgnoreKey = ['building', 'shelter', 'website', 'facebook', 'phone', 'wikipedia', 'shop', 'information',
    'description', 'note'
];

function osmTagsFastDetails(_item) {
    var result = [];
    if (_item.tags) {
        // var possibles = ['fee', 'capacity', 'maxheight'];

        // _.each(OSMTagsWithKey, function(value) {
        //     if (_item.tags[value]) {
        //         result.push(trc(_item.tags[value]));
        //         result = (result ? (result + ', ') : '') + trc(key) + ': ' + trc(value);
        //     }
        // });
        // var possibleWithoutKey = ['cuisine', 'sport'];
        _.each(OSMTagsWithoutKey, function(value) {
            if (_item.tags[value]) {
                result.push(trc(_item.tags[value]));
            }
        });
    }
    return result;
}

function osmTagsDetails(_item) {
    var result = [];
    if (_item.tags) {

        _.each(_.omit(_item.tags, OSMTagsIgnoreKey, OSMTagsWithoutKey), function(value, key) {
            result.push(trc(key) + ': ' + trc(value));
        });
    }
    return result;
}

function parseBoolean(string) {
    if (_.isString(string)) {
        switch (string.toLowerCase().trim()) {
            case "true":
            case "yes":
            case "1":
                return true;
            case "false":
            case "no":
            case "0":
            case null:
                return false;
            default:
                return undefined;
        }
    }
    if (string === false || string === true) {
        return string;
    }
    return undefined;
}

function handleTagPropForIcon(value, key) {
    var showValue = false;
    if (key === 'sac_scale') {
        showValue = true;
        var level = 'T1';
        switch (value) {
            case 'mountain_hiking':
                level = 'T2';
                break;
            case 'demanding_mountain_hiking':
                level = 'T3';
                break;
            case 'alpine_hiking':
                level = 'T4';
                break;
            case 'demanding_alpine_hiking':
                level = 'T5';
                break;
            case 'difficult_alpine_hiking':
                level = 'T6';
                break;
            case 'hiking':
            default:
                break;
        }
        key = 'difficulty';
        value = level;
    }
    var icon = _.isString(key) && app.icons[key];
    if (icon) {
        // sdebug('handling icon ', key);
        var integerValue = parseFloat(value);
        if (!isNaN(integerValue)) {
            return htmlIcon(icon) + ':' + value;
        } else {
            var onOff = parseBoolean(value);
            if (onOff === undefined && _.isString(value)) {
                var onOffIcon = app.icons[value];
                if (onOffIcon) {
                    return htmlIcon(onOffIcon);
                } else if (showValue) {
                    return htmlIcon(icon) + ':' + value;
                }
            } else if (!!onOff) {
                return htmlIcon(icon);
            }
        }
    }
    return '';
}

function osmTagsIconsHTML(_item, _colorOff) {
    // sdebug('osmTagsIconsHTML', _item);
    var result = '';
    if (_item.tags) {
        _.each(_.omit(_item.tags, OSMTagsIgnoreKey, OSMTagsWithoutKey), function(value, key) {
            if (_.isArray(value)) {
                for (var i = 0; i < value.length; i++) {
                    result += handleTagPropForIcon(undefined, value[i]);
                }
            } else {
                result += handleTagPropForIcon(value, key);
            }

        });
    }
    return result;
}

exports.osmAddress = osmAddress;
exports.prepareOSMObject = prepareOSMObject;
exports.prepareOSMWay = prepareOSMWay;
exports.preparePhotonObject = preparePhotonObject;
exports.prepareNominatimResult = prepareNominatimResult;
exports.prepareUtfGridResult = prepareUtfGridResult;
exports.osmTagsDetails = osmTagsDetails;
exports.osmTagsIconsHTML = osmTagsIconsHTML;
exports.osmTagsFastDetails = osmTagsFastDetails;
exports.hashCode = function(str) {
    var hash = 5381,
        i = str.length;

    while (i) {
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
};