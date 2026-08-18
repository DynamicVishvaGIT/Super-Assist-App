import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraOptions, PictureSourceType } from '@awesome-cordova-plugins/camera/ngx';
import { ActionSheetController } from '@ionic/angular';
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

  constructor(
    private router: Router, 
    private actionSheetCtrl: ActionSheetController, 
    private camera: Camera, 
    private userService: User, 
    private apiService: Api,
    private commonService: Common
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
  }

  load_profile() {
    this.commonService.presentLoading();
    this.apiService.load_profile()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {
        if (response && response.profile) {
          this.myProfileData = response.profile;
        }
        this.commonService.dismissLoading();
      }, error => {
        this.commonService.dismissLoading();
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

  async presentMenuOptions() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Options',
      buttons: [
        // {
        //   text: 'Edit Profile',
        //   icon: 'create-outline',
        //   handler: () => {
        //     this.toggleEdit();
        //   }
        // },
        {
          text: 'Logout',
          role: 'destructive',
          icon: 'log-out-outline',
          handler: () => {
            this.logout();
          }
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
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

  openHelpCentre() {
    console.log('Help Centre clicked');
  }

  openSupport() {
    console.log('Support clicked');
  }

  openPrivacyPolicy() {
    console.log('Privacy Policy clicked');
  }

  openTerms() {
    console.log('Terms clicked');
  }
}