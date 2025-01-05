import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {SnakeComponent} from './games/snake/snake.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SnakeComponent, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'tinygames';
}
