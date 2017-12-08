// =====================================================================
// LABELS
// - #water_name (ocean and sea)
// - #place (continent, country, state, city, etc.)
// - #water_name (lakes)
// - #waterway (rivers)
// - #transportation_name (roads)
// - #poi (park, cemetery, stadium)
// =====================================================================

//STYLING VARIABLES//
@name: [nuti::lang] ? ([name:[nuti::lang]] ? [name:[nuti::lang]] : ([name:[nuti::fallback_lang]] ? [name:[nuti::fallback_lang]] : [name])) : [name];

//base colors
@label_foreground: #777;
@label_foreground_halo: rgba(0,0,0,0.7);

@label_background: #444;
@label_background_halo: rgba(0,0,0,0.3);

//ocean/sea labels
@marine_labels: darken(#777,20%);
@marine_labels_halo: darken(rgba(0,0,0,0.7),10%);

//continent, country and place labels
@country_label: lighten(@label_foreground,5%);
@country_label_high: darken(@label_background,5%);

//state and province labels
@admin1_labels: #333;
@admin1_labels_halo: #111;

//city labels low zooms
@label_lowzoom_shield_fill: darken(@label_foreground,15%);
@label_shield_halo:#000;

//city labels high zoom
@city_label_highzoom: #444;
@city_label_halo_highzoom: darken(rgba(0,0,0,0.7),10%);
@city_label_medium: lighten(@city_label_highzoom,5%);
@city_label_large: lighten(@city_label_highzoom,15%);

//city shields
@capital_shield: url(darkmatter/images/capital_shield_dark_666.svg);
@city_shield: url(darkmatter/images/city_shield_dark_444.svg);
@city_shield_2: url(darkmatter/images/city_shield_dark_666.svg);

//lake and river labels
@water_label: darken(@label_foreground,20%);
@water_halo: darken(@label_foreground_halo,5%);

//Road labels
@road_label_fill: #444;
@road_label_halo: #000;

//park labels
@park_label_fill: darken(@label_foreground,15%);
@park_label_halo: darken(@label_foreground_halo,10%);

//BEGIN STYLING//

//ocean labels
#water_name[class='ocean'][zoom>=2][zoom<=8],
#water_name[class='sea'][zoom>=5]{
    text-name: @name;
    text-face-name: @azo_it;
    text-placement: [nuti::texts3d];
    text-wrap-width: 100;
    text-wrap-before: true;
    text-fill: @marine_labels;
    text-halo-fill: @marine_labels_halo;
    text-halo-radius: 1.2;
    text-line-spacing: -2;
    text-character-spacing: 1.1;

    text-size: linear([view::zoom], (2, 12.0), (3, 14.0), (4, 18.0));
/*
    text-size: 12;
    [zoom>=3] {text-size: 14;}
    [zoom>=4] {text-size: 18;}
*/    
    [class='sea']{
      text-size: 12;
    }
}

//Continent Labels zooms 0-2
#place[class='continent'][zoom>=1][zoom<=2]{
  text-name: @name;
  text-halo-radius: 1.6px;
  text-halo-fill: @label_foreground_halo;
  text-fill: @label_foreground;
  text-face-name: @azo;
  text-placement: [nuti::texts3d];
  text-transform: uppercase;
  text-size: linear([view::zoom], (1, 12.0), (2, 14.0));
/*
  text-size: 12;
  [zoom=2] {text-size: 14;}
*/
}

//Country labels zooms 3-6
#place[class='country'] {
  [zoom=3][rank<=2],
  [zoom=4][rank<=2],
  [zoom=5][rank<=4]{
    text-name: @name;
    text-face-name: @azo;
    text-placement: [nuti::texts3d];
    text-fill: @country_label;
    text-halo-fill: @label_foreground_halo;
    text-halo-radius: 1;
    text-halo-rasterizer: fast;
    text-wrap-width: 100;
    text-wrap-before: true;
    text-line-spacing: -3;
    text-allow-overlap: false;
    text-min-distance: 10;
    text-transform: uppercase;

    text-size: linear([view::zoom], (3, 11.0), (4, 12.0));
    text-fill: linear([view::zoom], (3, @country_label), (4, @country_label_high));
/*
    text-size: 11;
    [zoom>=4] {
      text-fill: @country_label_high;
      text-halo-fill: @label_background_halo;
      text-size: 12;
      text-min-distance: 5;
    } 
      
    [name_en='France'] {text-dy: -5;}
    [name_en='Spain'] {text-dy: 3;}
*/
  }
}

