import {
  Component,
  OnInit,
  HostListener,
  OnDestroy
} from '@angular/core';

import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';

import { User } from '../user';
import { Common } from '../common';
import { Api } from '../api';
import { Platform } from '@ionic/angular';

interface ContactMedia {
  type: string;
  url: string;
}

interface ContactDocument {
  url: string;
  mime_type: string;
}

interface ContactDetails {
  name: string;
  mobile_no: string;
  email: string | null;
  groups: string[];
  media: ContactMedia[];
  documents: ContactDocument[];
  locations: any[];
}

@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.page.html',
  styleUrls: ['./contact-detail.page.scss'],
  standalone: false,
})
export class ContactDetailPage implements OnInit, OnDestroy {

  private _unsubscribeAll = new Subject<void>();
  backButtonSub!: Subscription;

  currentUser: any;

  // =================================================
  // CHAT
  // =================================================

  chat: any = null;

  // =================================================
  // CONTACT DATA
  // =================================================

  contact: ContactDetails = {
    name: '',
    mobile_no: '',
    email: null,
    groups: [],
    media: [],
    documents: [],
    locations: []
  };

  loading = false;

  // =================================================
  // IMAGE VIEWER
  // =================================================

  selectedIndex: number | null = null;

  slideClass = 'slide-right-a';

  // =================================================
  // TOUCH / SWIPE
  // =================================================

  private touchStartX = 0;
  private touchStartY = 0;

  private touchEndX = 0;
  private touchEndY = 0;

  private readonly swipeThreshold = 50;

  // =================================================
  // ACTIVE TAB
  // =================================================

  public activeTab: string = 'contacts';

  // =================================================
  // CONSTRUCTOR
  // =================================================

  constructor(
    private router: Router,
    private userService: User,
    private commonService: Common,
    private apiService: Api, private platform: Platform
  ) {}

  // =================================================
  // INIT
  // =================================================

  ngOnInit(): void {
    this.router.events.pipe(filter((event): event is NavigationEnd =>event instanceof NavigationEnd),takeUntil(this._unsubscribeAll))
      .subscribe((event: NavigationEnd) => {
        if (event.urlAfterRedirects === '/contact-detail') {
           /*
     * Get chat object passed from Chat Details
     */
    const navigation = this.router.getCurrentNavigation();

    const navigationState =
      navigation?.extras?.state?.['chat'];

    const historyState =
      window.history.state?.['chat'];

    this.chat =
      navigationState ||
      historyState ||
      null;

    console.log('Contact Detail Chat:', this.chat);

    /*
     * Current user
     */
    this.userService.currentUser$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {

        if (user) {

          this.currentUser = user;

        } else {

          const storedUser =
            localStorage.getItem('currentUser');

          if (storedUser) {

            try {

              this.currentUser =
                JSON.parse(storedUser);

            } catch (error) {

              console.error(
                'Invalid currentUser in localStorage',
                error
              );

            }

          }

        }

      });

    /*
     * Load contact details
     */
    if (this.chat?.id) {

      this.customer_details();

    } else {

      console.error(
        'Chat ID is missing. Cannot load contact details.'
      );

    }
        }
      });

  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.onBack();
      // (navigator as any).app.exitApp();
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  // =================================================
  // CUSTOMER DETAILS API
  // =================================================

  customer_details(): void {
    if (!this.chat?.id) {
      console.error(
        'Chat ID not available.'
      );
      return;
    }
    this.loading = true;
    this.commonService.presentLoading();
    this.apiService.customer_details(this.chat.id)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response: any) => {
          console.log('Customer Details Response:',response);
          this.loading = false;
          this.commonService.dismissLoading();
          const data = response?.data || response;
          if (!data) {
            console.error('Contact details data not found.');
            return;
          }
          this.contact = {
            name:data.name || '',
            mobile_no:
              data.mobile_no || '',
            email:
              data.email || null,
            groups:
              Array.isArray(data.groups)
                ? data.groups
                : [],
            media:
              Array.isArray(data.media)
                ? data.media 
                : [],

                // media: Array.isArray(data.media)
                // ? data.media.map((item: any) => ({
                //     ...item,
                //     url: item?.url
                //       ? item.url.replace(/^http:\/\//, 'https://')
                //       : item?.url
                //   }))
                // : [],

            documents:
              Array.isArray(data.documents)
                ? data.documents
                : [],

            locations:
              Array.isArray(data.locations)
                ? data.locations
                : []

          };

          console.log(
            'Mapped Contact:',
            this.contact
          );

        },

