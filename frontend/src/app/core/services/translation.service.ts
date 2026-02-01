import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private currentLang = new BehaviorSubject<string>('EN');
    public currentLang$ = this.currentLang.asObservable();

    private translations: any = {
        'EN': {
            'NAV_EXAMS': 'Exams',
            'NAV_ATTEMPTS': 'My Attempts',
            'NAV_USERS': 'Manage Users',
            'BTN_START': 'Start Exam',
            'BTN_SUBMIT': 'Submit Exam',
            'LBL_TIME_LEFT': 'Time Left',
            'LBL_QUESTION': 'Question',
            'MSG_VIOLATION': 'Security violation detected!'
        },
        'TE': { // Telugu placeholder
            'NAV_EXAMS': 'పరీక్షలు',
            'NAV_ATTEMPTS': 'నా ప్రయత్నాలు',
            'NAV_USERS': 'వినియోగదారుల నిర్వహణ',
            'BTN_START': 'పరీక్ష ప్రారంభించండి',
            'BTN_SUBMIT': 'సమర్పించండి',
            'LBL_TIME_LEFT': 'సమయం మిగిలి ఉంది',
            'LBL_QUESTION': 'ప్రశ్న',
            'MSG_VIOLATION': 'భద్రతా ఉల్లంఘన గుర్తించబడింది!'
        }
    };

    constructor() { }

    setLanguage(lang: string) {
        this.currentLang.next(lang);
    }

    translate(key: string): string {
        const lang = this.currentLang.value;
        return this.translations[lang][key] || key;
    }
}
