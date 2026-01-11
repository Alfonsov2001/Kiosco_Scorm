import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importamos FormsModule aquí
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  titulo: string = '';
  descripcion: string = '';
  archivoSeleccionado: File | null = null;
  mensaje: string = '';
  esError: boolean = false;

  constructor(private dataService: DataService, private router: Router) {}

  // Se ejecuta cuando el usuario elige un archivo
  onFileSelected(event: any) {
    this.archivoSeleccionado = event.target.files[0];
  }

  subir() {
    if (!this.titulo || !this.archivoSeleccionado) {
      this.mensaje = 'Por favor, completa el título y selecciona un archivo.';
      this.esError = true;
      return;
    }

    this.mensaje = 'Subiendo curso... Espere por favor.';
    this.esError = false;

    this.dataService.subirCurso(this.titulo, this.descripcion, this.archivoSeleccionado)
      .subscribe({
        next: (res) => {
          console.log('Éxito:', res);
          alert('¡Curso subido correctamente!');
          this.router.navigate(['/dashboard']); // Volvemos al inicio para ver el nuevo curso
        },
        error: (err) => {
          console.error(err);
          this.mensaje = 'Error al subir el curso. Revisa la consola.';
          this.esError = true;
        }
      });
  }

  cancelar() {
    this.router.navigate(['/dashboard']);
  }
}