        error: (error) => {

          this.loading = false;

          this.commonService.dismissLoading();

          console.error(
            'Customer Details Error:',
            error
          );

          this.commonService.showToastMessage(
            'Unable to load contact details.',
            'toast-error',
            '',
            2000
          );

        }

      });

  }

  // =================================================
  // INITIALS
  // =================================================

  getInitials(name: string | null | undefined): string {

    if (!name) {
      return '';
    }

    const cleanName =
      name.trim();

    if (!cleanName) {
      return '';
    }

    const parts =
      cleanName.split(/\s+/);

    if (parts.length >= 2) {

      return (
        parts[0][0] +
        parts[parts.length - 1][0]
      ).toUpperCase();

    }

    return cleanName
      .slice(0, 2)
      .toUpperCase();

  }

  // =================================================
  // BACK TO CHAT
  // =================================================

  onBack(): void {

    this.router.navigate(
      ['/chat-details'],
      {
        state: {
          chat: this.chat
        }
      }
    );

  }

  // =================================================
  // MESSAGE BUTTON
  // =================================================

  sendMessage(): void {

    /*
     * Go back to the same Chat Details page.
     *
     * Do NOT use:
     * ['/chat', this.contact.phone]
     *
     * because your actual chat page is /chat-details.
     */
    this.chat['routeURL'] = 'contact-details';
    this.router.navigate(
      ['/chat-details'],
      {
        state: {
          chat: this.chat
        }
      }
    );

  }

  // =================================================
  // CALL
  // =================================================

  makeCall(): void {

    if (!this.contact.mobile_no) {

      this.commonService.showToastMessage(
        'Contact number not available.',
        'toast-error',
        '',
        2000
      );

      return;
    }

    window.open(
      `tel:${this.contact.mobile_no}`,
      '_system'
    );

  }

  // =================================================
  // MEDIA
  // =================================================

  get imageMedia(): ContactMedia[] {

    return this.contact.media
      .filter(media =>
        media?.type === 'image' &&
        !!media?.url
      );

  }

  get videoMedia(): ContactMedia[] {

    return this.contact.media
      .filter(media =>
        media?.type === 'video' &&
        !!media?.url
      );

  }

  get audioMedia(): ContactMedia[] {

    return this.contact.media
      .filter(media =>
        media?.type === 'audio' &&
        !!media?.url
      );

  }

  // =================================================
  // SELECTED IMAGE
  // =================================================

  get selectedImage(): string | null {

    if (this.selectedIndex === null) {
      return null;
    }

    const media =
      this.imageMedia[this.selectedIndex];

    return media?.url || null;

  }

  // =================================================
  // OPEN IMAGE
  // =================================================

  openMedia(index: number): void {

    if (
      index < 0 ||
      index >= this.imageMedia.length
    ) {

      return;
    }

    this.selectedIndex = index;

    this.slideClass =
      'slide-right-a';

  }

  // =================================================
  // CLOSE IMAGE
  // =================================================

  closeMedia(): void {

    this.selectedIndex = null;

  }

  // =================================================
  // NEXT IMAGE
  // =================================================

  nextImage(): void {

    if (
      this.selectedIndex === null ||
      this.imageMedia.length <= 1
    ) {

      return;
    }

    const length =
      this.imageMedia.length;

    this.selectedIndex =
      (this.selectedIndex + 1) % length;

    this.toggleSlideClass(
      'right'
    );

  }

  // =================================================
  // PREVIOUS IMAGE
  // =================================================

  prevImage(): void {

    if (
      this.selectedIndex === null ||
      this.imageMedia.length <= 1
    ) {

      return;
    }

    const length =
      this.imageMedia.length;

    this.selectedIndex =
      (
        this.selectedIndex -
        1 +
        length
      ) % length;

    this.toggleSlideClass(
      'left'
    );

  }

  // =================================================
  // SLIDE ANIMATION
  // =================================================

  private toggleSlideClass(
    direction: 'left' | 'right'
  ): void {

    const suffix =
      this.slideClass.endsWith('a')
        ? 'b'
        : 'a';

    this.slideClass =
      `slide-${direction}-${suffix}`;

  }

  // =================================================
  // VIDEO
  // =================================================

  openVideo(url: string): void {

    if (!url) {
      return;
    }

    window.open(
      url,
      '_blank'
    );

  }

  // =================================================
  // AUDIO
  // =================================================

  openAudio(url: string): void {

    if (!url) {
      return;
    }

    window.open(
      url,
      '_blank'
    );

  }

  // =================================================
  // DOCUMENT
  // =================================================

  openDocument(
    url: string,
    fileName?: string
  ): void {

    if (!url) {

      this.commonService.showToastMessage(
        'Document not found.',
        'toast-error',
        '',
        2000
      );

      return;
    }

    const link =
      document.createElement('a');

    link.href = url;

    link.target = '_blank';

    if (fileName) {
      link.download = fileName;
    }

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  }

  // =================================================
  // FILE NAME
  // =================================================

  getFileName(
    url: string | null | undefined
  ): string {

    if (!url) {
      return 'Document';
    }

    const fileName =
      url.substring(
        url.lastIndexOf('/') + 1
      );

    /*
     * Remove MIME-like extension from
     * names such as:
     *
     * 3563910813765294.vnd.ms-excel
     */

    return fileName || 'Document';

  }

  // =================================================
  // TOUCH START
  // =================================================

  onTouchStart(
    event: TouchEvent
  ): void {

    if (
      this.selectedIndex === null
    ) {

      return;
    }

    const touch =
      event.touches[0];

    this.touchStartX =
      touch.clientX;

    this.touchStartY =
      touch.clientY;

    this.touchEndX =
      touch.clientX;

    this.touchEndY =
      touch.clientY;

  }

  // =================================================
  // TOUCH MOVE
  // =================================================

  onTouchMove(
    event: TouchEvent
  ): void {

    if (
      this.selectedIndex === null
    ) {

      return;
    }

    const touch =
      event.touches[0];

    this.touchEndX =
      touch.clientX;

    this.touchEndY =
      touch.clientY;

  }

  // =================================================
  // TOUCH END
  // =================================================

  onTouchEnd(
    event: TouchEvent
  ): void {

    if (
      this.selectedIndex === null
    ) {

      return;
    }

    const deltaX =
      this.touchEndX -
      this.touchStartX;

    const deltaY =
      this.touchEndY -
      this.touchStartY;

    /*
     * Ignore vertical swipe
     */

    if (
      Math.abs(deltaY) >
      Math.abs(deltaX)
    ) {

      this.resetTouch();

      return;
    }

    /*
     * Ignore small movement
     */

    if (
      Math.abs(deltaX) <
      this.swipeThreshold
    ) {

      this.resetTouch();

      return;
    }

    /*
     * Swipe left = next
     */

    if (deltaX < 0) {

      this.nextImage();

    } else {

      this.prevImage();

    }

    this.resetTouch();

  }

  // =================================================
  // RESET TOUCH
  // =================================================

  private resetTouch(): void {

    this.touchStartX = 0;
    this.touchStartY = 0;

    this.touchEndX = 0;
    this.touchEndY = 0;

  }

  // =================================================
  // KEYBOARD
  // =================================================

  @HostListener(
    'document:keydown',
    ['$event']
  )
  handleKeydown(
    event: KeyboardEvent
  ): void {

    if (
      this.selectedIndex === null
    ) {

      return;
    }

    if (
      event.key === 'ArrowRight'
    ) {

      event.preventDefault();

      this.nextImage();

    }

    if (
      event.key === 'ArrowLeft'
    ) {

      event.preventDefault();

      this.prevImage();

    }

    if (
      event.key === 'Escape'
    ) {

      event.preventDefault();

      this.closeMedia();

    }

  }

  // =================================================
  // BOTTOM NAVIGATION
  // =================================================

  goToChats(): void {

    this.activeTab = 'chats';

    this.router.navigate([
      '/home'
    ]);

  }

  goToContacts(): void {

    this.activeTab = 'contacts';

    this.router.navigate([
      '/contact-list'
    ]);

  }

  goToProfile(): void {

    this.activeTab = 'settings';

    this.router.navigate([
      '/my-profile'
    ]);

  }

  // =================================================
  // DESTROY
  // =================================================

  ngOnDestroy(): void {

    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();

  }

}
// import {
//   Component,
//   OnInit,
//   HostListener
// } from '@angular/core';

