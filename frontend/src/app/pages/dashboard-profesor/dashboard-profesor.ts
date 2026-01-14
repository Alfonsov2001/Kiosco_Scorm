import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UploadComponent } from '../../components/upload/upload.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-profesor',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule,UploadComponent,FormsModule],
  templateUrl: './dashboard-profesor.html',
  styleUrls: ['./dashboard-profesor.css'],
})
export class DashboardProfesor implements OnInit {
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  cargando = false;

  private api = 'http://localhost:3000/api';

  //Toolbar filtro categorias--modificar cuadno se cree en la bd
  categorias: { id: string; nombre: string }[] = [
    { id: '', nombre: 'Todas' },
    { id: 'scorm', nombre: 'SCORM' },
    { id: 'prevencion', nombre: 'Prevención' },
    { id: 'calidad', nombre: 'Calidad' },
  ];
  categoriaSeleccionada = '';
  searchTitulo = '';


  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.recargar();
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

      // Categorías todavía no vienen de BD.
      // Cuando las tengas, tu API debería devolver c.categoria_id.
      const matchCategoria = !cat || String(c.categoria_id || '') === cat;

      return matchTitulo && matchCategoria;
    });
  }

  abrir(id: number): void {
    this.router.navigate(['/player', id]);
  }
}