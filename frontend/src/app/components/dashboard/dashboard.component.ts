import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  recientes: any[] = [];
  categorias: any[] = [];
  usuario: any = {};
  cargando: boolean = false;

  // Filtros
  searchTitulo: string = '';
  categoriaSeleccionada: string = '';

  // Estado UI
  cursoSeleccionado: any = null;

  constructor(
    private dataService: DataService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.usuario = this.dataService.usuarioActual || { email: 'Invitado' };
    this.cargarCursos();
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.dataService.getCategorias().subscribe({
      next: (data) => {
        console.log('✅ Dashboard - Categorías cargadas:', data);
        this.categorias = data || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('❌ Error cargando categorías:', err)
    });
  }

  cargarCursos() {
    this.cargando = true;
    this.dataService.getCursos().subscribe({
      next: (data: any) => {
        this.cursos = data || [];
        this.aplicarFiltros();
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar cursos:', err);
        this.cargando = false;
      }
    });

    if (this.usuario && this.usuario.id) {
      this.dataService.obtenerRecientes(this.usuario.id).subscribe({
        next: (data) => this.recientes = data || []
      });
    }
  }

  aplicarFiltros() {
    const q = this.searchTitulo.trim().toLowerCase();
    const cat = this.categoriaSeleccionada;

    this.cursosFiltrados = this.cursos.filter(c => {
      const matchTitulo = !q || (c.titulo || '').toLowerCase().includes(q);
      const matchCat = !cat || c.categoria_id == cat; // Adaptar si bd tiene categoria
      return matchTitulo && matchCat;
    });
  }

  verDetalle(curso: any) {
    this.cursoSeleccionado = curso;
  }

  cerrarDetalle() {
    this.cursoSeleccionado = null;
  }

  iniciarCurso(curso: any) {
    console.log('Abriendo curso:', curso.titulo);
    this.dataService.cursoActual = curso;
    this.router.navigate(['/player', curso.id]);
  }

  salir() {
    this.dataService.usuarioActual = null;
    this.router.navigate(['/login']);
  }

  irSubir() {
    // No usado por alumno, pero por compatibilidad si quedo algo
  }
}