import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraOptions, PictureSourceType } from '@awesome-cordova-plugins/camera/ngx';
// import { ActionSheetController } from '@ionic/angular';
import { ActionSheetController, AlertController, Platform } from '@ionic/angular';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { environment } from '../../environments/environment';
import { User } from '../user';
import { Subject, takeUntil } from 'rxjs';
import { Api } from '../api';
import { Common } from '../common';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.page.html',
  styleUrls: ['./my-profile.page.scss'],
  standalone: false,
})
export class MyProfilePage implements OnInit {

  public activeTab: string = 'settings'; // 👈 Set to settings by default here

  private _unsubscribeAll: Subject<any>;

  isEdit = false;
  myProfileData: any = { full_name: '', email: '', mobile: '' };
  currentUser: any;

  user = {
    full_name: 'Dynamic Vishva',
    email: 'dv@superassist.ai',
    phone: '+91 9876 543210',
    business: 'Super Assist',
    businessId: 'SA-2024-001',
    waba: '+91 98765 43210'
  };

  tempUser: any;
  selectedImage: any = { name: '', data: '' };

  // ---- redesign (items 2, 18) ----
  appVersionText = '';        // real app version (from config.xml via the AppVersion plugin)
  profileLoading = true;      // shows placeholder lines instead of a full-screen loader

