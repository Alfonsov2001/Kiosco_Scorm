import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // 1. CAMBIO IMPORTANTE: Apuntamos a la raíz del servidor, no a /api/cursos
  private baseUrl = 'http://localhost:3000';

  public usuarioActual: any = null;
  public cursoActual: any;

  constructor(private http: HttpClient) { }

  // Función para hacer login
  login(email: string): Observable<any> {
    // Ahora construimos la ruta correcta: localhost:3000/api/login
    return this.http.post(`${this.baseUrl}/api/login`, { email });
  }

  // Función para pedir los cursos
  getCursos(): Observable<any> {
    // Ruta correcta: localhost:3000/api/cursos
    return this.http.get(`${this.baseUrl}/api/cursos`);
  }

  subirCurso(titulo: string, descripcion: string, archivo: File, categoriaId: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('file', archivo);
    if (categoriaId) formData.append('categoria_id', categoriaId);

    return this.http.post(`${this.baseUrl}/api/cursos/upload`, formData);
  }

  guardarProgreso(usuarioId: number, cursoId: number, cmi: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/progreso/guardar`, { usuarioId, cursoId, cmi });
  }

  obtenerProgreso(usuarioId: number, cursoId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/progreso/obtener?usuarioId=${usuarioId}&cursoId=${cursoId}`);
  }

  obtenerRecientes(usuarioId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/progreso/recientes?usuarioId=${usuarioId}`);
  }

  getCategorias(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/categorias`);
  }

  crearCategoria(nombre: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/categorias`, { nombre });
  }

  getCurso(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/cursos/${id}`);
  }
}