// import {
//   NavigationEnd,
//   Router
// } from '@angular/router';
// import { filter, Subject, takeUntil } from 'rxjs';
// import { User } from '../user';
// import { Common } from '../common';
// import { Api } from '../api';


// @Component({
//   selector: 'app-contact-detail',
//   templateUrl: './contact-detail.page.html',
//   styleUrls: ['./contact-detail.page.scss'],
//   standalone: false,
// })
// export class ContactDetailPage implements OnInit {

//   private _unsubscribeAll = new Subject<void>();

//   currentUser:any;

//   // =================================================
//   // IMAGE VIEWER
//   // =================================================

//   selectedIndex: number | null = null;

//   slideClass = 'slide-right-a';


//   // =================================================
//   // TOUCH / SWIPE
//   // =================================================

//   private touchStartX = 0;
//   private touchStartY = 0;

//   private touchEndX = 0;
//   private touchEndY = 0;

//   private readonly swipeThreshold = 50;


//   // =================================================
//   // ACTIVE TAB
//   // =================================================

//   public activeTab: string = 'contacts';


//   // =================================================
//   // CONTACT DATA
//   // =================================================

//   contact = {

//     name: 'Jordan Davidson',

//     phone: '+1 (555) 012-3456',

//     groups: [
//       'Designer',
//       'Product',
//       'Tech',
//       'Innovation',
//       'UI Architecture'
//     ],