//State and province labels
#place[class='state'][zoom>=5][zoom<=7] {
  [zoom>=5][rank<=1],
  [zoom>=6][rank<=2],
  [zoom>=7][rank<=99]{
    text-name: @name;
    text-face-name: @azo;
    text-placement: [nuti::texts3d];
    text-fill: @admin1_labels;
    text-halo-fill: @admin1_labels_halo;
    text-halo-radius: 1;
    text-halo-rasterizer: fast;
    text-transform: uppercase;
    text-allow-overlap: false;
    text-wrap-width: 30;
//    text-placement-type: simple;
//    text-placements: "W,E,NW,SE,10";
    text-size: linear([view::zoom], (5, 10.0), (6, 12.0));
/*
    text-size: 10;
    [zoom>=6]{text-size: 12;text-wrap-width: 0;}
*/
  }
}

//City Labels
#place::citydots[class='city'][zoom>=4][zoom<=7] {
  [zoom>=4][rank<=3],
  [zoom>=5][rank<=4],
  [zoom>=6][rank<=6],
  [zoom>=7][rank<=7]{
    shield-file: @city_shield;
    shield-unlock-image: true;
    shield-name: @name;
    shield-face-name: @azo;
    shield-placement: [nuti::texts3d];
    shield-fill: @label_foreground;
    shield-halo-fill: @label_shield_halo;
    shield-halo-radius: 1.3;
    shield-halo-rasterizer: fast;
//    shield-placement-type: simple;
//    shield-placements: "W,E,NW,NE,SE,8.5";
    shield-character-spacing: 1.2;
    shield-line-spacing: -1;
    shield-text-transform: uppercase;
    shield-text-dx: -4;
    shield-text-dy: 0;
    shield-allow-overlap: false;
    shield-wrap-width: 100;
    shield-wrap-before: true;
    //shield-min-distance: 1;

    [capital=2]{shield-file: @capital_shield;}
    shield-size: linear([view::zoom], (5, 15.0), (6, 16.0)) - [rank];
/*
    shield-size: 10;
    [zoom=6]{
      [rank<=3]{
        shield-size: 14;
        shield-line-spacing: -2;
      }
      [rank>=4]{
        shield-size: 10;
        shield-fill: @label_lowzoom_shield_fill;
        shield-file: @city_shield;
      }
      [capital=2]{
        shield-file: @capital_shield;
      }
    }

     [zoom=7]{
      shield-fill: @label_lowzoom_shield_fill;
      shield-file: @city_shield;
     [rank<=4]{
        shield-size: 14;
        shield-fill: @label_foreground;
        shield-file: @city_shield;
        [capital=2]{shield-file: @capital_shield;}
      }
     [rank=5]{
        shield-size: 12;
        shield-fill: @label_lowzoom_shield_fill;
      }
    }
*/
  }
}

#place[class='city'][zoom>=8][zoom<=12],
#place[class='town'][zoom>=8][rank<=9],
#place[class='town'][zoom>=9][rank<=11],
#place[class='town'][zoom>=12][zoom<=15],
#place[class='village'][zoom>=10][rank<=11],
#place[class='village'][zoom>=12][zoom<=16],
#place[class='suburb'][zoom>=12][rank<=11],
#place[class='suburb'][zoom>=13][zoom<=16],
#place[class='hamlet'][zoom>=13][zoom<=16],
#place[class='neighbourhood'][zoom>=13][zoom<=16] {
  text-name: @name;
  text-face-name: @azo;
  text-placement: [nuti::texts3d];
  text-fill: @city_label_medium;
  text-halo-fill: @city_label_halo_highzoom;
  text-halo-radius: 1.7;
  text-min-distance: 5;
  text-wrap-width: 100;
  text-wrap-before: true;
  text-transform: uppercase;
  text-character-spacing: 1.2;

  text-size: linear([view::zoom], (8, 16.0), (11, 18.0)) - [rank];
  [rank<=4] {
    text-fill: linear([view::zoom], (12, @city_label_large), (13, @label_foreground));
  }
  [rank>=5] {
    text-fill: linear([view::zoom], (12, @city_label_medium), (13, @label_foreground));
  }

