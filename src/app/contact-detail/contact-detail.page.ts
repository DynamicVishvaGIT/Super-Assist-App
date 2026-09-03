import {
  Component,
  OnInit,
  HostListener
} from '@angular/core';

import {
  Router
} from '@angular/router';


@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.page.html',
  styleUrls: ['./contact-detail.page.scss'],
  standalone: false,
})
export class ContactDetailPage implements OnInit {

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
  // CONTACT DATA
  // =================================================

  contact = {

    name: 'Jordan Davidson',

    phone: '+1 (555) 012-3456',

    groups: [
      'Designer',
      'Product',
      'Tech',
      'Innovation',
      'UI Architecture'
    ],

    media: [

      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',

      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',

      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80',

      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',

      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80'

    ]

  };


  // =================================================
  // CHAT OBJECT
  // =================================================

  chat: any = {
    contacts__name: '',
    contacts__wa_id: ''
  };


  // =================================================
  // CONSTRUCTOR
  // =================================================

  constructor(
    private router: Router
  ) {}


  // =================================================
  // INIT
  // =================================================

  ngOnInit(): void {

    /*
     * Read router state immediately.
     *
     * getCurrentNavigation() is only reliable during
     * the navigation itself.
     */

    const navigation = this.router.getCurrentNavigation();

    const navigationState =
      navigation?.extras?.state?.['chat'];


    /*
     * Fallback:
     *
     * history.state remains available after the
     * navigation has completed.
     */

    const historyState =
      window.history.state?.['chat'];


    /*
     * Use navigation state first.
     * If unavailable, use history.state.
     */

    this.chat =
      navigationState ||
      historyState ||
      this.chat;


    console.log(
      'Contact Detail Chat:',
      this.chat
    );

  }


  // =================================================
  // INITIALS
  // =================================================

  getInitials(name: string): string {

    if (!name) {
      return 'JD';
    }


    const cleanName =
      name.trim();


    if (!cleanName) {
      return 'JD';
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
  // BACK
  // =================================================

  onBack(): void {

    this.router.navigateByUrl(
      'chat-details'
    );

  }


  // =================================================
  // SEND MESSAGE
  // =================================================

  sendMessage(): void {

    this.router.navigate(
      ['/chat', this.contact.phone],
      {
        state: {
          name: this.contact.name,
          phone: this.contact.phone
        }
      }
    );

  }


  // =================================================
  // CALL
  // =================================================

  makeCall(): void {

    window.open(
      `tel:${this.contact.phone}`,
      '_system'
    );

  }


  // =================================================
  // VIEW ALL MEDIA
  // =================================================

  viewAllMedia(): void {

    console.log(
      'View all media clicked'
    );

  }


  // =================================================
  // OPEN SMS
  // =================================================

  openMessage(phoneNumber: string): void {

    const smsUrl =
      `sms:${phoneNumber}`;

    window.open(
      smsUrl,
      '_system'
    );

  }


  // =================================================
  // BOTTOM NAV
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
      '/contact-detail'
    ]);

  }


  goToProfile(): void {

    this.activeTab = 'settings';

    this.router.navigate([
      '/my-profile'
    ]);

  }


  // =================================================
  // SELECTED IMAGE
  // =================================================

  get selectedImage(): string | null {

    if (
      this.selectedIndex === null
    ) {
      return null;
    }


    return this.contact.media[
      this.selectedIndex
    ];

  }


  // =================================================
  // OPEN IMAGE
  // =================================================

  openMedia(index: number): void {

    if (
      index < 0 ||
      index >= this.contact.media.length
    ) {
      return;
    }


    this.selectedIndex = index;

    /*
     * Reset animation class
     */

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
      this.contact.media.length <= 1
    ) {
      return;
    }


    const length =
      this.contact.media.length;


    this.selectedIndex =
      (
        this.selectedIndex + 1
      ) % length;


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
      this.contact.media.length <= 1
    ) {
      return;
    }


    const length =
      this.contact.media.length;


    this.selectedIndex =
      (
        this.selectedIndex - 1 + length
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
     * Ignore vertical scrolling gestures.
     */

    if (
      Math.abs(deltaY) >
      Math.abs(deltaX)
    ) {

      this.resetTouch();

      return;

    }


    /*
     * Ignore very small movements.
     */

    if (
      Math.abs(deltaX) <
      this.swipeThreshold
    ) {

      this.resetTouch();

      return;

    }


    /*
     * Swipe LEFT
     *
     * Finger moves left:
     * show NEXT image.
     */

    if (deltaX < 0) {

      this.nextImage();

    }


    /*
     * Swipe RIGHT
     *
     * Finger moves right:
     * show PREVIOUS image.
     */

    else {

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
  // KEYBOARD CONTROLS
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

}