//     media: [

//       'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',

//       'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',

//       'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80',

//       'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',

//       'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80'

//     ]

//   };


//   // =================================================
//   // CHAT OBJECT
//   // =================================================

//   chat: any = {
//     contacts__name: '',
//     contacts__wa_id: ''
//   };


//   // =================================================
//   // CONSTRUCTOR
//   // =================================================

//   constructor(private router: Router, private userService: User, private commonService: Common, private apiService: Api) {}


//   // =================================================
//   // INIT
//   // =================================================

//   ngOnInit(): void {

//     /*
//      * Read router state immediately.
//      *
//      * getCurrentNavigation() is only reliable during
//      * the navigation itself.
//      */

//     const navigation = this.router.getCurrentNavigation();

//     const navigationState =
//       navigation?.extras?.state?.['chat'];


//     /*
//      * Fallback:
//      *
//      * history.state remains available after the
//      * navigation has completed.
//      */

//     const historyState =
//       window.history.state?.['chat'];


//     /*
//      * Use navigation state first.
//      * If unavailable, use history.state.
//      */

//     this.chat =
//       navigationState ||
//       historyState ||
//       this.chat;


//     console.log(
//       'Contact Detail Chat:',
//       this.chat
//     );
//     this.userService.currentUser$
//     .pipe(takeUntil(this._unsubscribeAll))
//       .subscribe(user => {
//         if (user) {
//           this.currentUser = user;
//         } else {
//           const storedUser = localStorage.getItem('currentUser');
//           if (storedUser) {
//             try {
//               this.currentUser = JSON.parse(storedUser);
//             } 
//             catch (error) {
//               console.error(
//                 'Invalid currentUser in localStorage',
//                 error
//               );
//             }
//           }
//         }
//       });
//     /*
//      * Load contacts when navigating to contact-list
//      */
//     this.router.events.pipe(filter((event): event is NavigationEnd =>event instanceof NavigationEnd),takeUntil(this._unsubscribeAll))
//       .subscribe((event: NavigationEnd) => {
//         if (event.urlAfterRedirects === '/contact-detail') {
//           this.customer_details();
//         }
//       });

