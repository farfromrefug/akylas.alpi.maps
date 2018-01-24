// =====================================================================
// VOYAGER
// =====================================================================

// =====================================================================
// MAP SET UP:
// - style: fonts, base colors, map properties
// =====================================================================

// STYLING VARIABLES //

//CARTO Fonts
@mont: "Montserrat Regular", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@mont_md: "Montserrat Medium", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@mont_bd: "Montserrat SemiBold", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@mont_it: "Montserrat Italic", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@mont_it_md: "Montserrat Italic", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";

//Base Colors
@landmass_fill: lighten(#F8F3EB,2%);
@landmass_fill_labels_only: transparent;


// MAP PROPERTIES //

Map {
  background-color: @landmass_fill;
  font-directory: url(fonts/);
}

