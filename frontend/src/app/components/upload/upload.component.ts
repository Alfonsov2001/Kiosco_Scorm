import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  titulo: string = '';
  descripcion: string = '';
  archivoSeleccionado: File | null = null;
  mensaje: string = '';
  esError: boolean = false;

  categorias: any[] = [];
  categoriaIdSeleccionada: string = '';
  mostrarNuevaCategoria: boolean = false;
  nuevaCategoriaNombre: string = '';

  @Output() cursoSubido = new EventEmitter<void>();

  constructor(private dataService: DataService, private router: Router, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.dataService.getCategorias().subscribe({
      next: (data) => {
        console.log('Frontend recibió categorías:', data);
        this.categorias = data || [];
        this.cd.detectChanges();
      },
      error: (e) => console.error('Error cargando categorías:', e)
    });
  }

  toggleNuevaCategoria() {
    this.mostrarNuevaCategoria = !this.mostrarNuevaCategoria;
  }

  guardarCategoria() {
    if (!this.nuevaCategoriaNombre.trim()) return;

    this.dataService.crearCategoria(this.nuevaCategoriaNombre).subscribe({
      next: (cat) => {
        this.mensaje = 'Categoría creada';
        this.esError = false;
        this.categorias.push(cat);
        this.categoriaIdSeleccionada = cat.id;
        this.mostrarNuevaCategoria = false;
        this.nuevaCategoriaNombre = '';
      },
      error: (e) => {
        this.mensaje = 'Error creando categoría';
        this.esError = true;
      }
    });
  }

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

    this.dataService.subirCurso(this.titulo, this.descripcion, this.archivoSeleccionado, this.categoriaIdSeleccionada)
      .subscribe({
        next: (res) => {
          console.log('Éxito:', res);
          alert('¡Curso subido correctamente!');
          this.mensaje = '';
          this.titulo = '';
          this.descripcion = '';
          this.archivoSeleccionado = null;
          this.categoriaIdSeleccionada = '';
          this.cursoSubido.emit(); // <--- EMITIMOS EVENTO
        },
        error: (err) => {
          console.error(err);
          this.mensaje = 'Error al subir el curso. Revisa la consola.';
          this.esError = true;
        }
      });
  }

  cancelar() {
    this.cursoSubido.emit(); // Ocultar o cancelar
  }
}