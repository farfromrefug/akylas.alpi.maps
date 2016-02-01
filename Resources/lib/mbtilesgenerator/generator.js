require('./promise-simple');
var Step = require('./step');
var EARTH_RADIUS = 6378.137;
// Number of requests for each step set.
var STEP_REQUEST_SIZE = 30;
var dataDir = Ti.Filesystem.applicationDataDirectory;
var mbtilesHoldingDir = Ti.Filesystem.getFile(dataDir, 'mbtiles');
if (!mbtilesHoldingDir.exists()) {
  mbtilesHoldingDir.createDirectory();
}
var DB_DIR = mbtilesHoldingDir.nativePath;
if (!_.endsWith(DB_DIR, '/')) {
  DB_DIR += '/';
}
/**
 * Get Tile x y from Latitude, Longitude and tile numbers
 * @param lat in degrees
 * @param lng in degrees
 * @param z
 * @returns {*[]}
 */
var latLngToTileXYForZoom = function(lat, lng, z) {
  var n = Math.pow(2, z);
  var x = n * ((lng + 180) / 360);
  var latRad = lat * 2 * Math.PI / 360;
  var y = n * (1 - (Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2;
  return [Math.floor(x), Math.floor(y)];
};

/**
 * Compute the area in square kilometers of a lat lng quad.
 * @param b the bounds {left:, bottom:, right:, top:}
 */
var boundsToArea = function(b) {
  var r2 = Math.pow(EARTH_RADIUS, 2);
  sdebug('Earth radius is ' + r2);
  // Area of lat bottom to the north-pole
  var alat1 = 2 * Math.PI * r2 * (1 - Math.sin(b.bottom * Math.PI / 180));
  // Area of lat top to the north-pole
  var alat2 = 2 * Math.PI * r2 * (1 - Math.sin(b.top * Math.PI / 180));
  // Area of lat portion strip
  var alat = alat1 - alat2;
  // Area of lat portion between left and right lngs.
  var a = alat * (Math.abs(b.left - b.right) / 360);
  return a;
};

/**
 * Validate bounds
 * @param b the bounds {left:, bottom:, right:, top:}
 */
var isValidBounds = function(b) {
  return b.left >= -180 && b.left <= 180 && b.right >= -180 && b.right <= 180 && b.bottom >= -85 && b.bottom <= 85 &&
    b.top >= -85 && b.top <= 85
};

// Classes
function Tile(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

var mbTilesStatusService = (function() {
  var self = new MicroEvent({
    mbtilesStatus: {},
    /**
     * Add new MBTiles to map
     * @param token
     */
    create: function(token) {
      this.mbtilesStatus[token] = {
        "status": "generating",
        "progress": 0
      };
    },
    remove: function(token) {
      delete this.mbtilesStatus[token];
    },

    /**
     * Update MBTiles status in map
     * @param token
     * @param status
     * @param progress
     */
    update: function(token, status, progress) {
      var value = {
        "status": status,
        "progress": progress
      };
      this.mbtilesStatus[token] = value;
      this.forwardUpdate(token, value);
    },
    /**
     * Broadcast update to master
     * @param token 
     * @param value
     */
    forwardUpdate: function(token, value) {
      // sdebug('Forwarding update to master :' + JSON.stringify(value));
      // process.send({
      //   "tag": "mbtiles-status-broadcast",
      //   "key": token,
      //   "value": value
      // });
    },
    receiveUpdate: function(data) {
      this.mbtilesStatus[data.key] = data.value;
    },
    get: function(token) {
      return this.mbtilesStatus[token];
    }

  });
  return self;
})();

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}
var initMBTilesRequest = function(layer) {
  // Create temporary sqlite DB file
  var token = guid();
  var file = DB_DIR + token + '.sqlite';
  Ti.Database.install(file, token);
  var db = Ti.Database.open(token);
  // var db = new sqlite3.Database(file);
  mbTilesStatusService.create(token);
  return {
    layer: layer,
    db: db,
    token: token,
    file: file
  };
};

/**
 * Returns the future token to retrieve MBTiles once ready.
 * @param bounds the MBTiles bounds
 * @returns a string value
 */
var requestMBTiles = function(layer, bounds) {
  var request = initMBTilesRequest(layer);
  processMBTiles(request, bounds);
  return request.token;
};

/**
 * Returns a promise whose resolution will return an mbtile with the requested bounds.
 * @param bounds
 * @returns {Promise} the MBTile
 */
var requestMBTilesSync = function(layer, bounds) {
  var request = initMBTilesRequest(layer)
  return processMBTiles(request, bounds);
};

/**
 * Returns a promise whose resolution will return an mbtile with the requested bounds.
 * @param bounds
 * @returns {Promise} the MBTile bounds
 */
var processMBTiles = function(request, bounds) {

  return new Promise(function(resolve, reject) {
    sdebug("Processing MBTiles for bounds:" + JSON.stringify(bounds));
    var layer = request.layer;
    // fs.readFile('conf/schema.sql', 'utf8', function(err, data) {
    //   if (err) {
    //     console.error('Error while loading schema: ' + err);
    //     throw err;
    //   }
    createTables(request.db,
        "CREATE TABLE tiles (zoom_level integer, tile_column integer, tile_row integer, tile_data blob);CREATE TABLE metadata (name text, value text);"
      )
      .then(function() {
        // required MetaData for mbtiles spec
        var metaData = {
          "name": layer.name,
          "type": "baselayer",
          "version": 1,
          "description": layer.attribution,
          "format": "png",
          "bounds": bounds.left + ',' + bounds.bottom + ',' + bounds.right + ',' + bounds.top
        };
        // Insert metadata into db
        return insertMetadata(request.db, metaData);
      })
      .then(function() {
        // Fetch then store tiles
        return fetchAndStoreTiles(request, bounds);
      })
      .then(function() {
        // All tiles have been stored. Close db.
        request.db.close();
        sdebug('MBTile computed successfully. File output is available in ' + request.file);
        // Persist tile state
        mbTilesStatusService.update(request.token, "done", 100);
        mbTilesStatusService.remove(request.token);
        // Open file, send binary data to client, and remove file.
        // Ti.Filesystem.getFile(DB_DIR + token + '.sqlite').read()
        // fs.readFile(request.file, function(err, data) {
        resolve(request.file.read());
        // });
        // });

      })
      // });
  });
};

/**
 * Create mbtiles tables
 * @param db the database
 * @param data the queries to execute
 * @returns {Promise}
 */
var createTables = function(db, data) {
  return new Promise(function(resolve, reject) {
    db.execute(data, function() {
      resolve();
    });
  });
};

/**
 * Insert metadata into mbtile
 * @param db the database
 * @param metaData the metadata object
 * @returns {Promise}
 */
var insertMetadata = function(db, metaData) {
  return new Promise(function(resolve, reject) {
    sdebug('Inserting Metadata');
    // db.serialize(function() {
    // var stmt = db.prepare('INSERT INTO metadata VALUES (?, ?)');
    for (var key in metaData) {
      db.execute('INSERT INTO metadata VALUES (?, ?)', key, metaData[key]);
      // stmt.run(key, metaData[key]);
    }
    // stmt.finalize();
    sdebug('Metadata inserted successfully.');
    // });
    resolve();
  });
};

/**
 * Insert a tile using an sqlite statement
 * @param stmt the statement
 * @param tile the tile metadata
 * @param data the tile blob
 * @param callback once it is done
 */
var insertTile = function(request, tile, data, callback) {
  // var insertTile = function(stmt, tile, data, callback) {
  sdebug('Inserting Tile');
  request.db.execute('INSERT INTO tiles VALUES (?, ?, ?, ?)', tile.z, tile.x, Math.pow(2, tile.z) - tile.y - 1, data);
  // stmt.run(tile.z, tile.x, Math.pow(2, tile.z) - tile.y - 1, data);
  callback();
};

/**
 * Process step by step fetch of tiles and parallel store into db
 * @param bounds the requested bounds
 * @param db the database
 * @returns {Promise} a promise resolved when finished.
 */
var fetchAndStoreTiles = function(request, bounds) {
  return new Promise(function(resolve, reject) {
    // List tiles
    var tiles = listTiles(request, bounds);
    sdebug(tiles.length + " tiles to process.");

    // Prepare steps
    var steps = [];
    var stepCount = Math.floor(1 + tiles.length / STEP_REQUEST_SIZE);
    for (var s = 0; s < stepCount; s++) {
      // var stmt = db.prepare('INSERT INTO tiles VALUES (?, ?, ?, ?)');
      // Use closures to split the tile fetch into sets, to prevent overflows (10000s of http requests at the same time).
      steps.push(fetchTilesFunction(request, tiles.slice(s * STEP_REQUEST_SIZE, Math.min((s + 1) *
        STEP_REQUEST_SIZE,
        // tiles.length)), stmt));
        tiles.length))));
      // steps.push(finalizeStepFunction(stmt, token, s, stepCount));
      steps.push(finalizeStepFunction(token, s, stepCount));
    }
    // Last step is resolution
    steps.push(function() {
      sdebug('Rendering done');
      resolve();
    });

    // Launch processing
    Step.apply(this, steps);

  });
};

/**
 * Make a list of the necessary tiles to compute and embed into the mbtile according to bounds.
 * @param bounds the requested bounds
 * @returns {Array} the array of tiles
 */
var listTiles = function(request, bounds) {
  sdebug('Listing tiles for bounds' + JSON.stringify(bounds));
  var tiles = [];
  var layer = request.layer;
  var minZoom = Math.max(1, layer.minZoom);
  var maxZoom = Math.min(22, layer.minZoom);
  for (var z = minZoom; z <= maxZoom; z++) {
    var coords1 = latLngToTileXYForZoom(bounds.top, bounds.left, z);
    var coords2 = latLngToTileXYForZoom(bounds.bottom, bounds.right, z);
    // Adjust to process at least one tile for each zoom (lower zoom levels)
    if (coords1[0] === coords2[0]) {
      coords2[0] += 1;
    }
    if (coords1[1] === coords2[1]) {
      coords2[1] += 1;
    }

    for (var x = Math.min(coords1[0], coords2[0]); x <= Math.max(coords1[0], coords2[0]); x++) {
      for (var y = Math.min(coords1[1], coords2[1]); y <= Math.max(coords1[1], coords2[1]); y++) {
        // var t = new Tile(x, y, z);
        tiles.push({
          x: x,
          y: y,
          z: z,
        });
      }
    }
  }
  return tiles;

};

/**
 * Closure for tile fetch
 * @param tiles the set of tiles to fetch
 * @param stmt the statement to run queries in
 * @returns {Function} the function
 */
var fetchTilesFunction = function(request, tiles) {
  return function() {
    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i];
      fetchTile(request, t, 0, function(data) {
        // Once fetch is done, store tile
        // insertTile(stmt, t, data, next);
        insertTile(request, t, data, next);
      });
    }
  };

};

