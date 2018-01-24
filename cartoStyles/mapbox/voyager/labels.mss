
// =====================================================================
// LABELS
// - #water_name (ocean and sea)
// - #place (continent, country, state, city, etc.)
// - #water_name (lakes)
// - #waterway (rivers)
// - #mountain_peak (rivers)
// - #transportation_name (roads)
// - #poi (park, cemetery, stadium)
// =====================================================================

//STYLING VARIABLES//
@name: [nuti::lang] ? ([name:[nuti::lang]] ? [name:[nuti::lang]] : ([name:[nuti::fallback_lang]] ? [name:[nuti::fallback_lang]] : [name])) : [name];

//place label colors
@dark_text: #4b5357;
@med_text: #405c78;
@light_text: #959eaa;
@place_halo: lighten(@med_text,60%);

//city shield
@city_shield: url(voyager/images/city-square.png);

//ocean/sea label colors
@marine_labels: #fff;
@marine_labels_halo: darken(@water,7%);

//Lake and River Labels
@water_label:darken(@water, 30%);
@water_halo: lighten(@water, 15%);

//Moutain peaks
@peak: desaturate(#a4e7a0,26%);
@peak_label:darken(@peak, 30%);
@peak_halo: lighten(@peak, 15%);

//Road labels
@road_text_light: darken(@light_text,8%);
@road_text: darken(@light_text,16%);
@motorway_halo: lighten(@motorway,6%);
@primary_halo: lighten(@main,2%);
@minor_halo: @landmass_fill;
@tunnel_halo: lighten(@tunnel,5);

//poi
@poi_light: #666;
@poi_dark:  #555;
@poi_halo:  fadeout(#fff,85);


//BEGIN STYLING//

//ocean labels
#water_name[class='ocean'][zoom>=2][zoom<=8],
#water_name[class='sea'][zoom>=5]{
    text-name: @name;
    text-face-name: @mont_it_md;
    text-wrap-width: 50;
    text-wrap-before: true;
//    text-size: 14;
    text-fill: @marine_labels;
    text-halo-fill: @marine_labels_halo;
    text-halo-radius: 1;
    text-line-spacing: -2;
    text-character-spacing: 1.1;
    text-size: linear([view::zoom], (2, 14.0), (5, 20.0));
/*
    [zoom>=3] {text-size: 16;}
    [zoom>=4] {text-size: 18;}
    [zoom>=5] {text-size: 20;}
*/
    
    [class='sea']{
      text-size: 12;
    }
}

//Continent Labels zooms 0-2
#place[class='continent'][zoom>=1][zoom<=2]{
//  text-size: 12;
  text-name: @name;
  text-fill: @med_text;
  text-face-name: @mont;
  text-transform: uppercase;
  text-halo-fill: @landmass_fill;
  text-halo-radius: 1;
  text-size: linear([view::zoom], (1, 10.0), (2, 14.0));
/*
  [zoom=2] {text-size: 14;}
*/
}

