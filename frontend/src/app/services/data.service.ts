import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject } from 'rxjs'; // AÑADIDO: BehaviorSubject
import { map, catchError, tap } from 'rxjs/operators'; // AÑADIDO: tap

// Interfaces para tipado
export interface Usuario {
  id: number;
  email: string;
  rol: 'alumno' | 'profesor';
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  ruta_carpeta: string;
  punto_entrada: string;
  fecha_subida: string;
  categoria_id: number | null;
  progreso?: Progreso | null;
  porcentaje?: number;
  estado?: 'completed' | 'passed' | 'failed' | 'incomplete' | 'browsed' | 'not attempted';
}

export interface Progreso {
  id?: number;
  usuario_id: number;
  curso_id: number;
  cmi_lesson_status: string;
  cmi_score_raw: number;
  cmi_location: string;
  cmi_suspend_data: string;
  fecha_actualizacion?: string;
  titulo?: string;
  descripcion?: string;
  ruta_carpeta?: string;
  punto_entrada?: string;
}

export interface EstadisticasUsuario {
  totalCursos: number;
  cursosCompletados: number;
  cursosEnProgreso: number;
  cursosNoIniciados: number;
  promedioProgreso: number;
  promedioPuntuacion: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Usar ruta vacía para que funcione con el proxy de Angular
  private baseUrl = 'http://localhost:3000';

  public usuarioActual: any = null;
  public cursoActual: any = null;

  // ==================== ESTADO DE RECIENTES (SIDEBAR) ====================
  // Fuente de verdad para la barra lateral
  private cursosVisitadosSubject = new BehaviorSubject<any[]>([]);
  // Observable público al que se suscribe el SidebarComponent
  public cursosVisitados$ = this.cursosVisitadosSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ==================== AUTENTICACIÓN Y SESIÓN ====================

