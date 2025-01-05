import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-bomberman',
  imports: [],
  templateUrl: './bomberman.component.html',
  styleUrl: './bomberman.component.scss'
})
export class BombermanComponent implements OnInit{

  canvas:any;
  context:any;
  grid = 64;
  numRows = 13;
  numCols = 15;

// create a new canvas and draw the soft wall image. then we can use this
// canvas to draw the images later on
  softWallCanvas:any;
  softWallCtx:any;

  wallCanvas:any;
  wallCtx:any;


// create a mapping of object types
  types = {
    wall: '▉',
    softWall: 1,
    bomb: 2
  };

// keep track of all entities
  entities:any[] = [];

// keep track of what is in every cell of the game using a 2d array. the
// template is used to note where walls are and where soft walls cannot spawn.
// '▉' represents a wall
// 'x' represents a cell that cannot have a soft wall (player start zone)
  cells:any[] = [];
  template = [
    ['▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉'],
    ['▉','x','x',   ,   ,   ,   ,   ,   ,   ,   ,   ,'x','x','▉'],
    ['▉','x','▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉','x','▉'],
    ['▉','x',   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,'x','▉'],
    ['▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉'],
    ['▉',   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,'▉'],
    ['▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉'],
    ['▉',   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,'▉'],
    ['▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉'],
    ['▉','x',   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,   ,'x','▉'],
    ['▉','x','▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉',   ,'▉','x','▉'],
    ['▉','x','x',   ,   ,   ,   ,   ,   ,   ,   ,   ,'x','x','▉'],
    ['▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉','▉']
  ];


// player character (just a simple circle)
  player:Player|null=null/* = {
    row: 1,
    col: 1,
    numBombs: 1,
    bombSize: 3,
    radius: this.grid * 0.35,
    render() {
      const x = (this.col + 0.5) * this.grid;
      const y = (this.row + 0.5) * this.grid;

      this.context.save();
      this.context.fillStyle = 'white';
      this.context.beginPath();
      this.context.arc(x, y, this.radius, 0, 2 * Math.PI);
      this.context.fill();
    }
  }*/

// game loop
  last:any;
  dt:any;

