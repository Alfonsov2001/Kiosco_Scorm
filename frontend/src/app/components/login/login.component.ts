import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';

  constructor(private dataService: DataService, private router: Router) {}

  entrar() {
    if (!this.email) return;
    // CORRECCIÓN AQUÍ: Añadido ': any'
    this.dataService.login(this.email).subscribe({
      next: (user: any) => { 
        this.dataService.usuarioActual = user;
        this.router.navigate(['/dashboard-profesor']);
      },
      error: () => alert('Error al conectar con el servidor')
    });
  }
}