  login(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/login`, { email }).pipe(
      tap((usuario: any) => {
        // Guardamos el usuario en memoria y localStorage al entrar
        this.usuarioActual = usuario;
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
      })
    );
  }

  /**
   * Cierra la sesión y limpia TODOS los datos para evitar que
   * el siguiente usuario vea información antigua.
   */
  logout() {
    this.usuarioActual = null;
    this.cursoActual = null;
    
    // Limpiamos la lista de la barra lateral
    this.cursosVisitadosSubject.next([]);
    
    // Limpiamos el almacenamiento del navegador
    localStorage.removeItem('usuarioActual');
    
    console.log('Sesión cerrada y datos limpiados.');
  }

  // ==================== CURSOS ====================

  getCursos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/cursos`);
  }

  getCurso(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/cursos/${id}`);
  }

  subirCurso(titulo: string, descripcion: string, archivo: File, categoriaId: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('file', archivo);
    if (categoriaId) formData.append('categoria_id', categoriaId);
    return this.http.post(`${this.baseUrl}/api/cursos/upload`, formData);
  }

  // ==================== CATEGORÍAS ====================

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/categorias`);
  }

  crearCategoria(nombre: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/categorias`, { nombre });
  }

  // ==================== PROGRESO SCORM ====================

  guardarProgreso(usuarioId: number, cursoId: number, cmi: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/progreso/guardar`, { usuarioId, cursoId, cmi }).pipe(
      // Al guardar, actualizamos la lista de recientes en segundo plano
      tap(() => this.obtenerRecientes(usuarioId).subscribe())
    );
  }

  obtenerProgreso(usuarioId: number, cursoId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/progreso/obtener?usuarioId=${usuarioId}&cursoId=${cursoId}`).pipe(
      catchError(() => of(null))
    );
  }

  // ⚠️ MODIFICADO: Ahora actualiza la barra lateral automáticamente
  obtenerRecientes(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/progreso/recientes?usuarioId=${usuarioId}`).pipe(
      tap(cursos => {
        // Emitimos el nuevo valor para que el Sidebar se actualice
        this.cursosVisitadosSubject.next(cursos);
      }),
      catchError(() => {
        this.cursosVisitadosSubject.next([]);
        return of([]);
      })
    );
  }

  // ==================== PROGRESO COMBINADO ====================

  /**
   * Obtiene todos los progresos de un usuario
   */
  obtenerTodosProgresos(usuarioId: number): Observable<Progreso[]> {
    return this.http.get<Progreso[]>(`${this.baseUrl}/api/progreso/todos?usuarioId=${usuarioId}`).pipe(
      catchError((err) => {
        console.warn('Error obteniendo todos los progresos:', err);
        return of([]);
      })
    );
  }

  /**
   * Obtiene todos los cursos con el progreso del usuario actual
   */
  getCursosConProgreso(usuarioId: number): Observable<Curso[]> {
    return forkJoin({
      cursos: this.getCursos(),
      progresos: this.obtenerTodosProgresos(usuarioId)
    }).pipe(
      map(({ cursos, progresos }) => {
        return cursos.map(curso => {
          const progreso = progresos.find(p => p.curso_id === curso.id);
          return {
            ...curso,
            progreso: progreso || null,
            estado: this.calcularEstado(progreso?.cmi_lesson_status),
            porcentaje: this.calcularPorcentaje(progreso?.cmi_lesson_status)
          };
        });
      }),
      catchError((err) => {
        console.error('Error en getCursosConProgreso:', err);
        return of([]);
      })
    );
  }

  /**
   * Calcula estadísticas generales del usuario
   */
  calcularEstadisticas(cursos: Curso[]): EstadisticasUsuario {
    const total = cursos.length;
    const completados = cursos.filter(c => 
      c.estado === 'completed' || c.estado === 'passed'
    ).length;
    const enProgreso = cursos.filter(c => 
      c.estado === 'incomplete' || c.estado === 'browsed'
    ).length;
    const noIniciados = total - completados - enProgreso;

    const sumaProgreso = cursos.reduce((sum, c) => sum + (c.porcentaje || 0), 0);
    const promedioProgreso = total > 0 ? Math.round(sumaProgreso / total) : 0;

    const cursosConNota = cursos.filter(c => c.progreso && c.progreso.cmi_score_raw > 0);
    const sumaPuntuacion = cursosConNota.reduce((sum, c) => sum + (c.progreso?.cmi_score_raw || 0), 0);
    const promedioPuntuacion = cursosConNota.length > 0 ? Math.round(sumaPuntuacion / cursosConNota.length) : 0;

    return {
      totalCursos: total,
      cursosCompletados: completados,
      cursosEnProgreso: enProgreso,
      cursosNoIniciados: noIniciados,
      promedioProgreso,
      promedioPuntuacion
    };
  }

  // ==================== HELPERS PRIVADOS ====================

  private calcularEstado(status: string | undefined): Curso['estado'] {
    if (!status) return 'not attempted';
    const s = status.toLowerCase().trim();
    switch (s) {
      case 'completed': return 'completed';
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'incomplete': return 'incomplete';
      case 'browsed': return 'browsed';
      default: return 'not attempted';
    }
  }

  private calcularPorcentaje(status: string | undefined): number {
    if (!status) return 0;
    const s = status.toLowerCase().trim();
    switch (s) {
      case 'completed':
      case 'passed':
      case 'failed':
        return 100;
      case 'incomplete':
        return 50;
      case 'browsed':
        return 25;
      default:
        return 0;
    }
  }

  // ==================== HELPERS PÚBLICOS ====================

  getEstadoTexto(estado: Curso['estado']): string {
    const textos: { [key: string]: string } = {
      'completed': 'Completado',
      'passed': 'Aprobado',
      'failed': 'Suspendido',
      'incomplete': 'En progreso',
      'browsed': 'Visto',
      'not attempted': 'No iniciado'
    };
    return textos[estado || 'not attempted'] || 'No iniciado';
  }

  getEstadoIcono(estado: Curso['estado']): string {
    const iconos: { [key: string]: string } = {
      'completed': 'bi-check-circle-fill',
      'passed': 'bi-trophy-fill',
      'failed': 'bi-x-circle-fill',
      'incomplete': 'bi-play-circle-fill',
      'browsed': 'bi-eye-fill',
      'not attempted': 'bi-circle'
    };
    return iconos[estado || 'not attempted'] || 'bi-circle';
  }

  getEstadoClase(estado: Curso['estado']): string {
    const clases: { [key: string]: string } = {
      'completed': 'estado-completado',
      'passed': 'estado-aprobado',
      'failed': 'estado-suspendido',
      'incomplete': 'estado-progreso',
      'browsed': 'estado-visto',
      'not attempted': 'estado-pendiente'
    };
    return clases[estado || 'not attempted'] || 'estado-pendiente';
  }

  getProgresoColor(porcentaje: number): string {
    if (porcentaje >= 100) return 'var(--color-alerta-exito)';
    if (porcentaje >= 50) return 'var(--color-interactivo-principal)';
    if (porcentaje > 0) return 'var(--color-alerta-advertencia)';
    return '#dee2e6';
  }
}