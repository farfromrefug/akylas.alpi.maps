var EARTH_RADIUS = 6378.137;

/**
 * Get Tile x y from Latitude, Longitude and tile numbers
 * @param lat in degrees
 * @param lng in degrees
 * @param z
 * @returns {*[]}
 */
export function latLngToTileXYForZoom(lat, lng, z) {
    var n = Math.pow(2, z);
    var x = n * ((lng + 180) / 360);
    var latRad = lat * 2 * Math.PI / 360;
    var y = n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
    return [Math.floor(x), Math.floor(y)];
};

// var calculateMapTile = function(lat, lng, int zoom) {
//     var tileWidth = proj->getBounds().getDelta().getX() / (1 << zoom);
//     var tileHeight = proj->getBounds().getDelta().getY() / (1 << zoom);
//     var mapVec = mapPos - proj->getBounds().getMin();
//     var x = static_cast<int>(std::floor(mapVec.getX() / tileWidth));
//     var y = static_cast<int>(std::floor(mapVec.getY() / tileHeight));
//     return [x, y, zoom];
// }
/**
 * Compute the area in square kilometers of a lat lng quad.
 * @param b the bounds {left:, bottom:, right:, top:}
 */
var boundsToArea = function(b) {
    var r2 = Math.pow(EARTH_RADIUS, 2);
    // console.debug('Earth radius is ' + r2);
    // Area of lat bottom to the north-pole
    var alat1 = 2 * Math.PI * r2 * (1 - Math.sin(b.sw.latitude * Math.PI / 180));
    // Area of lat top to the north-pole
    var alat2 = 2 * Math.PI * r2 * (1 - Math.sin(b.ne.latitude * Math.PI / 180));
    // Area of lat portion strip
    var alat = alat1 - alat2;
    // Area of lat portion between left and right lngs.
    var a = alat * (Math.abs(b.sw.longitude - b.ne.longitude) / 360);
    return a;
};

var countTiles = function(layer, bounds, minZoom, maxZoom) {
    var tileCount = 0,
        dx,
        dy;

    for (var z = minZoom; z <= maxZoom; z++) {
        var coords1 = latLngToTileXYForZoom(bounds.sw.latitude, bounds.sw.longitude, z);
        var coords2 = latLngToTileXYForZoom(bounds.ne.latitude, bounds.ne.longitude, z);
        dx = Math.abs(coords1[0] - coords2[0]) + 1;
        dy = Math.abs(coords1[1] - coords2[1]) + 1;
        tileCount += dx * dy;
        // Adjust to process at least one tile for each zoom (lower zoom levels)
        // if (coords1[0] === coords2[0]) {
        //     coords2[0] += 1;
        // }
        // if (coords1[1] === coords2[1]) {
        //     coords2[1] += 1;
        // }
        // tileCount += (Math.max(coords1[0], coords2[0]) - Math.min(coords1[0], coords2[0]) + 1) *
        //     (Math.max(coords1[1], coords2[1]) - Math.min(coords1[1], coords2[1]) + 1);
    }
    // console.debug('countTiles', bounds, minZoom, maxZoom, count);
    return tileCount;
};

export interface MBtilesInfo {
    count: number;
    minZoom: number;
    maxZoom: number;
    area: number;
    size?: number;
    bounds: Region;
}
export function computeInfoForMBTiles(layer, bounds, minZoom, maxZoom) {
    console.debug('computeInfoForMBTiles', bounds, minZoom, maxZoom);
    minZoom = Math.max(Math.max(1, layer.minZoom || 0), minZoom);
    maxZoom = Math.min(Math.min(22, layer.maxZoom || 22), maxZoom);
    var result: MBtilesInfo = {
        area: boundsToArea(bounds), //square kilometers
        count: countTiles(layer, bounds, minZoom, maxZoom),
        bounds: bounds,
        minZoom: minZoom,
        maxZoom: maxZoom
    };
    var width = layer.tileSize || 256;
    result.size = 20000 * result.count;
    return result;
}
