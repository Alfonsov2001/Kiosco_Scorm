// 1. IMPORTACIONES DE ANGULAR (Lo que te faltaba)
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';

// 2. IMPORTACIONES DE TUS SERVICIOS
// IMPORTANTE: Verifica que estas rutas sean correctas según tu carpeta
import { DataService } from '../../services/data.service';
import { ScormService } from '../../services/scorm.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule], // Necesario para usar *ngIf
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnDestroy {
  
  // Variables
  curso: any = null;
  urlSegura: SafeResourceUrl | undefined;
  cargando: boolean = true;
  progresoActual: number = 0;
  nombreUsuario: string = 'Alumno';
  
  // Suscripción para detectar cambios en tiempo real
  private progresoSub: Subscription | undefined;

  constructor(
    private dataService: DataService,
    private scormService: ScormService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    try {
      // Obtener el ID de la URL (ej: /player/5)
      const id = this.route.snapshot.paramMap.get('id');
      
      // --- LOGICA DE CURSO ---
      this.curso = this.dataService.cursoActual;
      // Si recargamos la página, el servicio pierde el dato, así que lo pedimos de nuevo
      if (!this.curso || this.curso.id !== Number(id)) {
        // Nota: Asegúrate de que tu DataService tenga el método 'getCurso'
        // Si usas promesas o observables, ajústalo aquí. Asumo Observable convertido a Promise:
        this.curso = await this.dataService.getCurso(Number(id)).toPromise(); 
      }

      // --- LOGICA DE USUARIO ---
      let usuario = this.dataService.usuarioActual;
      if (!usuario) {
        const stored = localStorage.getItem('usuarioActual');
        if (stored) usuario = JSON.parse(stored);
      }
      this.nombreUsuario = usuario ? usuario.nombre : 'Alumno';

      // Seguridad: Si no hay curso o usuario, mandar al login
      if (!this.curso || !usuario) {
        this.router.navigate(['/login']);
        return;
      }

      // --- INICIAR SCORM ---
      this.scormService.initScormAPI(this.curso.id, usuario.id);

      // Suscribirse al progreso para actualizar la barra verde
      this.progresoSub = this.scormService.progresoRealtime.subscribe(p => {
        this.progresoActual = p;
        this.cdr.detectChanges(); // Forzar actualización visual
      });

      // Cargar donde se quedó la última vez
      try { await this.scormService.cargarEstadoInicial(); } catch(e){}

      // --- CONSTRUIR URL DEL IFRAME ---
      let ruta = this.curso.ruta_carpeta;
      if (!ruta.startsWith('/')) ruta = '/' + ruta;
      
      const urlFinal = `${ruta}/${this.curso.punto_entrada}`;
      
      // "Sanitizar" la URL para que Angular confíe en ella
      this.urlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(urlFinal);
      
      // ¡Listo! Quitamos el spinner
      this.cargando = false;
      this.cdr.detectChanges();

    } catch (e) {
      console.error('Error cargando el player:', e);
      this.cargando = false;
    }
  }

  ngOnDestroy() {
    // Al salir, guardar todo y desuscribirse para no dejar basura en memoria
    if (this.progresoSub) this.progresoSub.unsubscribe();
    this.scormService.forceCommit();
  }

  volver() {
    // Guardar antes de salir
    this.scormService.forceCommit();
    
    // Redirigir según si es profe o alumno
    const usuario = this.dataService.usuarioActual;
    const ruta = (usuario?.rol === 'profesor') ? '/dashboard-profesor' : '/dashboard';
    this.router.navigate([ruta]);
  }
}