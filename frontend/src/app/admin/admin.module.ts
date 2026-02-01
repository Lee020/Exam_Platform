import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuditLogsComponent } from './components/audit-logs/audit-logs.component';
import { AuthGuard } from '../auth/guards/auth.guard';

const routes: Routes = [
    { path: 'users', component: UserManagementComponent, canActivate: [AuthGuard] },
    { path: 'audit-logs', component: AuditLogsComponent, canActivate: [AuthGuard] }
];

@NgModule({
    declarations: [
        UserManagementComponent,
        AuditLogsComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes)
    ]
})
export class AdminModule { }
