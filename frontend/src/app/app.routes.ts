import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';

import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlayerComponent } from './components/player/player.component';

import { DashboardProfesor } from './pages/dashboard-profesor/dashboard-profesor';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // ✅ Login sin layout
  { path: 'login', component: LoginComponent },

  // ✅ Resto de la app con layout
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard-profesor', component: DashboardProfesor },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'player/:id', component: PlayerComponent },
      
    ],
  },

  { path: '**', redirectTo: 'login' },
];
