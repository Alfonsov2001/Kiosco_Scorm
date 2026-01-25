import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UploadComponent } from '../../components/upload/upload.component';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, UploadComponent, FormsModule],
  templateUrl: './dashboard-profesor.html',
  styleUrls: ['./dashboard-profesor.css'],
})
export class DashboardProfesor implements OnInit {
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  cargando = false;

  private api = 'http://localhost:3000/api';

  //Toolbar filtro categorias--modificar cuadno se cree en la bd
  //Toolbar filtro categorias
  categorias: any[] = [];
  categoriaSeleccionada = '';
  searchTitulo = '';
  cursoSeleccionado: any = null;

  constructor(private http: HttpClient, private router: Router, private dataService: DataService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.recargar();
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.dataService.getCategorias().subscribe({
      next: (data) => {
        console.log('✅ DashboardProfesor - Categorías cargadas:', data);
        this.categorias = data || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('❌ Error cargando categorías:', err)
    });
  }

  recargar(): void {
    this.cargando = true;

    this.http.get<any[]>(`${this.api}/cursos`).subscribe({
      next: (data) => {
        this.cursos = data || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (e) => {
        console.error(e);
        this.cursos = [];
        this.cursosFiltrados = [];
        this.cargando = false;
      },
    });
  }

  aplicarFiltros(): void {
    const q = this.searchTitulo.trim().toLowerCase();
    const cat = this.categoriaSeleccionada;

    this.cursosFiltrados = (this.cursos || []).filter((c) => {
      const titulo = String(c.titulo || '').toLowerCase();
      const matchTitulo = !q || titulo.includes(q);
      // Cuando las tengas, tu API debería devolver c.categoria_id.
      // Comparacion laxa por si vienen como string/number
      const matchCategoria = !cat || c.categoria_id == cat;
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
    // Aquí luego implementaremos "continuar desde donde se quedó"
    // Por ahora, navegación normal
    this.router.navigate(['/player', curso.id]);
  }

  onCursoSubido(): void {
    this.recargar();
    // Opcional: collapse el acordeón manual o automáticamente
  }
}