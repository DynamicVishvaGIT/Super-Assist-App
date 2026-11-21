import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Common } from '../common';
import { Api } from '../api';
import { User } from '../user';
import { Platform } from '@ionic/angular';

declare var Keyboard: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  private _unsubscribeAll: Subject<any>;

  login_data: any={username:'', password:''};
  showPassword = false;
  isKeyboardOpen = false;

  // Inline validation state
  errors: { username: string; password: string } = { username: '', password: '' };
  touched: { username: boolean; password: boolean } = { username: false, password: false };
  shake: { username: boolean; password: boolean } = { username: false, password: false };
  // OLD (point 4): rejected valid emails (digits/hyphens in domain, short domains, long endings) and wasn't anchored
  // private readonly emailPattern = /[A-Za-z0-9._%+-]{1,}@[a-zA-Z]{3,}([.]{1}[a-zA-Z]{2,}|[.]{1}[a-zA-Z]{2,}[.]{1}[a-zA-Z]{2,})/;
  private readonly emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

  // (point 6) spinner inside the button instead of a full-screen loader
  isSubmitting = false;

  constructor(private router: Router, private commonService: Common, private apiService: Api, private userService: User, private platform: Platform) { 
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      window.addEventListener('keyboardDidShow', () => {
        this.isKeyboardOpen = true;
      });
      window.addEventListener('keyboardDidHide', () => {
        this.isKeyboardOpen = false;
      });
    });
  }

  onLogin() {
    // OLD toast-based validation - replaced by inline field validation below
    // if (!this.login_data.username) {
    //   this.commonService.showToastMessage('Enter the mobile number.', 'toast-error','', 2000);
    //   return;
    // }
    // let epattern = /[A-Za-z0-9._%+-]{1,}@[a-zA-Z]{3,}([.]{1}[a-zA-Z]{2,}|[.]{1}[a-zA-Z]{2,}[.]{1}[a-zA-Z]{2,})/;
    // if (!epattern.test(this.login_data.username)) {
    //   this.commonService.showToastMessage('Please enter email in correct format.', 'toast-error', 'top', 2000);
    //   return;
    // }
    // if (!this.login_data.password) {
    //   this.commonService.showToastMessage('Enter the password.', 'toast-error','', 2000);
    //   return;
    // }
    this.touched = { username: true, password: true };
    const emailOk = this.validateField('username');
    const passwordOk = this.validateField('password');
    if (!emailOk || !passwordOk) {
      if (!emailOk) { this.triggerShake('username'); }
      if (!passwordOk) { this.triggerShake('password'); }
      return;
    }
    if (this.isSubmitting) { return; }                       // (point 6) no double submit
    // (point 2) keyboards often add a trailing space after an email suggestion
    this.login_data.username = (this.login_data.username || '').trim();
    // this.commonService.presentLoading();                  // (point 6) replaced by the button spinner
    this.isSubmitting = true;
    this.login_data['fcm_token'] = this.commonService.fcm_token;
    this.login_data['platform_type'] = this.commonService.platform_type;
    // this.login_data['device_type'] = this.commonService.device_type;
    console.log(this.login_data);
    // let formData = new FormData();
    // formData.append("username",this.login_data.username),
    // formData.append("password",this.login_data.password),
    // formData.append("fcm_token",this.commonService.fcm_token),
    // formData.append("platform_type",this.commonService.platform_type),
    this.apiService.login(this.login_data)
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((response:any) => {
      console.log(response);
      // response.data['form_completed'] = response.form_completed;
      this.userService.setCurrentUser(response.data);
      localStorage.setItem('currentUser',JSON.stringify(response.data));
      this.commonService.showToastMessage(response.message, 'toast-success','', 2000);
      // this.commonService.dismissLoading();
      this.isSubmitting = false;
      this.login_data = { username: '', password: '' };
      this.touched = { username: false, password: false };
      this.errors = { username: '', password: '' };
      this.router.navigateByUrl('home');
    },
    respError => {console.log(respError);
      // this.commonService.dismissLoading();
      // this.commonService.showToastMessage(respError, 'toast-error','', 4000);
      this.isSubmitting = false;
      this.commonService.showToastMessage(this.friendlyError(respError), 'toast-error','', 4000);   // (point 5)
    })
  }

  /** Validate one field, set its inline error message, return true when valid */
  validateField(field: 'username' | 'password'): boolean {
    const value = (this.login_data[field] || '').toString().trim();
    let message = '';
    if (field === 'username') {
      if (!value) {
        message = 'Email address is required.';
      } else if (!this.emailPattern.test(value)) {
        message = 'Please enter a valid email address.';
      }
    } else {
      if (!this.login_data.password) {
        message = 'Password is required.';
      }
    }
    this.errors[field] = message;
    return !message;
  }

  onFieldBlur(field: 'username' | 'password') {
    this.touched[field] = true;
    this.validateField(field);
  }

  onFieldChange(field: 'username' | 'password') {
    // Re-validate live only after the user has left the field once (or tried to submit)
    if (this.touched[field]) {
      this.validateField(field);
    }
  }

  private triggerShake(field: 'username' | 'password') {
    this.shake[field] = false;
    setTimeout(() => {
      this.shake[field] = true;
      setTimeout(() => (this.shake[field] = false), 500);
    }, 10);
  }

  /** (point 5) never show technical HTTP text to the user */
  private friendlyError(err: any): string {
    const msg = (typeof err === 'string' ? err : (err?.message || '')).toString();
    const lower = msg.toLowerCase();
    if (!msg || lower.includes('unknown error') || lower.includes('status: 0') || lower.includes(' 0 ')) {
      return 'No internet connection. Please check your network and try again.';
    }
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid') || lower.includes('incorrect')) {
      return 'Incorrect email or password.';
    }
    if (lower.includes('http failure') || lower.includes('timeout') || lower.includes('500') || lower.includes('502') || lower.includes('503')) {
      return 'Something went wrong. Please try again in a moment.';
    }
    return msg;   // a readable message from the server (e.g. "Account disabled") is shown as-is
  }

  /** (point 1) Enter / "Next" on the email field moves to the password field */
  focusPassword(input: any) {
    input?.setFocus?.();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onForgotPassword() {
this.router.navigateByUrl('forgot-password');
}
}