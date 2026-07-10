import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectTemplatePage } from './select-template.page';

const routes: Routes = [
  {
    path: '',
    component: SelectTemplatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectTemplatePageRoutingModule {}
