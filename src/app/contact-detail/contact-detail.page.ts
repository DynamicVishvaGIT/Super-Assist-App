import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.page.html',
  styleUrls: ['./contact-detail.page.scss'],
  standalone: false,
})
export class ContactDetailPage implements OnInit {
  selectedImage: string | null = null;

  public activeTab: string = 'contacts'; // 👈 Set to contacts by default here

  contact = {
    name: 'Jordan Davidson',
    phone: '+1 (555) 012-3456',
    groups: ['Designer', 'Product', 'Tech', 'Innovation', 'UI Architecture'],
    media: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80'
    ]
  };

  constructor(private router: Router) { }

  ngOnInit() { }

  getInitials(name: string): string {
    if (!name) return 'JD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  onBack() {
    this.router.navigateByUrl('home');
  }

  sendMessage() {
    console.log('Open chat message with:', this.contact.name);
  }

  makeCall() {
    console.log('Initiating call to:', this.contact.phone);
  }

  viewAllMedia() {
    console.log('View all media clicked');
  }

  // openMedia(url: string) {
  //   console.log('Opening image:', url);
  // }

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
  openMedia(url: string) {
  this.selectedImage = url;
}
closeMedia() {
  this.selectedImage = null;
}
}