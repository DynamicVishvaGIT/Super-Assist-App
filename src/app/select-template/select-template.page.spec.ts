import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectTemplatePage } from './select-template.page';

describe('SelectTemplatePage', () => {
  let component: SelectTemplatePage;
  let fixture: ComponentFixture<SelectTemplatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTemplatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
