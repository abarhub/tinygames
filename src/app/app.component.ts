import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {SnakeComponent} from './games/snake/snake.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnakeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'tinygames';
}
