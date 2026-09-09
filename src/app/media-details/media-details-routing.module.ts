import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MediaDetailsPage } from './media-details.page';

const routes: Routes = [
  {
    path: '',
    component: MediaDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MediaDetailsPageRoutingModule {}
