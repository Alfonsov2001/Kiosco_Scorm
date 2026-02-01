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
    this.router.navigate(['/player', curso.curso_id]);
  }

  // ==================== HELPERS DE PROGRESO ====================

  getPorcentaje(status: string): number {
    if (!status) return 0;
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'passed') return 100;
    if (s === 'failed') return 100;
    if (s === 'incomplete') return 50;
    if (s === 'browsed') return 25;
    return 0;
  }

  getEstadoIcono(status: string): string {
    if (!status) return 'bi-circle';
    const s = status.toLowerCase();
    if (s === 'completed') return 'bi-check-circle-fill';
    if (s === 'passed') return 'bi-trophy-fill';
    if (s === 'failed') return 'bi-x-circle-fill';
    if (s === 'incomplete') return 'bi-play-circle-fill';
    if (s === 'browsed') return 'bi-eye-fill';
    return 'bi-circle';
  }

  getEstadoClase(status: string): string {
    if (!status) return 'status-pendiente';
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'passed') return 'status-completado';
    if (s === 'failed') return 'status-suspendido';
    if (s === 'incomplete') return 'status-progreso';
    if (s === 'browsed') return 'status-visto';
    return 'status-pendiente';
  }

  getProgresoColor(status: string): string {
    const porcentaje = this.getPorcentaje(status);
    if (porcentaje >= 100) return '#2D7A4F';
    if (porcentaje >= 50) return '#009ACD';
    if (porcentaje > 0) return '#D68E2E';
    return '#6c757d';
  }
}
