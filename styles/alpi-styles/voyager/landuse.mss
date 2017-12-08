// =====================================================================
// LANDUSE/LANDCOVER
// - #landuse: urban areas
// - #landcover: park, wood
// - #park: nature_reserve, national_park
// - #poi: park labels
// - #buildings
// - #aeroways: runway, taxiway
// =====================================================================

// STYLING VARIABLES //

//urban areas
@urbanareas: #f3eadc;

//parks and green areas
@greenareas: #C5E1B2;
@green_area_highzoom: rgb(224,236,211);

//buildings
@buildings: darken(@urbanareas,0%);

//aeroways
@aeroways: #e8e8e8;

// BEGIN STYLING //

//urban areas
#landuse[class='residential'][zoom>=6]{
  polygon-fill: linear([view::zoom], (5, fadeout(@urbanareas,50%)), (8, fadeout(@urbanareas,55%)), (9, fadeout(@urbanareas,60%)), (11, fadeout(@urbanareas,65%)), (15, fadeout(@urbanareas,75%)), (16, fadeout(@urbanareas,85%)));
/*
  [zoom>=5]{polygon-fill:fadeout(@urbanareas,50%);}
  [zoom>=8]{polygon-fill:fadeout(@urbanareas,55%);}
  [zoom>=9]{polygon-fill: fadeout(@urbanareas,60%);}
  [zoom>=11]{polygon-fill: fadeout(@urbanareas,65%);}
  [zoom>=13]{polygon-fill: fadeout(@urbanareas,70%);}
  [zoom>=15]{polygon-fill: fadeout(@urbanareas,75%);}
  [zoom>=16]{polygon-fill: fadeout(@urbanareas,85%);}
*/
}

//green areas and parks

#landcover[class='wood'][zoom>=5],
#landcover[class='grass'][zoom>=9],
#landcover[subclass='recreation_ground'][zoom>=12],
#park[class='nature_reserve'][zoom>=5],
#park[class='national_park'][zoom>=9],
#landuse[class='cemetery'],
#landuse[class='stadium']{
  #landcover[class='grass'] {
    polygon-opacity: linear([view::zoom], (9.0, 0.0), (11, 1.0));
  }

  polygon-fill: linear([view::zoom], (8, fadeout(@greenareas,80%)), (9, fadeout(@greenareas,75%)), (11, fadeout(@greenareas,65%)), (13, fadeout(@greenareas,60%)), (15, @green_area_highzoom));
/*
  //opacity: 0.8;
  [zoom<=8]{polygon-fill:fadeout(@greenareas,80%);}
  [zoom>=9]{polygon-fill:fadeout(@greenareas,75%);}
  [zoom>=11]{polygon-fill: fadeout(@greenareas,65%);}
  [zoom>=13]{polygon-fill: fadeout(@greenareas,60%);}
  [zoom>=15]{polygon-fill: @green_area_highzoom;}
*/
}

//buildings
#building [zoom>=13]['mapnik::geometry_type'=3]['nuti::buildings'>0] {
    ::3d['nuti::buildings'>1][zoom>=15] {
      building-height: [render_height] ? [render_height] : 10;
      building-fill: lighten(@buildings,10%);
      building-fill-opacity: linear([view::zoom], (15, 0.0), (18, 0.2));
    } 

    ::shadow['nuti::buildings'=1][zoom>=15] {
      polygon-fill: mix(@buildings,#777,88%);//darken(@buildings,7);
      polygon-opacity: linear([view::zoom], (14.5, 0.0), (15, 1.0));
//      [zoom>=15]{line-color:darken(@urbanareas,8%);}
//      [zoom<=16]{line-width:0.5;}
      [zoom>=15]{ polygon-geometry-transform:translate(0,1);}
      [zoom>=16]{ polygon-geometry-transform:translate(0,2);}
      [zoom>=17]{ polygon-geometry-transform:translate(0,3);}
      [zoom>=18]{ polygon-geometry-transform:translate(0,5);} 
//      a/polygon-fill: lighten(@buildings,2%);
    }

    ::fill {
      polygon-fill: lighten(@buildings,0%);
      polygon-opacity: linear([view::zoom], (13, 0.0), (14.5, 0.8), (15, 1.0));
/*
      [zoom<=14]{polygon-opacity: 0.8;}
      [zoom>=15]{polygon-opacity: 1;}
*/
    }
/*  
    ::shadow[zoom>=15] {
      polygon-fill: mix(@buildings,#777,88);
      polygon-geometry-transform:translate(0,2);
      [zoom>=15]{line-color:darken(@urbanareas,8);}
      [zoom<=16]{line-width:0.5;}
      [zoom=15]{ polygon-geometry-transform:translate(0,1);}
      [zoom=17]{ polygon-geometry-transform:translate(0,3);}
      [zoom=18]{ polygon-geometry-transform:translate(0,5);} 
      a/polygon-fill: lighten(@buildings,2);  
    }
*/
}

//aeroway
#aeroway {
  line-cap: square;
  line-join:miter;
  line-color: @aeroways;
  line-width:0.5;

  [class='runway']{
    line-width: linear([view::zoom], (10, 0.0), (11, 0.5), (12, 1.0), (13, 2.0), (14, 4.0), (15, 6.0), (16, 8.0));
/*
    [zoom=12] {line-width: 1;}
    [zoom=13] {line-width: 2;}
    [zoom=14] {line-width: 4;}
    [zoom=15] {line-width: 6;}
    [zoom>=16] {line-width: 8;}
*/
  }

  [class='taxiway']{
    line-width: linear([view::zoom], (12, 0.0), (13, 0.5), (14, 1.0), (15, 2.0), (16, 4.0));
/*
    [zoom=13] {line-width: 0.5;}
    [zoom=14] {line-width: 1;}
    [zoom=15] {line-width: 2;}
    [zoom>=16] {line-width: 4;}
*/
  }
}
