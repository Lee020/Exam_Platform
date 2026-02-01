import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
    selector: 'app-audit-logs',
    template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>System Audit Logs</h2>
        <button class="btn btn-outline-primary btn-sm" (click)="load()">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of logs">
                  <td>{{ log.timestamp | date:'short' }}</td>
                  <td><span class="badge bg-secondary text-white">{{ log.username }}</span></td>
                  <td><span class="fw-bold">{{ log.action }}</span></td>
                  <td>{{ log.resource }} ({{ log.resource_id }})</td>
                  <td><code>{{ log.ip_address }}</code></td>
                  <td>
                    <button class="btn btn-link btn-sm p-0" *ngIf="log.details" (click)="showDetails(log)">View</button>
                    <span class="text-muted" *ngIf="!log.details">None</span>
                  </td>
                </tr>
                <tr *ngIf="logs.length === 0">
                  <td colspan="6" class="text-center py-4">No audit logs found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
    logs: any[] = [];

    constructor(private adminService: AdminService) { }

    ngOnInit(): void {
        this.load();
    }

    load() {
        this.adminService.getAuditLogs().subscribe({
            next: (res) => this.logs = res.results || res,
            error: (err) => console.error('Audit logs load error', err)
        });
    }

    showDetails(log: any) {
        alert(JSON.stringify(log.details, null, 2));
    }
}
