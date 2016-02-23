exports.queryString = function(params, location) {
    var obj = {},
        i, parts, len, key, value;

    if (typeof params === 'string') {
        value = location.match(new RegExp('[?&]' + params + '=?([^&]*)[&#$]?'));
        return value ? value[1] : undefined;
    }

    var _params = location.split(/[?&]/);
    //_params[0] is the url

    for (i = 0, len = _params.length; i < len; i++) {
        parts = _params[i].split('=');
        if (!parts[0]) {
            continue;
        }
        obj[parts[0]] = parts[1] || true;
    }

    if (typeof params !== 'object') {
        return obj;
    }

    for (key in params) {
        value = params[key];
        if (typeof value === 'undefined') {
            delete obj[key];
        } else {
            if (typeof value === 'object') {
                obj[key] = JSON.stringify(value);
            } else {
                obj[key] = value;
            }
        }
    }
    parts = [];
    for (key in obj) {
        parts.push(key + (obj[key] === true ? '' : '=' + obj[key]));
    }

    return parts.splice(0, 2).join('?') + ((parts.length > 0) ? ('&' + parts.join('&')) : '');
};

exports.htmlColor = function(_text, _color) {
    sdebug('htmlColor', _text, _color);
    if (_color) {
        return '<font color="' + _color + '">' + _text + '</font>';
    }
    return _text;
};

exports.formatDuration = function(_time) {
    if (_time < 0) {
        return '';
    }
    return moment.duration(_time).format('m:ss', {
        trim: false
    });
};

exports.htmlIcon = function(_icon, _size, _color) {
    var result = '<font face="' + $iconicfontfamily + '"' + (_color ? ' color="' + _color + '"' : '') + '>' + _icon +
        '</font>';
    for (var i = 0; i < _size; i++) {
        result = '<big>' + result + '</big>';
    }
    return result;
};

exports.ohWeekString = function(oh) {
    var it = oh.getIterator();
    var has_next_change = it.advance();
    var date_today = new Date();
    date_today.setHours(0, 0, 0, 0);

    var date = new Date(date_today);
    var row;
    date.setDate(date.getDate() - date.getDay()); // start at begin of the week

    var table = [];
    for (row = 0; row < 7; row++) {
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
        it.setDate(date);
        var unknown = it.getUnknown();
        var is_open = it.getState();
        var state_string = it.getStateString(false);
        var prevdate = date;
        var curdate = date;
        var fullTime = 24 * 60 * 60 * 1000;

        table[row] = {
            date: new Date(date),
            hours: []
        };

        while (has_next_change && it.advance()) {

            curdate = it.getDate();

            var hoursPrev = (prevdate.getHours() * 60 + prevdate.getMinutes());
            // var hoursCur = (curdate.getHours() * 60 + curdate.getMinutes());
            // console.log(state_string, curdate.getDay(), prevdate.getDay(), date.getDay(), hoursPrev, hoursCur);

            if ((curdate.getDay() !== date.getDay() && prevdate.getDay() !== date.getDay())) {
                break;
            }
            if (hoursPrev > 0 && is_open || unknown) {
                table[row].hours.push([
                    [prevdate.getHours(), prevdate.getMinutes()],
                    [curdate.getHours(), curdate.getMinutes()]
                ]);
            }
            prevdate = curdate;
            is_open = it.getState();
            unknown = it.getUnknown();
            state_string = it.getStateString(false);

        }
        if (!has_next_change && table[row].hours.length === 0) { // 24/7
            if (is_open)
                table[row].hours.push([0, fullTime]);
        }
    }

    var output = [];
    var theMoment, moments = [],
        theRow, today, endweek;
    for (row in table) {
        theRow = table[row];
        // today = theRow.date.getDay() === date_today.getDay();
        // endweek = ((theRow.date.getDay() + 1) % 7) === date_today.getDay();
        // if (today) {
        //     output += '<b>';
        // }
        theMoment = moment(theRow.date);
        // output += theMoment.format('ddd') + ':   ';
        // output[0].push(theMoment);
        if (theRow.hours.length > 0) {
            moments = [];

            _.forEach(theRow.hours, function(values) {
                theMoment.hours(values[0][0]);
                theMoment.minutes(values[0][1]);
                moments.push(theMoment.clone());
                // output += theMoment.format('HH:mm') + ' - ';
                theMoment.hours(values[1][0]);
                theMoment.minutes(values[1][1]);
                moments.push(theMoment.clone());
                // output += theMoment.format('HH:mm') +
                // ', ';
            });
            // output = output.slice(0, -2);
            output.push(moments);
        } else {
            output.push([theMoment]);
            // output += trc('closed');
        }
        // if (today) {
        //     output += '</b>';
        // }
        // output += '<br>';
    }
    return output;
};

exports.photoAttribution = function(_photo) {
    var attribution;
    if (!!_photo.attribution) {
        attribution = '';
        var attr = _photo.attribution;
        if (attr.author) {
            attribution += attr.author;
            if (attr.author_link) {
                attribution = '<a href="' + attr.author_link + '">' + attribution + '</a>';
            }
        }
        if (attr.description) {
            attribution += '<br>' + attr.description;

        }
        if (attr.link) {
            attribution += '<br>' + '<a href="' + attr.link + '">' + attr.link + '</a>';

        }
    }
    return attribution;
};