#place[class='country'] {
[rank=1][zoom>=3][zoom<=6], 
[rank=2][zoom>=3][zoom<=7],
[rank=3][zoom>=4][zoom<=8], 
[rank=4][zoom>=5][zoom<=9], 
[rank=5][zoom>=6][zoom<=10], 
[rank>=6][zoom>=7][zoom<=10]{
  text-name: @name;
  text-face-name: @mont_md;
  text-placement: [nuti::texts3d];
  text-size: 0;
//  text-fill: @med_text;
  text-halo-fill: @landmass_fill;
  text-halo-radius: 1;
  text-halo-rasterizer: fast;
  text-wrap-width: 30;
  text-wrap-before: true;
  text-line-spacing: -2;
  text-min-distance: 2;
  text-transform: uppercase;
  text-character-spacing: 0.5;
  text-fill: linear([view::zoom], (4, mix(@med_text, @light_text, 50%)), (5, mix(@med_text, @light_text, 15%)), (6, lighten(@light_text, 5%)));
/*
  [zoom>=4]{text-fill:@med_text;}
  [zoom>=6]{text-fill:@light_text;}
*/
  
  [rank=1][zoom>=2]{
    text-size: linear([view::zoom], (2, 10.0), (5, 13.0), (6, 15.0));
    text-wrap-width: step([zoom], (2, 60), (3, 80), (4, 100), (5, 120), (6, 140));
/*
    [zoom=2]  { text-size: 10; text-wrap-width: 60; }
    [zoom=3]  { text-size: 11; text-wrap-width: 60; }
    [zoom=4]  { text-size: 12; text-wrap-width: 90; }
    [zoom=5]  { text-size: 13; text-wrap-width: 120; }
    [zoom>=6] { text-size: 14; text-wrap-width: 120; }
*/
  }
  [rank=2][zoom>=3]{
    text-size: linear([view::zoom], (3, 10.0), (6, 14.0));
    text-wrap-width: step([zoom], (3, 60), (4, 70), (5, 80), (6, 100));
/*
    [zoom=3]  { text-size: 10; text-wrap-width: 60; }
    [zoom=4]  { text-size: 11; text-wrap-width: 70; }
    [zoom=5]  { text-size: 12; text-wrap-width: 80; }
    [zoom>=6] { text-size: 13; text-wrap-width: 100; }
*/
  }
  [rank=3][zoom>=4]{
    text-size: linear([view::zoom], (4, 10.0), (8, 14.0));
    text-wrap-width: step([zoom], (7, 60), (8, 120));
/*
    [zoom=4]  { text-size: 10; }
    [zoom=5]  { text-size: 11; }
    [zoom=6]  { text-size: 12; }
    [zoom=7]  { text-size: 13; text-wrap-width: 60; }
    [zoom>=8] { text-size: 14; text-wrap-width: 120; }
*/
  }
  [rank=4][zoom>=5]{
    text-size: linear([view::zoom], (5, 10.0), (9, 14.0));
    text-wrap-width: step([zoom], (6, 60), (7, 90), (8, 120));
/*
    [zoom=5] { text-size: 10; }
    [zoom=6] { text-size: 11; text-wrap-width: 60  }
    [zoom=7] { text-size: 12; text-wrap-width: 90; }
    [zoom=8] { text-size: 13; text-wrap-width: 120; }
    [zoom>=9] { text-size: 14; text-wrap-width: 120; }
*/
  }
  [rank=5][zoom>=5]{
    text-size: linear([view::zoom], (5, 10.0), (9, 14.0));
    text-wrap-width: step([zoom], (7, 60), (8, 90), (9, 120));
/*
    [zoom=5] { text-size: 10; }
    [zoom=6] { text-size: 11; }
    [zoom=7] { text-size: 12; text-wrap-width: 60; }
    [zoom=8] { text-size: 13; text-wrap-width: 90; }
    [zoom>=9] { text-size: 14; text-wrap-width: 120; }
*/
  }
  [rank>=6][zoom>=6]{
    text-size: linear([view::zoom], (6, 10.0), (9, 13.0));
/*
    [zoom=6] { text-size: 10; }
    [zoom=7] { text-size: 11; }
    [zoom=8] { text-size: 12; }
    [zoom>=9] { text-size: 13; }
*/
  }
 }
}

//State and province labels
#place[class='state'][zoom>=6][zoom<=10]{
  [zoom>=5][rank<=2],
  [zoom>=6][rank<=4],
  [zoom>=7][rank<=99]{
    text-name: @name;
    text-face-name: @mont_md;
    text-placement: [nuti::texts3d];
    text-fill: @light_text;
    text-halo-fill: @landmass_fill;
    text-halo-radius: 1;
    text-halo-rasterizer: fast;
//    text-size: 11;
    text-transform: uppercase;
    text-allow-overlap: false;
    text-wrap-width: 60;
    text-wrap-before: true;
    text-min-distance:5;
//    text-placement-type: simple;
//    text-placements: "W,E,NW,SE,11";
    text-size: linear([view::zoom], (5, 11.0), (6, 12.0), (7, 13.0));
//    [zoom>=7]{text-fill:@light_text;}
/*
    [zoom>=6]{text-size: 12;}
    [zoom>=7]{text-size:14; text-fill:@light_text;}
*/
  }
}