//   }

//   customer_details() {
//     this.commonService.presentLoading();
//     this.apiService.customer_details(this.chat.id)
//       .pipe(takeUntil(this._unsubscribeAll))
//       .subscribe((response: any) => {console.log(response);
        
//         this.commonService.dismissLoading();
//       }, error => {
//         this.commonService.dismissLoading();
//         console.log(error);
//       });
//   }


//   // =================================================
//   // INITIALS
//   // =================================================

//   getInitials(name: string): string {

//     if (!name) {
//       return 'JD';
//     }


//     const cleanName =
//       name.trim();


//     if (!cleanName) {
//       return 'JD';
//     }


//     const parts =
//       cleanName.split(/\s+/);


//     if (parts.length >= 2) {

//       return (
//         parts[0][0] +
//         parts[parts.length - 1][0]
//       ).toUpperCase();

//     }


//     return cleanName
//       .slice(0, 2)
//       .toUpperCase();

//   }


//   // =================================================
//   // BACK
//   // =================================================

//   onBack(): void {

//     this.router.navigateByUrl(
//       'chat-details'
//     );

//   }


//   // =================================================
//   // SEND MESSAGE
//   // =================================================

//   sendMessage(): void {

//     this.router.navigate(
//       ['/chat', this.contact.phone],
//       {
//         state: {
//           name: this.contact.name,
//           phone: this.contact.phone
//         }
//       }
//     );

//   }


//   // =================================================
//   // CALL
//   // =================================================

//   makeCall(): void {

//     window.open(
//       `tel:${this.contact.phone}`,
//       '_system'
//     );

//   }


//   // =================================================
//   // VIEW ALL MEDIA
//   // =================================================

//   viewAllMedia(): void {

//     console.log(
//       'View all media clicked'
//     );

//   }


//   // =================================================
//   // OPEN SMS
//   // =================================================

//   openMessage(phoneNumber: string): void {

//     const smsUrl =
//       `sms:${phoneNumber}`;

//     window.open(
//       smsUrl,
//       '_system'
//     );

//   }


//   // =================================================
//   // BOTTOM NAV
//   // =================================================

//   goToChats(): void {

//     this.activeTab = 'chats';

//     this.router.navigate([
//       '/home'
//     ]);

//   }


//   goToContacts(): void {

//     this.activeTab = 'contacts';

//     this.router.navigate([
//       '/contact-detail'
//     ]);

//   }


//   goToProfile(): void {

//     this.activeTab = 'settings';

//     this.router.navigate([
//       '/my-profile'
//     ]);

//   }


//   // =================================================
//   // SELECTED IMAGE
//   // =================================================

//   get selectedImage(): string | null {

//     if (
//       this.selectedIndex === null
//     ) {
//       return null;
//     }


//     return this.contact.media[
//       this.selectedIndex
//     ];

//   }


//   // =================================================
//   // OPEN IMAGE
//   // =================================================

//   openMedia(index: number): void {

//     if (
//       index < 0 ||
//       index >= this.contact.media.length
//     ) {
//       return;
//     }


//     this.selectedIndex = index;

//     /*
//      * Reset animation class
//      */

//     this.slideClass =
//       'slide-right-a';

//   }


//   // =================================================
//   // CLOSE IMAGE
//   // =================================================

//   closeMedia(): void {

//     this.selectedIndex = null;

//   }


//   // =================================================
//   // NEXT IMAGE
//   // =================================================

//   nextImage(): void {

//     if (
//       this.selectedIndex === null ||
//       this.contact.media.length <= 1
//     ) {
//       return;
//     }


//     const length =
//       this.contact.media.length;


