// =====================================================================
// ROADS
// - #transportation: ::case and ::fill for roads, rail, bridges, tunnels
// - #transportation_name: transportation labels
// =====================================================================

// STYLING VARIABLES //

//Rail
@rail_line: #dddddd;
@rail_dashline: #fafafa;

//Basic Colors
@road_case: rgba(70,70,70,0.9);
@road_fill: black;
@tunnel: #eee;

//road colors by zoom for fill and case
//z6-z8
@motorway_fill_z6: white;
@motorway_case_z7: #ccc;//darken(#b4b2a3, 2%);
@motorway_fill_z7: darken(@motorway_fill_z6,12%);
//z9
@motorway_case_z9: #ccc;
@motorway_fill_z9: white;
@primary_fill_z9: #d3d3d3;
//z10
@motorway_case_z10: #ccc;
@motorway_fill_z10: white;
@primary_fill_z9: #ccc;
@minor_fill_z10: #ddd;
//z11
@motorway_case_z11: #ccc;
@motorway_fill_z11: white;
@primary_fill_z11: #d4d4d4;
@minor_fill_z11: #ddd;
//z12
@motorway_case_z12: #c4c4c4;
@motorway_fill_z12: white;
@primary_case_z12: #d9d9d9;
@primary_fill_z12: #fefefe;
@minor_case_z12: @landmass_fill; 
@minor_fill_z12: #ddd;
//z13
@motorway_case_z13: #c0c0c0;
@motorway_fill_z13: white;
@primary_case_z13: #ccc;
@primary_fill_z13: #fcfcfc;
@minor_case_z13: @minor_case_z12; 
@minor_fill_z13: #ddd;
@tunnel_fill: #eee;
//z14+
@motorway_case_z14: #bbb;
@motorway_fill_z14: white;
@primary_case_z14: #c4c4c3;
@primary_fill_z14: white;
@minor_case_z14: #ddd;
@minor_fill_z14: #f9f9f9;
@path_fill_z14: #eee;

// BEGIN STYLING //

#transportation[class='path']['mapnik::geometry_type'=3][zoom>=13]{
  polygon-fill: @path_fill_z14;
  polygon-opacity: linear([view::zoom], (13, 0.0), (14, 1.0));
}

