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

  // 🔥 NUEVO: Observable para enviar el progreso en tiempo real al Player
  public progresoRealtime = new BehaviorSubject<number>(0);

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
    this.initialized = false;
    
    // Reiniciar progreso visual al abrir un curso nuevo
    this.progresoRealtime.next(0);

    // Crear el objeto API
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
      GetValue: (element: string) => this.LMSGetValue(this.map2004to12(element)),
      SetValue: (element: string, value: string) => this.LMSSetValue(this.map2004to12(element), value),
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
        
        // Calcular progreso inicial basado en lo recuperado
        this.calcularProgreso();
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

  // 🔥 Lógica inteligente para calcular porcentaje
  private calcularProgreso() {
    let porcentaje = 0;
    const status = this.cmiData.cmi_lesson_status;
    const rawScore = parseFloat(this.cmiData.cmi_score_raw);

    // Prioridad 1: Si el estado es completado, es 100%
    if (status === 'completed' || status === 'passed') {
      porcentaje = 100;
    } 
    // Prioridad 2: Si hay una puntuación numérica (ej: 25, 50, 75), la usamos como %
    else if (!isNaN(rawScore) && rawScore > 0) {
      porcentaje = rawScore;
      // Si el score es > 100, lo limitamos (a veces es sobre 1000)
      if (porcentaje > 100) porcentaje = 100;
    }

    // Emitir el valor para que el Player lo vea y actualice la barra
    this.progresoRealtime.next(porcentaje);
  }

  // --- MÉTODOS SCORM 1.2 ---

  private LMSInitialize(param: string): string {
    console.log('🚀 SCORM: LMSInitialize');
    
    if (!this.initialized) {
      this.initialized = true;
      this.startTime = Date.now();
      
      if (this.cmiData.cmi_lesson_status === 'not attempted') {
        this.cmiData.cmi_lesson_status = 'incomplete';
        this.guardarEnBD();
      }
    }
    return "true";
  }

  private LMSFinish(param: string): string {
    console.log('🏁 SCORM: LMSFinish');
    this.guardarEnBD();
    this.initialized = false;
    return "true";
  }

  private LMSGetValue(element: string): string {
    // console.log('📖 SCORM Get:', element); // Descomentar para debug intenso
    
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

  private LMSSetValue(element: string, value: string): string {
    console.log(`📝 SCORM Set: ${element} = ${value}`);
    
    let cambioImportante = false;

    switch (element) {
      case 'cmi.core.lesson_status':
        this.cmiData.cmi_lesson_status = value;
        cambioImportante = true;
        break;
      case 'cmi.core.score.raw':
        this.cmiData.cmi_score_raw = parseFloat(value) || 0;
        cambioImportante = true;
        break;
      case 'cmi.core.lesson_location':
        this.cmiData.cmi_location = value;
        break;
      case 'cmi.suspend_data':
        this.cmiData.cmi_suspend_data = value;
        break;
    }
    
    // Si cambió el estado o la puntuación, recalculamos la barra visual
    if (cambioImportante) {
      this.calcularProgreso();
    }

    return "true";
  }

  private LMSCommit(param: string): string {
    // console.log('💾 SCORM Commit');
    this.guardarEnBD();
    return "true";
  }

  private guardarEnBD(): void {
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
      this.guardarEnBD();
    }
  }

  getEstadoActual(): any {
    return { ...this.cmiData };
  }
}