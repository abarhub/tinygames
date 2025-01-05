import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-breakout',
  imports: [],
  templateUrl: './breakout.component.html',
  styleUrl: './breakout.component.scss'
})
export class BreakoutComponent implements OnInit {

  canvas:any;
  context:any;

// each row is 14 bricks long. the level consists of 6 blank rows then 8 rows
// of 4 colors: red, orange, green, and yellow
  level1 = [
    [],
    [],
    [],
    [],
    [],
    [],
    ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
    ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
    ['O','O','O','O','O','O','O','O','O','O','O','O','O','O'],
    ['O','O','O','O','O','O','O','O','O','O','O','O','O','O'],
    ['G','G','G','G','G','G','G','G','G','G','G','G','G','G'],
    ['G','G','G','G','G','G','G','G','G','G','G','G','G','G'],
    ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y'],
    ['Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y','Y']
  ];

// create a mapping between color short code (R, O, G, Y) and color name
  colorMap:any = {
    'R': 'red',
    'O': 'orange',
    'G': 'green',
    'Y': 'yellow'
  };

// use a 2px gap between each brick
  brickGap = 2;
  brickWidth = 25;
  brickHeight = 12;

// the wall width takes up the remaining space of the canvas width. with 14 bricks
// and 13 2px gaps between them, thats: 400 - (14 * 25 + 2 * 13) = 24px. so each
// wall will be 12px
  wallSize = 12;
  bricks:any[] = [];

  paddle:any;/* = {
    // place the paddle horizontally in the middle of the screen
    x: canvas.width / 2 - brickWidth / 2,
    y: 440,
    width: brickWidth,
    height: brickHeight,

    // paddle x velocity
    dx: 0
  };*/

  ball = {
    x: 130,
    y: 260,
    width: 5,
    height: 5,

    // how fast the ball should go in either the x or y direction
    speed: 2,

    // ball velocity
    dx: 0,
    dy: 0
  };


  ngOnInit(): void {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');


// create the level by looping over each row and column in the level1 array
// and creating an object with the bricks position (x, y) and color
    for (let row = 0; row < this.level1.length; row++) {
      for (let col = 0; col < this.level1[row].length; col++) {
        const colorCode = this.level1[row][col];

        this.bricks.push({
          x: this.wallSize + (this.brickWidth + this.brickGap) * col,
          y: this.wallSize + (this.brickHeight + this.brickGap) * row,
          color: this.colorMap[colorCode],
          width: this.brickWidth,
          height: this.brickHeight
        });
      }
    }

    this.paddle = {
      // place the paddle horizontally in the middle of the screen
      x: this.canvas.width / 2 - this.brickWidth / 2,
      y: 440,
      width: this.brickWidth,
      height: this.brickHeight,

      // paddle x velocity
      dx: 0
    };

  }


// check for collision between two objects using axis-aligned bounding box (AABB)
// @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  collides(obj1:any, obj2:any) {
    return obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y;
  }

// game loop
  loop() {
    requestAnimationFrame(()=>this.loop());
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

    // move paddle by it's velocity
    this.paddle.x += this.paddle.dx;

    // prevent paddle from going through walls
    if (this.paddle.x < this.wallSize) {
      this.paddle.x = this.wallSize
    }
    else if (this.paddle.x + this.brickWidth > this.canvas.width - this.wallSize) {
      this.paddle.x = this.canvas.width - this.wallSize - this.brickWidth;
    }

    // move ball by it's velocity
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // prevent ball from going through walls by changing its velocity
    // left & right walls
    if (this.ball.x < this.wallSize) {
      this.ball.x = this.wallSize;
      this.ball.dx *= -1;
    }
    else if (this.ball.x + this.ball.width > this.canvas.width - this.wallSize) {
      this.ball.x = this.canvas.width - this.wallSize - this.ball.width;
      this.ball.dx *= -1;
    }
    // top wall
    if (this.ball.y < this.wallSize) {
      this.ball.y = this.wallSize;
      this.ball.dy *= -1;
    }

    // reset ball if it goes below the screen
    if (this.ball.y > this.canvas.height) {
      this.ball.x = 130;
      this.ball.y = 260;
      this.ball.dx = 0;
      this.ball.dy = 0;
    }

    // check to see if ball collides with paddle. if they do change y velocity
    if (this.collides(this.ball, this.paddle)) {
      this.ball.dy *= -1;

      // move ball above the paddle otherwise the collision will happen again
      // in the next frame
      this.ball.y = this.paddle.y - this.ball.height;
    }

    // check to see if ball collides with a brick. if it does, remove the brick
    // and change the ball velocity based on the side the brick was hit on
    for (let i = 0; i < this.bricks.length; i++) {
      const brick = this.bricks[i];

      if (this.collides(this.ball, brick)) {
        // remove brick from the bricks array
        this.bricks.splice(i, 1);

        // ball is above or below the brick, change y velocity
        // account for the balls speed since it will be inside the brick when it
        // collides
        if (this.ball.y + this.ball.height - this.ball.speed <= brick.y ||
          this.ball.y >= brick.y + brick.height - this.ball.speed) {
          this.ball.dy *= -1;
        }
        // ball is on either side of the brick, change x velocity
        else {
          this.ball.dx *= -1;
        }

        break;
      }
    }

    // draw walls
    this.context.fillStyle = 'lightgrey';
    this.context.fillRect(0, 0, this.canvas.width, this.wallSize);
    this.context.fillRect(0, 0, this.wallSize, this.canvas.height);
    this.context.fillRect(this.canvas.width - this.wallSize, 0, this.wallSize, this.canvas.height);

    // draw ball if it's moving
    if (this.ball.dx || this.ball.dy) {
      this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
    }

    // draw bricks
    this.bricks.forEach((brick)=> {
      this.context.fillStyle = brick.color;
      this.context.fillRect(brick.x, brick.y, brick.width, brick.height);
    });

    // draw paddle
    this.context.fillStyle = 'cyan';
    this.context.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
  }



  // listen to keyboard events to move the paddle
  keydown($event: KeyboardEvent) {
// left arrow key
    if ($event.which === 37) {
      this.paddle.dx = -3;
    }
    // right arrow key
    else if ($event.which === 39) {
      this.paddle.dx = 3;
    }

    // space key
    // if they ball is not moving, we can launch the ball using the space key. ball
    // will move towards the bottom right to start
    if (this.ball.dx === 0 && this.ball.dy === 0 && $event.which === 32) {
      this.ball.dx = this.ball.speed;
      this.ball.dy = this.ball.speed;
    }
  }

  // listen to keyboard events to stop the paddle if key is released
  keyup($event: KeyboardEvent) {
    if ($event.which === 37 || $event.which === 39) {
      this.paddle.dx = 0;
    }
  }


  start() {
// start the game
    requestAnimationFrame(()=>this.loop());
  }
}
