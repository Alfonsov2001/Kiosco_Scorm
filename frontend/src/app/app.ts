import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',  // <--- Fíjate que apunta a tu archivo app.html
  styleUrls: ['./app.css']    // <--- Y este a tu archivo app.css
})
export class App {
  title = 'frontend';
}