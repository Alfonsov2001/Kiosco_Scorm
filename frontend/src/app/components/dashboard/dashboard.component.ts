import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- 1. Importamos ChangeDetectorRef
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  cursos: any[] = [];
  usuario: any = {}; 

  constructor(
    private dataService: DataService, 
    private router: Router,
    private cd: ChangeDetectorRef // <--- 2. Lo inyectamos aquí para poder usarlo
  ) {}

  ngOnInit() {
    this.usuario = this.dataService.usuarioActual || { email: 'Invitado' };

    this.dataService.getCursos().subscribe({
      next: (data: any) => {
        this.cursos = data;
        console.log('Cursos cargados:', this.cursos);
        
        // <--- 3. ¡LA ALARMA! Le decimos a Angular: "Oye, tengo datos nuevos, actualiza la pantalla YA"
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar cursos:', err);
      }
    });
  }

  irAlCurso(curso: any) {
    console.log('Abriendo curso:', curso.titulo);
    this.dataService.cursoActual = curso;
    this.router.navigate(['/player', curso.id]);
  }

  salir() {
    this.dataService.usuarioActual = null;
    this.router.navigate(['/login']);
  }

// Función para ir a la pantalla de subir cursos
  irSubir() {
    this.router.navigate(['/upload']);
  }

}