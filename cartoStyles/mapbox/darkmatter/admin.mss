// =====================================================================
// ADMIN Boundaries, Places, and Place Labels
// - #boundary: countries
// - #boundary: states and provinces
// =====================================================================

// STYLING VARIABLES //

//country boundaries
@admin0_4: #555;
@admin0_5: #444;
@admin0_6: #151515;
@admin0_7: #444;

//state and province boundaries
@admin1_low: #333;
@admin1_high: #444;
@state: @country_low;

// BEGIN STYLING //

//country boundaries
#boundary[admin_level=2][maritime!=1] {
  ::outline {
    line-width: linear([view::zoom], (5, 0.0), (6, 8.0));
    line-color: @admin0_6;
    line-opacity: 0.5;
  }
  line-color: linear([view::zoom], (4, @admin0_4), (5, @admin0_5), (6, @admin0_5), (7, @admin0_7));
  line-width: linear([view::zoom], (0, 0.25), (4, 0.5), (5, 1.0), (7, 1.5));
/*
  [zoom=4] {
    line-color: @admin0_4;
  }

  [zoom>=5] {
    line-width: 0.5;
    line-color: @admin0_5;
  }

  [zoom>=6] {
    ::outline {
      line-width: 8;
      line-color: @admin0_6;
      line-opacity: 0.5;
    }

    line-width: 1;
    line-color: @admin0_7;
  }

  [zoom>=7] {
    ::outline {
      line-width: 8;
      line-color: @admin0_6;
      line-opacity: 0.5;
    }

    line-color: @admin0_7;
    line-width: 1.5;
  }
*/
}

//state and province boundaries
#boundary[admin_level>2][admin_level<=6][zoom>=4][maritime=0] {
    eraser/line-color: @landmass_fill;
    eraser/line-width: linear([view::zoom], (6, 0.5), (7, 1.0), (9, 2.0));
    line-width: linear([view::zoom], (6, 0.5), (7, 1.0), (9, 2.0));
    line-color: linear([view::zoom], (5, @admin1_low), (6, @admin1_high));
    [admin_level=6] {
      line-opacity: linear([view::zoom], (8, 1.0), (9, 0.8));
    }
    [zoom>=7] {
      line-dasharray: 2,2;
    }
/*
    [zoom>=6] {
      line-color: @admin1_high;
    }

    [zoom>=7] {
      eraser/line-width: 1;
      line-width: 1;
      line-dasharray: 2,2;
    }
    [zoom>=9] {
      eraser/line-width: 2;
      line-width: 2;
      
      [admin_level=6]{line-width:1;}
    }
*/
}
