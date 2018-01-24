// =====================================================================
// HYDRO
// - #water: Water Polygons
// - #waterway: rivers
// =====================================================================

// STYLING VARIABLES //

//Fills
@water: #CDD2D4;
@rivers_stroke: lighten(#346fa1,30%);//#D1DFE9;

// BEGIN STYLE //

//water polygons
#water[class='ocean'],
#water[class='lake'],
#water[class='river']{
  polygon-fill: @water;
}

//river styling
#waterway {
    [class='river'],
    [class='canal'][zoom>=12] {
//      line-color: @water;
      line-color: linear([view::zoom], (7, @rivers_stroke), (8, @water));
      line-width: linear([view::zoom], (7, 0.5), (8, 1.0));
      line-opacity: linear([view::zoom], (7, 0.9), (8, 1.0));
/*
      [zoom<=7]{
        line-color: @rivers_stroke;
        line-width: 0.5;
        line-opacity: 0.9;
      }
*/
    }
    [class='stream'][zoom>=12] {
      line-width: 0.5;
      line-color: @water;
    }
}

