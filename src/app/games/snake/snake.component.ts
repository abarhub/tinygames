import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-snake',
  imports: [],
  templateUrl: './snake.component.html',
  styleUrl: './snake.component.scss'
})
export class SnakeComponent implements OnInit{

  canvas:any;
  context:any;

  // the canvas width & height, snake x & y, and the apple x & y, all need to be a multiples of the grid size in order for collision detection to work
// (e.g. 16 * 25 = 400)
  grid = 16;
  count = 0;
  snake = {
    x: 160,
    y: 160,

    // snake velocity. moves one grid length every frame in either the x or y direction
    dx: this.grid,
    dy: 0,

    // keep track of all grids the snake body occupies
    cells: <any[]>[],

    // length of the snake. grows when eating an apple
    maxCells: 4
  };
  apple = {
    x: 320,
    y: 320
  };

  constructor() { }

  ngOnInit(): void {

    this.canvas = document.getElementById('game');
    if(this.canvas) {
      this.context = this.canvas.getContext('2d');

    }

    //requestAnimationFrame(this.loop);

  }

  // get random whole numbers in a specific range
// @see https://stackoverflow.com/a/1527820/2124254
  getRandomInt(min:number, max:number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

// game loop
  loop() {
    console.log('loop');
    const this2=this;
    requestAnimationFrame(()=>this2.loop());
    console.log('loop suite');

    // slow game loop to 15 fps instead of 60 (60/15 = 4)
    if (++this.count < 4) {
      return;
    }
    console.log('loop suite2');

    this.count = 0;
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

    // move snake by it's velocity
    this.snake.x += this.snake.dx;
    this.snake.y += this.snake.dy;

    // wrap snake position horizontally on edge of screen
    if (this.snake.x < 0) {
      this.snake.x = this.canvas.width - this.grid;
    }
    else if (this.snake.x >= this.canvas.width) {
      this.snake.x = 0;
    }

    // wrap snake position vertically on edge of screen
    if (this.snake.y < 0) {
      this.snake.y = this.canvas.height - this.grid;
    }
    else if (this.snake.y >= this.canvas.height) {
      this.snake.y = 0;
    }

    // keep track of where snake has been. front of the array is always the head
    this.snake.cells.unshift({x: this.snake.x, y: this.snake.y});

    // remove cells as we move away from them
    if (this.snake.cells.length > this.snake.maxCells) {
      this.snake.cells.pop();
    }

    // draw apple
    this.context.fillStyle = 'red';
    this.context.fillRect(this.apple.x, this.apple.y, this.grid-1, this.grid-1);

    // draw snake one cell at a time
    this.context.fillStyle = 'green';
    const this0=this;
    this.snake.cells.forEach(function(cell:any, index:number) {

      // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
      this0.context.fillRect(cell.x, cell.y, this0.grid-1, this0.grid-1);

      // snake ate apple
      if (cell.x ===this0. apple.x && cell.y === this0.apple.y) {
        this0.snake.maxCells++;

        // canvas is 400x400 which is 25x25 grids
        this0.apple.x = this0.getRandomInt(0, 25) * this0.grid;
        this0.apple.y = this0.getRandomInt(0, 25) * this0.grid;
      }

      // check collision with all cells after this one (modified bubble sort)
      for (var i = index + 1; i < this0.snake.cells.length; i++) {

        // snake occupies same space as a body part. reset game
        if (cell.x === this0.snake.cells[i].x && cell.y === this0.snake.cells[i].y) {
          this0.snake.x = 160;
          this0.snake.y = 160;
          this0.snake.cells = [];
          this0.snake.maxCells = 4;
          this0.snake.dx = this0.grid;
          this0.snake.dy = 0;

          this0.apple.x = this0.getRandomInt(0, 25) * this0.grid;
          this0.apple.y = this0.getRandomInt(0, 25) * this0.grid;
        }
      }
    });
  }

  start() {
    console.log('start','canvas:',this.canvas,'context',this.context);
    requestAnimationFrame(()=>this.loop());
  }

  keydown($event: KeyboardEvent) {
    // prevent snake from backtracking on itself by checking that it's
    // not already moving on the same axis (pressing left while moving
    // left won't do anything, and pressing right while moving left
    // shouldn't let you collide with your own body)

    // left arrow key
    if ($event.which === 37 && this.snake.dx === 0) {
      this.snake.dx = -this.grid;
      this.snake.dy = 0;
    }
    // up arrow key
    else if ($event.which === 38 && this.snake.dy === 0) {
      this.snake.dy = -this.grid;
      this.snake.dx = 0;
    }
    // right arrow key
    else if ($event.which === 39 && this.snake.dx === 0) {
      this.snake.dx = this.grid;
      this.snake.dy = 0;
    }
    // down arrow key
    else if ($event.which === 40 && this.snake.dy === 0) {
      this.snake.dy = this.grid;
      this.snake.dx = 0;
    }
  }
}
