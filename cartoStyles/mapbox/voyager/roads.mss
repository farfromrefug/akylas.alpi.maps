// =====================================================================
// ROADS
// - #transportation: ::case and ::fill for roads, rail, bridges, tunnels
// =====================================================================


//basic colors

@motorway:           #FFE9A5;
@motorway_case:       mix(@motorway,#f6cd8b,50%);
@main:                #fefdd7;
@main_case_lowzoom:   mix(@main,#ffdda9,30%);
@main_case:           mix(@main,#ffdda9,40%);
@secondary:           #FDFBDC;//#fff;
@secondary_case:      mix(@main,#ffdda9,50%);
@street:              #fff;
@minor:               #fff;
@minor_case:          mix(@landmass_fill,#ffdda9,50%); 
@path:                #d7d7d7;
@path_case:           @minor_case; 
@tunnel:              mix(@motorway,#eee,10%);
@tunnel_case:         mix(@motorway,#dbdbdb,30%);
@rail:                #ddd;
@rail_dash:           #fff;

//motorway trunk fill widths
@09_hwy_f: 1.4;
@10_hwy_f: 1.8;
@11_hwy_f: 1.5;
@12_hwy_f: 2;
@13_hwy_f: 3;
@14_hwy_f: 4;
@15_hwy_f: 5;
@16_hwy_f: 8;
@17_hwy_f: 12;
@18_hwy_f: 20;

//primary fill widths
@11_maj_f: 1.5;
@12_maj_f: 2;
@13_maj_f: 3;
@14_maj_f: 4;
@15_maj_f: 5;
@16_maj_f: 7;
@17_maj_f: 10;
@18_maj_f: 15;

//secondary, tertiary fill widths
@12_sec_f: 1.5;
@13_sec_f: 2;
@14_sec_f: 3;
@15_sec_f: 4;
@16_sec_f: 6;
@17_sec_f: 10;
@18_sec_f: 15;

//minor fill widths
@12_min_f: 0.8;
@13_min_f: 1;
@14_min_f: 1.5;
@15_min_f: 2;
@16_min_f: 3;
@17_min_f: 5;
@18_min_f: 10;


#transportation {
  ::polygon {
    [class='path']['mapnik::geometry_type'=3][zoom>=14] {
      polygon-fill: mix(@path, @buildings, 75%);
      polygon-opacity: linear([view::zoom], (14.0, 0.0), (14.5, 0.7));
    }
  }
  ::case { }
  ::fill { }
}

#transportation {
  [class='motorway']['mapnik::geometry_type'=2][zoom>=4] {
    ::case {
      line-color: @motorway_case;
      line-cap: [zoom]<=9 ? butt : round;
      line-join: round;
      line-width: 0.5;
//      line-opacity: 0.6;
      line-opacity: linear([view::zoom], (4.5, 0.0), (5, 0.5), (7, 1.0));
      line-width: linear([view::zoom], (4.5, 0.0), (5, 0.5), (8, 1.0), (9, 1.2), (10, 1.8), (11, @11_hwy_f + 2.0), (12, @12_hwy_f + 2.0), (13, @13_hwy_f + 2.5), (14, @14_hwy_f + 3.0), (15, @15_hwy_f + 3.0), (16, @16_hwy_f + 4.0), (17, @17_hwy_f + 4.0), (18, @18_hwy_f + 5.0));
      [brunnel='tunnel']{line-color: @tunnel_case;}
/*
      [zoom>=7]   { line-width:0.5; line-opacity:1; }
      [zoom>=8]   { line-width: 1; }
      [zoom>=9]   { line-width:1.2; }
      [zoom>=10]  { line-width: 1.8; }
      [zoom>=11]   {line-width: @11_hwy_f + 2;}
      [zoom>=13]   {line-width: @13_hwy_f + 2.5;}
      [zoom>=14]   {line-width: @14_hwy_f + 3;}
      [zoom>=15]   {line-width: @15_hwy_f + 3;}
      [zoom>=16]   {line-width: @16_hwy_f + 4;}
      [zoom>=17]   {line-width: @17_hwy_f + 4;}
      [zoom>=18]   {line-width: @18_hwy_f + 5;}
*/
    }
    ::fill {
        line-color:@motorway;
        line-cap: [zoom]<=9 ? butt : round;
        line-join: round;
        line-opacity: 1;
        line-width: linear([view::zoom], (9.5, 0.0), (10, 1.0), (11, @11_hwy_f), (12, @12_hwy_f), (13, @13_hwy_f), (14, @14_hwy_f), (15, @15_hwy_f), (16, @16_hwy_f), (17, @17_hwy_f), (18, @18_hwy_f));
        [brunnel='tunnel']{line-color: @tunnel;}
/*        
        [zoom>=10] { line-width:1;}
        [zoom=11]  {line-width: @11_hwy_f;}
        [zoom=12]  {line-width: @12_hwy_f;}
        [zoom=13]  {line-width: @13_hwy_f;}
        [zoom=14]  {line-width: @14_hwy_f;}
        [zoom=15]  {line-width: @15_hwy_f;}
        [zoom=16]  {line-width: @16_hwy_f;}
        [zoom=17]  {line-width: @17_hwy_f;}
        [zoom>=18] {line-width: @18_hwy_f;}
*/
    }
  }
 
  [class='trunk']['mapnik::geometry_type'=2][zoom>=4],
  [class='primary']['mapnik::geometry_type'=2][zoom>=4]{
    ::case{ 
//      line-color:@main_case;
      line-cap: [zoom]<=10 ? butt : round;
      line-join: round;
//      line-width: 0.5;
      line-opacity: linear([view::zoom], (4.5, 0.0), (5, 0.5), (7, 1.0));
      line-color:linear([view::zoom], (11, @main_case_lowzoom), (12, @main_case));
      line-width: linear([view::zoom], (4.5, 0.0), (5, 0.5), (7, 0.8), (8, 1.0), (10, 1.2), (11, @11_maj_f + 1.5), (12, @12_maj_f + 2.0), (13, @13_maj_f + 2.0), (14, @14_maj_f + 2.5), (15, @15_maj_f + 2.5), (16, @16_maj_f + 2.5), (17, @17_maj_f + 3.0), (18, @18_maj_f + 3.0));
/*
      [zoom<=11]{line-color: @main_case_lowzoom;}
*/
      [brunnel='tunnel']{line-color: @tunnel_case;}
      [class='trunk']{line-color: @motorway_case;}
/*
      [zoom>=7] { line-width:0.8;line-opacity:1; }
      [zoom>=8] {line-width: 1;}
      [zoom>=10] {line-width: 1.2;}
      [zoom>=11]  {line-width: @11_maj_f+1.5;}
      [zoom>=12]  {line-width: @12_maj_f+2;}
      [zoom>=13]  {line-width: @13_maj_f+2;}
      [zoom>=14]  {line-width: @14_maj_f+2.5;}
      [zoom>=15]  {line-width: @15_maj_f+2.5;}
      [zoom>=16]  {line-width: @16_maj_f+2.5;}
      [zoom>=17]  {line-width: @17_maj_f+3;}
      [zoom>=18]  {line-width: @18_maj_f+3;}
      
      [class='primary']{
        [zoom<=9]{line-width: 0.5;}
        [zoom=10]{line-width: 1;}
      }
*/      
      [class='primary'] {
        line-width: linear([view::zoom], (6.5, 0.0), (9, 0.5), (10, 1.0), (11, @11_maj_f + 1.5), (12, @12_maj_f + 2.0), (13, @13_maj_f + 2.0), (14, @14_maj_f + 2.5), (15, @15_maj_f + 2.5), (16, @16_maj_f + 2.5), (17, @17_maj_f + 3.0), (18, @18_maj_f + 3.0));
      }
    }

    ::fill {
//      line-color: @main;
      line-cap: [zoom]<=10 ? butt : round;
      line-join: round;
      line-color: linear([view::zoom], (7, @main_case_lowzoom), (8, darken(@main_case,5%)), (11, @main));
      line-width: linear([view::zoom], (10.5, 0.0), (11, @11_maj_f), (12, @12_maj_f), (13, @13_maj_f), (14, @14_maj_f), (15, @15_maj_f), (16, @16_maj_f), (17, @17_maj_f), (18, @18_maj_f));
      line-opacity: linear([view::zoom], (6, 0.0), (7, 1.0));
      [brunnel='tunnel']{line-color: @tunnel;}
      [class='trunk']{line-color: @motorway;}
/*
      [zoom>=11]  {line-width: @11_maj_f;}
      [zoom>=12]  {line-width: @12_maj_f;}
      [zoom>=13]  {line-width: @13_maj_f;}
      [zoom>=14]  {line-width: @14_maj_f;}
      [zoom>=15]  {line-width: @15_maj_f;}
      [zoom>=16]  {line-width: @16_maj_f;}
      [zoom>=17]  {line-width: @17_maj_f;}
      [zoom>=18]  {line-width: @18_maj_f;}
*/
    }
  }

  [class='secondary']['mapnik::geometry_type'=2][zoom>=11],
  [class='tertiary']['mapnik::geometry_type'=2][zoom>=11]{
    ::case {
//      line-color: @secondary_case;
      line-cap: [zoom]<=13 ? butt : round;
      line-join: round;
//      [zoom<=11]{line-color: rgb(255,254,249);}
      line-color: linear([view::zoom], (11, rgb(255, 254, 249)), (12.0, @secondary_case));
      line-width: linear([view::zoom], (11, 0.0), (11.5, 1.2), (12, @12_sec_f + 1.0), (13, @13_sec_f + 1.5), (14, @14_sec_f + 2.0), (15, @15_sec_f + 2.5), (16, @16_sec_f + 2.5), (17, @17_sec_f + 3.0), (18, @18_sec_f + 3.0));
      [brunnel='tunnel']{line-color: @tunnel_case;}
/*
      [brunnel='tunnel']{line-color: @tunnel_case;}
      [zoom>=10] { line-width:0.5; }
      [zoom>=11]  { line-width:1.2; }
      [zoom>=12]  {line-width: @12_sec_f + 1.5; }
      [zoom>=13]  {line-width: @13_sec_f + 2;}
      [zoom>=14]  {line-width: @14_sec_f + 2.5;}
      [zoom>=15]  {line-width: @15_sec_f + 2.5;}
      [zoom>=16]  {line-width: @16_sec_f + 2.5;}
      [zoom>=17]  {line-width: @17_sec_f + 3;}
      [zoom>=18]  {line-width: @18_sec_f + 3;}
*/
    }
    ::fill {
//      line-color:@street;
      line-cap: [zoom]<=13 ? butt : round;
      line-join: round;
      line-color: linear([view::zoom], (11, rgb(255, 254, 249)), (12.0, @street));
      line-width: linear([view::zoom], (11, 0.0), (11.5, 1.2), (12, 1.4), (13, @13_sec_f), (14, @14_sec_f), (15, @15_sec_f), (16, @16_sec_f), (17, @17_sec_f), (18, @18_sec_f));
      [brunnel='tunnel']{line-color:@tunnel;}
/*
      [zoom>=12] {line-width: 1.4;}
      [zoom>=13]  {line-width: @13_sec_f;}
      [zoom>=14]  {line-width: @14_sec_f;}
      [zoom>=15]  {line-width: @15_sec_f;}
      [zoom>=16]  {line-width: @16_sec_f;}
      [zoom>=17]  {line-width: @17_sec_f;}
      [zoom>=18]  {line-width: @18_sec_f;}
*/
    }
  }

  [class='minor']['mapnik::geometry_type'=2][zoom>=12]{
    ::case {
      line-cap: [zoom]<=13 ? butt : round;
      line-join: round;
//      line-color:@minor_case;
      line-color: linear([view::zoom], (13, rgba(255,255,255,1.0)), (14, @street), (14.5, @minor_case));
      line-width: linear([view::zoom], (12.0, 0.0), (12.5, @12_min_f), (13, @13_min_f), (14, @14_min_f), (15, @15_min_f + 2.0), (16, @16_min_f + 2.0), (17, @17_min_f + 3.0), (18, @18_min_f + 3.0));
      [brunnel='tunnel']{line-color: @tunnel_case;}
/*
      [zoom<=13]{line-color:rgba(255,255,255,1);}
      [zoom=12]  {line-width: @12_min_f;}
      [zoom=13]  {line-width: @13_min_f;}
      [zoom=14]{line-width:@14_min_f+1.5;}
      [zoom=15]{line-width:@15_min_f+2;}
      [zoom=16]{line-width:@16_min_f+2;}
      [zoom=17]{line-width:@17_min_f+3;}
      [zoom=18]{line-width:@18_min_f+3;}
*/
    }
    ::fill {
      line-cap: [zoom]<=13 ? butt : round;
      line-join: round;
//      line-color:@street;
      line-color: linear([view::zoom], (13, rgba(255,255,255,1.0)), (14, @street));
      line-width: linear([view::zoom], (13.5, 0.0), (14, @14_min_f), (15, @15_min_f), (16, @16_min_f), (17, @17_min_f), (18, @18_min_f));
      [brunnel='tunnel']{line-color:@tunnel;}
/*
      [zoom<=13]  {line-color:rgba(255,255,255,1);}
      [zoom>=12]  {line-width: @12_min_f;}
      [zoom>=14]  {line-width: @14_min_f;}
      [zoom>=15]  {line-width: @15_min_f;}
      [zoom>=16]  {line-width: @16_min_f;}
      [zoom>=17]  {line-width: @17_min_f;}
      [zoom>=18]  {line-width: @18_min_f;}
*/
    }
  }
   
  
  [class='motorway'][ramp=1]['mapnik::geometry_type'=2][zoom>=11],
  [class='trunk'][ramp=1]['mapnik::geometry_type'=2][zoom>=11], 
  [class='primary'][ramp=1]['mapnik::geometry_type'=2][zoom>=11],
  [class='secondary'][ramp=1]['mapnik::geometry_type'=2][zoom>=11],
  [class='tertiary'][ramp=1]['mapnik::geometry_type'=2][zoom>=11]{
    ::case{
//      line-color:@motorway_case;
      line-cap: [zoom]<=12 ? butt : round;
      line-join: round;
      line-color:linear([view::zoom], (13, @motorway), (14, @motorway_case));
      line-width:linear([view::zoom], (11, 0.0), (13, 0.8), (14, @14_hwy_f/2.0+1.0), (15, @15_hwy_f/2.0+2.0), (16, @16_hwy_f/2.0+2.0), (17, @17_hwy_f/2.0+2.0), (18, @18_hwy_f/2.0+2.0));
/*
      [zoom<=11] {line-width:0;}
      [zoom<=13] {line-width: 0.8;line-color:@motorway;}
      [zoom=14]  {line-width: @14_hwy_f/2+1;}
      [zoom=15]  {line-width: @15_hwy_f/2+2;}
      [zoom=16]  {line-width: @16_hwy_f/2+2;}
      [zoom=17]  {line-width: @17_hwy_f/2+2;}
      [zoom>=18] {line-width: @18_hwy_f/2+2;}
*/      
      [class='primary']{
        line-color:@main_case;
        line-width:linear([view::zoom], (12, 0.0), (13, 0.8), (14, @14_hwy_f/2.0+1.0), (15, @15_hwy_f/2.0+2.0), (16, @16_hwy_f/2.0+2.0), (17, @17_hwy_f/2.0+2.0), (18, @18_hwy_f/2.0+2.0));
/*
        [zoom<=12]{line-width:0;}
*/
      }
      
      [class='secondary'],
      [class='tertiary']{
        line-color:@secondary_case;
        line-width:linear([view::zoom], (12, 0.0), (13, 0.8), (14, @14_hwy_f/2.0+1.0), (15, @15_hwy_f/2.0+2.0), (16, @16_hwy_f/2.0+2.0), (17, @17_hwy_f/2.0+2.0), (18, @18_hwy_f/2.0+2.0));
/*
        [zoom<=12]{line-width:0;}
*/
      }
      
      [brunnel='tunnel']{line-color: @tunnel_case;}
  }

  ::fill{
      line-cap: [zoom]<=12 ? butt : round;
      line-join: round;
      line-color:@motorway;
      line-width: linear([view::zoom], (13, 0.0), (14, @14_hwy_f/2.0), (15, @15_hwy_f/2.0), (16, @16_hwy_f/2.0), (17, @17_hwy_f/2.0), (18, @18_hwy_f/2.0));
/*
      [zoom<=13] {line-width: 0;line-color:transparent;}
      [zoom=14]  {line-width: @14_hwy_f/2;}
      [zoom=15]  {line-width: @15_hwy_f/2;}
      [zoom=16]  {line-width: @16_hwy_f/2;}
      [zoom=17]  {line-width: @17_hwy_f/2;}
      [zoom>=18] {line-width: @18_hwy_f/2;}
      
      [class='trunk'],
      [class='motorway']{
        line-color:@motorway;
      }
*/      
      [class='trunk'],
      [class='motorway']{
        line-color:@motorway;
      }
      [class='primary']{
        line-color:@main;
      }
      [class='secondary'],
      [class='tertiary']{
        line-color:@street;
      }
      [brunnel='tunnel']{line-color:@tunnel;}
    }
  }
 
  [class='service']['mapnik::geometry_type'=2][zoom>=14]{
    ::case {
      line-cap: [zoom]<=15 ? butt : round;
      line-join: round;
//      line-color: @minor_case;
      line-color: linear([view::zoom], (15, @street), (16, @minor_case));
      line-width: linear([view::zoom], (14.5, 0.0), (15, @15_min_f/4.0*2.0), (16, @16_min_f/2.0*2.0), (17, @17_min_f/2.0*2.0), (18, @18_min_f/3.0*2.0));
/*
      [zoom<=15] { line-color:@street;}
      [zoom>=15] { line-width:@15_min_f/4*2; }
      [zoom>=16] { line-width:@16_min_f/2*2;}
      [zoom>=17] { line-width:@17_min_f/2*2; }
      [zoom>=18] { line-width:@18_min_f/3*2; }
*/
    }
    ::fill {
      line-color: @street;
      line-cap: [zoom]<=15 ? butt : round;
      line-join: round;
      line-width: linear([view::zoom], (15.5, 0.0), (16, @16_min_f/2.0), (17, @17_min_f/2.0), (18, @18_min_f/3.0));
      [brunnel='tunnel']{line-color:@tunnel;}
/*
      [zoom>=16] {line-width: @16_min_f/2;}
      [zoom>=17] { line-width:@17_min_f/2; }
      [zoom>=18] { line-width:@18_min_f/3; }
*/
    }
  }

  [class='path']['mapnik::geometry_type'=2][zoom>=14],
  [class='track']['mapnik::geometry_type'=2][zoom>=14]{
    ::case{
      line-color: @path;
      line-opacity: 0.8;
      line-dasharray: 1, 1;
      line-width: linear([view::zoom], (14.5, 0.0), (15, 1.2), (16, 1.5), (17, 2.0), (18, 2.5));
      [zoom>=15] { line-dasharray: 1.2, 1.2; }
      [zoom>=16] { line-dasharray: 1.5,1.5; }
      [zoom>=17] { line-dasharray: 2,2; }
      [zoom>=18] { line-dasharray: 2.5,2.5; }
      /*
      [zoom>=15] { line-width: 1.2; line-dasharray: 1.2, 1.2; }
      [zoom>=16] { line-width: 1.5; line-dasharray: 1.5,1.5; }
      [zoom>=17] { line-width: 2; line-dasharray: 2,2; }
      [zoom>=18] { line-width: 2.5; line-dasharray: 2.5,2.5; }
      */
      }
  }
  
  [class='rail'][brunnel!='tunnel'][zoom>=12]{
    ::case{
      line-width: linear([view::zoom], (12, 0.0), (13, 0.5), (15, 2.0), (17, 3.0), (18, 6.0));
      line-color: @rail;
      dash/line-width: linear([view::zoom], (14.5, 0.0), (15, 1.0), (17, 2.0), (18, 4.0));
      dash/line-color: @rail_dash;
      dash/line-dasharray: 6,6;
/*
      [zoom>=15]{
        line-width: 2;    
        dash/line-width: 1;
        dash/line-color: @rail_dash;
        dash/line-dasharray: 6,6;
      }
      [zoom>=17]{
        line-width: 3;    
        dash/line-width: 2;
      }
      [zoom>=18]{
        line-width: 6;    
        dash/line-width: 4;
      }
*/
    }
  }
}
