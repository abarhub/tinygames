import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-tetris',
  imports: [],
  templateUrl: './tetris.component.html',
  styleUrl: './tetris.component.scss'
})
export class TetrisComponent implements OnInit {

  canvas:any;
  context:any;
  grid:number = 32;
  tetrominoSequence:string[] = [];
  playfield:number[][]=[];
  count:number = 0;
  tetromino:any;
  rAF:any = null;  // keep track of the animation frame so we can cancel it
  gameOver = false;

  // how to draw each tetromino
// @see https://tetris.fandom.com/wiki/SRS
  tetrominos:any = {
    'I': [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    'J': [
      [1,0,0],
      [1,1,1],
      [0,0,0],
    ],
    'L': [
      [0,0,1],
      [1,1,1],
      [0,0,0],
    ],
    'O': [
      [1,1],
      [1,1],
    ],
    'S': [
      [0,1,1],
      [1,1,0],
      [0,0,0],
    ],
    'Z': [
      [1,1,0],
      [0,1,1],
      [0,0,0],
    ],
    'T': [
      [0,1,0],
      [1,1,1],
      [0,0,0],
    ]
  };

  // color of each tetromino
  colors:any = {
    'I': 'cyan',
    'O': 'yellow',
    'T': 'purple',
    'S': 'green',
    'Z': 'red',
    'J': 'blue',
    'L': 'orange'
  };


  ngOnInit(): void {

    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');


// keep track of what is in every cell of the game using a 2d array
// tetris playfield is 10x20, with a few rows offscreen
    //const playfield = [];

// populate the empty state
    for (let row = -2; row < 20; row++) {
      this.playfield[row] = [];

      for (let col = 0; col < 10; col++) {
        this.playfield[row][col] = 0;
      }
    }
  }

// https://tetris.fandom.com/wiki/Tetris_Guideline

// get a random integer between the range of [min,max]
// @see https://stackoverflow.com/a/1527820/2124254
  getRandomInt(min:number, max:number):number {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

// generate a new tetromino sequence
// @see https://tetris.fandom.com/wiki/Random_Generator
  generateSequence() {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    while (sequence.length) {
      const rand = this.getRandomInt(0, sequence.length - 1);
      const name = sequence.splice(rand, 1)[0];
      this.tetrominoSequence.push(name);
    }
  }

// get the next tetromino in the sequence
  getNextTetromino() {
    if (this.tetrominoSequence.length === 0) {
      this.generateSequence();
    }

    const name = this.tetrominoSequence.pop();
    // @ts-ignore
    const matrix = this.tetrominos[name];

    // I and O start centered, all others start in left-middle
    const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

    // I starts on row 21 (-1), all others start on row 22 (-2)
    const row = name === 'I' ? -1 : -2;

    return {
      name: name,      // name of the piece (L, O, etc.)
      matrix: matrix,  // the current rotation matrix
      row: row,        // current row (starts offscreen)
      col: col         // current col
    };
  }

// rotate an NxN matrix 90deg
// @see https://codereview.stackexchange.com/a/186834
  rotate(matrix:number[][]) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
      row.map((val, j) => matrix[N - j][i])
    );

    return result;
  }

// check to see if the new matrix/row/col is valid
  isValidMove(matrix:number[][], cellRow:number, cellCol:number) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] && (
          // outside the game bounds
          cellCol + col < 0 ||
          cellCol + col >= this.playfield[0].length ||
          cellRow + row >= this.playfield.length ||
          // collides with another piece
          this.playfield[cellRow + row][cellCol + col])
        ) {
          return false;
        }
      }
    }

    return true;
  }

