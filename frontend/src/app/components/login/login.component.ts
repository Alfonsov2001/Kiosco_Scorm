import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  // Campos nuevos para Registro
  rol: 'alumno' | 'profesor' = 'alumno';
  codigoDocente: string = '';
  isRegistering: boolean = false; // Controla si mostramos Login o Registro

  error: string = '';
  cargando: boolean = false;

  constructor(
    private dataService: DataService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  // --- FUNCIÓN DE VALIDACIÓN ---
  private esEmailValido(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.error = '';
    this.email = '';
    this.codigoDocente = '';
    this.rol = 'alumno';
  }

  entrar() {
    // 1. Limpiamos espacios
    const emailLimpio = this.email.trim();
    this.error = '';

    // 2. Validaciones básicas
    if (!emailLimpio) {
      this.error = 'Por favor, introduce tu correo electrónico.';
      return;
    }

    if (!this.esEmailValido(emailLimpio)) {
      this.error = '⚠️ Formato incorrecto. Debe ser un email válido.';
      return;
    }

    if (this.isRegistering && this.rol === 'profesor' && !this.codigoDocente) {
      this.error = '⚠️ Debes introducir el código de docente para registrarte como profesor.';
      return;
    }

    // 3. Activamos carga
    this.cargando = true;

    // 4. Lógica diferenciada: Login vs Registro
    if (this.isRegistering) {
      // --- REGISTRO ---
      this.dataService.register(emailLimpio, this.rol, this.codigoDocente)
        .pipe(
          finalize(() => {
            this.cargando = false;
            this.cd.detectChanges(); // Forzamos actualización UI pase lo que pase
          })
        )
        .subscribe({
          next: (usuario) => this.manejarExito(usuario),
          error: (err) => {
            console.error('❌ Error en registro:', err);
            this.error = err.error?.mensaje || 'Error al registrarse. Intenta de nuevo.';
          }
        });
    } else {
      // --- LOGIN ---
      this.dataService.login(emailLimpio)
        .pipe(
          finalize(() => {
            this.cargando = false;
            this.cd.detectChanges(); // Forzamos actualización UI pase lo que pase
          })
        )
        .subscribe({
          next: (usuario) => this.manejarExito(usuario),
          error: (err: any) => {
            console.error('❌ Error en login:', err);
            // Mostrar mensaje en el HTML (no popup)
            if (err.status === 404) {
              this.error = 'Correo inválido: El usuario no existe.';
            } else {
              this.error = 'Error: No se pudo conectar o el correo es incorrecto.';
            }
          }
        });
    }
  }

  manejarExito(usuario: any) {
    console.log('✅ Auth exitoso:', usuario);
    // Redirigir según el rol
    if (usuario.rol === 'profesor') {
      this.router.navigate(['/dashboard-profesor']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}