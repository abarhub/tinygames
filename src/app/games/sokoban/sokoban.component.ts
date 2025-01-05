import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-sokoban',
  imports: [],
  templateUrl: './sokoban.component.html',
  styleUrl: './sokoban.component.scss'
})
export class SokobanComponent implements OnInit {

  canvas:any;
  context:any;

  grid = 64;

// create a new canvas and draw the wall image. then we can use this
// canvas to draw the images later on
  wallCanvas:any;//  :HTMLCanvasElement|null = null;
  wallCtx:any;

  // the direction to move the player each frame. we'll use change in
// direction so "row: 1" means move down 1 row, "row: -1" means move
// up one row, etc.
  playerDir = { row: 0, col: 0 };
  playerPos = { row: 0, col: 0 };  // player position in the 2d array
  rAF:number|null = null;  // keep track of the animation frame so we can cancel it
  width = 0;  // find the largest row and use that as the game width


// create a mapping of object types using the sok file format
// @see http://www.sokobano.de/wiki/index.php?title=Level_format
  types = {
    wall: '#',
    player: '@',
    playerOnGoal: '+',
    block: '$',
    blockOnGoal: '*',
    goal: '.',
    empty: ' '
  };

// a sokoban level using the sok file format
  level1 = `
  #####
###   #
#.@$  #
### $.#
#.##$ #
# # . ##
#$ *$$.#
#   .  #
########
`;

// keep track of what is in every cell of the game using a 2d array
  cells:any[] = [];


  ngOnInit(): void {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');

    this.wallCanvas = document.createElement('canvas');
    this.wallCtx = this.wallCanvas.getContext('2d');
    this.wallCanvas.width = this.wallCanvas.height = this.grid;

    this.wallCtx.fillStyle = '#5b5530';
    this.wallCtx.fillRect(0, 0, this.grid, this.grid);
    this.wallCtx.fillStyle = '#a19555';

// 1st row brick
    this.wallCtx.fillRect(1, 1, this.grid - 2, 20);

// 2nd row bricks
    this.wallCtx.fillRect(0, 23, 20, 18);
    this.wallCtx.fillRect(22, 23, 42, 18);

// 3rd row bricks
    this.wallCtx.fillRect(0, 43, 42, 20);
    this.wallCtx.fillRect(44, 43, 20, 20);

    // use each line of the level as the row (remove empty lines)
    this.level1.split('\n')
      .filter(rowData => !!rowData)
      .forEach((rowData, row) => {
        this.cells[row] = [];

        if (rowData.length > this.width) {
          this.width = rowData.length;
        }

        // use each character of the level as the col
        rowData.split('').forEach((colData, col) => {
          this.cells[row][col] = colData;

          if (colData === this.types.player || colData === this.types.playerOnGoal) {
            this.playerPos = { row, col };
          }
        });
      });


// update the size of the canvas to the level size
    this.canvas.width = this.width * this.grid;
    this.canvas.height = this.cells.length * this.grid;

  }


// move an entity from one cell to another
  move(startPos:any, endPos :any) {
    const startCell = this.cells[startPos.row][startPos.col];
    const endCell = this.cells[endPos.row][endPos.col];

    const isPlayer = startCell === this.types.player || startCell === this.types.playerOnGoal;

    // first remove then entity from its current cell
    switch(startCell) {

      // if the start cell is the player or a block (no goal)
      // then leave empty
      case this.types.player:
      case this.types.block:
        this.cells[startPos.row][startPos.col] = this.types.empty;
        break;

      // if the start cell has a goal then leave a goal
      case this.types.playerOnGoal:
      case this.types.blockOnGoal:
        this.cells[startPos.row][startPos.col] = this.types.goal;
        break;
    }

    // then move then entity into the new cell
    switch(endCell) {

      // if the end cell is empty, add the block or player
      case this.types.empty:
        this.cells[endPos.row][endPos.col] = isPlayer ? this.types.player : this.types.block;
        break;

      // if the cell has a goal then make sure to preserve the goal
      case this.types.goal:
        this.cells[endPos.row][endPos.col] = isPlayer ? this.types.playerOnGoal : this.types.blockOnGoal;
        break;
    }
  }

// show the win screen
  showWin() {
    if (this.rAF) {
      cancelAnimationFrame(this.rAF);
    }

    this.context.fillStyle = 'black';
    this.context.globalAlpha = 0.75;
    this.context.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);

    this.context.globalAlpha = 1;
    this.context.fillStyle = 'white';
    this.context.font = '36px monospace';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2);
  }