/**
 * Closure for step finalization
 * @param stmt the statement to close
 * @param token the current token
 * @param s the current step
 * @param stepCount the total number of steps 
 * @returns {Function} the function
 */
// var finalizeStepFunction = function(stmt, token, s, stepCount) {
var finalizeStepFunction = function(token, s, stepCount) {
  return function() {
    mbTilesStatusService.update(token, "generating", Math.floor((s + 1) * 100 / (stepCount + 1)));
    // stmt.finalize();
    this();
  }
};

function getSubdomain(t, subdomains) {
  var index = (t.x + t.y) % subdomains.length;
  return subdomains.charAt(index);
}

function getTileUrl(request, t) {
  return request.layer.url.replace('{x}', t.x).replace('{y}', t.y).replace('{z}', t.z).replace('{s}', getSubdomain(t,request.layer.subdomains));
}
/**
 * Make an http request to get a particular tile from the tileserver. Will attempt 3 times if request fails.
 * @param t the requested tile
 * @param attempts the number of failed attempts (< 3)
 * @param callback the callback once tile is fetched
 */
var fetchTile = function(request, t, attempts, callback) {
  var url = getTileUrl(request, t, i);
  sdebug("Getting " + url);

  new HTTPClient({
    headers: (request.layer.userAgent && {
      'User-Agent': request.layer.userAgent
    }),
    url: url,
    onload: function(e) {
      if (e.data) {
        callback(e.data.toBase64());
        // } else if (attempts < 3) {
        // fetchTile(request, t, attempts++, callback);
      }
    },
    onerror: function(e) {
      if (attempts < 3) {
        fetchTile(request, t, attempts++, callback);
      }
    }
  });
};

/**
 * Retrieve MBTiles data for current token.
 * @param token
 */
var getMBTiles = function(token, callback) {
  var status = mbTilesStatusService.get(token);
  // Return if not finished
  if (!status || status.status === "generating") {
    callback();
    return;
  }

  return Ti.Filesystem.getFile(DB_DIR + token + '.sqlite').read();
};

/**
 * Remove all MBTiles which have no reference in the app or which have been downloaded already.
 */
var removeOldMBTiles = function() {
  var files = Ti.Filesystem.getFile(DB_DIR).getDirectoryListing();
  _.each(files, function(file) {
    var token = file;
    var status = mbTilesStatusService.get(token);
    if (!status || status.status === "downloaded") {
      Ti.Filesystem.getFile(DB_DIR + token + '.sqlite').deleteFile();
    }
  });
  sdebug('MBTiles Cleaning in progress.');
};