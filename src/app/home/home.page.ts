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
  public activeTab: string = 'chats';

  backButtonSub!: Subscription;
  private _unsubscribeAll: Subject<any>;

  currentUser: any;
  loading = true;
  chats: any = [];
  filteredChats: any = [];
  searchText: string = '';
  allChats: any[] = []; 
  activeFilter: string = ''; // 'all' | 'unread' | 'favorites'
  
  county_list: any = [];
  showModal = false;
  contact = {
    country_code: '+91',
    contact_number: '',
    contact_name: '',
    email_id: '',
    organization: ''
  };

  constructor(
    private router: Router, 
    private userService: User, 
    private commonService: Common, 
    private apiService: Api, 
    private platform: Platform, 
    private location: Location
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

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/home') {
        this.get_conversation_list();
        this.load_country_codes();
      }
    });

    setTimeout(() => {
      this.loading = false;
    }, 1200);
    this.allChats = [...this.chats];
    this.filteredChats = [...this.chats];
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      if (this.showModal) {
        this.closeModal();
        return;
      }
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
      .subscribe((response: any) => {
        this.county_list = response;
      },
      respError => {
        this.commonService.showToastMessage(respError, 'toast-error', '', 4000);
      });
  }

  get_conversation_list() {
    this.commonService.presentLoading();
    this.apiService.conversation_list()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {console.log(response)
        this.chats = response.data.map((item: any) => ({
          ...item,
          selected: false,
          pinned: item.pinned || false
        }));
        this.allChats = [...this.chats];
        this.applyFilters();
        this.commonService.dismissLoading();
      },
      respError => {
        this.commonService.dismissLoading();
        this.commonService.showToastMessage(respError, 'toast-error', '', 4000);
      });
  }

  setFilter(filterType: string) {
    this.activeFilter = filterType;
    this.applyFilters();
  }

  filterChats() {
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.allChats];

    const value = this.searchText.toLowerCase().trim();
    if (value) {
      result = result.filter(chat =>
        (chat.contacts__name || '').toLowerCase().includes(value) ||
        (chat.last_message_text || '').toLowerCase().includes(value)
      );
    }

    if (this.activeFilter === 'unread') {
      result = result.filter(chat => (chat.unread_count || 0) > 0);
    } else if (this.activeFilter === 'favorites') {
      result = result.filter(chat => chat.pinned === true);
    }

    this.filteredChats = result;
  }

  get unreadCount(): number {
    return this.allChats.filter(chat => (chat.unread_count || 0) > 0).length;
  }

  get favoriteCount(): number {
    return this.allChats.filter(chat => chat.pinned === true).length;
  }

  add_new_contacts() {
    if (!this.contact.contact_name) {
      this.commonService.showToastMessage('Enter the contact person name.', 'toast-error', '', 2000);
      return;
    }
    if (!this.contact.contact_number) {
      this.commonService.showToastMessage('Enter the contact person number.', 'toast-error', '', 2000);
      return;
    }
    if (!this.contact.email_id) {
      this.commonService.showToastMessage('Enter the contact person mail id.', 'toast-error', '', 2000);
      return;
    }

    this.apiService.add_new_contacts(this.contact)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {
        const chat = {
          id: response?.conv_id || Date.now(),
          contacts__name: this.contact.contact_name,
          last_message_text: 'Start conversation...',
          last_message_at: new Date(),
          unread_count: 0,
          online: true,
          selected: false,
          pinned: false,
          image: 'assets/images/avtar.png',
          recipient_no: this.contact.contact_number,
          email_id: this.contact.email_id,
          organization: this.contact.organization,
          conv_id: response?.conv_id || response?.conversation_id || ''
        };
        this.chats.unshift(chat);
        this.allChats = [...this.chats];
        this.applyFilters();
        this.showModal = false;
        this.router.navigate(['/chat-details'], {
          state: { chat: chat }
        });
        this.contact = {
          country_code: '+91',
          contact_name: '',
          contact_number: '',
          email_id: '',
          organization: ''
        };
      },
      respError => {
        this.commonService.showToastMessage(respError, 'toast-error', '', 4000);
      });
  }
  getInitials(name: string): string {
  if (!name) {
    return '?';
  }

  const cleanName = name.trim();

  if (!cleanName) {
    return '?';
  }

  const parts = cleanName.split(/\s+/);

  // Single name → first letter
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  // Multiple names → first letter + last letter
  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  selectChat(chat: any) {
    chat.selected = !chat.selected;
  }
  
  deleteChat(chat: any) {
    this.chats = this.chats.filter((c: any) => c !== chat);
    this.allChats = [...this.chats];
    this.applyFilters();
  }

  goToChatDetails(chat: any) {
    this.router.navigate(['/chat-details'], {
      state: { chat: chat }
    });
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
}