//city dots
#place::citydots[class='city'][zoom>=4][zoom<=7] {
  [zoom>=4][rank<=2],
  [zoom>=5][rank<=4],
  [zoom>=6][rank<=6],
  [zoom>=7][rank<=7]{
    shield-file: @city_shield;
    shield-unlock-image: true;
    shield-name: @name;
    shield-size: 10;
    shield-face-name: @mont_md;
    shield-placement: [nuti::texts3d];
    shield-fill: @med_text;
    shield-halo-fill: @place_halo;
    shield-halo-radius: 1;
    shield-halo-rasterizer: fast;
//    shield-placement-type: simple;
//    shield-placements: "W,E,NW,NE,SE,10";
    shield-line-spacing: -2;
    shield-text-dx: -3;
    shield-text-dy: 0;
    shield-min-distance: 3;
    shield-wrap-width: 40;
//    shield-size: 11;

    shield-size: linear([view::zoom], (4, 10.0), (5, 11.0), (6, 12.0), (7, 13.0)) - ([rank] / 3.0);
    shield-wrap-width:([zoom], (4, 40), (5, 50), (6, 60));
    [zoom>=5] {
      [rank>=0][rank<=2] { 
        shield-text-transform:uppercase;
      }
    }
//    [zoom>=6] {
//      shield-fill: @med_text;
      shield-wrap-width:60;
//    }
    [zoom>=7] {
      [rank>=3][rank<=5] { 
        shield-text-transform:uppercase; 
      }
    }
/*
    [zoom>=4] {
      [rank>=0][rank<=2] { shield-size: 10; }
      [rank>=3][rank<=5] { shield-size: 9; }
    }
    [zoom>=5] {
      [rank>=0][rank<=2] { 
        shield-size: 11; 
        shield-text-transform:uppercase;
      }
      [rank>=3][rank<=5] { shield-size: 10; }
    }
    [zoom>=6] {
      shield-fill: @med_text;
      [rank>=0][rank<=2] { shield-size: 12; }
      [rank>=3][rank<=5] { shield-size: 11; }
    }
    [zoom=7] {
      [rank>=0][rank<=2] { shield-size: 13; }
      [rank>=3][rank<=5] { 
        shield-size: 12;
        shield-text-transform:uppercase; 
      }
      [rank>=6] { shield-size: 11; }
    }
*/
  }
}

#place[class='city'][zoom>=8][zoom<=14][rank<=11],
#place[class='city'][zoom>=9][zoom<=14][rank<=12],
#place[class='city'][zoom>=10][zoom<=14][rank<=15]{
  text-name: @name;
  text-face-name: @mont_md;
  text-placement: [nuti::texts3d];
  text-fill: @med_text;
  text-halo-fill: @place_halo;
  text-halo-radius: 1;
  text-halo-rasterizer: fast;
//  text-wrap-width: 40;
  text-line-spacing: -2;
  //text-wrap-before: true;
  text-size: linear([view::zoom], (8, 13.0), (14, 21.0)) - ([rank] / 2.0);
  text-wrap-width: step([zoom], (8, 50), (9, 60), (10, 60), (11, 70), (12, 80), (13, 120), (14, 200));
  [zoom>=10] {text-transform: uppercase;}
/*
  [zoom=8] {
    text-size: 10;
    text-wrap-width: 60;
    [rank>=0][rank<=3] { text-size: 16; }
    [rank>=4][rank<=5] { text-size: 14; }
    [rank>=6][rank<=7] { text-size: 12; }
    [rank>=8][rank<=9] { text-size: 11; }
  }
  [zoom=9] {
    text-size: 11;
    text-wrap-width: 60;
    [rank>=0][rank<=3] { text-size: 17; }
    [rank>=4][rank<=5] { text-size: 15; }
    [rank>=6][rank<=7] { text-size: 13; }
    [rank>=8][rank<=9] { text-size: 12; }
  }
  [zoom=10] {
    text-size: 12;
    text-wrap-width: 70;
    [rank>=0][rank<=3] { text-size: 18; }
    [rank>=4][rank<=5] { text-size: 16; }
    [rank>=6][rank<=7] { text-size: 14; }
    [rank>=8][rank<=9] { text-size: 13; }
  }
  [zoom=11] {
    text-size: 13;
    text-wrap-width: 80;
    [rank>=0][rank<=3] { text-size: 19; }
    [rank>=4][rank<=5] { text-size: 17; }
    [rank>=6][rank<=7] { text-size: 15; }
    [rank>=8][rank<=9] { text-size: 14; }
  }
  [zoom>=12] {
    text-size: 14;
    text-wrap-width: 100;
    [rank>=0][rank<=3] { text-size: 20; }
    [rank>=4][rank<=5] { text-size: 18; }
    [rank>=6][rank<=7] { text-size: 16; }
    [rank>=8][zoom<=9] { text-size: 15; }
  }
  [zoom=13] {
    text-size: 15;
    text-wrap-width: 200;
    [rank>=0][rank<=3] { text-size: 21; }
    [rank>=4][rank<=5] { text-size: 19; }
    [rank>=6][rank<=7] { text-size: 17; }
    [rank>=8][rank<=9] { text-size: 16; }
  }
  
  [zoom=14] {
    text-size: 16;
    text-wrap-width: 300;
    text-name: [name];
    [rank>=0][rank<=3] { text-size: 21; }
    [rank>=4][rank<=5] { text-size: 20; }
    [rank>=6][rank<=7] { text-size: 19; }
    [rank>=8][rank<=9] { text-size: 17; }
  }
*/
}

