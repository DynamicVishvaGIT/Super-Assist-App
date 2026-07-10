import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TemplatePreviewPage } from './template-preview.page';

const routes: Routes = [
  {
    path: '',
    component: TemplatePreviewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TemplatePreviewPageRoutingModule {}
