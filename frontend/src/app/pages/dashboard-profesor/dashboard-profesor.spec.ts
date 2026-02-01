import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardProfesor } from './dashboard-profesor'; // Asegúrate de que la ruta sea correcta
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DataService } from '../../services/data.service';
import { of } from 'rxjs'; // Necesario para simular respuestas observables

describe('DashboardProfesor', () => {
  let component: DashboardProfesor;
  let fixture: ComponentFixture<DashboardProfesor>;

  // 1. Creamos un "Mock" (Simulacro) del DataService
  // Esto evita que el test intente llamar a funciones reales que pueden fallar
  const mockDataService = {
    // Simulamos getCategorias devolviendo un array vacío observable
    getCategorias: () => of([]),
    // Si usas usuarioActual en el componente, simúlalo también
    usuarioActual: { id: 1, nombre: 'Test Profe', rol: 'profesor' },
    cursoActual: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Importamos el componente (es standalone)
      imports: [DashboardProfesor], 
      
      // Proveemos las dependencias falsas o de prueba
      providers: [
        provideHttpClient(),        // Cliente HTTP falso para el componente
        provideHttpClientTesting(), // Herramientas de testing HTTP
        provideRouter([]),          // Router falso
        // AQUÍ ESTÁ LA CLAVE: Cuando pidan DataService, usa el mockDataService
        { provide: DataService, useValue: mockDataService } 
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardProfesor);
    component = fixture.componentInstance;
    
    // detectChanges dispara el ngOnInit.
    // Como hemos mockeado el servicio, no fallará intentando conectar a nada.
    fixture.detectChanges(); 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});