//Towns
#place[class='town'][zoom>=9][zoom<=14][rank<=12],
#place[class='town'][zoom=15]{
  text-name: @name;
  text-face-name: @mont_md;
  text-placement: [nuti::texts3d];
  text-fill: @med_text;
  text-halo-fill: @place_halo;
  text-halo-radius: 1;
  text-halo-rasterizer: fast;
  text-wrap-before: true;
  text-line-spacing: -2;
//  text-size: 11;
  text-transform: uppercase;
  text-size: linear([view::zoom], (9, 9.0), (10, 10.0), (11, 11.0), (12, 12.0), (13, 13.0), (14, 15.0), (15, 17.0));
  text-wrap-width: step([zoom], (9, 70), (10, 80), (11, 90), (12, 100), (13, 110), (14, 130), (15, 140));
//  [zoom>=13] { text-wrap-width: 160; }
//  [zoom>=14] { text-wrap-width: 200; text-face-name:@mont_md; }
//  [zoom>=15] { text-name:""; }
/*
  [zoom>=8] { text-size: 9; }
  [zoom>=9] { text-size: 10; }
  [zoom>=10] { text-size: 11; }
  [zoom>=13] { text-size: 12; text-wrap-width: 160; }
  [zoom>=14] { 
    text-size: 13; 
    text-wrap-width: 200;
    //text-face-name:@mont_md;
    text-name: [name];
  }

  [zoom>=15] {text-name:""; }
*/
}

//Villages
#place[class='village'][zoom>=12][zoom<=14][rank<=11],
#place[class='village'][zoom>=15][zoom<=16] {
  text-name: @name;
  text-face-name: @mont_md;
  text-placement: [nuti::texts3d];
  text-fill: @med_text;
  text-halo-fill: @place_halo;
//  text-size: 10;
  text-halo-radius: 1;
  text-halo-rasterizer: fast;
//  text-wrap-width: 60;
  text-wrap-before: true;
  text-line-spacing: -2;
  text-transform: uppercase;
  text-size: linear([view::zoom], (11, 9.0), (12, 10.0), (13, 11.0), (16, 16.0));
  text-wrap-width: step([zoom], (12, 80), (13, 90), (14, 120), (15, 140), (16, 160));
/*
  [zoom>=12] { text-size: 10; }
  [zoom>=13] { text-size: 11;text-wrap-width: 80; }
  [zoom>=14] { 
    text-size: 12; 
    text-wrap-width: 100; 
    text-name:[name];
  }

  [zoom>=16] { text-size: 13; text-wrap-width: 160; }
  [zoom=17] { text-size: 14; text-wrap-width: 200; }
*/
}

//Suburbs

#place[class='suburb'][zoom>=12][zoom<=14][rank<=11],
#place[class='suburb'][zoom>=15][zoom<=16] {
  text-name: @name;
  text-face-name: @mont_md;
  text-placement: [nuti::texts3d];
//  text-size: 9;
  text-fill: @med_text;
  text-halo-fill: @place_halo;
  text-halo-radius: 1;
  text-halo-rasterizer: fast;
//  text-wrap-width: 60;
  text-wrap-before: true;
  text-line-spacing: -2;
  text-transform: uppercase;
  text-size: linear([view::zoom], (12, 9.0), (13, 10.0), (16, 13.0));
  text-wrap-width: step([zoom], (12, 60), (13, 80), (14, 90), (15, 100), (16, 120));
