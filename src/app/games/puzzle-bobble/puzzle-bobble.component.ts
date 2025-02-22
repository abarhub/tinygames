import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-puzzle-bobble',
  imports: [],
  templateUrl: './puzzle-bobble.component.html',
  styleUrl: './puzzle-bobble.component.scss'
})
export class PuzzleBobbleComponent implements OnInit {

  canvas: any;
  context: any;

// puzzle bubble is played on a hex grid. instead of doing complicated
// math of working with a hex grid, we can just fill the screen with
// bubbles in their correct positions. each bubble will start inactive,
// meaning we pretend the bubble isn't there (don't draw it or count
// it for collision). when the bubble we shoot collides with a wall
// or another active bubble, we just find the closest inactive bubble
// and make it active with the same color as the shot bubble. this
// gives the illusion of the bubble snapping to a grid
  grid = 32;

// each even row is 8 bubbles long and each odd row is 7 bubbles long.
// the level consists of 4 rows of bubbles of 4 colors: red, orange,
// green, and yellow
  level1 = [
    ['R', 'R', 'Y', 'Y', 'B', 'B', 'G', 'G'],
    ['R', 'R', 'Y', 'Y', 'B', 'B', 'G'],
    ['B', 'B', 'G', 'G', 'R', 'R', 'Y', 'Y'],
    ['B', 'G', 'G', 'R', 'R', 'Y', 'Y']
  ];

// create a mapping between color short code (R, G, B, Y) and color name
  colorMap:any = {
    'R': 'red',
    'G': 'green',
    'B': 'blue',
    'Y': 'yellow'
  };
  colors: string[] = Object.values(this.colorMap);

// use a 1px gap between each bubble
  bubbleGap = 1;

// the size of the outer walls for the game
  wallSize = 4;
  bubbles: any[] = [];
  particles: any[] = [];


  curBubblePos: { x: number, y: number } | null = null;
  curBubble: { x: any; y: any; color: string; radius: number; speed: number; dx: number; dy: number } | null = null;

// angle (in radians) of the shooting arrow
  shootDeg = 0;

// min/max angle (in radians) of the shooting arrow
  minDeg = this.degToRad(-60);
  maxDeg = this.degToRad(60);

// the direction of movement for the arrow (-1 = left, 1 = right)
  shootDir = 0;


  ngOnInit(): void {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');


    // fill the grid with inactive bubbles
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < (row % 2 === 0 ? 8 : 7); col++) {
        // if the level has a bubble at the location, create an active
        // bubble rather than an inactive one
        const color = this.level1[row]?.[col];
        this.createBubble(col * this.grid, row * this.grid, this.colorMap[color]);
      }
    }

    this.curBubblePos = {
      // place the current bubble horizontally in the middle of the screen
      x: this.canvas.width / 2,
      y: this.canvas.height - this.grid * 1.5
    };
    this.curBubble = {
      x: this.curBubblePos.x,
      y: this.curBubblePos.y,
      color: 'red',
      radius: this.grid / 2,  // a circles radius is half the width (diameter)

      // how fast the bubble should go in either the x or y direction
      speed: 8,

      // bubble velocity
      dx: 0,
      dy: 0
    };
  }


// helper function to convert deg to radians
  degToRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

// rotate a point by an angle
  rotatePoint(x: number, y: number, angle: number) {
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);

    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

// get a random integer between the range of [min,max]
// @see https://stackoverflow.com/a/1527820/2124254
  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

// get the distance between two points
  getDistance(obj1: any, obj2: any) {
    const distX = obj1.x - obj2.x;
    const distY = obj1.y - obj2.y;
    return Math.sqrt(distX * distX + distY * distY);
  }

// check for collision between two circles
  collides(obj1: any, obj2: any) {
    return this.getDistance(obj1, obj2) < obj1.radius + obj2.radius;
  }

// find the closest bubbles that collide with the object
  getClosestBubble(obj: any, activeState = false) {
    const closestBubbles = this.bubbles
      .filter(bubble => bubble.active == activeState && this.collides(obj, bubble));

    if (!closestBubbles.length) {
      return;
    }

    return closestBubbles
      // turn the array of bubbles into an array of distances
      .map(bubble => {
        return {
          distance: this.getDistance(obj, bubble),
          bubble
        }
      })
      .sort((a, b) => a.distance - b.distance)[0].bubble;
  }