  ngOnInit(): void {
    this.canvas = document.getElementById('game');
    this.context = this.canvas.getContext('2d');

    this.softWallCanvas = document.createElement('canvas');
    this.softWallCtx = this.softWallCanvas.getContext('2d');
    this.softWallCanvas.width = this.softWallCanvas.height = this.grid;

    this.softWallCtx.fillStyle = 'black';
    this.softWallCtx.fillRect(0, 0, this.grid, this.grid);
    this.softWallCtx.fillStyle = '#a9a9a9';

// 1st row brick
    this.softWallCtx.fillRect(1, 1, this.grid - 2, 20);

// 2nd row bricks
    this.softWallCtx.fillRect(0, 23, 20, 18);
    this.softWallCtx.fillRect(22, 23, 42, 18);

// 3rd row bricks
    this.softWallCtx.fillRect(0, 43, 42, 20);
    this.softWallCtx.fillRect(44, 43, 20, 20);

    this.wallCanvas = document.createElement('canvas');
    this.wallCtx = this.wallCanvas.getContext('2d');

    this.wallCanvas.width = this.wallCanvas.height = this.grid;

    this.wallCtx.fillStyle = 'black';
    this.wallCtx.fillRect(0, 0, this.grid, this.grid);
    this.wallCtx.fillStyle = 'white';
    this.wallCtx.fillRect(0, 0, this.grid - 2, this.grid - 2);
    this.wallCtx.fillStyle = '#a9a9a9';
    this.wallCtx.fillRect(2, 2, this.grid - 4, this.grid - 4);

    this.player=new Player(1,1,1,3,this.grid,this.context);
  }


// populate the level with walls and soft walls
  generateLevel() {
    this.cells = [];

    for (let row = 0; row < this.numRows; row++) {
      this.cells[row] = [];

      for (let col = 0; col < this.numCols; col++) {

        // 90% chance cells will contain a soft wall
        if (!this.template[row][col] && Math.random() < 0.90) {
          this.cells[row][col] = this.types.softWall;
        }
        else if (this.template[row][col] === this.types.wall) {
          this.cells[row][col] = this.types.wall;
        }
      }
    }
  }

// blow up a bomb and its surrounding tiles
  blowUpBomb(bomb:Bomb) {

    // bomb has already exploded so don't blow up again
    if (!bomb.alive) return;

    bomb.alive = false;

    // remove bomb from grid
    this.cells[bomb.row][bomb.col] = null;

    // explode bomb outward by size
    const dirs = [{
      // up
      row: -1,
      col: 0
    }, {
      // down
      row: 1,
      col: 0
    }, {
      // left
      row: 0,
      col: -1
    }, {
      // right
      row: 0,
      col: 1
    }];
    dirs.forEach((dir) => {
      for (let i = 0; i < bomb.size; i++) {
        const row = bomb.row + dir.row * i;
        const col = bomb.col + dir.col * i;
        const cell = this.cells[row][col];

        // stop the explosion if it hit a wall
        if (cell === this.types.wall) {
          return;
        }

        // center of the explosion is the first iteration of the loop
        this.entities.push(new Explosion(row, col, dir, i === 0 ? true : false,this));
        this.cells[row][col] = null;

        // bomb hit another bomb so blow that one up too
        if (cell === this.types.bomb) {

          // find the bomb that was hit by comparing positions
          const nextBomb = this.entities.find((entity) => {
            return (
              entity.type === this.types.bomb &&
              entity.row === row && entity.col === col
            );
          });
          this.blowUpBomb(nextBomb);
        }

        // stop the explosion if hit anything
        if (cell) {
          return;
        }
      }
    });
  }

// bomb constructor function
  /*Bomb(row, col, size, owner) {
    this.row = row;
    this.col = col;
    this.radius = grid * 0.4;
    this.size = size;    // the size of the explosion
    this.owner = owner;  // which player placed this bomb
    this.alive = true;
    this.type = types.bomb;

    // bomb blows up after 3 seconds
    this.timer = 3000;

    // update the bomb each frame
    this.update = function(dt) {
      this.timer -= dt;

      // blow up bomb if timer is done
      if (this.timer <= 0) {
        return blowUpBomb(this);
      }

      // change the size of the bomb every half second. we can determine the size
      // by dividing by 500 (half a second) and taking the ceiling of the result.
      // then we can check if the result is even or odd and change the size
      const interval = Math.ceil(this.timer / 500);
      if (interval % 2 === 0) {
        this.radius = grid * 0.4;
      }
      else {
        this.radius = grid * 0.5;
      }
    };

    // render the bomb each frame
    this.render = function() {
      const x = (this.col + 0.5) * grid;
      const y = (this.row + 0.5) * grid;

      // draw bomb
      context.fillStyle = 'black';
      context.beginPath();
      context.arc(x, y, this.radius, 0, 2 * Math.PI);
      context.fill();

      // draw bomb fuse moving up and down with the bomb size
      const fuseY = (this.radius === grid * 0.5 ? grid * 0.15 : 0);
      context.strokeStyle = 'white';
      context.lineWidth = 5;
      context.beginPath();
      context.arc(
        (this.col + 0.75) * grid,
        (this.row + 0.25) * grid - fuseY,
        10, Math.PI, -Math.PI / 2
      );
      context.stroke();
    };
  }*/

// explosion constructor function
  /*Explosion(row, col, dir, center) {
    this.row = row;
    this.col = col;
    this.dir = dir;
    this.alive = true;

    // show explosion for 0.3 seconds
    this.timer = 300;

    // update the explosion each frame
    this.update = function(dt) {
      this.timer -= dt;

      if (this.timer <=0) {
        this.alive = false;
      }
    };

    // render the explosion each frame
    this.render = function() {
      const x = this.col * grid;
      const y = this.row * grid;
      const horizontal = this.dir.col;
      const vertical = this.dir.row;

      // create a fire effect by stacking red, orange, and yellow on top of
      // each other using progressively smaller rectangles
      context.fillStyle = '#D72B16';  // red
      context.fillRect(x, y, grid, grid);

      context.fillStyle = '#F39642';  // orange

      // determine how to draw based on if it's vertical or horizontal
      // center draws both ways
      if (center || horizontal) {
        context.fillRect(x, y + 6, grid, grid - 12);
      }
      if (center || vertical) {
        context.fillRect(x + 6, y, grid - 12, grid);
      }

      context.fillStyle = '#FFE5A8';  // yellow

      if (center || horizontal) {
        context.fillRect(x, y + 12, grid, grid - 24);
      }
      if (center || vertical) {
        context.fillRect(x + 12, y, grid - 24, grid);
      }
    };
  }*/