//road case
#transportation::case['mapnik::geometry_type'=2]{
  [class='motorway'][zoom>=5],
  [class='trunk'][zoom>=5]{
    line-cap: butt;
    line-width: linear([view::zoom], (6, 0.0), (7, 2.5), (9, 3.0), (11, 4.0), (12, 5.0), (15, 8.0), (16, 10.0), (17, 12.0), (18, 16.0));
    line-color: linear([view::zoom], (7, @motorway_case_z7), (8, @motorway_case_z9), (11, @motorway_case_z11), (12, @motorway_case_z12), (13, @motorway_case_z13), (14, @motorway_case_z14));
/*
    [zoom>=7]  {line-width: 2.5; line-color:@motorway_case_z7;}
    [zoom>=9]  {line-width: 3; line-color: @motorway_case_z9;}
    [zoom>=11] {line-width: 4; line-color: @motorway_case_z11;}
    [zoom>=12] {line-width: 5; line-color: @motorway_case_z12;}
    [zoom>=13] {line-width: 6; line-color: @motorway_case_z13;}
    [zoom>=15] {line-width: 8; line-color: @motorway_case_z14;}
    [zoom>=16] {line-width: 10;}
    [zoom>=17] {line-width: 12;}
    [zoom>=18] {line-width: 16;}
*/
    
    [ramp=1]{
      line-width: linear([view::zoom], (12, 0.0), (13, 4.0), (15, 5.0), (16, 8.0), (17, 10.0), (18, 14.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 4;}
      [zoom>=15]{line-width: 5;}
      [zoom>=16]{line-width: 8;}
      [zoom>=17]{line-width: 10;}
      [zoom>=18]{line-width: 14;}
*/
    }
    
    [brunnel='tunnel']{
      line-width: linear([view::zoom], (12, 0.0), (13, 6.0), (15, 8.0), (16, 10.0), (17, 12.0), (18, 16.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 6;}
      [zoom>=15]{line-width: 8;}
      [zoom>=16]{line-width: 10;}
      [zoom>=17]{line-width: 12;}
      [zoom>=18]{line-width: 16;}
*/
    }
      
    [brunnel='bridge']{
      line-width: linear([view::zoom], (12, 0.0), (13, 6.0), (15, 8.0), (16, 10.0), (17, 12.0), (18, 16.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 6;}
      [zoom>=15]{line-width: 8;}
      [zoom>=16]{line-width: 10;}
      [zoom>=17]{line-width: 12;}
      [zoom>=18]{line-width: 16;}
*/      
      [ramp=1]{
        line-width: linear([view::zoom], (12, 0.0), (13, 4.0), (15, 5.0), (16, 8.0), (17, 10.0), (18, 14.0));
/*
        [zoom>=13]{line-width: 4;}
        [zoom>=15]{line-width: 5;}
        [zoom>=16]{line-width: 8;}
        [zoom>=17]{line-width: 10;}
        [zoom>=18]{line-width: 14;}
*/
      }   
    }
  }
  
  [class='primary'][zoom>=7],
  [class='secondary'][zoom>=7],
  [class='tertiary'][zoom>=7] {
    line-cap: butt;
    line-width: linear([view::zoom], (11, 0.0), (12, 3.0), (13, 5.0), (16, 7.0), (17, 10.0), (18, 12.0));
    line-color: linear([view::zoom], (12, @primary_case_z12), (13, @primary_case_z13), (14, @primary_case_z14));
    [class='tertiary'] {
      line-width: linear([view::zoom], (11, 0.0), (12, 1.5), (13, 5.0), (16, 7.0), (17, 10.0), (18, 12.0));
      line-color: linear([view::zoom], (12, @minor_case_z12), (13, @primary_case_z13), (14, @primary_case_z14));
    }
/*
    [zoom>=12] {line-width:3;line-color: @primary_case_z12;}
    [zoom>=13] {line-width:5; line-color: @primary_case_z13;}
    [zoom>=14] {line-color: @primary_case_z14;}
    [zoom>=16] {line-width:7;}
    [zoom>=17] {line-width:10;}
    [zoom>=18] {line-width:12;}
*/
    
    [ramp=1]{
      line-width: linear([view::zoom], (12, 0.0), (13, 3.0), (14, 4.0), (16, 5.0), (17, 8.0), (18, 10.0));
/*
      [zoom<=12] {line-width: 0;}
      [zoom>=13] {line-width:3;}
      [zoom>=14] {line-width:4;}
      [zoom>=16] {line-width:5;}
      [zoom>=17] {line-width:8;}
      [zoom>=18] {line-width:10;}
*/
    }

    
    [brunnel='tunnel']{
      line-width: linear([view::zoom], (12, 0.0), (13, 5.0), (16, 7.0), (17, 10.0), (18, 12.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 5;}
      [zoom>=16]{line-width: 7;}
      [zoom>=17]{line-width: 10;}
      [zoom>=18]{line-width: 12;}
*/
     }
    
    [brunnel='bridge']{
      line-width: linear([view::zoom], (12, 0.0), (13, 5.0), (16, 7.0), (17, 10.0), (18, 12.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 5;}
      [zoom>=16]{line-width: 7;}
      [zoom>=17]{line-width: 10;}
      [zoom>=18]{line-width: 12;}
*/      
      [ramp=1]{
        line-width: linear([view::zoom], (12, 0.0), (13, 3.0), (14, 4.0), (16, 5.0), (17, 8.0), (18, 10.0));
/*
        [zoom<=12] {line-width: 0;}
        [zoom>=13] {line-width:3;}
        [zoom>=14] {line-width:4;}
        [zoom>=16] {line-width:5;}
        [zoom>=17] {line-width:8;}
        [zoom>=18] {line-width:10;}
*/
      }
    } 
  }
  
  [class='minor'][zoom>=11],
  [class='service'][zoom>=11]{
    line-cap: butt;
    line-width: linear([view::zoom], (11, 0.0), (12, 1.5), (13, 3.0), (15, 4.0), (16, 6.0), (17, 8.0), (18, 10.0));
    line-color: linear([view::zoom], (12, @minor_case_z12), (13, @landmass_fill), (14, @minor_fill_z14));
    [class='service'] {
      line-width: linear([view::zoom], (14, 0.0), (15, 4.0), (16, 6.0), (17, 8.0), (18, 10.0));
    }
/*
    [zoom>=12] {line-width:1.5; line-color: @minor_case_z12;}
    [zoom>=13] {line-width:3; line-color: @landmass_fill;}
    [zoom>=14] {line-color: @minor_fill_z14; line-cap: round;}
    [zoom>=15] {line-width:4;}
    [zoom>=16] {line-width:6;}
    [zoom>=17] {line-width:8;}
    [zoom>=18] {line-width:10;}
*/
    
    [brunnel='tunnel']{
      line-width: linear([view::zoom], (12, 0.0), (13, 1.0), (14, 3.0), (15, 5.0), (17, 8.0), (18, 10.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 1;}
      [zoom>=14]{line-width: 3;}
      [zoom>=15]{line-width: 5;}
      [zoom>=17]{line-width: 6;}
      [zoom>=17]{line-width: 8;}
      [zoom>=18]{line-width: 10;}
*/
    }    
    
    [brunnel='bridge']{
      line-width: linear([view::zoom], (12, 0.0), (13, 1.0), (14, 3.0), (15, 5.0), (17, 8.0), (18, 10.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 1;}
      [zoom>=14]{line-width: 3;}
      [zoom>=15]{line-width: 5;}
      [zoom>=17]{line-width: 6;}
      [zoom>=17]{line-width: 8;}
      [zoom>=18]{line-width: 10;}
*/
    }    
  }
}
  

//road fill
#transportation::fill['mapnik::geometry_type'=2]{
  [class='motorway'][zoom>=5],
  [class='trunk'][zoom>=5]{
    line-cap: butt;
    line-width: linear([view::zoom], (5, 0.0), (6, 0.5), (7, 1.0), (11, 2.0), (13, 4.0), (15, 6.0), (16, 8.0), (17, 10.0), (18, 14.0));
    line-color: linear([view::zoom], (6, @motorway_fill_z7), (7, #fff), (9, @motorway_fill_z9), (11, @motorway_fill_z11), (12, @motorway_fill_z12), (13, @motorway_fill_z13), (14, @motorway_fill_z14));
/*
    [zoom>=6]  {line-width: 0.5;line-color: @motorway_fill_z7;}
    [zoom>=7]  {line-width: 1; line-color: #fff;}//line-color: @motorway_fill_z7;}
    [zoom>=9]  {line-width:1; line-color: @motorway_fill_z9;}
    [zoom>=11] {line-width:2; line-color: @motorway_fill_z11;}
    [zoom>=12] {line-width:3; line-color: @motorway_fill_z12;}
    [zoom>=13] {line-width:4; line-color: @motorway_fill_z13;}
    [zoom>=14] {line-color: @motorway_fill_z14;}
    [zoom>=15] {line-width:6;}
    [zoom>=16] {line-width:8;}
    [zoom>=17] {line-width:10;}
    [zoom>=18] {line-width: 14;}
*/
    
    [ramp=1]{
      line-width: linear([view::zoom], (12, 0.0), (13, 2.0), (15, 3.0), (16, 6.0), (17, 8.0), (18, 12.0));
/*
      [zoom<=12] {line-width:0;}
      [zoom>=13] {line-width:2;}
      [zoom>=15] {line-width:3;}
      [zoom>=16] {line-width:6;}
      [zoom>=17] {line-width: 8;}
      [zoom>=18] {line-width: 12;}
*/
    }

    [brunnel='tunnel']{
      line-color:@tunnel;
      line-width: linear([view::zoom], (12, 0.0), (13, 4.0), (15, 6.0), (16, 8.0), (17, 10.0), (18, 14.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13] {line-width: 4;}
      [zoom>=15] {line-width: 6;}
      [zoom>=16] {line-width: 8;}
      [zoom>=17] {line-width: 10;}
      [zoom>=18] {line-width: 14;}
*/
    }
    
    [brunnel='bridge']{
      line-width: linear([view::zoom], (12, 0.0), (13, 4.0), (15, 6.0), (16, 8.0), (17, 10.0), (18, 14.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13] {line-width: 4;}
      [zoom>=15] {line-width: 6;}
      [zoom>=16] {line-width: 8;}
      [zoom>=17] {line-width: 10;}
      [zoom>=18] {line-width: 14;}
*/
      [ramp=1]{
        line-width: linear([view::zoom], (12, 0.0), (13, 2.0), (15, 3.0), (16, 6.0), (17, 8.0), (18, 12.0));
/*
        [zoom<=12] {line-width:0;}
        [zoom>=13] {line-width:2;}
        [zoom>=15] {line-width:3;}
        [zoom>=16] {line-width:6;}
        [zoom>=17] {line-width: 8;}
        [zoom>=18] {line-width: 12;}
*/
      }
    }
  }

  [class='primary'][zoom>=7],
  [class='secondary'][zoom>=7],
  [class='tertiary'][zoom>=7] {
    line-cap: butt;
    line-width: linear([view::zoom], (7, 0.0), (8, 0.5), (12, 1.0), (13, 3.0), (16, 5.0), (17, 8.0), (18, 10.0));
    line-color: linear([view::zoom], (8, @primary_fill_z9), (11, @primary_fill_z11), (12, @primary_fill_z12), (13, @primary_fill_z13), (14, @primary_fill_z14));
/*
    [zoom>=8]  {line-width: 0.5;line-color:@primary_fill_z9;}
    [zoom>=11] {line-color: @primary_fill_z11;}
    [zoom>=12] {line-width: 1; line-color: @primary_fill_z12;}
    [zoom>=13] {line-width:3; line-color: @primary_fill_z13;}
    [zoom>=14] {line-color: @primary_fill_z14;}
    [zoom>=16] {line-width:5;}
    [zoom>=17] {line-width:8;}
    [zoom>=18] {line-width:10;}
*/    
    [ramp=1]{
      line-width: linear([view::zoom], (12, 0.0), (13, 1.0), (14, 2.0), (16, 3.0), (17, 6.0), (18, 8.0));
/*
      [zoom<=12] {line-width: 0;}
      [zoom>=13] {line-width: 1;}
      [zoom>=14] {line-width: 2;}
      [zoom>=16] {line-width: 3;}
      [zoom>=17] {line-width: 6;}
      [zoom>=18] {line-width: 8;}
*/
    }
    
    [brunnel='tunnel']{
      line-width: linear([view::zoom], (12, 0.0), (13, 3.0), (16, 5.0), (17, 8.0), (18, 10.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 3;}
      [zoom>=16]{line-width: 5;}
      [zoom>=17]{line-width: 8;}
      [zoom>=18]{line-width: 10;}
*/
    }

    [brunnel='bridge']{
      line-width: linear([view::zoom], (12, 0.0), (13, 3.0), (16, 5.0), (17, 8.0), (18, 10.0));
/*
      [zoom<=12]{line-width: 0;}
      [zoom>=13]{line-width: 3;}
      [zoom>=16]{line-width: 5;}
      [zoom>=17]{line-width: 8;}
      [zoom>=18]{line-width: 10;}
*/
      
      [ramp=1]{
        line-width: linear([view::zoom], (12, 0.0), (13, 1.0), (14, 2.0), (16, 3.0), (17, 6.0), (18, 8.0));
/*
        [zoom<=12] {line-width: 0;}
        [zoom>=13] {line-width: 1;}
        [zoom>=14] {line-width: 2;}
        [zoom>=16] {line-width: 3;}
        [zoom>=17] {line-width: 6;}
        [zoom>=18] {line-width: 8;}
*/
      }
    }
  }

  [class='minor'][zoom>=11],
  [class='service'][zoom>=11]{
    line-cap: butt;
    line-width: linear([view::zoom], (11, 0.0), (12, 0.5), (13, 1.0), (15, 2.0), (16, 4.0), (17, 6.0), (18, 8.0));
    line-color: linear([view::zoom], (12, @minor_fill_z11), (13, @minor_fill_z13), (14, @minor_case_z14));
/*
    [zoom>=12] {line-width:0.5;line-color:@minor_fill_z11;}
    [zoom>=13] {line-width:1; line-color: @minor_fill_z13;}
    [zoom>=14] {line-color: @minor_case_z14; line-cap: round;}
    [zoom>=15] {line-width:2;}
    [zoom>=16] {line-width:4;}
    [zoom>=17] {line-width: 6;}
    [zoom>=18] {line-width: 8;} 
*/
  }
  
  [class='path'][zoom>=14],
  [class='track'][zoom>=14]{
    line-color: @path_fill_z14;
    line-width: linear([view::zoom], (14, 0.0), (15, 1.0), (17, 2.0));
/*
    [zoom>=15] {line-width:1;}
    [zoom>=17] {line-width:2;}
*/
  }

  [class='rail'][zoom>=12],
  [class='transit'][zoom>=12]{
    line-width: linear([view::zoom], (12, 0.0), (13, 3.0));
    dash/line-width: linear([view::zoom], (12, 0.0), (13, 2.0));
    [class='transit'] {
      line-width: linear([view::zoom], (14, 0.0), (15, 3.0));
      dash/line-width: linear([view::zoom], (14, 0.0), (15, 2.0));
    }
    line-color: @rail_line;
    dash/line-color: @rail_dashline;
    dash/line-dasharray: 12,12;
  }
}
