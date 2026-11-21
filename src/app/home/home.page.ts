import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { User } from '../user';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { Common } from '../common';
import { Api } from '../api';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { ChatWebsocket } from '../chat-websocket';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
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
  // showModal = false;

  // ---- UI-only state for the redesigned page ----
  isScrolled = false;
  contactErrors: { contact_number: string; contact_name: string; email_id: string } =
    { contact_number: '', contact_name: '', email_id: '' };
  contactShake: { [key: string]: boolean } = {};
  readonly avatarPalette = [
    { bg: '#e3f6ec', fg: '#00a95b' }, { bg: '#e6f0ff', fg: '#2563eb' },
    { bg: '#fdeee6', fg: '#e8590c' }, { bg: '#f1e9ff', fg: '#7c3aed' },
    { bg: '#fde8ef', fg: '#d6336c' }, { bg: '#e3f7f8', fg: '#0c8599' },
    { bg: '#fff4d6', fg: '#c47f00' }, { bg: '#eceff3', fg: '#495464' },
  ];

  /** Bottom sheet visibility. Also slides the tab bar away while the sheet is open. */
  private _showModal = false;
  get showModal(): boolean { return this._showModal; }
  set showModal(value: boolean) {
    this._showModal = value;
    document.body.classList.toggle('sa-sheet-open', value);
  }
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
    private location: Location, private chatWebSocket: ChatWebsocket
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
    // WebSocket subscription
    this.subscribeToWebSocket();

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/home') {
        this.get_conversation_list();
        this.load_country_codes();
      }
    });

    // setTimeout(() => {
    //   this.loading = false;
    // }, 1200);
    // Skeleton now hides when the conversation list arrives; this is only a safety net
    setTimeout(() => {
      this.loading = false;
    }, 10000);
    this.allChats = [...this.chats];
    this.filteredChats = [...this.chats];
  }

  private subscribeToWebSocket(): void {
    this.chatWebSocket.messages$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((event: any) => {
        console.log('Home WebSocket event:', event);
        this.handleWebSocketEvent(event);
      });
  }

  private handleWebSocketEvent(event: any): void {
    if (!event) {
      return;
    }
    console.log('Home WebSocket event:', event);
    if (event.type === 'INBOX_UPDATE') {
      console.log('Inbox updated. Refreshing conversation list...');
      this.get_conversation_list(false);
      return;
    }
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
    document.body.classList.remove('sa-sheet-open');
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

  get_conversation_list(showLoader: boolean = true, done?: () => void) {
    if (showLoader) {
      this.commonService.presentLoading();
    }
    // this.commonService.presentLoading();
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
        this.loading = false;
        done?.();
      },
      respError => {
        this.commonService.dismissLoading();
        this.commonService.showToastMessage(respError, 'toast-error', '', 4000);
        this.loading = false;
        done?.();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
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
    // OLD toast validation - replaced by inline validation (same rules, same order as the fields)
    // if (!this.contact.contact_name) {
    //   this.commonService.showToastMessage('Enter the contact person name.', 'toast-error', '', 2000);
    //   return;
    // }
    // if (!this.contact.contact_number) {
    //   this.commonService.showToastMessage('Enter the contact person number.', 'toast-error', '', 2000);
    //   return;
    // }
    // if (!this.contact.email_id) {
    //   this.commonService.showToastMessage('Enter the contact person mail id.', 'toast-error', '', 2000);
    //   return;
    // }
    const fields: Array<'contact_number' | 'contact_name' | 'email_id'> = ['contact_number', 'contact_name', 'email_id'];
    const invalid = fields.filter(f => !this.validateContactField(f));
    if (invalid.length) {
      invalid.forEach(f => this.shakeContactField(f));
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
    this.contactErrors = { contact_number: '', contact_name: '', email_id: '' };
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

  // =========================================================
  // VIEW HELPERS (redesign) - presentation only
  // =========================================================

  /** Same contact always gets the same avatar colour */
  getAvatarColor(name: string): { bg: string; fg: string } {
    const key = (name || '?').toString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return this.avatarPalette[Math.abs(hash) % this.avatarPalette.length];
  }

  /** WhatsApp-style time: today -> 03:45 PM, Yesterday, weekday, then dd/MM/yy */
  formatChatTime(value: any): string {
    if (!value) { return ''; }
    const date = new Date(value);
    if (isNaN(date.getTime())) { return ''; }
    const now = new Date();
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOf(now) - startOf(date)) / 86400000);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    if (days <= 0) {
      const h = date.getHours() % 12 || 12;
      return `${pad(h)}:${pad(date.getMinutes())} ${date.getHours() < 12 ? 'AM' : 'PM'}`;
    }
    if (days === 1) { return 'Yesterday'; }
    if (days < 7) {
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    }
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
  }

  badgeText(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  /** Keeps rows from being re-created (and re-animated) on every inbox refresh */
  trackChat(index: number, chat: any) {
    return chat?.conv_id || chat?.id || index;
  }

  onContentScroll(event: any) {
    const scrolled = (event?.detail?.scrollTop || 0) > 4;
    if (scrolled !== this.isScrolled) { this.isScrolled = scrolled; }
  }

  clearSearch() {
    this.searchText = '';
    this.applyFilters();
  }

  /** Pull-to-refresh: reuses the existing list call without the full-screen loader */
  doRefresh(event: any) {
    this.get_conversation_list(false, () => event?.target?.complete());
  }

  validateContactField(field: 'contact_number' | 'contact_name' | 'email_id'): boolean {
    const messages = {
      contact_number: 'Phone number is required.',
      contact_name: 'Full name is required.',
      email_id: 'Email address is required.',
    };
    const value = (this.contact[field] || '').toString().trim();
    this.contactErrors[field] = value ? '' : messages[field];
    return !!value;
  }

  onContactChange(field: 'contact_number' | 'contact_name' | 'email_id') {
    if (this.contactErrors[field]) { this.validateContactField(field); }
  }

  private shakeContactField(field: string) {
    this.contactShake[field] = false;
    setTimeout(() => {
      this.contactShake[field] = true;
      setTimeout(() => (this.contactShake[field] = false), 500);
    }, 10);
  }

  goToChatDetails(chat: any) { console.log(chat)
    chat['routeURL']= 'home';
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