  loop(timestamp:number) {
    requestAnimationFrame((x)=>this.loop(x));
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height);

    // calculate the time difference since the last update. requestAnimationFrame
    // passes the current timestamp as a parameter to the loop
    if (!this.last) {
      this.last = timestamp;
    }
    this.dt = timestamp - this.last;
    this.last = timestamp;

    // update and render everything in the grid
    for (let row = 0; row < this.numRows; row++) {
      for (let col = 0; col < this.numCols; col++) {
        switch(this.cells[row][col]) {
          case this.types.wall:
            this.context.drawImage(this.wallCanvas, col * this.grid, row * this.grid);
            break;
          case this.types.softWall:
            this.context.drawImage(this.softWallCanvas, col * this.grid, row * this.grid);
            break;
        }
      }
    }

    // update and render all entities
    this.entities.forEach((entity) => {
      entity.update(this.dt);
      entity.render();
    });

    // remove dead entities
    this.entities = this.entities.filter((entity) => entity.alive);

    if(this.player) {
      this.player.render();
    }
  }

// listen to keyboard events to move the snake
  //document.addEventListener('keydown', function(e) {
  keydown($event: KeyboardEvent) {
    if(!this.player) return;
    let row = this.player.row;
    let col = this.player.col;

    // left arrow key
    if ($event.which === 37) {
      col--;
    }
    // up arrow key
    else if ($event.which === 38) {
      row--;
    }
    // right arrow key
    else if ($event.which === 39) {
      col++;
    }
    // down arrow key
    else if ($event.which === 40) {
      row++;
    }
    // space key (bomb)
    else if (
      $event.which === 32 && !this.cells[row][col] &&
      // count the number of bombs the player has placed
      this.entities.filter((entity) => {
        return entity.type === this.types.bomb && entity.owner === this.player
      }).length < this.player.numBombs
    ) {
      // place bomb
      const bomb = new Bomb(row, col, this.player.bombSize, this.player,this);
      this.entities.push(bomb);
      this.cells[row][col] = this.types.bomb;
    }

    // don't move the player if something is already at that position
    if (!this.cells[row][col]) {
      this.player.row = row;
      this.player.col = col;
    }
  }


  start() {
    this.generateLevel();
    requestAnimationFrame((x)=>this.loop(x));
  }
}

class Bomb {

  row:number;
  col:number;
  radius:number;
  size:number;
  owner:Player;
  alive:boolean;
  type:number;
  timer:number;
  bombermanComponent:BombermanComponent;

  constructor(row:number, col:number, size:number, owner:Player,bombermanComponent:BombermanComponent) {
    this.row = row;
    this.col = col;
    this.radius = bombermanComponent.grid * 0.4;
    this.size = size;    // the size of the explosion
    this.owner = owner;  // which player placed this bomb
    this.alive = true;
    this.type = bombermanComponent.types.bomb;
    this.bombermanComponent = bombermanComponent;

    // bomb blows up after 3 seconds
    this.timer = 3000;
  }

  update (dt:number) {
    this.timer -= dt;

    // blow up bomb if timer is done
    if (this.timer <= 0) {
      return this.bombermanComponent.blowUpBomb(this);
    }

    // change the size of the bomb every half second. we can determine the size
    // by dividing by 500 (half a second) and taking the ceiling of the result.
    // then we can check if the result is even or odd and change the size
    const interval = Math.ceil(this.timer / 500);
    if (interval % 2 === 0) {
      this.radius = this.bombermanComponent.grid * 0.4;
    }
    else {
      this.radius = this.bombermanComponent.grid * 0.5;
    }
  };

