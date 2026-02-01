import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service'; // Ajusta la ruta si es necesario
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header', // El selector que tengas
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html', // Tu archivo HTML
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  nombreUsuario: string = 'Usuario';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    // Recuperamos el nombre del usuario para mostrarlo en el header
    if (this.dataService.usuarioActual) {
      this.nombreUsuario = this.dataService.usuarioActual.nombre;
    } else {
      // Si por alguna razón recargamos y se borró del servicio, miramos en localStorage
      const stored = localStorage.getItem('usuarioActual');
      if (stored) {
        const user = JSON.parse(stored);
        this.nombreUsuario = user.nombre;
      }
    }
  }

  cerrarSesion() {
    console.log(' Cerrando sesión...');
    
    // 1. Limpiar datos del servicio
    this.dataService.usuarioActual = null;
    
    // 2. Borrar del almacenamiento local
    localStorage.removeItem('usuarioActual');
    
    // 3. Redirigir al login
    this.router.navigate(['/login']);
  }
}