import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.page.html',
  styleUrls: ['./contact-list.page.scss'],
  standalone:false
})
export class ContactListPage implements OnInit {
  searchQuery: string = '';

  contacts: Contact[] = [
    { id: '1', name: 'Alex Thompson', phone: '+1 (555) 019-2834' },
    { id: '2', name: 'Sarah Jenkins', phone: '+1 (555) 014-9921' },
    { id: '3', name: 'David Miller', phone: '+1 (555) 017-5582' },
    { id: '4', name: 'Jessica Taylor', phone: '+1 (555) 012-3345' },
    { id: '5', name: 'Michael Brown', phone: '+1 (555) 018-9900' }
  ];

  filteredContacts: Contact[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.filteredContacts = [...this.contacts];
  }

  // Filter contacts dynamically based on search input
  filterContacts() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredContacts = [...this.contacts];
    } else {
      this.filteredContacts = this.contacts.filter(
        c => c.name.toLowerCase().includes(query) || c.phone.includes(query)
      );
    }
  }

  // Generate initials for avatar placeholder
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Handle row selection (e.g., share or view contact details)
  selectContact(contact: Contact) {
    console.log('Selected contact:', contact);
    // Add navigation or selection callback here
  }

  // Direct phone call handler function
  callContact(contact: Contact, event: Event) {
    event.stopPropagation();
    window.location.href = `tel:${contact.phone}`;
  }

  // Direct chat/message handler function
  messageContact(contact: Contact, event: Event) {
    event.stopPropagation();
    console.log('Open chat with:', contact.name);
    // Example navigation: this.router.navigate(['/chat', contact.id]);
  }

  goBack() {
    window.history.back();
  }
}