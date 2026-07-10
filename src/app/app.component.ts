import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { IonTabs, MenuController, ModalController, Platform, ToastController } from '@ionic/angular';
import { User } from './user';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public selectedIndex = 0;
  selectedPath = '';
  selected:boolean = false;
  public appPages = [
    {
      title: 'Dashboard',
      url: '/home',
      icon: 'home-outline'
    },
  ];
  @ViewChild('myTabs',{ static: false }) tabs!: IonTabs;
  selectedTab: string = '';
  activeTabName: string | undefined = '';
  tab_name: any;
  userstatus_data: any;
  userstatus: any;
  loginStatus: boolean = false;
  displayProfileData = {first_name: '', last_name: '', email: '', avatar: ''};
  currentUser:any;

  
  constructor(private platform: Platform,private userService: User,
    public router:Router,public modalController: ModalController, private menuCtrl: MenuController, private statusBar: StatusBar,
     private toastController: ToastController,private keyboard: Keyboard, private location: Location) {
    this.selectedPath = window.location.pathname;
    console.log(this.selectedPath);
    this.keyboard.onKeyboardWillShow().subscribe(() => {
      document.body.classList.add('keyboard-open');
    });
  
    this.keyboard.onKeyboardWillHide().subscribe(() => {
      document.body.classList.remove('keyboard-open');
    });
    this.initializeApp();
    this.platform.backButton.subscribeWithPriority(9999, async () => {
      const modal = await this.modalController.getTop();  // 👈 check if a modal is open
      if (modal) {
        await modal.dismiss();   // close modal instead of navigating
        return;
      }
      if ((this.router.url.includes('folder'))|| (this.router.url.includes('home')) || (this.router.url.includes('login'))) {
        (navigator as any).app.exitApp();
      }
      else if  (this.router.url.includes('register')) {
        this.router.navigate(['login'])
      }
      else if  ((this.router.url.includes('my-profile')) ||(this.router.url.includes('chat-details')) ) {
        this.router.navigate(['home'])
      }
      else{
        this.location.back();
      }
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.statusBar.backgroundColorByHexString('#2c56fa');
      this.statusBar.overlaysWebView(false);
    });
    // this.userService.currentUser$.subscribe(user => {
    //   if (user) {
    //     this.currentUser = user;
    //     console.log('39',this.currentUser);
    //     // this.check_user_can_status();
    //   } else {
    //     const storedUser = localStorage.getItem('currentUser');
    //     if (storedUser) {
    //       this.currentUser = JSON.parse(storedUser);
    //       console.log('44',this.currentUser);
    //     }
    //   }
    // });
  }
 
  // async presentAdvertisementModal() {
  //   const modal = await this.modalController.create({
  //     component: AdvertisementPage,
  //   });
  //   return await modal.present();
  // }
  ngOnInit() {
    this.menuCtrl.enable(false);
    this.checkLoginStatus();
    this.selectedPath = window.location.pathname;
    const path = window.location.pathname.split('folder/')[1];
    if (path !== undefined) {
      this.selectedIndex = this.appPages.findIndex(page => page.title.toLowerCase() === path.toLowerCase());
    }
  }
  async checkLoginStatus(){
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('118',currentUser);
    if (Object.keys(currentUser).length != 0) {
      this.userService.setCurrentUser(currentUser);  // Update via UserService
      this.router.navigateByUrl('/home');  // Navigate to home page after login
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  doLogout(){
    this.menuCtrl.enable(false);
    this.selectedPath = '/logout';
    localStorage.removeItem('currentUser');
    this.router.navigateByUrl('login');
  }
  goToProjectList(){
    this.selectedPath = '/projectlist';
    this.router.navigate(['projectlist'])
  
  }
  getSelectedTab(): void {
    this.selected = true;
    this.activeTabName = this.tabs.getSelected();
    this.tab_name=this.activeTabName
  }
  openPage(page:any) {
    this.selectedPath = page.url;
   this.router.navigate([page.url])
  }

  /**
   * Navigate to register page
   */
  goToProfile() {
    // Navigate to registration page
    // this.router.navigate(['/register']);
    console.log('Navigate to register page');
    this.presentToast('Profile page - Coming soon!', 'primary');
  }

  /**
   * Present toast message
   */
  private async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
    });
    toast.present();
  }

}
