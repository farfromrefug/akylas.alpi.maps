
//CARTO Fonts
@mont: "Montserrat Regular", "Noto Sans Regular", "NanumBarunGothic Regular", "Koruri Regular", "Noto Sans Tibetan Regular", "Noto Sans Khmer Regular";

@contour_text: #5E5E5E;
@contour_halo: lighten(@contour_text,60%);


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
  line-width: 0.6;
  line-opacity: 0.3;
  line-color: #959393;
  text-face-name: @mont;
  text-fill: @contour_text;
  text-halo-fill: @contour_halo;
  text-halo-rasterizer: fast;
  text-halo-radius: 1;
  text-avoid-edges: true;
  text-placement: line;
  text-character-spacing: 1;
  text-size: linear([view::zoom], (15, 9.5), (20, 12.0));
  text-name: "";
  [index=10] { 
    line-opacity: 0.4; 
    line-width: 1.1; 
    text-name: [ele]+' m';
  }
}

#cliff[zoom>=15]{
  line-color: #644808;
  line-width: 3;
  line-dasharray: 2,2;
  line-opacity: linear([view::zoom], (15.0, 0.0), (15.25, 1));
}