  constructor(
    private router: Router, 
    private actionSheetCtrl: ActionSheetController, 
    private camera: Camera, 
    private userService: User, 
    private apiService: Api,
    private commonService: Common,
    private alertCtrl: AlertController,
    private platform: Platform,
    private appVersion: AppVersion,
    private inAppBrowser: InAppBrowser
  ) { 
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
      } else {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
      }
    });
    this.load_profile();
    this.loadAppVersion();
  }

  load_profile() {
    // this.commonService.presentLoading();   // (item 18) replaced by placeholder lines
    this.profileLoading = true;
    this.apiService.load_profile()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {
        if (response && response.profile) {
          this.myProfileData = response.profile;
        }
        // this.commonService.dismissLoading();
        this.profileLoading = false;
      }, error => {
        // this.commonService.dismissLoading();
        this.profileLoading = false;
        console.log(error);
      });
  }

  getInitials(name: string): string {
    if (!name) return 'DV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // OLD: Ionic action sheet (replaced by the custom animated bottom sheet below)
  // async presentMenuOptions() {
  //   const actionSheet = await this.actionSheetCtrl.create({
  //     header: 'Options',
  //     buttons: [
  //       // {
  //       //   text: 'Edit Profile',
  //       //   icon: 'create-outline',
  //       //   handler: () => {
  //       //     this.toggleEdit();
  //       //   }
  //       // },
  //       {
  //         text: 'Logout',
  //         role: 'destructive',
  //         icon: 'log-out-outline',
  //         handler: () => {
  //           this.logout();
  //         }
  //       },
  //       {
  //         text: 'Cancel',
  //         icon: 'close',
  //         role: 'cancel'
  //       }
  //     ]
  //   });
  //   await actionSheet.present();
  // }

  // =========================================================
  // CUSTOM "OPTIONS" BOTTOM SHEET (same content: Options / Logout / Cancel)
  // =========================================================
  showMenuSheet = false;
  menuClosing = false;

  presentMenuOptions() {
    this.menuClosing = false;
    this.showMenuSheet = true;
    document.body.classList.add('sa-sheet-open');     // slides the tab bar away (global.scss)
  }

  closeMenuSheet(after?: () => void) {
    if (!this.showMenuSheet || this.menuClosing) { return; }
    this.menuClosing = true;                          // play the slide-down animation first
    setTimeout(() => {
      this.showMenuSheet = false;
      this.menuClosing = false;
      document.body.classList.remove('sa-sheet-open');
      after?.();
    }, 260);
  }

  /** Same as the old sheet: Logout logs out straight away */
  onMenuLogout() {
    this.closeMenuSheet(() => this.logout());
  }

  ionViewWillLeave() {
    this.showMenuSheet = false;
    this.menuClosing = false;
    document.body.classList.remove('sa-sheet-open');
  }

  toggleEdit() {
    this.isEdit = true;
    this.tempUser = { ...this.user };
  }

  // async changeProfilePicture() {
  //   const actionSheet = await this.actionSheetCtrl.create({
  //     header: 'Change Profile Picture',
  //     buttons: [
  //       {
  //         text: 'Take Photo',
  //         icon: 'camera',
  //         handler: () => {
  //           this.takePicture(this.camera.PictureSourceType.CAMERA);
  //         }
  //       },
  //       {
  //         text: 'Choose from Gallery',
  //         icon: 'image',
  //         handler: () => {
  //           this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
  //         }
  //       },
  //       {
  //         text: 'Cancel',
  //         icon: 'close',
  //         role: 'cancel'
  //       }
  //     ]
  //   });

  //   await actionSheet.present();
  // }

  takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 100,
      sourceType: sourceType,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true 
    };

    this.camera.getPicture(options).then((imageData) => {
      const d = new Date();
      const n = d.getTime();
      const fileName = n + ".jpg";
      const base64Image = imageData.startsWith('data:image') ? imageData : `data:image/jpeg;base64,${imageData}`;
      this.selectedImage = { name: fileName, data: base64Image };
    }, (err) => {
      console.log('Error obtaining picture', err);
    });
  }

  cancelEdit() {
    this.isEdit = false;
    this.user = { ...this.tempUser };
  }

  save() {
    this.isEdit = false;
    console.log('Saved:', this.user);
  }

  logout() {
    this.userService.clearCurrentUser();
    this.clearUserData();
    this.router.navigateByUrl('login');
  }

  private clearUserData() {
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
  }

  goToChats() {
    this.activeTab = 'chats';
    this.router.navigate(['/home']);
  }

  goToContacts() {
    this.activeTab = 'contacts';
    this.router.navigate(['/contact-detail']);
  }

  goToProfile() {
    this.activeTab = 'settings';
    this.router.navigate(['/my-profile']);
  }

  // OLD (item 3): rows only logged to the console
  // openHelpCentre() {
  //   console.log('Help Centre clicked');
  // }
  //
  // openSupport() {
  //   console.log('Support clicked');
  // }
  //
  // openPrivacyPolicy() {
  //   console.log('Privacy Policy clicked');
  // }
  //
  // openTerms() {
  //   console.log('Terms clicked');
  // }
  openHelpCentre() {
    this.openSettingsLink(environment.settingsLinks?.helpCentre, 'Help Centre');
  }
  openSupport() {
    this.openSettingsLink(environment.settingsLinks?.support, 'Support');
  }
  openPrivacyPolicy() {
    this.openSettingsLink(environment.settingsLinks?.privacyPolicy, 'Privacy Policy');
  }
  openTerms() {
    this.openSettingsLink(environment.settingsLinks?.terms, 'Terms and Conditions');
  }

  // =========================================================
  // REDESIGN HELPERS (items 2, 3, 6, 15)
  // =========================================================

  /** (item 3) open the configured link inside the app, or tell the user it's coming */
  private openSettingsLink(url: string | undefined, title: string) {
    if (url) {
      this.inAppBrowser.create(url, '_blank', 'location=yes,toolbarcolor=#ffffff,closebuttoncaption=Close');
      return;
    }
    this.commonService.showToastMessage(title + ' is coming soon.', 'toast-info', '', 2000);
  }

  /** (item 2) real version number instead of the hard-coded "2.4.0" */
  private loadAppVersion() {
    this.platform.ready().then(() => {
      this.appVersion.getVersionNumber()
        .then(v => this.appVersionText = v || '')
        .catch(() => this.appVersionText = '');   // browser preview: plugin not available
    });
  }

  /** (item 6) visible Log out row asks first, then uses the existing logout() */
  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Log out',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-button-no' },
        { text: 'Log out', role: 'destructive', cssClass: 'alert-button-yes', handler: () => this.logout() }
      ]
    });
    await alert.present();
  }

  /** (item 15) same display format as the Contacts page: 919434478921 -> +91 94344 78921 */
  formatPhone(phone: string | null | undefined): string {
    const raw = (phone || '').toString().trim();
    const digits = raw.replace(/\D/g, '');
    if (!digits || digits.length !== raw.replace(/^\+/, '').length) { return raw; }
    if (digits.length === 12 && digits.startsWith('91')) {
      return '+91 ' + digits.slice(2, 7) + ' ' + digits.slice(7);
    }
    if (digits.length === 10) {
      return digits.slice(0, 5) + ' ' + digits.slice(5);
    }
    if (digits.length > 10) {
      const cc = digits.slice(0, digits.length - 10);
      const rest = digits.slice(-10);
      return '+' + cc + ' ' + rest.slice(0, 5) + ' ' + rest.slice(5);
    }
    return raw;
  }
}