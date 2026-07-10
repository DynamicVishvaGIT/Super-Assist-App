import { Inject, Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';
import { User } from './user';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Common {
  
  baseUrl = 'https://dvchat.dvworks.in/';
  fcm_token: string = 'fcm_token';
  platform_type:string='android';
  device_type: string = 'mobile';
  isLoading = false;

  private loader: HTMLIonLoadingElement | null = null;
  private isPresenting = false;
  private loadingCount = 0;

  constructor(@Inject(LOCAL_STORAGE) private storage: StorageService,private toastController: ToastController, private loadingController: LoadingController, private userService: User) { }

  getBaseURL() {
    return this.baseUrl;
  }

  findItem(array: any, key: string, value: string, ignorecase?:boolean) {
    for (let index = 0; index < array.length; index++) {
      let value1 = array[index][key];
      let value2 = value;
      if(ignorecase) {
        value1 = value1.toLowerCase();
        value2 = value2.toLowerCase();
      }
      if (value1 == value2) {
        return index;
      }
    }
    return -1;
  }

  findTwoItem(array: any, key1: string, value1: string, key2: string, value2: string) {
    for (let index = 0; index < array.length; index++) {
      if (array[index][key1] == value1 && array[index][key2] == value2) {
        return index;
      }
    }
    return -1;
  }

  async showToastMessage(message: string, css: string, location:any, duration: number) {
    if (location){
      location = location;
    }
    else{
      location='top';
    }
    let toast = await this.toastController.create({
      message: message,
      duration: duration,
      position: location,
      cssClass: css
    });

    await toast.present();
  }

  async presentLoading() {
    this.loadingCount++;
    // Loader already exists
    if (this.loader || this.isPresenting) {
      return;
    }
    this.isPresenting = true;
    this.loader = await this.loadingController.create({
      message: 'Loading...',
      backdropDismiss: false
    });
    await this.loader.present();
    this.isPresenting = false;
  }

  async dismissLoading() {
    if (this.loadingCount > 0) {
      this.loadingCount--;
    }
    // Some API still running
    if (this.loadingCount > 0) {
      return;
    }
    // Loader still creating
    while (this.isPresenting) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (this.loader) {
      try {
        await this.loader.dismiss();
      } catch (e) {
        console.log(e);
      }
      this.loader = null;
    }
  }

  // async presentLoading() {
  //   this.isLoading = true;
  //   return await this.loadingController.create({
  //     message: 'Loading...',
  //     //duration: 5000,
  //   }).then(a => {
  //     a.present().then(() => {
  //       console.log('presented');
  //       if (!this.isLoading) {
  //         a.dismiss().then(() => console.log('abort presenting'));
  //       }
  //     });
  //   });
  // }

  // async dismissLoading() {
  //   this.isLoading = false;
  //   return await this.loadingController.dismiss().then(() => console.log('dismissed'));
  // }

  async presentToast(msg: any) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      mode:'ios',
      color:'dark'

    });

    await toast.present();
  }

  setItem(key: string, value: any) {
    this.storage.set(key, value);
  }
  
  getItem(key: string) {
    let value = this.storage.get(key) || undefined;
    return value;
  }
  
  removeItem(key: string) {
    this.storage.remove(key);
  }
  
  removeAll() {
    this.storage.clear();
  }

  errorHandler(error:any=Response) {console.log(error);
    let message = (error['error']) ? ((error['error'].error) ? error['error'].error : error['message']) : error['message'];
    return throwError(message || 'Remote server unreachable. Please check your Internet connection.');
  }
}
