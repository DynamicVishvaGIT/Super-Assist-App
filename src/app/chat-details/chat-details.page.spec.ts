import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatDetailsPage } from './chat-details.page';

describe('ChatDetailsPage', () => {
  let component: ChatDetailsPage;
  let fixture: ComponentFixture<ChatDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
