import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
// Quitamos HttpClient de aquí, ya no lo necesitamos directo
import { UploadComponent } from '../../components/upload/upload.component';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule, UploadComponent, FormsModule],
  templateUrl: './dashboard-profesor.html',
  styleUrls: ['./dashboard-profesor.css'],
})
export class DashboardProfesor implements OnInit {
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  cargando = false;

  categorias: any[] = [];
  categoriaSeleccionada = '';
  searchTitulo = '';
  cursoSeleccionado: any = null;

  constructor(
    // private http: HttpClient, <--- YA NO LO NECESITAMOS, usamos el servicio
    private router: Router, 
    private dataService: DataService, 
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.recargar();
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.dataService.getCategorias().subscribe({
      next: (data) => {
        console.log('✅ Categorías cargadas:', data);
        this.categorias = data || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('❌ Error cargando categorías:', err)
    });
  }

  recargar(): void {
    this.cargando = true; // Activar spinner

    // ⚠️ CAMBIO CLAVE: Usamos dataService.getCursos() en lugar de this.http
    this.dataService.getCursos().subscribe({
      next: (data) => {
        console.log('📚 Cursos cargados correctamente:', data);
        this.cursos = data || [];
        this.aplicarFiltros();
        
        this.cargando = false; // Desactivar spinner
        this.cd.detectChanges(); // ⚠️ Forzar actualización de la vista
      },
      error: (e) => {
        console.error('❌ Error cargando cursos (Profesor):', e);
        this.cursos = [];
        this.cursosFiltrados = [];
        
        this.cargando = false; // Desactivar spinner incluso si falla
        this.cd.detectChanges(); // ⚠️ Forzar actualización de la vista
      },
    });
  }

  aplicarFiltros(): void {
    const q = this.searchTitulo.trim().toLowerCase();
    // Convertimos a string por seguridad
    const cat = this.categoriaSeleccionada ? String(this.categoriaSeleccionada) : '';

    this.cursosFiltrados = (this.cursos || []).filter((c) => {
      const titulo = String(c.titulo || '').toLowerCase();
      const matchTitulo = !q || titulo.includes(q);
      
      // Comparamos IDs como strings para evitar problemas de tipos (number vs string)
      const cCatId = c.categoria_id != null ? String(c.categoria_id) : '';
      const matchCategoria = !cat || cCatId === cat;
      
      return matchTitulo && matchCategoria;
    });
  }

  verDetalle(curso: any): void {
    this.cursoSeleccionado = curso;
  }

  cerrarDetalle(): void {
    this.cursoSeleccionado = null;
  }

  iniciarCurso(curso: any): void {
    this.dataService.cursoActual = curso;
    this.router.navigate(['/player', curso.id]);
  }

  onCursoSubido(): void {
    console.log('🔄 Detectado nuevo curso, recargando...');
    this.recargar();
  }
}