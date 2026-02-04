import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScormService {
  private startTime: number = 0;
  private cursoId: number = 0;
  private usuarioId: number = 0;
  private initialized: boolean = false;

  // 🔥 Observable para enviar el progreso en tiempo real al Player
  public progresoRealtime = new BehaviorSubject<number>(0);

  // 🆕 Variables para tracking de progreso gradual multi-fuente
  private paginasVisitadas: Set<string> = new Set();
  private progressMeasure: number = 0; // SCORM 2004 cmi.progress_measure (0-1)
  private interactionCount: number = 0; // Contador de interacciones
  private sessionStartTime: number = 0;

  // Cache de datos CMI
  private cmiData: any = {
    cmi_lesson_status: 'not attempted',
    cmi_score_raw: 0,
    cmi_location: '',
    cmi_suspend_data: ''
  };

  constructor(private dataService: DataService) { }

  initScormAPI(cursoId: number, usuarioId: number) {
    this.cursoId = cursoId;
    this.usuarioId = usuarioId;
    this.startTime = Date.now();
    this.sessionStartTime = Date.now();
    this.initialized = false;
    
    // Reiniciar tracking al abrir un curso nuevo
    this.paginasVisitadas.clear();
    this.progressMeasure = 0;
    this.interactionCount = 0;
    this.progresoRealtime.next(0);

    // Crear el objeto API SCORM 1.2
    const apiObject = {
      LMSInitialize: (param: string) => this.LMSInitialize(param),
      LMSFinish: (param: string) => this.LMSFinish(param),
      LMSGetValue: (element: string) => this.LMSGetValue(element),
      LMSSetValue: (element: string, value: string) => this.LMSSetValue(element, value),
      LMSCommit: (param: string) => this.LMSCommit(param),
      LMSGetLastError: () => "0",
      LMSGetErrorString: (errorCode: string) => "No error",
      LMSGetDiagnostic: (errorCode: string) => "No error"
    };

    // API SCORM 2004
    const api2004Object = {
      Initialize: (param: string) => this.LMSInitialize(param),
      Terminate: (param: string) => this.LMSFinish(param),
      GetValue: (element: string) => this.LMSGetValue2004(element),
      SetValue: (element: string, value: string) => this.LMSSetValue2004(element, value),
      Commit: (param: string) => this.LMSCommit(param),
      GetLastError: () => "0",
      GetErrorString: (errorCode: string) => "No error",
      GetDiagnostic: (errorCode: string) => "No error"
    };

    // Exponer en TODOS los lugares posibles donde SCORM puede buscar
    const win = window as any;
    
    // SCORM 1.2
    win.API = apiObject;
    win.api = apiObject;
    
    // SCORM 2004
    win.API_1484_11 = api2004Object;
    
    // También en el parent
    if (win.parent && win.parent !== win) {
      win.parent.API = apiObject;
      win.parent.api = apiObject;
      win.parent.API_1484_11 = api2004Object;
    }

    // Y en top
    if (win.top && win.top !== win) {
      try {
        win.top.API = apiObject;
        win.top.api = apiObject;
        win.top.API_1484_11 = api2004Object;
      } catch (e) {
        // Ignorar error cross-origin
      }
    }

    console.log('✅ SCORM API inicializado para curso:', cursoId, 'usuario:', usuarioId);
  }

  // Cargar estado inicial desde BD
  async cargarEstadoInicial(): Promise<void> {
    console.log(`📥 Cargando estado SCORM para usuario:${this.usuarioId} curso:${this.cursoId}`);
    
    try {
      const data = await this.dataService.obtenerProgreso(this.usuarioId, this.cursoId).toPromise();
      
      if (data && data.cmi_lesson_status) {
        this.cmiData = {
          cmi_lesson_status: data.cmi_lesson_status || 'not attempted',
          cmi_score_raw: data.cmi_score_raw || 0,
          cmi_location: data.cmi_location || '',
          cmi_suspend_data: data.cmi_suspend_data || ''
        };
        console.log('✅ Estado SCORM recuperado:', this.cmiData);
        
        // 🆕 Restaurar páginas visitadas desde suspend_data
        this.restaurarProgresoGuardado();
        
        // Calcular progreso inicial basado en lo recuperado
        this.calcularProgresoMultiFuente();
      } else {
        console.log('ℹ️ No hay estado previo, iniciando nuevo progreso');
        this.cmiData.cmi_lesson_status = 'incomplete';
        this.progresoRealtime.next(0);
      }
    } catch (e) {
      console.warn('⚠️ Error cargando estado SCORM (no crítico):', e);
      this.cmiData.cmi_lesson_status = 'incomplete';
    }
  }

  // 🆕 Restaurar progreso guardado anteriormente
  private restaurarProgresoGuardado(): void {
    try {
      if (this.cmiData.cmi_suspend_data) {
        const suspendData = this.parseSuspendData(this.cmiData.cmi_suspend_data);
        
        // Restaurar páginas visitadas
        if (suspendData._tracking?.paginas && Array.isArray(suspendData._tracking.paginas)) {
          suspendData._tracking.paginas.forEach((p: string) => this.paginasVisitadas.add(p));
        }
        
        // Restaurar progress_measure
        if (suspendData._tracking?.progressMeasure) {
          this.progressMeasure = suspendData._tracking.progressMeasure;
        }
        
        // Restaurar contador de interacciones
        if (suspendData._tracking?.interactionCount) {
          this.interactionCount = suspendData._tracking.interactionCount;
        }
        
        console.log('📊 Tracking restaurado:', {
          paginas: this.paginasVisitadas.size,
          progressMeasure: this.progressMeasure,
          interacciones: this.interactionCount
        });
      }
    } catch (e) {
      console.warn('No se pudo restaurar tracking previo');
    }
  }

  // 🆕 Parsear suspend_data de forma segura (puede ser JSON o string del SCORM)
  private parseSuspendData(data: string): any {
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      // Si no es JSON válido, es data del SCORM original
      return { _original: data };
    }
  }

  // 🆕 Guardar tracking en suspend_data sin perder datos originales del SCORM
  private guardarTrackingEnSuspendData(): void {
    try {
      let suspendObj = this.parseSuspendData(this.cmiData.cmi_suspend_data);
      
      // Agregar o actualizar nuestro tracking
      suspendObj._tracking = {
        paginas: Array.from(this.paginasVisitadas),
        progressMeasure: this.progressMeasure,
        interactionCount: this.interactionCount,
        ultimaActualizacion: new Date().toISOString()
      };
      
      this.cmiData.cmi_suspend_data = JSON.stringify(suspendObj);
    } catch (e) {
      console.warn('Error guardando tracking');
    }
  }

  // 🔥 NUEVA lógica multi-fuente para calcular porcentaje
  private calcularProgresoMultiFuente(): void {
    let porcentaje = 0;
    const status = this.cmiData.cmi_lesson_status;
    const rawScore = parseFloat(this.cmiData.cmi_score_raw);
    
    // ===== PRIORIDAD 1: Estado completado = 100% =====
    if (status === 'completed' || status === 'passed') {
      porcentaje = 100;
    }
    // ===== PRIORIDAD 2: SCORM 2004 progress_measure (0-1) =====
    else if (this.progressMeasure > 0) {
      porcentaje = Math.round(this.progressMeasure * 100);
    }
    // ===== PRIORIDAD 3: Score raw si está entre 0-100 =====
    else if (!isNaN(rawScore) && rawScore > 0 && rawScore <= 100) {
      porcentaje = Math.round(rawScore);
    }
    // ===== PRIORIDAD 4: Páginas visitadas (lesson_location) =====
    else if (this.paginasVisitadas.size > 0) {
      // Estimamos: cada página nueva = incremento proporcional
      // Máximo estimado de páginas: 20 (ajustable)
      const maxPaginasEstimado = 20;
      porcentaje = Math.min(Math.round((this.paginasVisitadas.size / maxPaginasEstimado) * 100), 95);
    }
    // ===== PRIORIDAD 5: Interacciones realizadas =====
    else if (this.interactionCount > 0) {
      // Cada interacción = 5% hasta máximo 90%
      porcentaje = Math.min(this.interactionCount * 5, 90);
    }
    // ===== PRIORIDAD 6: Tiempo de sesión =====
    else if (this.sessionStartTime > 0) {
      const minutos = (Date.now() - this.sessionStartTime) / 60000;
      // Cada minuto = 2% hasta máximo 30%
      if (minutos >= 0.5) {
        porcentaje = Math.min(Math.round(minutos * 2), 30);
      }
    }
    // ===== PRIORIDAD 7: Estados SCORM básicos (fallback) =====
    else if (status === 'incomplete' || status === 'browsed') {
      porcentaje = status === 'incomplete' ? 10 : 5;
    }

    // Limitar a 0-100
    porcentaje = Math.max(0, Math.min(100, porcentaje));
    
    console.log(`📊 Progreso calculado: ${porcentaje}% (fuentes: status=${status}, score=${rawScore}, páginas=${this.paginasVisitadas.size}, interacciones=${this.interactionCount})`);
    
    // Emitir el valor para que el Player lo vea y actualice la barra
    this.progresoRealtime.next(porcentaje);
    
    // Guardar el porcentaje en cmi_score_raw para persistirlo
    if (porcentaje > (this.cmiData.cmi_score_raw || 0)) {
      this.cmiData.cmi_score_raw = porcentaje;
    }
    
    // Guardar tracking
    this.guardarTrackingEnSuspendData();
  }

  // --- MÉTODOS SCORM 1.2 ---

  private LMSInitialize(param: string): string {
    console.log('🚀 SCORM: LMSInitialize');
    
    if (!this.initialized) {
      this.initialized = true;
      this.startTime = Date.now();
      this.sessionStartTime = Date.now();
      
      if (this.cmiData.cmi_lesson_status === 'not attempted') {
        this.cmiData.cmi_lesson_status = 'incomplete';
        this.guardarEnBD();
      }
    }
    return "true";
  }

  private LMSFinish(param: string): string {
    console.log('🏁 SCORM: LMSFinish');
    this.calcularProgresoMultiFuente();
    this.guardarEnBD();
    this.initialized = false;
    return "true";
  }

  private LMSGetValue(element: string): string {
    switch (element) {
      case 'cmi.core.lesson_status': return this.cmiData.cmi_lesson_status;
      case 'cmi.core.score.raw': return String(this.cmiData.cmi_score_raw);
      case 'cmi.core.score.min': return "0";
      case 'cmi.core.score.max': return "100";
      case 'cmi.core.lesson_location': return this.cmiData.cmi_location;
      case 'cmi.suspend_data': return this.cmiData.cmi_suspend_data;
      case 'cmi.core.student_id': return String(this.usuarioId);
      case 'cmi.core.student_name': return 'Usuario ' + this.usuarioId;
      case 'cmi.core.credit': return 'credit';
      case 'cmi.core.entry': return this.cmiData.cmi_location ? 'resume' : 'ab-initio';
      case 'cmi.core.lesson_mode': return 'normal';
      case 'cmi.core.total_time': return '0000:00:00';
      default: return "";
    }
  }

  // 🆕 Getter SCORM 2004
  private LMSGetValue2004(element: string): string {
    const mapped = this.map2004to12(element);
    if (mapped !== element) {
      return this.LMSGetValue(mapped);
    }
    
    // Elementos específicos de SCORM 2004
    switch (element) {
      case 'cmi.progress_measure': return String(this.progressMeasure);
      case 'cmi.completion_status': return this.cmiData.cmi_lesson_status === 'completed' ? 'completed' : 'incomplete';
      case 'cmi.success_status': return this.cmiData.cmi_lesson_status === 'passed' ? 'passed' : 'unknown';
      default: return this.LMSGetValue(element);
    }
  }

  private LMSSetValue(element: string, value: string): string {
    console.log(`📝 SCORM Set: ${element} = ${value}`);
    
    // 🆕 Incrementar contador de interacciones
    this.interactionCount++;

    switch (element) {
      case 'cmi.core.lesson_status':
        this.cmiData.cmi_lesson_status = value;
        break;
      case 'cmi.core.score.raw':
        const scoreValue = parseFloat(value) || 0;
        // Solo actualizar si es mayor que el actual (progreso nunca baja)
        if (scoreValue > (this.cmiData.cmi_score_raw || 0)) {
          this.cmiData.cmi_score_raw = scoreValue;
        }
        break;
      case 'cmi.core.lesson_location':
        this.cmiData.cmi_location = value;
        // 🆕 Registrar página visitada
        if (value && value.trim()) {
          this.paginasVisitadas.add(value.trim());
        }
        break;
      case 'cmi.suspend_data':
        // 🆕 Preservar nuestro tracking al actualizar suspend_data
        try {
          const nuevoData = this.parseSuspendData(value);
          const actualData = this.parseSuspendData(this.cmiData.cmi_suspend_data);
          nuevoData._tracking = actualData._tracking;
          this.cmiData.cmi_suspend_data = JSON.stringify(nuevoData);
        } catch {
          this.cmiData.cmi_suspend_data = value;
        }
        break;
    }
    
    // Recalcular progreso después de cualquier cambio
    this.calcularProgresoMultiFuente();
    
    return "true";
  }

  // 🆕 Setter SCORM 2004
  private LMSSetValue2004(element: string, value: string): string {
    console.log(`📝 SCORM 2004 Set: ${element} = ${value}`);
    
    // Elementos específicos de SCORM 2004
    switch (element) {
      case 'cmi.progress_measure':
        const pm = parseFloat(value);
        if (!isNaN(pm) && pm >= 0 && pm <= 1) {
          this.progressMeasure = pm;
          this.calcularProgresoMultiFuente();
        }
        return "true";
        
      case 'cmi.completion_status':
        if (value === 'completed') {
          this.cmiData.cmi_lesson_status = 'completed';
        } else if (value === 'incomplete') {
          this.cmiData.cmi_lesson_status = 'incomplete';
        }
        this.calcularProgresoMultiFuente();
        return "true";
        
      case 'cmi.success_status':
        if (value === 'passed') {
          this.cmiData.cmi_lesson_status = 'passed';
        } else if (value === 'failed') {
          this.cmiData.cmi_lesson_status = 'failed';
        }
        this.calcularProgresoMultiFuente();
        return "true";
    }
    
    // Mapear a SCORM 1.2 para el resto
    const mapped = this.map2004to12(element);
    return this.LMSSetValue(mapped, value);
  }

  private LMSCommit(param: string): string {
    this.calcularProgresoMultiFuente();
    this.guardarEnBD();
    return "true";
  }

  private guardarEnBD(): void {
    // Asegurar que el tracking esté guardado
    this.guardarTrackingEnSuspendData();
    
    // Guardamos silenciosamente en backend
    this.dataService.guardarProgreso(this.usuarioId, this.cursoId, this.cmiData).subscribe({
      next: () => {}, // Éxito silencioso
      error: (e) => console.error('❌ Error guardando progreso:', e)
    });
  }

  private map2004to12(element: string): string {
    const mapping: { [key: string]: string } = {
      'cmi.location': 'cmi.core.lesson_location',
      'cmi.completion_status': 'cmi.core.lesson_status',
      'cmi.success_status': 'cmi.core.lesson_status',
      'cmi.score.raw': 'cmi.core.score.raw',
      'cmi.score.min': 'cmi.core.score.min',
      'cmi.score.max': 'cmi.core.score.max',
      'cmi.suspend_data': 'cmi.suspend_data',
      'cmi.learner_id': 'cmi.core.student_id',
      'cmi.learner_name': 'cmi.core.student_name',
      'cmi.session_time': 'cmi.core.session_time',
      'cmi.exit': 'cmi.core.exit',
      'cmi.entry': 'cmi.core.entry',
      'cmi.mode': 'cmi.core.lesson_mode',
      'cmi.credit': 'cmi.core.credit',
      'cmi.total_time': 'cmi.core.total_time'
    };
    return mapping[element] || element;
  }

  forceCommit(): void {
    if (this.initialized) {
      console.log('🔄 Forzando guardado de progreso final...');
      this.calcularProgresoMultiFuente();
      this.guardarEnBD();
    }
  }

  getEstadoActual(): any {
    return { ...this.cmiData };
  }
  
  // 🆕 Obtener el porcentaje actual calculado
  getProgresoActual(): number {
    return this.progresoRealtime.getValue();
  }
}