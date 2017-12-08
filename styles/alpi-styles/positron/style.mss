// =====================================================================
// POSITRON ALL
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
@landmass_fill: lighten(#e3e3dc, 8%);
@land: lighten(#e3e3dc, 8%);

// MAP PROPERTIES //

Map {
  background-color: @landmass_fill;
  font-directory: url(fonts/);
}
