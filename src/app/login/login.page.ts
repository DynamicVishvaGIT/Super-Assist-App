import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Common } from '../common';
import { Api } from '../api';
import { User } from '../user';

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

  constructor(private router: Router, private commonService: Common, private apiService: Api, private userService: User) { 
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
  }

  onLogin() {
    if (!this.login_data.username) {
      this.commonService.showToastMessage('Enter the mobile number.', 'toast-error','', 2000);
      return;
    }
    let epattern = /[A-Za-z0-9._%+-]{1,}@[a-zA-Z]{3,}([.]{1}[a-zA-Z]{2,}|[.]{1}[a-zA-Z]{2,}[.]{1}[a-zA-Z]{2,})/;
    if (!epattern.test(this.login_data.username)) {
      this.commonService.showToastMessage('Please enter email in correct format.', 'toast-error', 'top', 2000);
      return;
    }
    if (!this.login_data.password) {
      this.commonService.showToastMessage('Enter the password.', 'toast-error','', 2000);
      return;
    }
    this.commonService.presentLoading();
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
      this.commonService.dismissLoading();
      this.login_data = { username: '', password: '' };
      this.router.navigateByUrl('home');
    },
    respError => {console.log(respError);
      this.commonService.dismissLoading();
      this.commonService.showToastMessage(respError, 'toast-error','', 4000);
    })
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // onLogin() {
  //   this.router.navigateByUrl('home');
  // }

}
