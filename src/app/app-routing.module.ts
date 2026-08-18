import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'chat-details',
    loadChildren: () => import('./chat-details/chat-details.module').then( m => m.ChatDetailsPageModule)
  },
  {
    path: 'my-profile',
    loadChildren: () => import('./my-profile/my-profile.module').then( m => m.MyProfilePageModule)
  },
  {
    path: 'select-template',
    loadChildren: () => import('./select-template/select-template.module').then( m => m.SelectTemplatePageModule)
  },
  {
    path: 'template-preview',
    loadChildren: () => import('./template-preview/template-preview.module').then( m => m.TemplatePreviewPageModule)
  },
  {
    path: 'chat-box',
    loadChildren: () => import('./chat-box/chat-box.module').then( m => m.ChatBoxPageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./forgot-password/forgot-password.module').then( m => m.ForgotPasswordPageModule)
  },
  {
    path: 'contact-detail',
    loadChildren: () => import('./contact-detail/contact-detail.module').then( m => m.ContactDetailPageModule)
  },
  {
    path: 'contact-list',
    loadChildren: () => import('./contact-list/contact-list.module').then( m => m.ContactListPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
