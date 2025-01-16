let cam;

// Start and Default ASCII Symbols
let ascii = [
  { symbol: "(" },
  { symbol: ":" },
  { symbol: "@" },
  { symbol: "^" },
];

let defaultAscii = [
  { symbol: "(" },
  { symbol: ":" },
  { symbol: "@" },
  { symbol: "^" },
];

// Custom Buttons and Sliders
let swapButton;
let swapColors = false;
let gridSlider;
let textSlider;
let oscSlider;

// Color Master
let fillColor = [255, 255, 255, 255];
let bgColor = [0];
let textColor = [0];
let textboxColor = [255];
let textboxStrokeColor = [0];

// Oscillation Parameters
const lowThreshold = 0;
const highThreshold = 200;
let speed = (5 * Math.PI) / 5000;
let oscillationFactor = 0.4;

// User Input Variables
let userInput = "";
let inputText = "";
let defaultText =
  "Start Typing to Generate. Press 'Enter' to Begin a New String."; // Default text to show before input

function preload() {
  Helvetica = loadFont("helvetica.ttf");
}

function updateAscii(input) {
  if (input.length === 0) {
    ascii = defaultAscii;
    inputText = defaultText;
  } else {
    ascii = [];
    for (let i = 0; i < input.length; i++) {
      let symbol = input.charAt(i);
      ascii.push({ symbol: symbol });
    }
    inputText = input;
  }
}

function setup() {
  createCanvas(1024, 768);

  // Text Settings
  textFont(Helvetica);
  textAlign(LEFT, LEFT);

  // Camera Input Settings
  cam = createCapture(VIDEO);
  cam.size(1024, 768);
  cam.hide();

  // Sliders and Buttons
  gridSlider = new Slider(20, height - 25, 300, 15, 10, 150, 100);
  textSlider = new Slider(20, height - 60, 300, 15, 5, 18, 10);
  oscSlider = new Slider(20, height - 95, 300, 15, 0, 0.8, 0);

  // Swap Color Button
  swapButton = new Button(20, height - 145, 100, 20, "Swap Colors");

  frameRate(60);
}

function swapColorsFunction() {
  fillColor = swapColors ? [255, 255, 255, 255] : [0, 0, 0, 255];
  bgColor = swapColors ? [0] : [255];
  textColor = swapColors ? [0] : [255];
  textboxColor = swapColors ? [255] : [0];
  textboxStrokeColor = swapColors ? [0] : [255];
  swapColors = !swapColors;
}

class Button {
  constructor(x, y, w, h, label) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
    this.baseColor = color(255);
    this.hoverColor = color(0);
    this.textColor = color(0);
    this.currentColor = this.baseColor;
  }

  display() {
    if (this.isHovered()) {
      this.currentColor = this.hoverColor;
      this.textColor = this.baseColor;
    } else {
      this.currentColor = this.baseColor;
      this.textColor = this.hoverColor;
    }

    fill(this.currentColor);
    stroke(this.textColor);
    strokeWeight(.8);
    rect(this.x, this.y, this.w, this.h, 10);

    fill(this.textColor);
    textSize(10);
    textAlign(CENTER, CENTER);
    noStroke();
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }

  isHovered() {
    return (
      mouseX > this.x &&
      mouseX < this.x + this.w &&
      mouseY > this.y &&
      mouseY < this.y + this.h
    );
  }

  isClicked() {
    return this.isHovered();
  }
}

class Slider {
  constructor(x, y, w, h, min, max, initialValue) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.min = min;
    this.max = max;
    this.value = initialValue;
    this.knobX = map(this.value, this.min, this.max, this.x, this.x + this.w);
    this.dragging = false;
    this.hovering = false;
  }

  show() {
    stroke(200);
    strokeWeight(4);
    line(this.x, this.y, this.x + this.w, this.y);

    this.hovering = this.isHovered();
    
    noStroke();

    // Knob with Hover
    push();
    strokeWeight(.8);
    stroke(this.hovering ? color(fillColor) : color(bgColor));
    fill(this.hovering ? color(bgColor) : color(fillColor));
    ellipse(this.knobX, this.y, this.h, this.h);
    pop();
  }

  update() {
    if (this.dragging) {
      this.knobX = constrain(mouseX, this.x, this.x + this.w);
      this.value = map(this.knobX, this.x, this.x + this.w, this.min, this.max);
    }
  }

  pressed() {
    let d = dist(mouseX, mouseY, this.knobX, this.y);
    if (d < this.h / 2) {
      this.dragging = true;
    }
  }

  released() {
    this.dragging = false;
  }

  isHovered() {
    let d = dist(mouseX, mouseY, this.knobX, this.y);
    return d < this.h / 2;
  }

  getValue() {
    return this.value;
  }
}

