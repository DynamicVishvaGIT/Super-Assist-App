import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaDetailsPage } from './media-details.page';

describe('MediaDetailsPage', () => {
  let component: MediaDetailsPage;
  let fixture: ComponentFixture<MediaDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
