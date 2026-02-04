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
  // Datos
  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  recientes: any[] = [];
  categorias: any[] = [];
  usuario: any = {};

  // Estadísticas
  estadisticas: any = {
    totalCursos: 0,
    cursosCompletados: 0,
    cursosEnProgreso: 0,
    cursosNoIniciados: 0,
    promedioProgreso: 0,
    promedioPuntuacion: 0
  };

  // Estado UI
  cargando: boolean = false;
  cursoSeleccionado: any = null;

  // Filtros
  searchTitulo: string = '';
  categoriaSeleccionada: string = '';
  filtroEstado: string = '';

  constructor(
    private dataService: DataService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.usuario = this.dataService.usuarioActual;

    // Si no hay usuario ni en memoria ni en storage (el servicio ya intentó cargar), volvemos al login
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarCategorias();
    this.cargarCursosConProgreso();
  }

  // ==================== CARGA DE DATOS ====================

  cargarCategorias() {
    this.dataService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  cargarCursosConProgreso() {
    this.cargando = true;

    if (!this.usuario?.id) {
      this.dataService.getCursos().subscribe({
        next: (data) => {
          this.cursos = data.map(c => ({
            ...c,
            estado: 'not attempted',
            porcentaje: 0
          }));
          this.aplicarFiltros();
          this.calcularEstadisticas();
          this.cargando = false;
          this.cd.detectChanges();
        },
        error: () => {
          this.cargando = false;
        }
      });
      return;
    }

    this.dataService.getCursosConProgreso(this.usuario.id).subscribe({
      next: (data) => {
        this.cursos = data || [];
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.dataService.getCursos().subscribe({
          next: (data) => {
            this.cursos = data.map(c => ({
              ...c,
              estado: 'not attempted',
              porcentaje: 0
            }));
            this.aplicarFiltros();
            this.calcularEstadisticas();
            this.cargando = false;
          }
        });
      }
    });

    this.dataService.obtenerRecientes(this.usuario.id).subscribe({
      next: (data) => {
        this.recientes = data || [];
        this.cd.detectChanges();
      }
    });
  }

  calcularEstadisticas() {
    const total = this.cursos.length;
    const completados = this.cursos.filter(c =>
      c.estado === 'completed' || c.estado === 'passed'
    ).length;
    const enProgreso = this.cursos.filter(c =>
      c.estado === 'incomplete' || c.estado === 'browsed'
    ).length;
    const noIniciados = total - completados - enProgreso;

    const sumaProgreso = this.cursos.reduce((sum, c) => sum + (c.porcentaje || 0), 0);
    const promedioProgreso = total > 0 ? Math.round(sumaProgreso / total) : 0;

    const cursosConNota = this.cursos.filter(c => c.progreso && c.progreso.cmi_score_raw > 0);
    const sumaPuntuacion = cursosConNota.reduce((sum, c) => sum + (c.progreso?.cmi_score_raw || 0), 0);
    const promedioPuntuacion = cursosConNota.length > 0 ? Math.round(sumaPuntuacion / cursosConNota.length) : 0;

    this.estadisticas = {
      totalCursos: total,
      cursosCompletados: completados,
      cursosEnProgreso: enProgreso,
      cursosNoIniciados: noIniciados,
      promedioProgreso,
      promedioPuntuacion
    };
  }

  // ==================== FILTROS ====================

  aplicarFiltros() {
    const q = this.searchTitulo.trim().toLowerCase();
    const cat = this.categoriaSeleccionada;
    const estado = this.filtroEstado;

    this.cursosFiltrados = this.cursos.filter(c => {
      const matchTitulo = !q || (c.titulo || '').toLowerCase().includes(q);
      const matchCat = !cat || String(c.categoria_id) === String(cat);

      let matchEstado = true;
      if (estado === 'completed') {
        matchEstado = c.estado === 'completed' || c.estado === 'passed';
      } else if (estado === 'in-progress') {
        matchEstado = c.estado === 'incomplete' || c.estado === 'browsed';
      } else if (estado === 'not-started') {
        matchEstado = c.estado === 'not attempted' || !c.estado;
      }

      return matchTitulo && matchCat && matchEstado;
    });
  }

  limpiarFiltros() {
    this.searchTitulo = '';
    this.categoriaSeleccionada = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  // ==================== ACCIONES ====================

  verDetalle(curso: any) {
    this.cursoSeleccionado = curso;
    this.dataService.registrarVisita(curso);
  }

  cerrarDetalle() {
    this.cursoSeleccionado = null;
  }

  iniciarCurso(curso: any) {
    this.dataService.cursoActual = curso;
    this.router.navigate(['/player', curso.id]);
  }

  descargarCurso(curso: any): void {
    if (!curso || !curso.id) return;
    
    this.dataService.descargarCurso(curso.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${curso.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        if (err.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorObj = JSON.parse(reader.result as string);
              alert('Error al descargar: ' + (errorObj.mensaje || 'Error desconocido'));
            } catch (e) {
              alert('No se pudo descargar el curso.');
            }
          };
          reader.readAsText(err.error);
        } else {
          alert('No se pudo descargar el curso.');
        }
      }
    });
  }

  salir() {
    this.dataService.usuarioActual = null;
    this.router.navigate(['/login']);
  }

  // ==================== HELPERS UI ====================

  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'completed': 'Completado',
      'passed': 'Aprobado',
      'failed': 'Suspendido',
      'incomplete': 'En progreso',
      'browsed': 'Visto',
      'not attempted': 'No iniciado'
    };
    return textos[estado] || 'No iniciado';
  }

  getEstadoIcono(estado: string): string {
    const iconos: { [key: string]: string } = {
      'completed': 'bi-check-circle-fill',
      'passed': 'bi-trophy-fill',
      'failed': 'bi-x-circle-fill',
      'incomplete': 'bi-play-circle-fill',
      'browsed': 'bi-eye-fill',
      'not attempted': 'bi-circle'
    };
    return iconos[estado] || 'bi-circle';
  }

  getEstadoClase(estado: string): string {
    const clases: { [key: string]: string } = {
      'completed': 'estado-completado',
      'passed': 'estado-aprobado',
      'failed': 'estado-suspendido',
      'incomplete': 'estado-progreso',
      'browsed': 'estado-visto',
      'not attempted': 'estado-pendiente'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getProgresoColor(porcentaje: number): string {
    if (porcentaje >= 100) return '#2D7A4F';
    if (porcentaje >= 50) return '#009ACD';
    if (porcentaje > 0) return '#D68E2E';
    return '#dee2e6';
  }

  getBotonTexto(curso: any): string {
    if (curso.porcentaje === 100) return 'Revisar';
    if (curso.porcentaje > 0) return 'Continuar';
    return 'Iniciar';
  }

  getBotonIcono(curso: any): string {
    if (curso.porcentaje === 100) return 'bi-arrow-repeat';
    if (curso.porcentaje > 0) return 'bi-play-fill';
    return 'bi-play-circle';
  }
}
