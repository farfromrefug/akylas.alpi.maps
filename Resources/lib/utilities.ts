export function queryString(params, location) {
    var obj = {},
        i,
        parts,
        len,
        key,
        value;

    if (typeof params === 'string') {
        value = location.match(new RegExp('[?&]' + params + '=?([^&]*)[&#$]?'));
        return value ? value[1] : undefined;
    }

    var locSplit = location.split(/[?&]/);
    //_params[0] is the url

    parts = [];
    for (i = 0, len = locSplit.length; i < len; i++) {
        var theParts = locSplit[i].split('=');
        if (!theParts[0]) {
            continue;
        }
        if (theParts[1]) {
            parts.push(theParts[0] + '=' + theParts[1]);
        } else {
            parts.push(theParts[0]);
        }
    }
    if (Array.isArray(params)) {
        let data;

        for (i = 0, len = params.length; i < len; i++) {
            data = params[i];
            if (typeof data === 'string') {
                parts.push(data);
            } else if (Array.isArray(data)) {
                parts.push(data[0] + '=' + data[1]);
            }
        }
    } else if (typeof params === 'object') {
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
        for (key in obj) {
            parts.push(key + (obj[key] === true ? '' : '=' + obj[key]));
        }
    }

    return parts.splice(0, 2).join('?') + (parts.length > 0 ? '&' + parts.join('&') : '');
}

export function htmlColor(_text, _color) {
    console.debug('htmlColor', _text, _color);
    if (_color) {
        return '<font color="' + _color + '">' + _text + '</font>';
    }
    return _text;
}

export function formatDuration(_time) {
    if (_time < 0) {
        return '';
    }
    return moment.duration(_time).format('m:ss', {
        trim: false
    });
}

export function htmlIcon(_icon, _size?, _color?) {
    var result = '<font face="' + $.iconicfontfamily + '"' + (_color ? ' color="' + _color + '"' : '') + '>' + _icon + '</font>';
    for (var i = 0; i < _size; i++) {
        result = '<big>' + result + '</big>';
    }
    return result;
}

export function ohWeekString(oh) {

    const r = oh.getTable();
    console.log('table', r);
    return r as {
        su:string[]
        mo:string[]
        tu:string[]
        we:string[]
        th:string[]
        fr:string[]
        sa:string[]
        ph:string[]
    };
    var it = oh.getIterator();
    var hasNextChange = it.advance();
    var dateToday = new Date();
    dateToday.setHours(0, 0, 0, 0);

    var date = new Date(dateToday);
    var row;
    date.setDate(date.getDate() - date.getDay()); // start at begin of the week

    var table = [];
    for (row = 0; row < 7; row++) {
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
        it.setDate(date);
        var unknown = it.getUnknown();
        var isOpen = it.getState();
        var stateString = it.getStateString(false);
        var prevdate = date;
        var curdate = date;
        var fullTime = 24 * 60 * 60 * 1000;

        table[row] = {
            date: new Date(date),
            hours: []
        };

        while (hasNextChange && it.advance()) {
            curdate = it.getDate();

            var hoursPrev = prevdate.getHours() * 60 + prevdate.getMinutes();
            // var hoursCur = (curdate.getHours() * 60 + curdate.getMinutes());
            // console.log(state_string, curdate.getDay(), prevdate.getDay(), date.getDay(), hoursPrev, hoursCur);

            if (curdate.getDay() !== date.getDay() && prevdate.getDay() !== date.getDay()) {
                break;
            }
            if ((hoursPrev > 0 && isOpen) || unknown) {
                table[row].hours.push([[prevdate.getHours(), prevdate.getMinutes()], [curdate.getHours(), curdate.getMinutes()]]);
            }
            prevdate = curdate;
            isOpen = it.getState();
            unknown = it.getUnknown();
            stateString = it.getStateString(false);
        }
        if (!hasNextChange && table[row].hours.length === 0) {
            // 24/7
            if (isOpen) table[row].hours.push([0, fullTime]);
        }
    }

    var output = [];
    var theMoment,
        moments = [],
        theRow,
        today,
        endweek;
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

            theRow.hours.forEach(function(values) {
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
}

export function photoAttribution(_photo) {
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
}
