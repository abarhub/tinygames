import { Routes } from '@angular/router';
import {SnakeComponent} from './games/snake/snake.component';
import {TetrisComponent} from './games/tetris/tetris.component';
import {BombermanComponent} from './games/bomberman/bomberman.component';
import {BreakoutComponent} from './games/breakout/breakout.component';
import {PongComponent} from './games/pong/pong.component';
import {PuzzleBobbleComponent} from './games/puzzle-bobble/puzzle-bobble.component';
import {SokobanComponent} from './games/sokoban/sokoban.component';

export const routes: Routes = [
  { path: 'snake', component: SnakeComponent },
  { path: 'tetris', component: TetrisComponent },
  { path: 'bomberman', component: BombermanComponent },
  { path: 'breakout', component: BreakoutComponent },
  { path: 'pong', component: PongComponent },
  { path: 'bobble', component: PuzzleBobbleComponent },
  { path: 'sokoban', component: SokobanComponent },
];
