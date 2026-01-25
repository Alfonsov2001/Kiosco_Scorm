import { Injectable } from '@angular/core';
import { DataService } from './data.service';

@Injectable({
    providedIn: 'root'
})
export class ScormService {
    private startTime: number = 0;
    private cursoId: number = 0;
    private usuarioId: number = 0;

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

        // Reset cache (o cargar desde BD si lo hiciéramos síncrono, pero SCORM es síncrono y HTTP asíncrono. 
        // Lo ideal es cargar antes de init)

        // API SCORM 1.2
        (window as any).API = {
            LMSInitialize: (param: string) => this.LMSInitialize(param),
            LMSFinish: (param: string) => this.LMSFinish(param),
            LMSGetValue: (element: string) => this.LMSGetValue(element),
            LMSSetValue: (element: string, value: string) => this.LMSSetValue(element, value),
            LMSCommit: (param: string) => this.LMSCommit(param),
            LMSGetLastError: () => "0",
            LMSGetErrorString: () => "No error",
            LMSGetDiagnostic: () => "No error"
        };

        // API SCORM 2004 (Simplificado, mapeado a 1.2 internamente por ahora)
        (window as any).API_1484_11 = {
            Initialize: (param: string) => this.LMSInitialize(param),
            Terminate: (param: string) => this.LMSFinish(param),
            GetValue: (element: string) => this.LMSGetValue(this.map2004to12(element)),
            SetValue: (element: string, value: string) => this.LMSSetValue(this.map2004to12(element), value),
            Commit: (param: string) => this.LMSCommit(param),
            GetLastError: () => "0",
            GetErrorString: () => "No error",
            GetDiagnostic: () => "No error"
        };

        console.log('✅ SCORM API Adapter initialized');
    }

    // Cargar estado inicial desde BD
    async cargarEstadoInicial() {
        console.log(`ScormService: Cargando estado para U:${this.usuarioId} C:${this.cursoId}`);
        try {
            const data = await this.dataService.obtenerProgreso(this.usuarioId, this.cursoId).toPromise();
            if (data && data.cmi_lesson_status) {
                this.cmiData = {
                    cmi_lesson_status: data.cmi_lesson_status,
                    cmi_score_raw: data.cmi_score_raw,
                    cmi_location: data.cmi_location || '', // Asegurar string
                    cmi_suspend_data: data.cmi_suspend_data || '' // Asegurar string
                };
                console.log('📥 Estado SCORM recuperado:', this.cmiData);
            } else {
                console.log('ℹ️ No hay estado previo guardado (o es vacío).');
            }
        } catch (e) {
            console.error('⚠️ Error no crítico cargando estado inicial SCORM:', e);
            // No hacemos throw, dejamos que continúe con valores por defecto
        }
    }

    // --- MÉTODOS SCORM ---

    private LMSInitialize(param: string): string {
        console.log('SCORM: LMSInitialize');
        return "true";
    }

    private LMSFinish(param: string): string {
        console.log('SCORM: LMSFinish');
        this.guardarEnBD();
        return "true";
    }

    private LMSGetValue(element: string): string {
        // console.log('SCORM: LMSGetValue', element);
        switch (element) {
            case 'cmi.core.lesson_status': return this.cmiData.cmi_lesson_status;
            case 'cmi.core.score.raw': return this.cmiData.cmi_score_raw.toString();
            case 'cmi.core.lesson_location': return this.cmiData.cmi_location;
            case 'cmi.suspend_data': return this.cmiData.cmi_suspend_data;
            case 'cmi.core.student_id': return this.usuarioId.toString();
            case 'cmi.core.student_name': return 'Usuario ' + this.usuarioId;
            default: return "";
        }
    }

    private LMSSetValue(element: string, value: string): string {
        // console.log(`SCORM: LMSSetValue ${element} = ${value}`);
        switch (element) {
            case 'cmi.core.lesson_status': this.cmiData.cmi_lesson_status = value; break;
            case 'cmi.core.score.raw': this.cmiData.cmi_score_raw = parseFloat(value); break;
            case 'cmi.core.lesson_location': this.cmiData.cmi_location = value; break;
            case 'cmi.suspend_data': this.cmiData.cmi_suspend_data = value; break;
        }
        // Opcional: Guardar en cada set o solo en commit. Guardar en cada set es más seguro pero intensivo.
        // Lo haremos en commit y finish.
        return "true";
    }

    private LMSCommit(param: string): string {
        console.log('SCORM: LMSCommit');
        this.guardarEnBD();
        return "true";
    }

    private guardarEnBD() {
        this.dataService.guardarProgreso(this.usuarioId, this.cursoId, this.cmiData).subscribe({
            next: () => console.log('💾 Progreso guardado en BD'),
            error: (e) => console.error('❌ Error guardando progreso', e)
        });
    }

    private map2004to12(element: string): string {
        // Mapeo básico
        if (element === 'cmi.location') return 'cmi.core.lesson_location';
        if (element === 'cmi.completion_status') return 'cmi.core.lesson_status'; // 2004 tiene completion + success
        if (element === 'cmi.score.raw') return 'cmi.core.score.raw';
        if (element === 'cmi.suspend_data') return 'cmi.suspend_data';
        return element;
    }
}
