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

  private _unsubscribeAll: Subject<any>;

  isEdit = false;
  myProfileData: any={full_name:'', email:''};
  currentUser:any;

  user = {
    full_name: 'Your Name',
    email: 'dynamicvishva@gmail.com',
    phone: '+91 98332 93468',
    business: 'Super Assist',
    businessId: 'SA-2024-001',
    waba: '+91 98765 43210'
  };

  tempUser: any;
  selectedImage:any={name:'', data:''};

  constructor(private router: Router, private actionSheetCtrl: ActionSheetController, private camera: Camera, private userService: User, private apiService: Api,
    private commonService: Common
  ) { 
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        console.log('39',this.currentUser);
      } 
      else {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
          console.log('44',this.currentUser);
        }
      }
    });
    this.load_profile();
  }

  load_profile() {
    this.commonService.presentLoading();
    this.apiService.load_profile()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {console.log(response);
        this.myProfileData = response.profile;
        this.commonService.dismissLoading();
      }, error => {
        this.commonService.dismissLoading();
        console.log(error);
      });
  }

  toggleEdit() {
    this.isEdit = true;
    this.tempUser = { ...this.user };
  }

  async changeProfilePicture() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Change Profile Picture',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Choose from Gallery',
          icon: 'image',
          handler: () => {
            this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
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
      var d = new Date(),
      n = d.getTime(),
      fileName = n + ".jpg";
      let base64Image = imageData.startsWith('data:image') ? imageData : `data:image/jpeg;base64,${imageData}`;
      this.selectedImage = { name: fileName, data: base64Image};
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
    console.log('Logout clicked');
    this.userService.clearCurrentUser();  // 🔥 important
      // Clear user data from storage
    this.clearUserData();
    this.router.navigateByUrl('login');
  }

  private clearUserData() {
    // Clear user session data
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
  }

  onBack() {
    this.router.navigateByUrl('home');
  }

}
