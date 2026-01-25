import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  recientes: any[] = [];
  usuario: any;

  constructor(private dataService: DataService, private router: Router) { }

  ngOnInit() {
    this.usuario = this.dataService.usuarioActual;
    if (this.usuario) {
      this.cargarRecientes();
    }
  }

  cargarRecientes() {
    this.dataService.obtenerRecientes(this.usuario.id).subscribe({
      next: (data: any) => this.recientes = data || [],
      error: (e) => console.error(e)
    });
  }

  abrir(curso: any) {
    this.dataService.cursoActual = curso;
    this.router.navigate(['/player', curso.id]); // Asumimos id del curso, ojo si id es prog_id
    // El endpoint devuelve p.*, c.titulo... 
    // progreso.curso_id es lo que necesitamos.
    // SQL: SELECT p.*, c.titulo ... FROM progreso p JOIN cursos c ON p.curso_id = c.id
    // Entonces 'id' en row será id de progreso, 'curso_id' será id de curso.
    this.router.navigate(['/player', curso.curso_id]);
  }
}
