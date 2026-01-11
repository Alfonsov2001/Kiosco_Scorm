import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; // Importante para *ngIf

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule], // <--- Asegúrate de tener esto
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  curso: any;
  urlSegura: SafeResourceUrl | undefined;

  constructor(
    private dataService: DataService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.curso = this.dataService.cursoActual;

    if (!this.curso) {
      // Si recargan la página y pierden el dato, volvemos al dashboard
      this.router.navigate(['/dashboard']);
      return;
    }

    // Construimos la URL: http://localhost:3000 + /cursos/carpeta + /archivo.html
    const rutaCompleta = `http://localhost:3000${this.curso.ruta_carpeta}/${this.curso.punto_entrada}`;
    
    // Le decimos a Angular que confiamos en esta URL para el iframe
    this.urlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(rutaCompleta);
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}