import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-pong',
  imports: [],
  templateUrl: './pong.component.html',
  styleUrl: './pong.component.scss'
})
export class PongComponent implements OnInit {

  canvas:any;
  context:any;
  grid = 15;
  paddleHeight = this.grid * 5; // 80
  maxPaddleY :number=0;

  paddleSpeed = 6;
  ballSpeed = 5;

  leftPaddle:any;
  rightPaddle:any;
  ball:any;


  ngOnInit(): void {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');
    this.maxPaddleY = this.canvas.height - this.grid - this.paddleHeight;

    this.leftPaddle = {
      // start in the middle of the game on the left side
      x: this.grid * 2,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      width: this.grid,
      height: this.paddleHeight,

      // paddle velocity
      dy: 0
    };
    this.rightPaddle = {
      // start in the middle of the game on the right side
      x: this.canvas.width - this.grid * 3,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      width: this.grid,
      height: this.paddleHeight,

      // paddle velocity
      dy: 0
    };
    this.ball = {
      // start in the middle of the game
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: this.grid,
      height: this.grid,

      // keep track of when need to reset the ball position
      resetting: false,

      // ball velocity (start going to the top-right corner)
      dx: this.ballSpeed,
      dy: -this.ballSpeed
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

    // move paddles by their velocity
    this.leftPaddle.y += this.leftPaddle.dy;
    this.rightPaddle.y += this.rightPaddle.dy;

    // prevent paddles from going through walls
    if (this.leftPaddle.y < this.grid) {
      this.leftPaddle.y = this.grid;
    }
    else if (this.leftPaddle.y > this.maxPaddleY) {
      this.leftPaddle.y = this.maxPaddleY;
    }

    if (this.rightPaddle.y < this.grid) {
      this.rightPaddle.y = this.grid;
    }
    else if (this.rightPaddle.y > this.maxPaddleY) {
      this.rightPaddle.y = this.maxPaddleY;
    }

    // draw paddles
    this.context.fillStyle = 'white';
    this.context.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
    this.context.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);

    // move ball by its velocity
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // prevent ball from going through walls by changing its velocity
    if (this.ball.y < this.grid) {
      this.ball.y = this.grid;
      this.ball.dy *= -1;
    }
    else if (this.ball.y + this.grid > this.canvas.height - this.grid) {
      this.ball.y = this.canvas.height - this.grid * 2;
      this.ball.dy *= -1;
    }

    // reset ball if it goes past paddle (but only if we haven't already done so)
    if ( (this.ball.x < 0 || this.ball.x > this.canvas.width) && !this.ball.resetting) {
      this.ball.resetting = true;

      // give some time for the player to recover before launching the ball again
      setTimeout(() => {
        this.ball.resetting = false;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
      }, 400);
    }

    // check to see if ball collides with paddle. if they do change x velocity
    if (this.collides(this.ball, this.leftPaddle)) {
      this.ball.dx *= -1;

      // move ball next to the paddle otherwise the collision will happen again
      // in the next frame
      this.ball.x = this.leftPaddle.x + this.leftPaddle.width;
    }
    else if (this.collides(this.ball, this.rightPaddle)) {
      this.ball.dx *= -1;

      // move ball next to the paddle otherwise the collision will happen again
      // in the next frame
      this.ball.x = this.rightPaddle.x - this.ball.width;
    }

    // draw ball
    this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);

    // draw walls
    this.context.fillStyle = 'lightgrey';
    this.context.fillRect(0, 0, this.canvas.width, this.grid);
    this.context.fillRect(0, this.canvas.height - this.grid, this.canvas.width, this.canvas.height);

    // draw dotted line down the middle
    for (let i = this.grid; i < this.canvas.height - this.grid; i += this.grid * 2) {
      this.context.fillRect(this.canvas.width / 2 - this.grid / 2, i, this.grid, this.grid);
    }
  }

// listen to keyboard events to move the paddles
  keydown($event: KeyboardEvent) {

    // up arrow key
    if ($event.which === 38) {
      this.rightPaddle.dy = -this.paddleSpeed;
    }
    // down arrow key
    else if ($event.which === 40) {
      this.rightPaddle.dy = this.paddleSpeed;
    }

    // w key
    if ($event.which === 87) {
      this.leftPaddle.dy = -this.paddleSpeed;
    }
    // a key
    else if ($event.which === 83) {
      this.leftPaddle.dy = this.paddleSpeed;
    }
  }

  // listen to keyboard events to stop the paddle if key is released
  keyup($event: KeyboardEvent) {
    if ($event.which === 38 || $event.which === 40) {
      this.rightPaddle.dy = 0;
    }

    if ($event.which === 83 || $event.which === 87) {
      this.leftPaddle.dy = 0;
    }
  }

  start() {

// start the game
    requestAnimationFrame(()=>this.loop());
  }

}
