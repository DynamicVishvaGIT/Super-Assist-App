import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { User } from '../user';
import { Common } from '../common';
import { Api } from '../api';


interface Contact {
  id: number | string;
  name: string | null;
  phone: string;
  email?: string | null;
  whatsapp_opted?: boolean;
  created_at?: string;
  conversation_id?: number | string | null;

  loadingConversation?: boolean;
}

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.page.html',
  styleUrls: ['./contact-list.page.scss'],
  standalone: false
})
export class ContactListPage implements OnInit, OnDestroy {

  private _unsubscribeAll = new Subject<void>();

  currentUser: any;
  searchQuery: string = '';
  contacts: Contact[] = [];
  filteredContacts: Contact[] = [];
  visibleContacts: Contact[] = [];
  /* =========================
     Pagination
  ========================== */
  readonly PAGE_SIZE = 50;
  currentPage = 1;
  isLoadingMore = false;
  isLoadingContacts = false;
  /* =========================
     Infinite Scroll
  ========================== */
  get isInfiniteScrollDisabled(): boolean {
    return (
      this.isLoadingMore ||
      this.visibleContacts.length >= this.filteredContacts.length
    );
  }


  constructor(private router: Router, private userService: User, private commonService: Common, private apiService: Api) {}


  ngOnInit(): void {
    this.userService.currentUser$
    .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
        } else {
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            try {
              this.currentUser = JSON.parse(storedUser);
            } 
            catch (error) {
              console.error(
                'Invalid currentUser in localStorage',
                error
              );
            }
          }
        }
      });
    /*
     * Load contacts when navigating to contact-list
     */
    this.router.events.pipe(filter((event): event is NavigationEnd =>event instanceof NavigationEnd),takeUntil(this._unsubscribeAll))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects === '/contact-list') {
          this.load_contacts();
        }
      });
    this.load_contacts();
  }


  /* =========================================================
     LOAD ALL CONTACTS
  ========================================================= */

  // load_contacts(): void {
  load_contacts(done?: () => void): void {
    if (this.isLoadingContacts) {
      done?.();
      return;
    }
    this.isLoadingContacts = true;
    // this.commonService.presentLoading();
    // (item 14/15) no blocking full-screen loader: first load shows the skeleton rows,
    // later visits refresh quietly in the background (pull-to-refresh also available)
    this.apiService.load_contacts()
      .pipe(takeUntil(this._unsubscribeAll)).subscribe({
        next: (response: any) => {
          console.log('load_contacts response:',response);
          const apiContacts = Array.isArray(response?.data)? response.data: [];
          this.contacts = apiContacts.map(
            (contact: any): Contact => {
              return {
                id: contact.id,
                name: contact.name,
                phone: contact.wa_id || '',
                email: contact.email,
                whatsapp_opted: contact.whatsapp_opted,
                created_at: contact.created_at,
                conversation_id:contact.conversation_id ?? null,
                loadingConversation: false
              };
            }
          );
          console.log('Total contacts:',this.contacts.length);
          // (item 11) A-Z order so the letter headers make sense
          this.contacts.sort((a, b) => this.compareContacts(a, b));
          this.currentPage = 1;
          // this.filteredContacts = [...this.contacts];
          // this.visibleContacts = this.filteredContacts.slice(0,this.PAGE_SIZE);
          this.filterContacts();   // same as above when the search box is empty; keeps an active search after a quiet refresh
          this.isLoadingContacts = false;
          // this.commonService.dismissLoading();
          done?.();
        },
        error: (respError: any) => {
          console.error('load_contacts error:',respError);
          this.isLoadingContacts = false;
          // this.commonService.dismissLoading();
          this.commonService.showToastMessage(respError,'toast-error','',4000);
          done?.();
        }
      });
    }
  /* =========================================================
     FRONTEND SEARCH
  ========================================================= */
  filterContacts(): void {
    const query = this.searchQuery
      .toLowerCase()
      .trim();
    this.currentPage = 1;
    if (!query) {
      this.filteredContacts = [...this.contacts];
    } else {
      this.filteredContacts = this.contacts.filter(
        (contact: Contact) => {
          const name =
            (contact.name || '')
              .toLowerCase();
          const phone =
            (contact.phone || '')
              .toLowerCase();

          return (
            name.includes(query) ||
            phone.includes(query)
          );

        }
      );

    }
    this.visibleContacts =
      this.filteredContacts.slice(
        0,
        this.PAGE_SIZE
      );
  }
  /* =========================================================
     LOAD NEXT 50
  ========================================================= */
  loadMoreContacts(event: any): void {
    if (this.isLoadingMore) {
      event?.target?.complete();
      return;
    }
    if (
      this.visibleContacts.length >=
      this.filteredContacts.length
    ) {
      event?.target?.complete();
      return;
    }
    this.isLoadingMore = true;
    this.currentPage++;
    const startIndex =
      (this.currentPage - 1) *
      this.PAGE_SIZE;
    const endIndex =
      startIndex +
      this.PAGE_SIZE;
    const nextContacts =
      this.filteredContacts.slice(
        startIndex,
        endIndex
      );
    this.visibleContacts = [
      ...this.visibleContacts,
      ...nextContacts
    ];
    console.log(
      'Visible contacts:',
      this.visibleContacts.length
    );
    this.isLoadingMore = false;
    event?.target?.complete();
    if (
      this.visibleContacts.length >=
      this.filteredContacts.length
    ) {
      event.target.disabled = true;
    }
  }
  /* =========================================================
     CLEAR SEARCH
  ========================================================= */
  clearSearch(): void {
    this.searchQuery = '';
    this.filterContacts();
  }
  /* =========================================================
     GET INITIALS
  ========================================================= */
  getInitials(name: string | null): string {
    if (!name || !name.trim()) {
      return '?';
    }
    return name
      .trim()
      .split(/\s+/)
      .map((n: string) => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  /* =========================================================
     SELECT CONTACT
  ========================================================= */
  selectContact(contact: Contact): void {
    console.log(
      'Selected contact:',
      contact
    );
  }
  /* =========================================================
     MESSAGE BUTTON
  ========================================================= */
  openMessageForContact(
    contact: Contact,
    event: Event
  ): void {
  
    event.stopPropagation();
  
    /*
     * conversation_id already available
     */
    if (
      contact.conversation_id !== null &&
      contact.conversation_id !== undefined &&
      contact.conversation_id !== ''
    ) {
  
      this.openMessage(contact);
  
      return;
    }
  
    /*
     * conversation_id does not exist.
     * Create/open conversation first.
     */
    this.createConversation(contact);
  }
  // openMessageForContact(
  //   contact: Contact,
  //   event: Event
  // ): void {
  // event.stopPropagation();
  //   console.log(
  //     'Message contact:',
  //     contact
  //   );
  //   if (
  //     contact.conversation_id !== null &&
  //     contact.conversation_id !== undefined &&
  //     contact.conversation_id !== ''
  //   ) {
  //     this.openMessage(
  //       contact.conversation_id
  //     );
  //     return;
  //   }
  //   this.createConversation(contact);
  // }
  /* =========================================================
     CREATE / OPEN CONVERSATION
  ========================================================= */
  private createConversation(contact: Contact): void {

    if (contact.loadingConversation) {
      return;
    }
  
    contact.loadingConversation = true;
  
    const payload = {
      contact_id: contact.id
    };
  
    console.log(
      'open_contact_conversation payload:',
      payload
    );
  
    this.apiService
      .open_contact_conversation(payload)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
  
        next: (response: any) => {
  
          console.log(
            'open_contact_conversation response:',
            response
          );
  
          const conversationId =
            response?.conversation_id;
  
          if (
            conversationId === null ||
            conversationId === undefined ||
            conversationId === ''
          ) {
  
            contact.loadingConversation = false;
  
            this.commonService.showToastMessage(
              'Conversation ID not received.',
              'toast-error',
              '',
              3000
            );
  
            return;
          }
  
          /*
           * Store conversation_id in the contact object.
           */
          contact.conversation_id = conversationId;
  
          contact.loadingConversation = false;
  
          /*
           * Now navigate to chat details.
           */
          this.openMessage(contact);
        },
  
        error: (error: any) => {
  
          console.error(
            'open_contact_conversation error:',
            error
          );
  
          contact.loadingConversation = false;
  
          this.commonService.showToastMessage(
            error,
            'toast-error',
            '',
            4000
          );
        }
  
      });
  }
  // private createConversation(
  //   contact: Contact
  // ): void {
  //   if (contact.loadingConversation) {
  //     return;
  //   }
  //   contact.loadingConversation = true;
  //   const requestBody = {
  //     contact_id: contact.id
  //   };
  //   console.log(
  //     'Opening conversation:',
  //     requestBody
  //   );
  //   this.apiService.open_contact_conversation(
  //     requestBody
  //   )
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe({
  //       next: (response: any) => {
  //         console.log(
  //           'open_contact_conversation response:',
  //           response
  //         );
  //         const conversationId =
  //           response?.conversation_id;
  //         if (
  //           conversationId === null ||
  //           conversationId === undefined ||
  //           conversationId === ''
  //         ) {
  //           console.error(
  //             'conversation_id missing from API response'
  //           );
  //           contact.loadingConversation = false;
  //           this.commonService.showToastMessage(
  //             'Unable to open conversation.',
  //             'toast-error',
  //             '',
  //             4000
  //           );
  //           return;
  //         }
  //         contact.conversation_id =
  //           conversationId;
  //         contact.loadingConversation = false;
  //         console.log(
  //           'Conversation ID stored:',
  //           contact.conversation_id
  //         );
  //         this.openMessage(
  //           conversationId
  //         );
  //       },
  //       error: (respError: any) => {
  //         console.error(
  //           'open_contact_conversation error:',
  //           respError
  //         );
  //         contact.loadingConversation = false;
  //         this.commonService.showToastMessage(
  //           respError,
  //           'toast-error',
  //           '',
  //           4000
  //         );
  //       }
  //     });

  // }
  /* =========================================================
     OPEN CHAT DETAILS
  ========================================================= */
  openMessage(contact: Contact): void {

    const conversationId =
      contact.conversation_id;
  
    if (
      conversationId === null ||
      conversationId === undefined ||
      conversationId === ''
    ) {
      return;
    }
  
    /*
     * Create the same chat object structure
     * that your existing chat-details page expects.
     */
    const chat = {
  
      /*
       * VERY IMPORTANT
       *
       * Existing chat-details uses:
       *
       * this.apiService.message_list(this.chat.id)
       *
       * Therefore id must be conversation_id.
       */
      id: conversationId,
  
      /*
       * Keep conversation_id also available.
       */
      conversation_id: conversationId,
  
      /*
       * Original contact ID.
       */
      contact_id: contact.id,
  
      /*
       * Existing chat-details uses contacts__name.
       */
      contacts__name:
        contact.name || 'Unknown Contact',
  
      /*
       * Existing chat-details can use this
       * as initial recipient number.
       */
      recipient_no:
        contact.phone || '',
  
      /*
       * Required by your existing
       * checkConversationWindow().
       */
      last_in_message_at: null,
  
      /*
       * Additional contact information.
       */
      email: contact.email || '',
  
      whatsapp_opted:
        contact.whatsapp_opted ?? false,
        routeURL: 'contact'
  
    };
  
    console.log(
      'Opening Chat Details:',
      chat
    );
  
    /*
     * Save the active chat.
     *
     * This also helps if the page is refreshed.
     */
    sessionStorage.setItem(
      'activeChat',
      JSON.stringify(chat)
    );
  
    /*
     * Navigate to existing chat-details route.
     */
    this.router.navigate(
      ['/chat-details'],
      {
        state: {
          chat: chat
        }
      }
    );
  }
  // openMessage(
  //   conversationId: number | string
  // ): void {
  //   console.log(
  //     'Opening chat-details with conversation ID:',
  //     conversationId
  //   );
  //   let chat={};
  //   this.router.navigate(['/chat-details'], {
  //     state: { chat: chat }
  //   });
  //   // this.router.navigate([
  //   //   '/chat-details',
  //   //   conversationId
  //   // ]);

  // }

  goToChatDetails(chat: any) { console.log(chat)
    this.router.navigate(['/chat-details'], {
      state: { chat: chat }
    });
  }


  /* =========================================================
     TRACK BY
  ========================================================= */

  // =========================================================
  // VIEW HELPER (redesign) - same palette + hash as the Chats page,
  // so a contact has the same avatar colour on both tabs
  // =========================================================
  readonly avatarPalette = [
    { bg: '#e3f6ec', fg: '#00a95b' }, { bg: '#e6f0ff', fg: '#2563eb' },
    { bg: '#fdeee6', fg: '#e8590c' }, { bg: '#f1e9ff', fg: '#7c3aed' },
    { bg: '#fde8ef', fg: '#d6336c' }, { bg: '#e3f7f8', fg: '#0c8599' },
    { bg: '#fff4d6', fg: '#c47f00' }, { bg: '#eceff3', fg: '#495464' },
  ];

  /** (item 15) skeleton only on the very first load */
  get showSkeleton(): boolean {
    return this.isLoadingContacts && !this.contacts.length;
  }

  /** (item 14) pull-to-refresh, reuses load_contacts */
  doRefresh(event: any): void {
    this.load_contacts(() => event?.target?.complete());
  }

  /** (item 11) section letter: A-Z, everything else under '#' */
  sectionLetter(contact: Contact): string {
    const first = (contact?.name || '').trim().charAt(0).toUpperCase();
    return /^[A-Z]$/.test(first) ? first : '#';
  }

  /** (item 11) show a letter header before the first contact of each letter */
  showSectionHeader(index: number): boolean {
    if (index === 0) { return true; }
    const prev = this.visibleContacts[index - 1];
    const cur = this.visibleContacts[index];
    return !!cur && (!prev || this.sectionLetter(prev) !== this.sectionLetter(cur));
  }

  /** A-Z by name, names starting with a non-letter / no name go to the end ('#') */
  private compareContacts(a: Contact, b: Contact): number {
    const la = this.sectionLetter(a);
    const lb = this.sectionLetter(b);
    if (la === '#' && lb !== '#') { return 1; }
    if (lb === '#' && la !== '#') { return -1; }
    const na = (a.name || a.phone || '').trim();
    const nb = (b.name || b.phone || '').trim();
    return na.localeCompare(nb, undefined, { sensitivity: 'base' });
  }

  /** (item 10) display-only phone formatting: 919434478921 -> +91 94344 78921 */
  formatPhone(phone: string | null | undefined): string {
    const raw = (phone || '').toString().trim();
    const digits = raw.replace(/\D/g, '');
    if (!digits || digits.length !== raw.replace(/^\+/, '').length) { return raw; }  // not plain digits: show as-is
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

  getAvatarColor(name: string | null): { bg: string; fg: string } {
    const key = (name || '?').toString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    return this.avatarPalette[Math.abs(hash) % this.avatarPalette.length];
  }

  trackByContactId(
    index: number,
    contact: Contact
  ): number | string {

    return contact.id;

  }


  /* =========================================================
     GO BACK
  ========================================================= */

  goBack(): void {
    this.router.navigateByUrl('home');
    // window.history.back();

  }


  /* =========================================================
     DESTROY
  ========================================================= */

  ngOnDestroy(): void {

    this._unsubscribeAll.next();

    this._unsubscribeAll.complete();

  }

}
// import { Component, OnInit } from '@angular/core';
// import { NavigationEnd, Router } from '@angular/router';
// import { filter, Subject, takeUntil } from 'rxjs';
// import { User } from '../user';
// import { Common } from '../common';
// import { Api } from '../api';

// interface Contact {
//   id: string;
//   name: string;
//   phone: string;
// }

// @Component({
//   selector: 'app-contact-list',
//   templateUrl: './contact-list.page.html',
//   styleUrls: ['./contact-list.page.scss'],
//   standalone: false
// })
// export class ContactListPage implements OnInit {

//   private _unsubscribeAll: Subject<any>;

//   currentUser:any;
//   searchQuery: string = '';
//   contactId: string | null = null;

//   contacts: Contact[] = [
//     { id: '1', name: 'Alex Thompson', phone: '+1 (555) 019-2834' },
//     { id: '2', name: 'Sarah Jenkins', phone: '+1 (555) 014-9921' },
//     { id: '3', name: 'David Miller', phone: '+1 (555) 017-5582' },
//     { id: '4', name: 'Jessica Taylor', phone: '+1 (555) 012-3345' },
//     { id: '5', name: 'Michael Brown', phone: '+1 (555) 018-9900' }
//   ];

//   filteredContacts: Contact[] = [];

//   constructor(private router: Router, private userService: User, private commonService: Common, private apiService: Api) {
//     this._unsubscribeAll = new Subject();
//   }

//   ngOnInit() {
//     this.filteredContacts = [...this.contacts];
//     this.userService.currentUser$.subscribe(user => {
//       if (user) {
//         this.currentUser = user;
//       } else {
//         const storedUser = localStorage.getItem('currentUser');
//         if (storedUser) {
//           this.currentUser = JSON.parse(storedUser);
//         }
//       }
//     });

//     this.router.events.pipe(
//       filter((event): event is NavigationEnd => event instanceof NavigationEnd)
//     ).subscribe((event: NavigationEnd) => {
//       if (event.url === '/contact-list') {
//         this.load_contacts();
//       }
//     });
//   }

//   load_contacts() {
//     this.commonService.presentLoading();
//     this.apiService.load_contacts()
//       .pipe(takeUntil(this._unsubscribeAll))
//       .subscribe((response: any) => {console.log(response)
        
//         this.commonService.dismissLoading();
//       },
//       respError => {
//         this.commonService.dismissLoading();
//         this.commonService.showToastMessage(respError, 'toast-error', '', 4000);
//       });
//   }

//   // Filter contacts dynamically based on search input
//   filterContacts() {
//     const query = this.searchQuery.toLowerCase().trim();
//     if (!query) {
//       this.filteredContacts = [...this.contacts];
//     } else {
//       this.filteredContacts = this.contacts.filter(
//         c => c.name.toLowerCase().includes(query) || c.phone.includes(query)
//       );
//     }
//   }

//   // Generate initials for avatar placeholder
//   getInitials(name: string): string {
//     return name
//       .split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase()
//       .substring(0, 2);
//   }

//   // Handle row selection (e.g., share or view contact details)
//   selectContact(contact: Contact) {
//     console.log('Selected contact:', contact);
//     // Add navigation or selection callback here
//   }

//   // Direct phone call handler function
//   callContact(contact: Contact, event: Event) {
//     event.stopPropagation();
//     window.location.href = `tel:${contact.phone}`;
//   }

//   // Direct chat/message handler function
//   messageContact(contact: Contact, event: Event) {
//     event.stopPropagation();
//     console.log('Open chat with:', contact.name);
//     // Navigates to the chat page with the contact's unique ID
//     this.router.navigate(['/chat', contact.id]);
//   }

//   openMessage(phoneNumber: string) {
//     // Standard SMS URI scheme. 
//     // You can also pre-fill text using: `sms:${phoneNumber}?body=Hello%20there`
//     // const smsUrl = `sms:${phoneNumber}`;
    
//     // // Opens the native device messaging app
//     // window.open(smsUrl, '_system');
//   }

//   goBack() {
//     window.history.back();
//   }
// }