// place the tetromino on the playfield
  placeTetromino() {
    for (let row = 0; row < this.tetromino.matrix.length; row++) {
      for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
        if (this.tetromino.matrix[row][col]) {

          // game over if piece has any part offscreen
          if (this.tetromino.row + row < 0) {
            return this.showGameOver();
          }

          this.playfield[this.tetromino.row + row][this.tetromino.col + col] = this.tetromino.name;
        }
      }
    }

    // check for line clears starting from the bottom and working our way up
    for (let row = this.playfield.length - 1; row >= 0; ) {
      if (this.playfield[row].every(cell => !!cell)) {

        // drop every row above this one
        for (let r = row; r >= 0; r--) {
          for (let c = 0; c < this.playfield[r].length; c++) {
            this.playfield[r][c] = this.playfield[r-1][c];
          }
        }
      }
      else {
        row--;
      }
    }

    this.tetromino = this.getNextTetromino();
  }

// show the game over screen
  showGameOver() {
    cancelAnimationFrame(this.rAF);
    this.gameOver = true;

    this.context.fillStyle = 'black';
    this.context.globalAlpha = 0.75;
    this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);

    this.context.globalAlpha = 1;
    this.context.fillStyle = 'white';
    this.context.font = '36px monospace';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText('GAME OVER!', this.canvas.width / 2, this.canvas.height / 2);
  }





// let count = 0;
// let tetromino = getNextTetromino();
// let rAF = null;  // keep track of the animation frame so we can cancel it
// let gameOver = false;

// game loop
loop() {
  this.rAF = requestAnimationFrame(()=>this.loop());
  this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

  // draw the playfield
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (this.playfield[row][col]) {
        const name = this.playfield[row][col];
        // @ts-ignore
        this.context.fillStyle = this.colors[name];

        // drawing 1 px smaller than the grid creates a grid effect
        this.context.fillRect(col * this.grid, row * this.grid, this.grid-1, this.grid-1);
      }
    }
  }

  // draw the active tetromino
  if (this.tetromino) {

    // tetromino falls every 35 frames
    if (++this.count > 35) {
      this.tetromino.row++;
      this.count = 0;

      // place piece if it runs into anything
      if (!this.isValidMove(this.tetromino.matrix, this.tetromino.row, this.tetromino.col)) {
        this.tetromino.row--;
        this.placeTetromino();
      }
    }

    // @ts-ignore
    this.context.fillStyle = this.colors[this.tetromino.name];

    for (let row = 0; row < this.tetromino.matrix.length; row++) {
      for (let col = 0; col < this.tetromino.matrix[row].length; col++) {
        if (this.tetromino.matrix[row][col]) {

          // drawing 1 px smaller than the grid creates a grid effect
          this.context.fillRect((this.tetromino.col + col) * this.grid, (this.tetromino.row + row) * this.grid, this.grid-1, this.grid-1);
        }
      }
    }
  }
}

// listen to keyboard events to move the active tetromino
// document.addEventListener('keydown', function(e) {
keydown($event: KeyboardEvent){
  if (this.gameOver) return;

  // left and right arrow keys (move)
  if ($event.which === 37 || $event.which === 39) {
    const col = $event.which === 37
      ? this.tetromino.col - 1
      : this.tetromino.col + 1;

    if (this.isValidMove(this.tetromino.matrix, this.tetromino.row, col)) {
      this.tetromino.col = col;
    }
  }

  // up arrow key (rotate)
  if ($event.which === 38) {
    const matrix = this.rotate(this.tetromino.matrix);
    if (this.isValidMove(matrix, this.tetromino.row, this.tetromino.col)) {
      this.tetromino.matrix = matrix;
    }
  }

  // down arrow key (drop)
  if($event.which === 40) {
    const row = this.tetromino.row + 1;

    if (!this.isValidMove(this.tetromino.matrix, row, this.tetromino.col)) {
      this.tetromino.row = row - 1;

      this.placeTetromino();
      return;
    }

    this.tetromino.row = row;
  }
}


  start() {
    this.tetromino = this.getNextTetromino();
    requestAnimationFrame(()=>this.loop());
  }
}