/*
  text-size: 9;
  [zoom=8]{
    [rank<=4] {
      text-size: 16;
      text-fill: @city_label_large;
    }

    [rank>=5][rank<=6][class='city']{
       text-size: 12;
       text-fill: @city_label_medium;
    }
  }

  [zoom=9]{
    [rank<=4] {
     text-size: 16;
       text-fill: @city_label_large;
    }
    [rank>=5][rank<=7]{
      text-size: 12;
      text-fill: @city_label_medium;
    }
   }

  [zoom=10]{
   [rank<=5] {
     text-size: 16;
     text-fill: @city_label_large;
    }

    [rank>=6][rank<=7][class='city'],
    [rank>=6][rank<=7][class='town']{
        text-size: 14;
        text-fill: @city_label_medium;
    }

    [rank>=7][rank<=10][class='city'],
    [rank=8][class='town']{ 
      text-size: 12;
    }

   }

  [zoom=11]{
     [rank<=5] {
       text-size: 18;
       text-fill: @city_label_large;
    }

    [rank=6]{
        text-size: 14;
        text-fill: @city_label_medium;
    }

    [rank>=7][rank<=11][class='city'],
    [rank>=8][rank<=9][class='town']{
      text-size: 12;
    }

   }

  [zoom=12]{
    [rank<=6] {
       text-size: 18;
       text-fill: @city_label_large;
    }

    [rank>=7][rank<=9]{
        text-size: 14;
        text-fill: @city_label_medium;
    }

    [rank>=10][rank<=12][class='city'],
    [rank=10][class='town'],
    [rank=10][class='suburb']{
      text-size: 12;
    }
   }

  [zoom>=13]{
      text-size: 11;
      text-fill: @label_foreground;
      text-wrap-width: 90;
    }
*/
}

//lake labels
#water_name [class='lake'][zoom>=9] {
    text-name: @name;
    text-face-name: @azo_it;
    text-placement: [nuti::texts3d];
    text-fill: @water_label;
    text-size: 11;
    text-halo-fill: @water_halo;
    text-halo-radius: 1.2;
    text-wrap-width: 60;
    text-wrap-before: true;
}

//river labels
#waterway[class='river'][zoom>=12]{
      text-name: @name;
      text-face-name: @azo_it;
      text-placement: line;
      text-fill: @water_label;
      text-size: 11;
      text-halo-fill: @water_halo;
      text-halo-radius: 1.2;
      text-avoid-edges: true;
      text-placement: line;
      text-min-distance: 200;
}

//road labels
#transportation_name[zoom>11] {
  text-name: @name;
  text-placement: line;
  text-face-name: @azo;
  text-character-spacing: 1;
  text-size: 10;
  text-min-distance: 200;
  text-fill: @road_label_fill;
  text-halo-fill: @road_label_halo;
  text-halo-radius: 1.8;
  text-transform: uppercase;
  text-avoid-edges: true;
  text-dy: 5;
//  text-max-char-angle-delta: 30;
  [zoom>=17] { text-size: 11;}
  [class='motorway'] {
    text-name: "";
    text-size: 0;
    text-opacity: 0;
    text-halo-opacity: 0;
  }
  [class='trunk'], [class='primary'] {
    [zoom<=11] {
      text-name: "";
      text-size: 0;
      text-opacity: 0;
      text-halo-opacity: 0;
    }
  }
  [class='secondary'] {
    [zoom<=12] {
      text-name: "";
      text-size: 0;
      text-opacity: 0;
      text-halo-opacity: 0;
    }
  }
  [class='tertiary'] {
    [zoom<=14] {
      text-name: "";
      text-size: 0;
      text-opacity: 0;
      text-halo-opacity: 0;
    }
  }
  [class='minor'], [class='service']{
    [zoom<=15] {
      text-name: "";
      text-size: 0;
      text-opacity: 0;
      text-halo-opacity: 0;
    }
  }
  [class='path'],[class='track'] {
    [zoom<=16] {
      text-name: "";
      text-size: 0;
      text-opacity: 0;
      text-halo-opacity: 0;
    }
  }
}

//park labels
#poi[rank=1][class='park'][zoom>=14],
#poi[rank<=2][class='park'][zoom>=16],
#poi[rank<=3][class='park'][zoom>=17],
#poi[rank=1][class='cemetery'][zoom>=14],
#poi[rank<=2][class='cemetery'][zoom>=16],
#poi[rank<=3][class='cemetery'][zoom>=17],
#poi[rank<=1][class='stadium'][zoom>=16],
#poi[rank<=3][class='stadium'][zoom>=17]{
  text-name: @name;
  text-face-name: @azo_it;
  text-placement: [nuti::markers3d];
  text-fill: @park_label_fill;
  text-halo-fill: @park_label_halo;
  text-halo-radius: 1.2;
  text-size: 12;
  text-wrap-width: 100;
  //text-ratio: 0.5;
  text-character-spacing: 1;
  text-wrap-before: true;
  text-avoid-edges: true;
  text-line-spacing: -1;
}
