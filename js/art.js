// art.js — word-art lookup for the AI-generated kawaii sticker set (MiniMax image-01).
// Files live at assets/images/art/<name>.jpg (relative path, works over file:// and http://).
// Historical SVG version is preserved in git history (commit af30950).

const artFile = name => '<img src="assets/images/art/' + name + '.jpg" alt="' + name + '">';

const ANIMAL_ART = {
  fish: artFile("fish"),
  bird: artFile("bird"),
  giraffe: artFile("giraffe"),
  dog: artFile("dog"),
  turtle: artFile("turtle"),
  rabbit: artFile("rabbit"),
  cat: artFile("cat"),
  frog: artFile("frog"),
  duck: artFile("duck")
};

const SHAPE_ART = {
  triangle: artFile("triangle"),
  circle: artFile("circle"),
  star: artFile("star"),
  rectangle: artFile("rectangle"),
  square: artFile("square"),
  heart: artFile("heart")
};
