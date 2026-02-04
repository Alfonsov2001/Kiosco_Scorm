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
  usuario: any = {};

  categorias: any[] = [];
  categoriaSeleccionada = '';
  searchTitulo = '';
  filtroEstado = '';
  cursoSeleccionado: any = null;
  errorMensaje: string = '';
  confirmandoEliminacion: boolean = false;

  // Estadísticas
  estadisticas: any = {
    totalCursos: 0,
    cursosCompletados: 0,
    cursosEnProgreso: 0,
    cursosNoIniciados: 0,
    promedioProgreso: 0,
    promedioPuntuacion: 0
  };

  constructor(
    private router: Router,
    private dataService: DataService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.usuario = this.dataService.usuarioActual;

    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.recargar();
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.dataService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('❌ Error cargando categorías:', err)
    });
  }

  recargar(): void {
    this.cargando = true;

    if (!this.usuario?.id) {
      this.dataService.getCursos().subscribe({
        next: (data) => {
          this.cursos = data.map((c: any) => ({ ...c, estado: 'not attempted', porcentaje: 0 }));
          this.finalizarCarga();
        },
        error: () => this.finalizarCarga(true)
      });
      return;
    }

    this.dataService.getCursosConProgreso(this.usuario.id).subscribe({
      next: (data) => {
        this.cursos = data || [];
        this.finalizarCarga();
      },
      error: () => {
        this.dataService.getCursos().subscribe({
          next: (data) => {
            this.cursos = data.map((c: any) => ({ ...c, estado: 'not attempted', porcentaje: 0 }));
            this.finalizarCarga();
          }
        });
      }
    });
  }

  private finalizarCarga(error = false) {
    if (error) {
      this.cursos = [];
      this.cursosFiltrados = [];
    } else {
      this.aplicarFiltros();
      this.calcularEstadisticas();
    }
    this.cargando = false;
    this.cd.detectChanges();
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

  aplicarFiltros(): void {
    const q = this.searchTitulo.trim().toLowerCase();
    const cat = this.categoriaSeleccionada ? String(this.categoriaSeleccionada) : '';
    const estado = this.filtroEstado;

    this.cursosFiltrados = (this.cursos || []).filter((c) => {
      const titulo = String(c.titulo || '').toLowerCase();
      const matchTitulo = !q || titulo.includes(q);

      const cCatId = c.categoria_id != null ? String(c.categoria_id) : '';
      const matchCategoria = !cat || cCatId === cat;

      let matchEstado = true;
      if (estado === 'completed') {
        matchEstado = c.estado === 'completed' || c.estado === 'passed';
      } else if (estado === 'in-progress') {
        matchEstado = c.estado === 'incomplete' || c.estado === 'browsed';
      } else if (estado === 'not-started') {
        matchEstado = c.estado === 'not attempted' || !c.estado;
      }

      return matchTitulo && matchCategoria && matchEstado;
    });
  }

  limpiarFiltros() {
    this.searchTitulo = '';
    this.categoriaSeleccionada = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  verDetalle(curso: any): void {
    this.cursoSeleccionado = curso;
    this.dataService.registrarVisita(curso);
  }

  cerrarDetalle(): void {
    this.cursoSeleccionado = null;
  }

  solicitarConfirmacionEliminacion(): void {
    this.confirmandoEliminacion = true;
    this.errorMensaje = '';
  }

  cancelarEliminacion(): void {
    this.confirmandoEliminacion = false;
  }

  eliminarCurso(id: number): void {
    this.errorMensaje = '';
    this.dataService.eliminarCurso(id).subscribe({
      next: () => {
        this.confirmandoEliminacion = false;
        this.cerrarDetalle();
        this.recargar();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        const errorMsg = err.error?.mensaje || err.message || 'Error desconocido';
        this.errorMensaje = 'No se pudo eliminar el curso. Detalle: ' + errorMsg;
        this.confirmandoEliminacion = false;
        this.cd.detectChanges();
      }
    });
  }

  iniciarCurso(curso: any): void {
    this.dataService.cursoActual = curso;
    this.router.navigate(['/player', curso.id]);
  }

  onCursoSubido(): void {
    this.recargar();
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
