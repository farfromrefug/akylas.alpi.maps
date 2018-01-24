
//CARTO Fonts
@mont: "Montserrat Regular", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";
//Base Colors
//@landmass_fill: lighten(#F8F3EB,2%);
@landmass_fill_labels_only: transparent;

#hillshade {
  [class='shadow'] {
    polygon-fill: black;
    polygon-opacity: 0.05;
    [level=89] { polygon-opacity: 0.02; }
    [level=78] { polygon-opacity: 0.04; }
    [level=67] { polygon-opacity: 0.06; }
    [level=56] { polygon-opacity: 0.08; }
  }
  [class='highlight'] {
    polygon-fill: white;
    polygon-opacity: 0.10;
  }
}

#contour[ele>0] {
  text-name: [ele]+' m';
  text-face-name: @mont;
  text-placement: line;
  text-fill: #5E5E5E;
  text-halo-fill: rgba(255,255,255,1.0);
  text-halo-radius: 1;
  text-avoid-edges: true;
  text-allow-overlap: false;
  text-halo-rasterizer: fast;
  text-size: linear([view::zoom], (15, 9.5), (20, 12.0));

}
#contour[ele>0] {
  line-width: 0.6;
  line-opacity: 0.3;
  line-color: #959393;
  [index=5] { 
    line-opacity: 0.4; 
    line-width: 1.1; 
  }
  [index=10] { 
    line-opacity: 0.4; 
    line-width: 1.1; 
  }
}