  // render the bomb each frame
  render () {
    const x = (this.col + 0.5) * this.bombermanComponent.grid;
    const y = (this.row + 0.5) * this.bombermanComponent.grid;

    // draw bomb
    this.bombermanComponent.context.fillStyle = 'black';
    this.bombermanComponent.context.beginPath();
    this.bombermanComponent.context.arc(x, y, this.radius, 0, 2 * Math.PI);
    this.bombermanComponent.context.fill();

    // draw bomb fuse moving up and down with the bomb size
    const fuseY = (this.radius === this.bombermanComponent.grid * 0.5 ? this.bombermanComponent.grid * 0.15 : 0);
    this.bombermanComponent.context.strokeStyle = 'white';
    this.bombermanComponent.context.lineWidth = 5;
    this.bombermanComponent.context.beginPath();
    this.bombermanComponent.context.arc(
      (this.col + 0.75) * this.bombermanComponent.grid,
      (this.row + 0.25) * this.bombermanComponent.grid - fuseY,
      10, Math.PI, -Math.PI / 2
    );
    this.bombermanComponent.context.stroke();
  };
}

class Explosion {

  row:number;
  col:number;
  dir:any;
  alive:boolean;
  timer:number;
  bombermanComponent:BombermanComponent;
  center:boolean;

  constructor(row:number, col:number, dir:any, center:boolean,bombermanComponent:BombermanComponent) {
    this.row = row;
    this.col = col;
    this.dir = dir;
    this.alive = true;
    this.bombermanComponent = bombermanComponent;
    this.center = center;

    // show explosion for 0.3 seconds
    this.timer = 300;
  }

  update (dt:number) {
    this.timer -= dt;

    if (this.timer <=0) {
      this.alive = false;
    }
  };

  // render the explosion each frame
  render () {
    const x = this.col * this.bombermanComponent.grid;
    const y = this.row * this.bombermanComponent.grid;
    const horizontal = this.dir.col;
    const vertical = this.dir.row;

    // create a fire effect by stacking red, orange, and yellow on top of
    // each other using progressively smaller rectangles
    this.bombermanComponent.context.fillStyle = '#D72B16';  // red
    this.bombermanComponent.context.fillRect(x, y, this.bombermanComponent.grid, this.bombermanComponent.grid);

    this.bombermanComponent.context.fillStyle = '#F39642';  // orange

    // determine how to draw based on if it's vertical or horizontal
    // center draws both ways
    if (this.center || horizontal) {
      this.bombermanComponent.context.fillRect(x, y + 6, this.bombermanComponent.grid, this.bombermanComponent.grid - 12);
    }
    if (this.center || vertical) {
      this.bombermanComponent.context.fillRect(x + 6, y, this.bombermanComponent.grid - 12, this.bombermanComponent.grid);
    }

    this.bombermanComponent.context.fillStyle = '#FFE5A8';  // yellow

    if (this.center || horizontal) {
      this.bombermanComponent.context.fillRect(x, y + 12, this.bombermanComponent.grid, this.bombermanComponent.grid - 24);
    }
    if (this.center || vertical) {
      this.bombermanComponent.context.fillRect(x + 12, y, this.bombermanComponent.grid - 24, this.bombermanComponent.grid);
    }
  }

}

class Player {
  row: number;
  col: number;
  numBombs: number;
  bombSize: number;
  radius: number;
  grid:number;
  context :any;

  constructor(row:number,col:number,numBombs:number,bombSize: number,grid:number,context :any) {
    this.row=row;
    this.col=col;
    this.numBombs=numBombs;
    this.bombSize=bombSize;
    this.radius=grid * 0.35;
    this.grid=grid;
    this.context=context;

  }

  render() {
    const x = (this.col + 0.5) * this.grid;
    const y = (this.row + 0.5) * this.grid;

    this.context.save();
    this.context.fillStyle = 'white';
    this.context.beginPath();
    this.context.arc(x, y, this.radius, 0, 2 * Math.PI);
    this.context.fill();
  }
}
