import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ScormService } from '../../services/scorm.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnDestroy {
  curso: any;
  urlSegura: SafeResourceUrl | undefined;
  urlDebug: string = '';

  constructor(
    private dataService: DataService,
    private scormService: ScormService,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    // 1. Intentar obtener curso del servicio (memoria)
    this.curso = this.dataService.cursoActual;
    console.log('Player ngOnInit - Curso en memoria:', this.curso);

    // 2. Si no está en memoria, intentar recuperarlo usando el ID de la URL
    if (!this.curso) {
      // Necesitamos castear a 'any' o asegurar que route está definido
      const id = this.route.snapshot.paramMap.get('id');
      console.log('Player - No hay curso en memoria. Recuperando ID de URL:', id);

      if (id) {
        try {
          this.curso = await this.dataService.getCurso(Number(id)).toPromise();
          if (!this.curso) throw new Error('Curso no encontrado');
          console.log('Player - Curso recuperado:', this.curso);
        } catch (e) {
          console.error('Error recuperando curso:', e);
          this.router.navigate(['/dashboard']);
          return;
        }
      } else {
        console.warn('ID nulo en URL, volviendo al dashboard');
        this.router.navigate(['/dashboard']);
        return;
      }
    }

    // 3. Renderizar Iframe INMEDIATAMENTE (para que no se quede en blanco)
    const rutaCompleta = `http://localhost:3000${this.curso.ruta_carpeta}/${this.curso.punto_entrada}`;
    console.log('Cargando iframe:', rutaCompleta);
    this.urlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(rutaCompleta);

    // 4. Inicializar SCORM en segundo plano (sin bloquear UI)
    const usuario = this.dataService.usuarioActual;
    if (usuario && usuario.id) {
      console.log('Inicializando SCORM para usuario:', usuario.id);
      this.scormService.initScormAPI(this.curso.id, usuario.id);

      // Llamada asíncrona no bloqueante
      this.scormService.cargarEstadoInicial().catch(e => {
        console.error('Error no crítico cargando estado SCORM en background:', e);
      });
    }
  }

  ngOnDestroy() {
    // Opcional: Forzar guardado al salir
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}