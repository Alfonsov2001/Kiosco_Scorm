import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlayerComponent } from './components/player/player.component';
import { UploadComponent } from './components/upload/upload.component'; // <--- ¿Está esta línea?

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'player/:id', component: PlayerComponent },
  
  // ESTA ES LA CLAVE:
  { path: 'upload', component: UploadComponent }
];