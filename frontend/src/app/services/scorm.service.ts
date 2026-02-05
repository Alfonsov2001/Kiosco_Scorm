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

  // Simplificado: solo 3 hitos - 0%, 50%, 100%
  private progresoGuardado: number = 0; // Ultimo progreso guardado
  private progressMeasure: number = 0; // SCORM 2004 cmi.progress_measure (0-1)
  private sessionStartTime: number = 0;

  // Cache de datos CMI
  private cmiData: any = {
    cmi_lesson_status: 'not attempted',
    cmi_score_raw: 0,
    cmi_location: '',
    cmi_suspend_data: ''
  };

  // Intervalo para guardado automático
  private autoSaveInterval: any = null;

  constructor(private dataService: DataService) { }

  initScormAPI(cursoId: number, usuarioId: number) {
    this.cursoId = cursoId;
    this.usuarioId = usuarioId;
    this.startTime = Date.now();
    this.sessionStartTime = Date.now();
    this.initialized = false;
    
    // Reiniciar tracking al abrir un curso nuevo
    this.progressMeasure = 0;
    this.progresoGuardado = 0;
    this.progresoRealtime.next(0);

    console.log(`🚀 Inicializando API SCORM para usuario ${usuarioId}, curso ${cursoId}`);

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
    
    // SCORM 1.2 - Múltiples ubicaciones
    win.API = apiObject;
    win.api = apiObject;
    
    // SCORM 2004
    win.API_1484_11 = api2004Object;
    
    // También en el parent (muy importante para iframes)
    if (win.parent && win.parent !== win) {
      console.log('📢 Exponiendo API a window.parent');
      win.parent.API = apiObject;
      win.parent.api = apiObject;
      win.parent.API_1484_11 = api2004Object;
    }

    // Y en top (también importante)
    if (win.top && win.top !== win) {
      try {
        console.log('📢 Exponiendo API a window.top');
        win.top.API = apiObject;
        win.top.api = apiObject;
        win.top.API_1484_11 = api2004Object;
      } catch (e) {
        console.warn('⚠️ No se puede acceder a window.top (posible error de cross-origin):', e);
      }
    }

    // 🆕 También exponer globalmente como propiedades accesibles
    (window as any).scormAPI = apiObject;
    (window as any).scormAPI2004 = api2004Object;

    console.log('✅ SCORM API inicializado en múltiples ubicaciones');
    console.log('   - window.API ✅');
    console.log('   - window.api ✅');
    console.log('   - window.API_1484_11 ✅');
    if (win.parent && win.parent !== win) console.log('   - window.parent.API ✅');
    if (win.top && win.top !== win) console.log('   - window.top.API ✅');
    
    // 🆕 Iniciar guardado automático cada 10 segundos
    this.iniciarGuardadoAutomatico();
  }

  // 🆕 Método de diagnóstico
  private diagnosticarSCORM(): void {
    const win = window as any;
    const tieneAPI_12 = !!(win.API || win.api);
    const tieneAPI_2004 = !!win.API_1484_11;
    const tieneParentAPI = !!(win.parent?.API || win.parent?.api || win.parent?.API_1484_11);
    
    console.log(`
╔════════════════════════════════════════════╗
║         DIAGNÓSTICO DE SCORM                ║
╚════════════════════════════════════════════╝
Versión detectada: ${tieneAPI_2004 ? 'SCORM 2004' : tieneAPI_12 ? 'SCORM 1.2' : 'NO DETECTADO'}
API 1.2 disponible: ${tieneAPI_12}
API 2004 disponible: ${tieneAPI_2004}
Parent API disponible: ${tieneParentAPI}
Variables soportadas:
  - cmi.progress_measure: ${tieneAPI_2004 ? '✅ Sí (SCORM 2004)' : '❌ No (Solo SCORM 1.2)'}
  - cmi.core.score.raw: ✅ Sí (SCORM 1.2)
  - cmi.core.lesson_status: ✅ Sí (SCORM 1.2)

Próximos pasos:
1. Abre el navegador (F12)
2. Ve a la consola
3. Busca mensajes que digan "PROGRESS_MEASURE" o "SCORE.RAW"
4. Si ves "PROGRESS_MEASURE RECIBIDO", el curso está reportando progreso
5. Si no ves nada, el curso no está reportando progreso granular
    `);
  }

  // Guardado automatico (simplificado)
  private iniciarGuardadoAutomatico(): void {
    // Detener intervalo anterior si existe
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // Solo guardar al detectar cambios (via LMSSetValue)
    // Ya no necesitamos guardado periodico con la logica de 3 hitos
  }

  // Detener guardado automatico
  detenerGuardadoAutomatico(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
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

  // Restaurar progreso guardado anteriormente
  private restaurarProgresoGuardado(): void {
    try {
      if (this.cmiData.cmi_suspend_data) {
        const suspendData = this.parseSuspendData(this.cmiData.cmi_suspend_data);
        
        // Restaurar progress_measure
        if (suspendData._tracking?.progressMeasure) {
          this.progressMeasure = suspendData._tracking.progressMeasure;
        }
        
        // Restaurar ultimo progreso guardado
        if (suspendData._tracking?.progresoGuardado) {
          this.progresoGuardado = suspendData._tracking.progresoGuardado;
        }
        
        console.log('Tracking restaurado:', {
          progressMeasure: this.progressMeasure,
          progresoGuardado: this.progresoGuardado
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

  // Guardar tracking en suspend_data sin perder datos originales del SCORM
  private guardarTrackingEnSuspendData(): void {
    try {
      let suspendObj = this.parseSuspendData(this.cmiData.cmi_suspend_data);
      
      // Agregar o actualizar nuestro tracking
      suspendObj._tracking = {
        progressMeasure: this.progressMeasure,
        progresoGuardado: this.progresoGuardado,
        ultimaActualizacion: new Date().toISOString()
      };
      
      this.cmiData.cmi_suspend_data = JSON.stringify(suspendObj);
    } catch (e) {
      console.warn('Error guardando tracking');
    }
  }

  // Logica simplificada: solo 0%, 50%, 100%
  private calcularProgresoMultiFuente(): void {
    let porcentaje = 0;
    const status = this.cmiData.cmi_lesson_status;
    const rawScore = parseFloat(this.cmiData.cmi_score_raw);
    
    // COMPLETADO = 100%
    if (status === 'completed' || status === 'passed') {
      porcentaje = 100;
    }
    // EN PROGRESO = 50%
    else if (status === 'incomplete' || this.progressMeasure > 0 || rawScore > 0) {
      porcentaje = 50;
    }
    // NO INICIADO = 0%
    else {
      porcentaje = 0;
    }
    
    console.log('Progreso calculado: ' + porcentaje + '% (status=' + status + ')');
    
    this.progresoRealtime.next(porcentaje);
  }

  // Determinar si debemos guardar este progreso (solo en hitos: 0%, 50%, 100%)
  private debeGuardarProgreso(): boolean {
    const progresoActual = this.progresoRealtime.getValue();
    
    // Siempre guardar el primer cambio (0%)
    if (this.progresoGuardado === 0 && (progresoActual === 0 || progresoActual === 50)) {
      return true;
    }
    
    // Guardar transicion 0 -> 50 o 50 -> 100
    if (progresoActual > this.progresoGuardado) {
      this.progresoGuardado = progresoActual;
      return true;
    }
    
    // No guardar si no hay cambio significativo
    return false;
  }

  // --- MÉTODOS SCORM 1.2 ---

  private LMSInitialize(param: string): string {
    console.log('🚀 SCORM: LMSInitialize LLAMADO');
    console.log('   Parámetro:', param);
    console.log('   Usuario:', this.usuarioId);
    console.log('   Curso:', this.cursoId);
    
    if (!this.initialized) {
      this.initialized = true;
      this.startTime = Date.now();
      this.sessionStartTime = Date.now();
      
      console.log('✅ SCORM inicializado correctamente');
      
      if (this.cmiData.cmi_lesson_status === 'not attempted') {
        this.cmiData.cmi_lesson_status = 'incomplete';
        // 🆕 Guardar inmediatamente cuando se inicia
        this.calcularProgresoMultiFuente();
        this.guardarEnBD();
      }
    } else {
      console.log('⚠️ LMSInitialize ya fue llamado anteriormente');
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
    console.log('SCORM 1.2 Set: ' + element + ' = ' + value);

    switch (element) {
      case 'cmi.core.lesson_status':
        console.log(`📌 LESSON_STATUS: ${value}`);
        this.cmiData.cmi_lesson_status = value;
        this.guardarEnBD();
        break;
      case 'cmi.core.score.raw':
        const scoreValue = parseFloat(value) || 0;
        console.log(`📊 SCORE.RAW: ${scoreValue}`);
        // Solo actualizar si es mayor que el actual (progreso nunca baja)
        if (scoreValue > (this.cmiData.cmi_score_raw || 0)) {
          this.cmiData.cmi_score_raw = scoreValue;
          // 🆕 Guardar inmediatamente si el score cambió
          this.guardarEnBD();
        }
        break;
      case 'cmi.core.lesson_location':
        this.cmiData.cmi_location = value;
        console.log('Ubicacion: ' + value);
        break;
      case 'cmi.suspend_data':
        // 🆕 Preservar nuestro tracking al actualizar suspend_data
        try {
          const nuevoData = this.parseSuspendData(value);
          const actualData = this.parseSuspendData(this.cmiData.cmi_suspend_data);
          nuevoData._tracking = actualData._tracking;
          this.cmiData.cmi_suspend_data = JSON.stringify(nuevoData);
          console.log(`💾 SUSPEND_DATA actualizado`);
        } catch {
          this.cmiData.cmi_suspend_data = value;
        }
        break;
    }
    
    // Recalcular progreso después de cualquier cambio
    this.calcularProgresoMultiFuente();
    
    return "true";
  }

  private LMSSetValue2004(element: string, value: string): string {
    console.log(`📝 SCORM 2004 Set: ${element} = ${value}`);
    
    // Elementos específicos de SCORM 2004
    switch (element) {
      case 'cmi.progress_measure':
        const pm = parseFloat(value);
        if (!isNaN(pm) && pm >= 0 && pm <= 1) {
          console.log(`🎯 PROGRESS_MEASURE RECIBIDO: ${pm} (${Math.round(pm * 100)}%)`);
          this.progressMeasure = pm;
          this.calcularProgresoMultiFuente();
          // 🆕 Guardar inmediatamente al recibir progreso
          this.guardarEnBD();
        }
        return "true";
        
      case 'cmi.completion_status':
        console.log(`✅ COMPLETION_STATUS: ${value}`);
        if (value === 'completed') {
          this.cmiData.cmi_lesson_status = 'completed';
        } else if (value === 'incomplete') {
          this.cmiData.cmi_lesson_status = 'incomplete';
        }
        this.calcularProgresoMultiFuente();
        this.guardarEnBD();
        return "true";
        
      case 'cmi.success_status':
        console.log(`🏆 SUCCESS_STATUS: ${value}`);
        if (value === 'passed') {
          this.cmiData.cmi_lesson_status = 'passed';
        } else if (value === 'failed') {
          this.cmiData.cmi_lesson_status = 'failed';
        }
        this.calcularProgresoMultiFuente();
        this.guardarEnBD();
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
    // Solo guardar si hay cambio significativo (0%, 50%, 100%)
    if (!this.debeGuardarProgreso()) {
      console.log('Progreso sin cambio significativo, no se guarda');
      return;
    }

    // Asegurar que el tracking este guardado
    this.guardarTrackingEnSuspendData();
    
    // Log detallado antes de guardar
    const progresoActual = this.progresoRealtime.getValue();
    console.log('Guardando progreso en BD:', {
      usuario: this.usuarioId,
      curso: this.cursoId,
      status: this.cmiData.cmi_lesson_status,
      porcentaje: progresoActual + '%',
      timestamp: new Date().toISOString()
    });
    
    // Guardamos en backend
    this.dataService.guardarProgreso(this.usuarioId, this.cursoId, this.cmiData).subscribe({
      next: () => {
        console.log('Progreso ' + progresoActual + '% guardado exitosamente en BD');
      },
      error: (e) => console.error('Error guardando progreso:', e)
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