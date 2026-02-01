import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet 
    // He quitado Header, Sidebar y Footer de aquí porque 
    // ya los tienes en LayoutComponent y aquí no se usan.
  ],
  templateUrl: './app.html', // Tu app.html solo tiene <router-outlet>
  styleUrls: ['./app.css']
})
export class App {}