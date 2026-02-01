import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  error: string = '';
  cargando: boolean = false;

  constructor(
    private dataService: DataService,
    private router: Router
  ) { }

  // --- FUNCIÓN DE VALIDACIÓN (NUEVO) ---
  // Comprueba que el texto tenga formato: algo@algo.algo
  private esEmailValido(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  entrar() {
    // 1. Limpiamos espacios al inicio y final
    const emailLimpio = this.email.trim();
    this.error = '';

    // 2. Validación: ¿Está vacío?
    if (!emailLimpio) {
      this.error = 'Por favor, introduce tu correo electrónico.';
      return;
    }

    // 3. Validación: ¿Tiene formato correcto?
    // Si NO cumple la estructura de email, detenemos y mostramos error.
    if (!this.esEmailValido(emailLimpio)) {
      this.error = '⚠️ Formato incorrecto. Debe ser un email válido (ej: usuario@campus.es)';
      return;
    }

    // 4. Si pasa las validaciones, activamos carga y llamamos al servicio
    this.cargando = true;

    this.dataService.login(emailLimpio).subscribe({
      next: (usuario) => {
        console.log('✅ Login exitoso:', usuario);
        
        // Guardamos en el servicio y LocalStorage
        this.dataService.usuarioActual = usuario;
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        
        this.cargando = false;

        // Redirigir según el rol
        if (usuario.rol === 'profesor') {
          this.router.navigate(['/dashboard-profesor']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        this.error = 'No se ha encontrado ese usuario o hubo un error de conexión.';
        this.cargando = false;
      }
    });
  }
}