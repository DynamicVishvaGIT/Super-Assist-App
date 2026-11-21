import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage implements OnInit {

  forgot_data: any = {
    email: ''
  };

  isLoading = false;

  // (redesign) inline validation like the login page
  emailError = '';
  shakeEmail = false;
  showSuccessMessage = false;

  private successTimer: any;

  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
  }


  /* =====================================================
     SEND RESET LINK
     ===================================================== */

  onSendResetLink() {

    const email = this.forgot_data.email?.trim();

    /* Empty email */

    if (!email) {

      // this.presentToast(
      //   'Please enter your email address.',
      //   'danger'
      // );
      this.setEmailError('Please enter your email address.');   // same text, shown under the field

      return;
    }


    /* Email validation */

    const emailPattern =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;


    if (!emailPattern.test(email)) {

      // this.presentToast(
      //   'Please enter a valid email address.',
      //   'danger'
      // );
      this.setEmailError('Please enter a valid email address.');

      return;
    }

    this.emailError = '';
    if (this.isLoading) { return; }   // no double submit (Enter key + tap)


    /*
     * -----------------------------------------------------
     * API INTEGRATION
     * -----------------------------------------------------
     *
     * Your existing API method should be called here.
     *
     * I have intentionally not invented an Api method name
     * because your actual Api service code was not provided.
     *
     * Once your backend method is known, this section can
     * call it without changing any of the HTML/design.
     */


    this.isLoading = true;


    /*
     * Temporary UI success state.
     *
     * Replace this section with your existing API success
     * response when the forgot-password API method is added.
     */

    setTimeout(() => {

      this.isLoading = false;

      this.showSuccessMessage = true;

      // this.presentToast(
      //   'A reset link has been sent to your email.',
      //   'success'
      // );
      // (redesign) the animated success card on the page already shows this same message


      /* Hide custom success message after 4 seconds */

      clearTimeout(this.successTimer);

      this.successTimer = setTimeout(() => {

        this.showSuccessMessage = false;

      }, 4000);

    }, 700);

  }


  /* =====================================================
     BACK TO LOGIN
     ===================================================== */

  /* =====================================================
     REDESIGN HELPERS (inline error + shake)
     ===================================================== */

  private setEmailError(message: string) {
    this.emailError = message;
    this.shakeEmail = false;
    setTimeout(() => {
      this.shakeEmail = true;
      setTimeout(() => (this.shakeEmail = false), 500);
    }, 10);
  }

  onEmailChange() {
    if (this.emailError) { this.emailError = ''; }
  }

  backToLogin() {

    this.router.navigateByUrl('login');

  }


  /* =====================================================
     TOAST
     ===================================================== */

  async presentToast(
    message: string,
    color: string
  ) {

    const toast =
      await this.toastController.create({

        message: message,

        duration: 2500,

        position: 'bottom',

        color: color

      });

    await toast.present();

  }

}