// create the bubble grid bubble. passing a color will create
// an active bubble
  createBubble(x: number, y: number, color: any) {
    const row = Math.floor(y / this.grid);
    const col = Math.floor(x / this.grid);

    // bubbles on odd rows need to start half-way on the grid
    const startX = row % 2 === 0 ? 0 : 0.5 * this.grid;

    // because we are drawing circles we need the x/y position
    // to be the center of the circle instead of the top-left
    // corner like you would for a square
    const center = this.grid / 2;

    this.bubbles.push({
      x: this.wallSize + (this.grid + this.bubbleGap) * col + startX + center,

      // the bubbles are closer on the y axis so we subtract 4 on every
      // row
      y: this.wallSize + (this.grid + this.bubbleGap - 4) * row + center,

      radius: this.grid / 2,
      color: color,
      active: color ? true : false
    });
  }

// get all bubbles that touch the passed in bubble
  getNeighbors(bubble: any) {
    const neighbors: any[] = [];

    // check each of the 6 directions by "moving" the bubble by a full
    // grid in each of the 6 directions (60 degree intervals)
    // @see https://www.redblobgames.com/grids/hexagons/#angles
    const dirs = [
      // right
      this.rotatePoint(this.grid, 0, 0),
      // up-right
      this.rotatePoint(this.grid, 0, this.degToRad(60)),
      // up-left
      this.rotatePoint(this.grid, 0, this.degToRad(120)),
      // left
      this.rotatePoint(this.grid, 0, this.degToRad(180)),
      // down-left
      this.rotatePoint(this.grid, 0, this.degToRad(240)),
      // down-right
      this.rotatePoint(this.grid, 0, this.degToRad(300))
    ];

    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i];

      const newBubble = {
        x: bubble.x + dir.x,
        y: bubble.y + dir.y,
        radius: bubble.radius
      };
      const neighbor = this.getClosestBubble(newBubble, true);
      if (neighbor && neighbor !== bubble && !neighbors.includes(neighbor)) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

// remove bubbles that create a match of 3 colors
  removeMatch(targetBubble: any) {
    const matches = [targetBubble];

    this.bubbles.forEach(bubble => bubble.processed = false);
    targetBubble.processed = true;

    // loop over the neighbors of matching colors for more matches
    let neighbors = this.getNeighbors(targetBubble);
    for (let i = 0; i < neighbors.length; i++) {
      let neighbor = neighbors[i];

      if (!neighbor.processed) {
        neighbor.processed = true;

        if (neighbor.color === targetBubble.color) {
          matches.push(neighbor);
          neighbors = neighbors.concat(this.getNeighbors(neighbor));
        }
      }
    }

    if (matches.length >= 3) {
      matches.forEach(bubble => {
        bubble.active = false;
      });
    }
  }

// make any floating bubbles (bubbles that don't have a bubble chain
// that touch the ceiling) drop down the screen
  dropFloatingBubbles() {
    const activeBubbles = this.bubbles.filter(bubble => bubble.active);
    activeBubbles.forEach(bubble => bubble.processed = false);

    // start at the bubbles that touch the ceiling
    let neighbors = activeBubbles
      .filter(bubble => bubble.y - this.grid <= this.wallSize);

    // process all bubbles that form a chain with the ceiling bubbles
    for (let i = 0; i < neighbors.length; i++) {
      let neighbor = neighbors[i];

      if (!neighbor.processed) {
        neighbor.processed = true;
        neighbors = neighbors.concat(this.getNeighbors(neighbor));
      }
    }

    // any bubble that is not processed doesn't touch the ceiling
    activeBubbles
      .filter(bubble => !bubble.processed)
      .forEach(bubble => {
        bubble.active = false;
        // create a particle bubble that falls down the screen
        this.particles.push({
          x: bubble.x,
          y: bubble.y,
          color: bubble.color,
          radius: bubble.radius,
          active: true
        });
      });
  }


// reset the bubble to shoot to the bottom of the screen
  getNewBubble() {
    if (this.curBubble && this.curBubblePos) {
      this.curBubble.x = this.curBubblePos.x;
      this.curBubble.y = this.curBubblePos.y;
      this.curBubble.dx = this.curBubble.dy = 0;

      const randInt = this.getRandomInt(0, this.colors.length - 1);
      this.curBubble.color = this.colors[randInt];
    }
  }

// handle collision between the current bubble and another bubble
  handleCollision(bubble: any) {
    if (this.curBubble) {
      bubble.color = this.curBubble.color;
      bubble.active = true;
      this.getNewBubble();
      this.removeMatch(bubble);
      this.dropFloatingBubbles();
    }
  }