/*
  [zoom>=13] { 
    text-size: 10; 
    text-min-distance: 20; 
  }
  [zoom>=14] { 
    text-face-name:@mont_md;
    text-name: [name];
  }
  [zoom>=15] { 
    text-size: 10; 
    //text-wrap-width: 120; 
  }
  
  [zoom>=16] { 
    text-size: 11; 
    text-wrap-width: 80;  
  }
  
  [zoom>=17] { 
    text-size: 12; 
    text-wrap-width: 200; 
  }
*/
}

//Neighbourhoods & Hamlets
#place[zoom>=13][zoom<=15][rank<=11],
#place[zoom>=16][zoom<=17] {
  [class='hamlet'],
  [class='neighbourhood'] {
    text-name: @name;
    text-face-name: @mont;
    text-placement: [nuti::texts3d];
    text-fill: @med_text;
    text-halo-fill: @place_halo;
//    text-size: 8;
    text-halo-radius: 1;
    text-halo-rasterizer: fast;
//    text-wrap-width: 60;
    text-wrap-before: true;
    text-line-spacing: -2;
    text-transform: uppercase;
    text-size: linear([view::zoom], (14, 9.0), (16, 13.0), (17, 15.0));
    text-wrap-width: step([zoom], (13, 80), (14, 80), (15, 100), (16, 120), (17, 140));
/*
    [zoom>=14] { 
      text-size: 9; 
      text-wrap-width: 80;
      text-name: [name];
      text-face-name: @mont_md;
    }
    [zoom>=15] { 
      text-size: 10; 
      text-wrap-width: 100; 
    }
    [zoom>=16] { 
      text-size: 11.5; 
      text-wrap-width: 120; 
    }
    [zoom>=18] { text-size: 12;  }
*/
  }
}

//Lake labels
#water_name [class='lake'][zoom>=9] {
    text-name: @name;
    text-face-name: @mont_it;
    text-placement: [nuti::texts3d];
    text-fill: @water_label;
//    text-size: 9;
    text-halo-fill: @water_halo;
    text-halo-radius: 1;
//    text-wrap-width: 50;
    text-wrap-before: true;
    text-min-distance:30;
    text-size: linear([view::zoom], (16, 9.0), (17, 10.0), (18, 12.0));
    text-wrap-width: step([zoom], (16, 80), (17, 100));
/*
    [zoom>=17]{
      text-size:10;
      text-wrap-width:100; 
      text-min-distance:80;
    }
    [zoom>=18]{
      text-min-distance: 10; 
      text-size:12;
    }
*/
}

//river labels
#waterway[class='river'][zoom>=14]{
  text-name: @name;
  text-face-name: @mont_it;
  text-fill: @water_label;
//  text-size: 9;
  text-halo-fill: @water_halo;
  text-halo-radius: 1.2;
  text-avoid-edges: true;
  text-placement: line;
  //text-repeat-distance:10;
  text-character-spacing: 1;
  text-size: linear([view::zoom], (15, 9.0), (16, 10.0), (17, 11.0));
/*
  [zoom>=16]{text-size:10;}
  [zoom>=17]{text-size:11;}
*/
}

