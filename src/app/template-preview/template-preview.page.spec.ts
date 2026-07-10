import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplatePreviewPage } from './template-preview.page';

describe('TemplatePreviewPage', () => {
  let component: TemplatePreviewPage;
  let fixture: ComponentFixture<TemplatePreviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatePreviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
