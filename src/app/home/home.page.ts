import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { User } from '../user';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { Common } from '../common';
import { Api } from '../api';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  backButtonSub!: Subscription;

  private _unsubscribeAll: Subject<any>;

  currentUser:any;
  loading = true;
  chats: any=[];
  searchText: string = '';
  allChats: any[] = []; // original data
  county_list: any=[];
  showModal = false;
  contact = {
    country_code: '+91',
    contact_number: '',
    contact_name: '',
    email_id: ''
  };

  constructor(private router: Router, private userService: User, private commonService: Common, private apiService: Api, private platform: Platform, private location: Location) { 
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
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd) // Ensure the event is of type NavigationEnd
      ).subscribe((event: NavigationEnd) => {
        if (event.url === '/home') { // Check if user navigated back to a specific URL
          this.get_conversation_list();
          this.load_country_codes();
        }
    });
    setTimeout(()=>{
      this.loading = false;
    },1200);
    this.allChats = [...this.chats]; // backup original
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      if (this.showModal) {
        this.closeModal();
        return;
      }
      // Normal back navigation
      (navigator as any).app.exitApp();
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  load_country_codes() {
    this.apiService.load_country_codes()
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((response:any) => {
      console.log(response);
      this.county_list = response;
    },
    respError => {console.log(respError);
      this.commonService.showToastMessage(respError, 'toast-error','', 4000);
    })
  }

  get_conversation_list() {
    this.commonService.presentLoading();
    this.apiService.conversation_list()
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((response:any) => {
      console.log(response);
      this.chats = response.data;
      this.chats = this.chats.map((item:any) => ({
        ...item,
        selected: false
      }));
      this.allChats = [...this.chats]; // backup original
      this.commonService.dismissLoading();
    },
    respError => {console.log(respError);
      this.commonService.dismissLoading();
      this.commonService.showToastMessage(respError, 'toast-error','', 4000);
    })
  }

  filterChats() {
    const value = this.searchText.toLowerCase().trim();
    if (!value) {
      this.chats = [...this.allChats];
      return;
    }
    this.chats = this.allChats.filter(chat =>
      (chat.contacts__name || '').toLowerCase().includes(value) ||
      (chat.last_message_text || '').toLowerCase().includes(value)
    );
  }

  add_new_contacts() {
    if (!this.contact.contact_name) {
      this.commonService.showToastMessage('Enter the contact person name.', 'toast-error','', 2000);
      return;
    }
    if (!this.contact.contact_number) {
      this.commonService.showToastMessage('Enter the contact person number.', 'toast-error','', 2000);
      return;
    }
    if (!this.contact.email_id) {
      this.commonService.showToastMessage('Enter the contact person mail id.', 'toast-error','', 2000);
      return;
    }
    // this.commonService.presentLoading();
    console.log(this.contact);
    this.apiService.add_new_contacts(this.contact)
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((response:any) => {
      console.log(response);
      // const newChat = {
      //   id: response?.id || Date.now(),
      //   name: this.contact.contact_name,
      //   message: 'Start conversation...',
      //   date: new Date(),
      //   count: 0,
      //   online: true,
      //   selected: false,
      //   pinned: false,
      //   image: 'assets/images/avtar.png',
      //   recipient_no: this.contact.contact_number,
      //   email_id: this.contact.email_id
      // };
      const recipientNo = this.contact.contact_number;
      const chat = {
        id: response?.conv_id || Date.now(),
        contacts__name: this.contact.contact_name,
        message: 'Start conversation...',
        date: new Date(),
        count: 0,
        online: true,
        selected: false,
        pinned: false,
        image: 'assets/images/avtar.png',
        recipient_no: recipientNo,
        email_id: this.contact.email_id,
        conv_id: response?.conv_id || response?.conversation_id || ''
      };
      this.chats.unshift(chat);
      this.showModal = false;
      this.router.navigate(['/chat-details'], {
        state: {
          chat: chat
          // user: newChat,
          // conv_id: response?.conv_id || response?.conversation_id || '',
          // recipient_no: this.contact.contact_number
        }
      });
      this.contact = {
        country_code:'',
        contact_name: '',
        contact_number: '',
        email_id: ''
      };
    },
    respError => {console.log(respError);
      // this.commonService.dismissLoading();
      this.commonService.showToastMessage(respError, 'toast-error','', 4000);
    })
  }

  // OPEN
openModal() {
  this.showModal = true;
}

// CLOSE
closeModal() {
  this.showModal = false;
}

// CREATE CHAT
createChat() {
  if (!this.contact.contact_name || !this.contact.contact_number) {
    alert('Enter required fields');
    return;
  }
  const newChat = {
    id: Date.now(),
    name: this.contact.contact_name,
    message: 'Start conversation...',
    date: new Date(),
    count: 0,
    online: true,
    selected: false,
    pinned: false,
    image: 'assets/images/avtar.png'
  };
  this.chats.unshift(newChat);
  this.showModal = false;
  // 👉 Navigate to chat details page
  this.router.navigate(['/chat-details'], {
    state: { user: newChat }
  });

}

getInitials(name: string): string {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (
    words[0].charAt(0) + words[1].charAt(0)
  ).toUpperCase();
}

  formatDate(date: Date) {
    const today = new Date();
    const d = new Date(date);
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  }

  selectChat(chat:any){
    chat.selected = !chat.selected;
  }
  
  deleteChat(chat:any){
    this.chats = this.chats.filter((c:any) => c !== chat);
  }

  goToChatDetails(chat:any) {
    // this.router.navigateByUrl('chat-details');
    this.router.navigate(['/chat-details'], {
      state: { chat: chat }
    });
  }

  goToProfile() {
    this.router.navigateByUrl('my-profile');
  }

}
