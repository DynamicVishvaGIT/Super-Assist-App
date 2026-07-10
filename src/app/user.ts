import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class User {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() { }

  setCurrentUser(user: any) {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user)); // Update localStorage
  }

  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  clearCurrentUser() {
    this.currentUserSubject.next(null);   // clear BehaviorSubject
    localStorage.removeItem('currentUser'); // remove from localStorage
  }
}
