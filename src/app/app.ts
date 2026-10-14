import { Component, inject } from '@angular/core';
import { NewsMode } from './news/news-mode.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly newsMode = inject(NewsMode);
}
