// =====================================================================
// DARK MATTER ALL
// =====================================================================

// =====================================================================
// MAP SET UP:
// - style: fonts, base colors, map properties
// - admin: Boundaries, Places
// - hydro: Hydro
// - landuse: Urban areas, green areas, parks, buidlings, aeroways
// - roads: Roads
// - labels: Labels for all features
// =====================================================================

// STYLING VARIABLES //

//Fonts
@azo: "Azo Sans Regular", "Noto Sans Regular","NanumBarunGothic Regular","Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@azo_md: "Azo Sans Medium", "Noto Sans Regular","NanumBarunGothic Regular","Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@azo_bd: "Azo Sans Bold", "Noto Sans Regular","NanumBarunGothic Regular","Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
@azo_it: "Azo Sans Italic", "Noto Sans Regular","NanumBarunGothic Regular","Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";

//Base Colors
@landmass_fill: #0e0e0e;
@land: #0e0e0e;

// MAP PROPERTIES //

Map { 
  background-color: @land;
  font-directory: url(fonts/);
}