//     this.selectedIndex =
//       (
//         this.selectedIndex + 1
//       ) % length;


//     this.toggleSlideClass(
//       'right'
//     );

//   }


//   // =================================================
//   // PREVIOUS IMAGE
//   // =================================================

//   prevImage(): void {

//     if (
//       this.selectedIndex === null ||
//       this.contact.media.length <= 1
//     ) {
//       return;
//     }


//     const length =
//       this.contact.media.length;


//     this.selectedIndex =
//       (
//         this.selectedIndex - 1 + length
//       ) % length;


//     this.toggleSlideClass(
//       'left'
//     );

//   }


//   // =================================================
//   // SLIDE ANIMATION
//   // =================================================

//   private toggleSlideClass(
//     direction: 'left' | 'right'
//   ): void {

//     const suffix =
//       this.slideClass.endsWith('a')
//         ? 'b'
//         : 'a';


//     this.slideClass =
//       `slide-${direction}-${suffix}`;

//   }


//   // =================================================
//   // TOUCH START
//   // =================================================

//   onTouchStart(
//     event: TouchEvent
//   ): void {

//     if (
//       this.selectedIndex === null
//     ) {
//       return;
//     }


//     const touch =
//       event.touches[0];


//     this.touchStartX =
//       touch.clientX;


//     this.touchStartY =
//       touch.clientY;


//     this.touchEndX =
//       touch.clientX;


//     this.touchEndY =
//       touch.clientY;

//   }


//   // =================================================
//   // TOUCH MOVE
//   // =================================================

//   onTouchMove(
//     event: TouchEvent
//   ): void {

//     if (
//       this.selectedIndex === null
//     ) {
//       return;
//     }


//     const touch =
//       event.touches[0];


//     this.touchEndX =
//       touch.clientX;


//     this.touchEndY =
//       touch.clientY;

//   }


//   // =================================================
//   // TOUCH END
//   // =================================================

//   onTouchEnd(
//     event: TouchEvent
//   ): void {

//     if (
//       this.selectedIndex === null
//     ) {
//       return;
//     }


//     const deltaX =
//       this.touchEndX -
//       this.touchStartX;


//     const deltaY =
//       this.touchEndY -
//       this.touchStartY;


//     /*
//      * Ignore vertical scrolling gestures.
//      */

//     if (
//       Math.abs(deltaY) >
//       Math.abs(deltaX)
//     ) {

//       this.resetTouch();

//       return;

//     }


//     /*
//      * Ignore very small movements.
//      */

//     if (
//       Math.abs(deltaX) <
//       this.swipeThreshold
//     ) {

//       this.resetTouch();

//       return;

//     }


//     /*
//      * Swipe LEFT
//      *
//      * Finger moves left:
//      * show NEXT image.
//      */

//     if (deltaX < 0) {

//       this.nextImage();

//     }


//     /*
//      * Swipe RIGHT
//      *
//      * Finger moves right:
//      * show PREVIOUS image.
//      */

//     else {

//       this.prevImage();

//     }


//     this.resetTouch();

//   }


//   // =================================================
//   // RESET TOUCH
//   // =================================================

//   private resetTouch(): void {

//     this.touchStartX = 0;
//     this.touchStartY = 0;

//     this.touchEndX = 0;
//     this.touchEndY = 0;

//   }


//   // =================================================
//   // KEYBOARD CONTROLS
//   // =================================================

//   @HostListener(
//     'document:keydown',
//     ['$event']
//   )
//   handleKeydown(
//     event: KeyboardEvent
//   ): void {

//     if (
//       this.selectedIndex === null
//     ) {
//       return;
//     }


//     if (
//       event.key === 'ArrowRight'
//     ) {

//       event.preventDefault();

//       this.nextImage();

//     }


//     if (
//       event.key === 'ArrowLeft'
//     ) {

//       event.preventDefault();

//       this.prevImage();

//     }


//     if (
//       event.key === 'Escape'
//     ) {

//       event.preventDefault();

//       this.closeMedia();

//     }

//   }

// }