// game loop
  loop() {
    requestAnimationFrame(() => this.loop());
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // move the shooting arrow
    this.shootDeg = this.shootDeg + this.degToRad(2) * this.shootDir;

    // prevent shooting arrow from going below/above min/max
    if (this.shootDeg < this.minDeg) {
      this.shootDeg = this.minDeg;
    } else if (this.shootDeg > this.maxDeg) {
      this.shootDeg = this.maxDeg;
    }

    if (!this.curBubble) {
      return;
    }
    // move current bubble by it's velocity
    this.curBubble.x += this.curBubble.dx;
    this.curBubble.y += this.curBubble.dy;

    // prevent bubble from going through walls by changing its velocity
    if (this.curBubble.x - this.grid / 2 < this.wallSize) {
      this.curBubble.x = this.wallSize + this.grid / 2;
      this.curBubble.dx *= -1;
    } else if (this.curBubble.x + this.grid / 2 > this.canvas.width - this.wallSize) {
      this.curBubble.x = this.canvas.width - this.wallSize - this.grid / 2;
      this.curBubble.dx *= -1;
    }

    // check to see if bubble collides with the top wall
    if (this.curBubble.y - this.grid / 2 < this.wallSize) {
      // make the closest inactive bubble active
      const closestBubble = this.getClosestBubble(this.curBubble);
      this.handleCollision(closestBubble);
    }

    // check to see if bubble collides with another bubble
    for (let i = 0; i < this.bubbles.length; i++) {
      const bubble = this.bubbles[i];

      if (bubble.active && this.collides(this.curBubble, bubble)) {
        const closestBubble = this.getClosestBubble(this.curBubble);
        if (!closestBubble) {
          window.alert('Game Over');
          window.location.reload();
        }

        if (closestBubble) {
          this.handleCollision(closestBubble);
        }
      }
    }

    // move bubble particles
    this.particles.forEach(particle => {
      particle.y += 8;
    });

    // remove particles that went off the screen
    this.particles = this.particles.filter(particles => particles.y < this.canvas.height - this.grid / 2);

    // draw walls
    this.context.fillStyle = 'lightgrey';
    this.context.fillRect(0, 0, this.canvas.width, this.wallSize);
    this.context.fillRect(0, 0, this.wallSize, this.canvas.height);
    this.context.fillRect(this.canvas.width - this.wallSize, 0, this.wallSize, this.canvas.height);

    // draw bubbles and particles
    this.bubbles.concat(this.particles).forEach(bubble => {
      if (!bubble.active) return;
      this.context.fillStyle = bubble.color;

      // draw a circle
      this.context.beginPath();
      this.context.arc(bubble.x, bubble.y, bubble.radius, 0, 2 * Math.PI);
      this.context.fill();
    });

    // draw fire arrow. since we're rotating the canvas we need to save
    // the state and restore it when we're done
    this.context.save();

    if (!this.curBubblePos) {
      return;
    }
    // move to the center of the rotation (the middle of the bubble)
    this.context.translate(this.curBubblePos.x, this.curBubblePos.y);
    this.context.rotate(this.shootDeg);

    // move to the top-left corner of or fire arrow
    this.context.translate(0, -this.grid / 2 * 4.5);

    // draw arrow ↑
    this.context.strokeStyle = 'white';
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.moveTo(0, 0);
    this.context.lineTo(0, this.grid * 2);
    this.context.moveTo(0, 0);
    this.context.lineTo(-10, this.grid * 0.4);
    this.context.moveTo(0, 0);
    this.context.lineTo(10, this.grid * 0.4);
    this.context.stroke();

    this.context.restore();

    // draw current bubble
    this.context.fillStyle = this.curBubble.color;
    this.context.beginPath();
    this.context.arc(this.curBubble.x, this.curBubble.y, this.curBubble.radius, 0, 2 * Math.PI);
    this.context.fill();
  }

// listen for keyboard events to move the fire arrow
  keydown($event: KeyboardEvent) {
    if ($event.code === 'ArrowLeft') {
      this.shootDir = -1;
    } else if ($event.code === 'ArrowRight') {
      this.shootDir = 1;
    }

    // if the current bubble is not moving we can launch it
    if ($event.code === 'Space' && this.curBubble && this.curBubble.dx === 0 && this.curBubble.dy === 0) {
      // convert an angle to x/y
      this.curBubble.dx = Math.sin(this.shootDeg) * this.curBubble.speed;
      this.curBubble.dy = -Math.cos(this.shootDeg) * this.curBubble.speed;
    }
  }

// listen for keyboard events to stop moving the fire arrow if key is
// released
  keyup($event: KeyboardEvent) {

    if (
      // only reset shoot dir if the released key is also the current
      // direction of movement. otherwise if you press down both arrow
      // keys at the same time and then release one of them, the arrow
      // stops moving even though you are still pressing a key
      ($event.code === 'ArrowLeft' && this.shootDir === -1) ||
      ($event.code === 'ArrowRight' && this.shootDir === 1)
    ) {
      this.shootDir = 0;
    }
  }

  start() {

// start the game
    requestAnimationFrame(() => this.loop());
  }
}