// game loop
  loop() {
    this.rAF = requestAnimationFrame(()=>this.loop());
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

    // check to see if the player can move in the desired direction
    const row = this.playerPos.row + this.playerDir.row;
    const col = this.playerPos.col + this.playerDir.col;
    const cell = this.cells[row][col];
    switch(cell) {

      // allow the player to move into empty or goal cells
      case this.types.empty:
      case this.types.goal:
        this.move(this.playerPos, { row, col });

        this.playerPos.row = row;
        this.playerPos.col = col;
        break;

      // don't allow the player to move into a wall cell
      case this.types.wall:
        break;

      // only allow the player to move into a block cell if the cell
      // after the block is empty or a goal
      case this.types.block:
      case this.types.blockOnGoal:
        const nextRow = row + this.playerDir.row;
        const nextCol = col + this.playerDir.col;
        const nextCell = this.cells[nextRow][nextCol];

        if (nextCell === this.types.empty || nextCell === this.types.goal) {
          // move the block first, then the player
          this.move({ row, col }, { row: nextRow, col: nextCol });
          this.move(this.playerPos, { row, col });

          this.playerPos.row = row;
          this.playerPos.col = col;
        }
        break;
    }

    // reset player dir after checking move
    this.playerDir = { row: 0, col: 0 };

    // check to see if all blocks are on goals
    let allBlocksOnGoals = true;

    // draw the board. because multiple things can be drawn on the same
    // cell we shouldn't use a switch as that would only allow us to draw
    // a single thing per cell
    this.context.strokeStyle = 'black';
    this.context.lineWidth = 2;
    for (let row = 0; row < this.cells.length; row++) {
      for (let col = 0; col < this.cells[row].length; col++) {
        const cell = this.cells[row][col];

        if (cell === this.types.wall) {
          this.context.drawImage(this.wallCanvas, col * this.grid, row * this.grid);
        }

        if (cell === this.types.block || cell === this.types.blockOnGoal) {
          if (cell === this.types.block) {
            this.context.fillStyle = '#ffbb5b';

            // block is not on goal
            allBlocksOnGoals = false;
          }
          else {
            this.context.fillStyle = '#ba6a15';
          }

          this.context.fillRect(col * this.grid, row * this.grid, this.grid, this.grid);
          this.context.strokeRect(col * this.grid, row * this.grid, this.grid, this.grid);
          this.context.strokeRect((col + 0.1) * this.grid, (row + 0.1) * this.grid, this.grid - (0.2 * this.grid), this.grid - (0.2 * this.grid));

          // X
          this.context.beginPath();
          this.context.moveTo((col + 0.1) * this.grid, (row + 0.1) * this.grid);
          this.context.lineTo((col + 0.9) * this.grid, (row + 0.9) * this.grid);
          this.context.moveTo((col + 0.9) * this.grid, (row + 0.1) * this.grid);
          this.context.lineTo((col + 0.1) * this.grid, (row + 0.9) * this.grid);
          this.context.stroke();
        }

        if (cell === this.types.goal || cell === this.types.playerOnGoal) {
          this.context.fillStyle = '#914430';
          this.context.beginPath();
          this.context.arc((col + 0.5) * this.grid, (row + 0.5) * this.grid, 10, 0, Math.PI * 2);
          this.context.fill();
        }

        if (cell === this.types.player || cell === this.types.playerOnGoal) {
          this.context.fillStyle = 'black';
          this.context.beginPath();

          // head
          this.context.arc((col + 0.5) * this.grid, (row + 0.3) * this.grid, 8, 0, Math.PI * 2);
          this.context.fill();
          // body
          this.context.fillRect((col + 0.48) * this.grid, (row + 0.3) * this.grid, 2, this.grid/ 2.5 );
          // arms
          this.context.fillRect((col + 0.3) * this.grid, (row + 0.5) * this.grid, this.grid / 2.5, 2);
          // legs
          this.context.moveTo((col + 0.5) * this.grid, (row + 0.7) * this.grid);
          this.context.lineTo((col + 0.65) * this.grid, (row + 0.9) * this.grid);
          this.context.moveTo((col + 0.5) * this.grid, (row + 0.7) * this.grid);
          this.context.lineTo((col + 0.35) * this.grid, (row + 0.9) * this.grid);
          this.context.stroke();
        }
      }
    }

    if (allBlocksOnGoals) {
      this.showWin();
    }
  }


// listen to keyboard events to move the player
  //document.addEventListener('keydown', function(e) {
  keydown($event: KeyboardEvent){
    this.playerDir = { row: 0, col: 0};

    // left arrow key
    if ($event.which === 37) {
      this.playerDir.col = -1;
    }
    // up arrow key
    else if ($event.which === 38) {
      this.playerDir.row = -1;
    }
    // right arrow key
    else if ($event.which === 39) {
      this.playerDir.col = 1;
    }
    // down arrow key
    else if ($event.which === 40) {
      this.playerDir.row = 1;
    }
  }

// start the game
//   requestAnimationFrame(loop);


  start() {
    requestAnimationFrame(()=>this.loop());
  }

}