#transportation_name['mapnik::geometry_type'=2] {
  [class='motorway'][zoom>=13],
  [class='trunk'][zoom>=13],
  [class='primary'][zoom>=14],
  [class='secondary'][zoom>=15],
  [class='tertiary'][zoom>=15],
  [class='minor'][zoom>=16],
  [class='service'][zoom>=17],
  [class='path'][zoom>=17],
  [class='track'][zoom>=18]{
    text-avoid-edges: true;
    text-name: @name;
    text-placement: line;
    text-face-name: @mont;
    text-fill: linear([view::zoom], (17, @road_text_light), (18, @road_text));
//    text-size: 8;
    text-halo-fill: @minor_halo;
    text-halo-radius: 1;
    text-halo-rasterizer: fast;
    text-min-distance: 200;
    text-size: linear([view::zoom], (14, 8.0), (16, 9.0), (18, 11.0));
//    [zoom>=18] { text-fill:@road_text; }
/*
    [zoom>=14] { text-size: 8; }
    [zoom>=16] { text-size: 9; }
    [zoom>=17] { text-size: 10; text-character-spacing: 0.5;}
    [zoom>=18] { text-size: 11;text-fill:@road_text; }
*/
    
    [class='motorway'],
    [class='trunk'],
    [class='primary'] {
      text-face-name: @mont;
      text-halo-fill: @primary_halo;
      text-fill: linear([view::zoom], (16, @road_text_light), (17, @road_text));
      text-size: linear([view::zoom], (13, 9.0), (16, 12.0), (18, 13.0));
      [class='motorway'],[class='trunk']{text-halo-fill: @motorway_halo;}
/*
      [zoom>=13] { text-size: 9;}
      [zoom>=14] { text-size: 10;text-character-spacing: 0.5;}
      [zoom>=15] { text-size: 11; }
      [zoom>=16] { text-size: 12;  }
      [zoom>=17] {text-fill:@road_text;}
      [zoom>=18] { text-size: 13; }
*/
    }
    
    [class='secondary']{
//      text-fill: @road_text
      text-fill: linear([view::zoom], (16, @road_text_light), (17, @road_text));
      text-size: linear([view::zoom], (15, 11.0), (16, 12.0));
/*
        [zoom>=15]{text-size:11;text-character-spacing: 0.5;}
        [zoom>=16] { text-size: 12; }
        [zoom>=17] {text-fill: @road_text;}
*/
    }
    [class='tertiary']{
      text-fill: linear([view::zoom], (16, @road_text_light), (17, @road_text));
      text-size: linear([view::zoom], (15, 10.0), (16, 11.0), (18, 12.0));
/*
      [zoom>=15] { text-size: 9;  }
      [zoom>=16] { text-size: 11; }
      [zoom>=17] {text-fill: @road_text;}
      [zoom>=18] { text-size: 12;}
*/
    }
    [class='path'],
    [class='track']{
      text-fill: @road_text_light;
     }

  }
}

//poi labels
#poi[class='park'][subclass='park'],
#poi[class='stadium'][rank<=3],
#poi[class='cemetery'][rank<=3],
#poi[class='attraction'][rank<=3]{
  [zoom>=15][rank<=1],
  [zoom>=16][rank<=2],
  [zoom>=17][rank<=3],
  [zoom>=18]{
    text-name: @name;
    text-face-name: @mont_md;
    text-placement: [nuti::markers3d];
//    text-fill: @poi_light;
    text-halo-fill: @poi_halo;
    text-halo-radius: 1.5;
    text-halo-rasterizer: fast;
    text-line-spacing: -1;
//    text-wrap-width: 80;
    text-wrap-before: true;
    text-avoid-edges: true;
    text-transform: uppercase;
    text-fill: linear([view::zoom], (15, @poi_light), (16, @poi_dark));
    text-size: linear([view::zoom], (15, 8.0), (16, 9.0), (18, 10.0));
    text-wrap-width: step([zoom], (15, 80), (16, 90), (18, 100));
/*
    [zoom>=15]{text-size:8;}
    [zoom>=16]{text-size:8.5;text-fill:@poi_dark;}
    [zoom>=17]{text-size:9; text-wrap-width: 100;}
    [zoom>=18]{text-size:10; }
*/
  }
}

#housenumber[zoom>=18]['nuti::buildings'>0]{
    text-name: [housenumber];
    text-face-name: @mont;
    text-fill: darken(@buildings,25%);
    text-halo-fill: @poi_halo;
    text-halo-radius: 2;
    text-halo-rasterizer: fast;
    text-line-spacing: -1;
    text-wrap-width: 60;
    text-wrap-before: true;
    text-avoid-edges: true;
    text-transform: uppercase;
    text-min-distance: 20;
  }
  

//Peak labels
#mountain_peak [zoom>=7] {
    text-name: @name;
    text-face-name: @mont_it;
    text-placement: [nuti::texts3d];
    text-fill: @peak_label;
    text-halo-fill: @peak_halo;
    text-halo-radius: 1;
    text-wrap-before: true;
    text-min-distance:30;
    text-size: linear([view::zoom], (16, 9.0), (17, 10.0), (18, 12.0));
    text-wrap-width: step([zoom], (16, 80), (17, 100));
/*
    [zoom>=17]{
      text-size:10;
      text-wrap-width:100; 
      text-min-distance:80;
    }
    [zoom>=18]{
      text-min-distance: 10; 
      text-size:12;
    }
*/
}