function draw() {
  background(bgColor);

  cam.loadPixels();

  gridSlider.update();
  textSlider.update();
  oscSlider.update();

  count = gridSlider.getValue();
  textsize = textSlider.getValue(); // Update text size dynamically
  oscillationFactor = oscSlider.getValue();

  let asciiSize = width / count;
  let time = millis();

  // Oscillating factor with threshold
  const oscillation = oscillationFactor * (1 + Math.sin(time * speed));
  const luminanceOffset =
    lowThreshold + (highThreshold - lowThreshold) * oscillation;

  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      let posX = (x + 0.5) * asciiSize;
      let posY = (y + 0.5) * asciiSize;

      let x2 = floor((x / count) * cam.width);
      let y2 = floor((y / count) * cam.height);
      let pixelIndex = (y2 * cam.width + x2) * 4;

      let r = cam.pixels[pixelIndex] || 0;
      let g = cam.pixels[pixelIndex + 1] || 0;
      let b = cam.pixels[pixelIndex + 2] || 0;

      // Luminance calculation
      let luminance = (r + g + b) / 3;
      luminance += luminanceOffset;

      let shapeIndex = floor(map(luminance, 0, 255, 0, ascii.length));
      shapeIndex = constrain(shapeIndex, 0, ascii.length - 1);
      let shape = ascii[shapeIndex];

      drawShape(posX, posY, asciiSize, shape);
    }
  }
  
  let displayText = userInput.length === 0 ? defaultText : inputText;

  // Textbox Dimensions
  let textboxWidthAdjustment = displayText.length * 5 + 100;
  let textboxWidth = constrain(textboxWidthAdjustment, 100, width - 50);
  
  // Text box
  fill(textboxColor);
  rectMode(CENTER);
  rect(width / 2, 30, textboxWidth, 25, 10);

  // Default and Input Text
  noStroke();
  fill(textColor);
  textSize(12);
  textAlign(CENTER, CENTER);
  text(displayText, width / 2, 30);

  // Turn off rectMode for Button
  rectMode(CORNER);

  // Display Button
  swapButton.display();

  // Grid Slider
  gridSlider.show();
  fill(fillColor);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("Grid Size: " + count, gridSlider.x + gridSlider.w / 2, height - 40);

  // Text Slider
  textSlider.show();
  fill(fillColor);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("Text Size: " + textsize, textSlider.x + textSlider.w / 2, height - 75);

  // Osc Slider
  oscSlider.show();
  fill(fillColor);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("Oscillation: " + oscillationFactor.toFixed(2), oscSlider.x + oscSlider.w / 2, height - 110);
}

function drawShape(x, y, asciiSize, shape) {
  fill(fillColor);
  noStroke();

  textSize(textsize); // Apply dynamic text size
  text(shape.symbol, x, y);
}

function mousePressed() {
  if (swapButton.isClicked()) {
    swapColorsFunction();
  }
  gridSlider.pressed();
  textSlider.pressed();
  oscSlider.pressed();
}

function mouseReleased() {
  gridSlider.released();
  textSlider.released();
  oscSlider.released();
}

function keyPressed() {
  if (keyCode === ENTER) {
    updateAscii(userInput);
    userInput = "";
  } else if (keyCode === BACKSPACE) {
    userInput = userInput.slice(0, -1);
    updateAscii(userInput);
  }
}

function keyTyped() {
  if (key !== "Enter") {
    userInput += key;
    updateAscii(userInput);
  }
}
