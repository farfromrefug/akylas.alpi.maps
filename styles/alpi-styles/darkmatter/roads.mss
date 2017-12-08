// =====================================================================
// ROADS
// - #transportation: ::case and ::fill for roads, rail, bridges, tunnels
// - #transportation_name: transportation labels
// =====================================================================

// STYLING VARIABLES //

//Rail
@rail_line: #2f2f2f;
@rail_dashline: #111;

//Basic Colors
@road_case: rgba(70,70,70,0.9);
@road_fill: black;
@tunnel: #111;

//road colors by zoom for fill and case
//z6-z8
@motorway_fill_z6: #262626;
@motorway_case_z7: rgba(70,70,70,0.8);
@motorway_fill_z7: rgba(0,0,0,0.5);
//z9
@motorway_case_z9: rgba(50,50,50,0.8);
@motorway_fill_z9: @road_fill;
@primary_fill_z9: #2a2a2a;
//z10
@motorway_case_z10: rgba(60,60,60,0.8);
@motorway_fill_z10: @road_fill;
@primary_fill_z9: @primary_z10;
@minor_fill_z10: #252525;
//z11
@motorway_case_z11: @road_case;
@motorway_fill_z11: @road_fill;
@primary_fill_z11: #333;
@minor_fill_z11: @primary_fill_z9;
//z12
@motorway_case_z12: lighten(@road_case,5%);
@motorway_fill_z12: @road_fill;
@primary_case_z12: darken(@road_case,2%);
@primary_fill_z12: lighten(@road_fill,2%);
@minor_case_z12: @landmass_fill;
@minor_fill_z12: @primary_fill_z9;
//z13
@motorway_case_z13: lighten(@road_case,5%);
@motorway_fill_z13: @road_fill;
@primary_case_z13: darken(@road_case,7%);
@primary_fill_z13: lighten(@road_fill,2%);
@minor_case_z13: @minor_case_z12;
@minor_fill_z13: @primary_fill_z9;
//z14+
@motorway_case_z14: lighten(@road_case,2%);
@motorway_fill_z14: lighten(@road_fill,5%);
@primary_case_z14: darken(@road_case,2%);
@primary_fill_z14: lighten(@road_fill,2%);
@minor_case_z14: darken(@road_case,15%);
@minor_fill_z14: @landmass_fill;
@path_fill_z14: #181818;

// BEGIN STYLING //

#transportation['mapnik::geometry_type'=3]{
  polygon-fill: @path_fill_z14;
  polygon-opacity: linear([view::zoom], (9, 0.0), (10, 1.0));
}

//road case
#transportation::case['mapnik::geometry_type'=2]{
  [class='motorway'][zoom>=5],
  [class='trunk'][zoom>=5]{
    line-cap: butt;
    line-width: linear([view::zoom], (6, 0.0), (7, 2.0), (9, 3.0), (11, 4.0), (12, 5.0), (15, 8.0), (16, 10.0), (17, 12.0), (18, 16.0));
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
    line-width: linear([view::zoom], (5, 0.0), (6, 0.5), (7, 1.5), (11, 2.0), (13, 4.0), (15, 6.0), (16, 8.0), (17, 10.0), (18, 14.0));
    line-color: linear([view::zoom], (6, @motorway_fill_z6), (7, @motorway_fill_z7), (9, @motorway_fill_z9), (11, @motorway_fill_z11), (12, @motorway_fill_z12), (13, @motorway_fill_z13), (14, @motorway_fill_z14));
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
