// =====================================================================
// ROADS
// - #transportation: ::case and ::fill for roads, rail, bridges, tunnels
// - #transportation_name: transportation labels
// =====================================================================


// STYLING VARIABLES //

//urban areas
@urbanareas: lighten(@landmass_fill,1%);
@urbanareas_highzoom: lighten(@landmass_fill,1%);

//parks and green areas
@greenareas: darken(#222, 8%);

//buildings
@buildings: darken(@landmass_fill, 2%);
@buildings_outline_16: #141414;
@buildings_outline: #242424;

//aeroways
@aeroways: #111;

// BEGIN STYLING //

//urban areas
#landuse[class='residential'][zoom<=9] {
  polygon-fill: linear([view::zoom], (5, @urbanareas), (7, fadeout(@urbanareas,30%)), (8, fadeout(@urbanareas,50%)), (9, fadeout(@urbanareas,70%)));
/*
  [zoom>=5]{polygon-fill:@urbanareas;}
  [zoom>=7]{polygon-fill: fadeout(@urbanareas,30%);}
  [zoom>=8]{polygon-fill: fadeout(@urbanareas,50%);}
  [zoom=9]{polygon-fill: fadeout(@urbanareas,70%);}
*/
}

//green areas and parks

#landcover[class='wood'][zoom>=9],
#park[class='nature_reserve'][zoom>=9],
#park[class='national_park'][zoom>=9],
#landcover[class='grass'][zoom>=10],
#landcover[subclass='recreation_ground'][zoom>=10],
#landuse[class='cemetery'],
#landuse[class='stadium']{
  [zoom>=9]{polygon-fill: fadeout(@greenareas,50%); }
  [zoom<9] { 
    polygon-pattern-file: url(darkmatter/images/park-halftone-1.png);
    polygon-pattern-opacity: 0.1;
//    polygon-pattern-alignment: global;
  }
/*
  [zoom>=9][zoom<=10]{polygon-fill: @greenareas_low;}
  [zoom>=11]{polygon-fill: @greenareas_medium;}
  [zoom>=15]{polygon-fill: @greenareas_high;}
*/
//  polygon-pattern-file: url(darkmatter/images/park-halftone-1.png);
//  polygon-pattern-opacity: 0;
//  polygon-pattern-alignment: global;

}

//buildings
#building ['mapnik::geometry_type'=3]['nuti::buildings'>0] {
   ::3d['nuti::buildings'>1][zoom>=15] {
     building-height: [render_height] ? [render_height] : 10;
     building-fill: lighten(@buildings,10%);
     building-fill-opacity: linear([view::zoom], (15, 0.0), (18, 0.8));
   } 
   polygon-fill:@buildings;
   ['nuti::buildings'=1][zoom>=15] {
     line-color: @buildings_outline;
     line-width: linear([view::zoom], (15, 0.0), (16, 0.5), (17, 1.0));
   }
/*
   [zoom=16]{line-color: @buildings_outline_16; line-width: 0.5;}
   [zoom>=16]{line-color: @buildings_outline;}
*/
}

//aeroway
#aeroway [zoom>=12]{
  line-cap: square;
  line-join:miter;
  line-color: @aeroways;

  [class='runway']{
    line-width: linear([view::zoom], (11, 0.0), (12, 2.0), (13, 4.0), (14, 8.0), (15, 16.0), (16, 32.0), (17, 64.0), (18, 128.0));
/*
    [zoom=12] {line-width: 2;}
    [zoom=13] {line-width: 4;}
    [zoom=14] {line-width: 8;}
    [zoom=15] {line-width: 16;}
    [zoom=16] {line-width: 32;}
    [zoom=17] {line-width: 64;}
    [zoom>=18] {line-width: 128;}
*/
  }

  [class='taxiway']{
    line-width: linear([view::zoom], (12, 0.0), (13, 1.0), (14, 2.0), (15, 4.0), (16, 8.0), (17, 16.0), (18, 32.0));
/*
    [zoom=13] {line-width: 1;}
    [zoom=14] {line-width: 2;}
    [zoom=15] {line-width: 4;}
    [zoom=16] {line-width: 8;}
    [zoom=17] {line-width: 16;}
    [zoom>=18] {line-width: 32;}
*/
  }
}
