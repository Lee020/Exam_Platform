import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    public onViolation = new EventEmitter<string>();
    private isFullscreen = false;
    private escPressed = false;
    private fullscreenExitTimeout: any;

    constructor() { }

    startMonitoring(): void {
        // Tab switching detection
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Copy/Paste/Right-click block
        document.addEventListener('copy', this.preventEvent);
        document.addEventListener('paste', this.preventEvent);
        document.addEventListener('contextmenu', this.preventEvent);

        // ESC key detection
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Fullscreen detection
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    }

    stopMonitoring(): void {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        document.removeEventListener('copy', this.preventEvent);
        document.removeEventListener('paste', this.preventEvent);
        document.removeEventListener('contextmenu', this.preventEvent);
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));

        if (this.fullscreenExitTimeout) {
            clearTimeout(this.fullscreenExitTimeout);
        }

        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    requestFullscreen(): void {
        const el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen().catch(err => console.warn('Fullscreen request failed', err));
        }
    }

    private preventEvent(e: Event): void {
        e.preventDefault();
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            this.escPressed = true;
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            // Reset after a short delay
            setTimeout(() => {
                this.escPressed = false;
            }, 500);
        }
    }

    private handleVisibilityChange(): void {
        if (document.hidden) {
            this.onViolation.emit('TAB_SWITCH');
        }
    }

    private handleFullscreenChange(): void {
        if (!document.fullscreenElement) {
            // User exited fullscreen
            if (this.escPressed) {
                // Intentional exit via ESC - allow it without violation
                console.log('User intentionally exited fullscreen via ESC');
                return;
            }

            // Accidental exit (browser popup, etc.) - try to recover
            console.warn('Fullscreen exited accidentally - attempting recovery');

            // Clear any existing timeout
            if (this.fullscreenExitTimeout) {
                clearTimeout(this.fullscreenExitTimeout);
            }

            // Try to re-enter fullscreen after a brief delay
            this.fullscreenExitTimeout = setTimeout(() => {
                if (!document.fullscreenElement) {
                    this.requestFullscreen();
                    this.onViolation.emit('EXIT_FULLSCREEN');
                }
            }, 100);
        } else {
            this.isFullscreen = true;
        }
    }
}
