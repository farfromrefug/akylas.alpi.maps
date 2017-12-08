var fs = require('fs')
// var tilelive = require('tilelive')
// var Vector = require('tilelive-vector')
// var Http = require('tilelive-http')
var gl2xml = require('mapbox-gl-json-to-mapnik-xml')
var style = require('./outdoor')


// Vector.registerProtocols(tilelive)
// Http(tilelive)

gl2xml(style, function(err, xml) {
  if (err) return console.log(err)

  fs.writeFileSync('result.xml', xml)

//   var uri = {
//     protocol: 'vector:',
//     xml: xml,
//     scale: 1,
//     format: 'png'
//   }

//   tilelive.load(uri, function(err, source) {
//     if (err) return console.log(err)

//     source.getTile(0, 0, 0, function(err, data, headers) {
//       if (err) return console.log(err)

//       console.log(headers)
//       console.log(data.length)
//       fs.writeFileSync('0-0-0.png', data)
//     })
//   })
})