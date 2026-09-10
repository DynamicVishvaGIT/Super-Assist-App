import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import { File as CordovaFile } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';

interface DocumentItem {
  name: string;
  type: string;
  selected: boolean;
  fileUrl?: string;
  mimeType?: string;
}

interface MediaItem {
  type: 'image' | 'video' | 'audio';
  url: string;
  created_at: string;
  date: string;
  duration?: string;
}

interface LinkItem {
  text: string;
  created_at: string;
  selected: boolean;
}

@Component({
  selector: 'app-media-details',
  templateUrl: './media-details.page.html',
  styleUrls: ['./media-details.page.scss'],
  standalone: false
})
export class MediaDetailsPage implements OnInit {

  private isCordova(): boolean {
    return !!(
      (window as any).cordova &&
      (window as any).cordova.file
    );
  }

  activeTab: 'documents' | 'media' | 'links' = 'media';

  searchOpen = false;
  searchQuery = '';

  data: any = null;

  documents: DocumentItem[] = [];
  mediaItems: MediaItem[] = [];
  links: LinkItem[] = [];

  lightboxOpen = false;
  currentMediaIndex = 0;
  zoomLevel = 1;

  private touchStartX = 0;
  private touchStartY = 0;
  private suppressNextImageClick = false;
  isDownloading = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private actionSheetController: ActionSheetController,private cordovaFile: CordovaFile,private fileTransfer: FileTransfer,
    private alertController: AlertController,
    private toastController: ToastController,
    private fileOpener: FileOpener,
    private socialSharing: SocialSharing
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      if (!params['data']) return;

      try {
        this.data = JSON.parse(params['data']);

        this.setDocuments();
        this.setMedia();
        this.setLinks();

        console.log('Media Details:', this.data);
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    });
  }

  private async downloadRemoteFile(
    url: string,
    fileName: string
  ): Promise<string> {
  
    if (!this.isCordova()) {
      throw new Error('Cordova is not available');
    }
  
    if (!url) {
      throw new Error('Invalid download URL');
    }
  
    const rootPath =
      this.cordovaFile.externalRootDirectory;
  
    const downloadPath =
      rootPath + 'Download/';
  
    console.log('Download URL:', url);
    console.log('Root:', rootPath);
    console.log('Download directory:', downloadPath);
  
    const downloadDir =
      await this.cordovaFile.resolveDirectoryUrl(
        downloadPath
      );
  
    const superAssistDir =
      await this.cordovaFile.getDirectory(
        downloadDir,
        'Super Assist',
        {
          create: true,
          exclusive: false
        }
      );
  
    const safeName =
      this.sanitizeFileName(fileName);
  
    const targetPath =
      superAssistDir.nativeURL + safeName;
  
    console.log('FINAL TARGET:', targetPath);
  
    const transfer =
      this.fileTransfer.create();
  
    const result =
      await transfer.download(
        encodeURI(url),
        targetPath,
        true
      );
  
    const localPath =
      result.toURL();
  
    console.log(
      'DOWNLOAD COMPLETED:',
      localPath
    );
  
    return localPath;
  }


  // =========================================================
  // VIDEO DURATION
  // =========================================================

  setVideoDuration(
    item: MediaItem,
    event: Event
  ): void {

    const video = event.target as HTMLVideoElement;

    if (!video.duration || !isFinite(video.duration)) {
      return;
    }

    const totalSeconds = Math.floor(video.duration);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    item.duration =
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // =========================================================
  // DATA
  // =========================================================

  private setDocuments(): void {
    this.documents = (this.data.documents || []).map((doc: any) => ({
      name: this.getDocumentName(doc.url, doc.mime_type),
      type: this.getDocumentType(doc.url, doc.mime_type),
      selected: false,
      fileUrl: doc.url,
      mimeType: doc.mime_type
    }));
  }

  private getDocumentName(
    url: string,
    mimeType: string
  ): string {
  
    if (!url) {
      return 'Document';
    }
  
    // Remove query parameters
    const cleanUrl = url.split('?')[0];
  
    // Get filename
    let name =
      cleanUrl.substring(
        cleanUrl.lastIndexOf('/') + 1
      );
  
    // Fix Excel MIME-based filename if required
    if (
      mimeType === 'application/vnd.ms-excel' &&
      name.toLowerCase().endsWith('.vnd.ms-excel')
    ) {
      name = name.replace(
        /\.vnd\.ms-excel$/i,
        '.xls'
      );
    }
  
    return name || 'Document';
  }
  
  
  private getDocumentType(
    url: string,
    mimeType: string
  ): string {
  
    const name =
      this.getDocumentName(
        url,
        mimeType
      );
  
    const extension =
      name
        .split('.')
        .pop()
        ?.toLowerCase();
  
    // If URL has extension, use it
    if (extension && extension !== name.toLowerCase()) {
      return extension;
    }
  
    // Otherwise determine from MIME type
    switch (mimeType) {
  
      case 'application/pdf':
        return 'pdf';
  
      case 'application/vnd.ms-excel':
        return 'xls';
  
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'xlsx';
  
      case 'application/msword':
        return 'doc';
  
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
  
      case 'application/vnd.ms-powerpoint':
        return 'ppt';
  
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return 'pptx';
  
      case 'text/plain':
        return 'txt';
  
      case 'text/csv':
        return 'csv';
  
      default:
        return mimeType || 'file';
    }
  }

  private getDocumentExtension(
    doc: DocumentItem
  ): string {
  
    const name =
      (doc.name || '').split('?')[0];
  
    const nameExtension =
      name
        .split('.')
        .pop()
        ?.toLowerCase();
  
    if (
      nameExtension &&
      nameExtension !== name.toLowerCase()
    ) {
      return nameExtension;
    }
  
    return this.getExtensionFromMime(
      doc.mimeType
    );
  }

  private getExtensionFromMime(
    mimeType?: string
  ): string {
  
    switch (
      (mimeType || '').toLowerCase()
    ) {
  
      case 'application/pdf':
        return 'pdf';
  
      case 'application/msword':
        return 'doc';
  
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
  
      case 'application/vnd.ms-excel':
        return 'xls';
  
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'xlsx';
  
      case 'application/vnd.ms-powerpoint':
        return 'ppt';
  
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return 'pptx';
  
      case 'text/plain':
        return 'txt';
  
      case 'text/csv':
        return 'csv';
  
      default:
        return 'pdf';
    }
  }

  async downloadDocument(
    doc: DocumentItem,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    if (!doc?.fileUrl) {
      await this.showToast(
        'Document URL not available'
      );
      return;
    }
  
    if (!this.isCordova()) {
      await this.showToast(
        'Please test this in the Android app'
      );
      return;
    }
  
    try {
  
      this.isDownloading = true;
  
      const extension =
        this.getDocumentExtension(doc);
  
      let fileName =
        doc.name || `document_${Date.now()}`;
  
      fileName =
        this.ensureExtension(
          fileName,
          extension
        );
  
      fileName =
        this.sanitizeFileName(fileName);
  
      console.log(
        'Document filename:',
        fileName
      );
  
      console.log(
        'Document MIME:',
        this.getDocumentMimeType(doc)
      );
  
      const filePath =
        await this.downloadRemoteFile(
          doc.fileUrl,
          fileName
        );
  
      console.log(
        'DOCUMENT SAVED:',
        filePath
      );
  
      await this.showToast(
        `Saved to Download/Super Assist/${fileName}`
      );
  
    } catch (error: any) {
  
      console.error(
        'DOCUMENT DOWNLOAD ERROR:',
        error
      );
  
      console.error(
        'CODE:',
        error?.code
      );
  
      console.error(
        'SOURCE:',
        error?.source
      );
  
      console.error(
        'TARGET:',
        error?.target
      );
  
      console.error(
        'HTTP STATUS:',
        error?.http_status
      );
  
      await this.showToast(
        'Unable to download document'
      );
  
    } finally {
  
      this.isDownloading = false;
  
    }
  }

  // private async saveToSuperAssistFolder(
  //   url: string,
  //   fileName: string
  // ): Promise<string> {
  
  //   if (!(window as any).cordova) {
  //     throw new Error('Cordova is not available');
  //   }
  
  //   const root =
  //     this.cordovaFile.externalRootDirectory;
  
  //   const downloadPath =
  //     root + 'Download/';
  
  //   console.log('Android root:', root);
  //   console.log('Download path:', downloadPath);
  
  //   const downloadDir =
  //     await this.cordovaFile.resolveDirectoryUrl(
  //       downloadPath
  //     );
  
  //   const superAssistDir =
  //     await this.cordovaFile.getDirectory(
  //       downloadDir,
  //       'Super Assist',
  //       {
  //         create: true,
  //         exclusive: false
  //       }
  //     );
  
  //   const targetPath =
  //     superAssistDir.nativeURL + fileName;
  
  //   console.log('FINAL TARGET:', targetPath);
  
  //   const transfer =
  //     this.fileTransfer.create();
  
  //   const result =
  //     await transfer.download(
  //       url,
  //       targetPath,
  //       true
  //     );
  
  //   console.log(
  //     'FILE DOWNLOADED:',
  //     result.toURL()
  //   );
  
  //   return result.toURL();
  // }

  async downloadMedia(
    item: MediaItem,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    if (!item?.url) {
      await this.showToast(
        'Media URL not available'
      );
      return;
    }
  
    if (!this.isCordova()) {
      await this.showToast(
        'Please test this in the Android app'
      );
      return;
    }
  
    try {
  
      this.isDownloading = true;
  
      const extension =
        this.getMediaExtension(item);
  
      const fileName =
        this.sanitizeFileName(
          `SuperAssist_${Date.now()}.${extension}`
        );
  
      console.log(
        'Media type:',
        item.type
      );
  
      console.log(
        'Media extension:',
        extension
      );
  
      console.log(
        'Media filename:',
        fileName
      );
  
      const filePath =
        await this.downloadRemoteFile(
          item.url,
          fileName
        );
  
      console.log(
        'MEDIA SAVED:',
        filePath
      );
  
      await this.showToast(
        `Saved to Download/Super Assist/${fileName}`
      );
  
    } catch (error: any) {
  
      console.error(
        'MEDIA DOWNLOAD ERROR:',
        error
      );
  
      console.error(
        'CODE:',
        error?.code
      );
  
      console.error(
        'SOURCE:',
        error?.source
      );
  
      console.error(
        'TARGET:',
        error?.target
      );
  
      console.error(
        'HTTP STATUS:',
        error?.http_status
      );
  
      await this.showToast(
        `Unable to download media`
      );
  
    } finally {
  
      this.isDownloading = false;
  
    }
  }

  private sanitizeFileName(
    fileName: string
  ): string {
  
    return fileName
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replace(/\s+/g, '_')
      .trim();
  }

  async openDocument(
    doc: DocumentItem,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    if (!doc?.fileUrl) {
      await this.showToast(
        'Document URL not available'
      );
      return;
    }
  
    if (!this.isCordova()) {
      window.open(
        doc.fileUrl,
        '_system'
      );
      return;
    }
  
    try {
  
      this.isDownloading = true;
  
      const extension =
        this.getDocumentExtension(doc);
  
      let fileName =
        doc.name ||
        `document_${Date.now()}`;
  
      fileName =
        this.ensureExtension(
          fileName,
          extension
        );
  
      fileName =
        this.sanitizeFileName(fileName);
  
      const filePath =
        await this.downloadRemoteFile(
          doc.fileUrl,
          fileName
        );
  
      const mimeType =
        this.getDocumentMimeType(doc);
  
      console.log(
        'Opening:',
        filePath
      );
  
      console.log(
        'MIME:',
        mimeType
      );
  
      await this.fileOpener.open(
        filePath,
        mimeType
      );
  
    } catch (error: any) {
  
      console.error(
        'OPEN DOCUMENT ERROR:',
        error
      );
  
      console.error(
        'CODE:',
        error?.code
      );
  
      await this.showOpenFileOptions(
        error?.target || '',
        doc.name || 'Document',
        this.getDocumentMimeType(doc)
      );
  
    } finally {
  
      this.isDownloading = false;
  
    }
  }

  private getDocumentMimeType(
    doc: DocumentItem
  ): string {
  
    if (doc.mimeType) {
      return doc.mimeType;
    }
  
    return this.getMimeType(
      this.getDocumentExtension(doc)
    );
  }

  async shareMedia(
    item: MediaItem,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    if (!item?.url) {
      await this.showToast(
        'Media URL not available'
      );
      return;
    }
  
    if (!this.isCordova()) {
      await this.showToast(
        'Share is available in the Android app'
      );
      return;
    }
  
    try {
  
      this.isDownloading = true;
  
      const extension =
        this.getMediaExtension(item);
  
      const fileName =
        this.sanitizeFileName(
          `SuperAssist_${Date.now()}.${extension}`
        );
  
      const filePath =
        await this.downloadRemoteFile(
          item.url,
          fileName
        );
  
      console.log(
        'SHARE FILE PATH:',
        filePath
      );
  
      const sharePath =
        filePath.startsWith('file://')
          ? filePath
          : `file://${filePath}`;
  
      console.log(
        'SHARE URI:',
        sharePath
      );
  
      await this.socialSharing.share(
        '',
        fileName,
        sharePath,
        undefined
      );
  
    } catch (error: any) {
  
      console.error(
        'SHARE MEDIA ERROR:',
        error
      );
  
      console.error(
        'CODE:',
        error?.code
      );
  
      console.error(
        'MESSAGE:',
        error?.message
      );
  
      await this.showToast(
        'Unable to share file'
      );
  
    } finally {
  
      this.isDownloading = false;
  
    }
  }

  async openMediaOptions(
    item: MediaItem,
    index: number,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    const buttons: any[] = [];
  
    if (item.type === 'image' ||
        item.type === 'video' ||
        item.type === 'audio') {
  
      buttons.push({
        text: 'Download',
        icon: 'download-outline',
        handler: () => {
          this.downloadMedia(item);
        }
      });
  
      // buttons.push({
      //   text: 'Share',
      //   icon: 'share-social-outline',
      //   handler: () => {
      //     this.shareMedia(item);
      //   }
      // });
    }
  
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });
  
    const actionSheet =
      await this.actionSheetController.create({
  
        header:
          item.type === 'video'
            ? 'Video'
            : item.type === 'image'
              ? 'Image'
              : 'Audio',
  
        buttons
  
      });
  
    await actionSheet.present();
  }

  async openDocumentOptions(
    doc: DocumentItem,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    const buttons: any[] = [
  
      {
        text: 'Open',
        icon: 'open-outline',
        handler: () => {
          this.openDocument(doc);
        }
      },
  
      {
        text: 'Download',
        icon: 'download-outline',
        handler: () => {
          this.downloadDocument(doc);
        }
      },
  
      // {
      //   text: 'Share',
      //   icon: 'share-social-outline',
      //   handler: () => {
      //     this.shareDocument(doc);
      //   }
      // },
  
      {
        text: 'Cancel',
        role: 'cancel'
      }
  
    ];
  
    const actionSheet =
      await this.actionSheetController.create({
  
        header: doc.name,
  
        buttons
  
      });
  
    await actionSheet.present();
  }

  async shareDocument(
    doc: DocumentItem,
    event?: Event
  ): Promise<void> {
  
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    if (!doc?.fileUrl) {
      await this.showToast(
        'Document URL not available'
      );
      return;
    }
  
    if (!this.isCordova()) {
      await this.showToast(
        'Share is available in the Android app'
      );
      return;
    }
  
    try {
  
      this.isDownloading = true;
  
      const extension =
        this.getDocumentExtension(doc);
  
      let fileName =
        doc.name ||
        `document_${Date.now()}`;
  
      fileName =
        this.ensureExtension(
          fileName,
          extension
        );
  
      fileName =
        this.sanitizeFileName(fileName);
  
      const filePath =
        await this.downloadRemoteFile(
          doc.fileUrl,
          fileName
        );
  
      console.log(
        'DOCUMENT SHARE PATH:',
        filePath
      );
  
      const sharePath =
        filePath.startsWith('file://')
          ? filePath
          : `file://${filePath}`;
  
      const mimeType =
        this.getDocumentMimeType(doc);
  
      await this.socialSharing.share(
        '',
        fileName,
        sharePath,
        undefined
      );
  
    } catch (error: any) {
  
      console.error(
        'SHARE DOCUMENT ERROR:',
        error
      );
  
      console.error(
        'CODE:',
        error?.code
      );
  
      console.error(
        'MESSAGE:',
        error?.message
      );
  
      await this.showToast(
        'Unable to share file'
      );
  
    } finally {
  
      this.isDownloading = false;
  
    }
  }

  private getMediaExtension(
    item: MediaItem
  ): string {
  
    const url =
      (item.url || '').split('?')[0].toLowerCase();
  
    // Get extension from actual URL
    const urlExtension =
      url.substring(
        url.lastIndexOf('.') + 1
      );
  
    if (
      ['mp4', 'webm', 'mov', 'm4v', '3gp', 'avi']
        .includes(urlExtension)
    ) {
      return urlExtension;
    }
  
    if (item.type === 'video') {
      return 'mp4';
    }
  
    if (item.type === 'audio') {
  
      if (['wav', 'ogg', 'm4a'].includes(urlExtension)) {
        return urlExtension;
      }
  
      return 'mp3';
    }
  
    if (
      ['png', 'webp', 'gif', 'jpeg', 'jpg']
        .includes(urlExtension)
    ) {
      return urlExtension === 'jpeg'
        ? 'jpg'
        : urlExtension;
    }
  
    return 'jpg';
  }

  private async showToast(
    message: string
  ): Promise<void> {
  
    const toast =
      await this.toastController.create({
  
        message,
  
        duration: 2500,
  
        position: 'bottom'
  
      });
  
    await toast.present();
  }

  private getMimeType(type: string): string {

    if (!type) {
      return 'application/octet-stream';
    }
  
    switch (type.toLowerCase()) {
  
      case 'pdf':
        return 'application/pdf';
  
      case 'doc':
        return 'application/msword';
  
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
      case 'xls':
        return 'application/vnd.ms-excel';
  
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
  
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  
      case 'txt':
        return 'text/plain';
  
      case 'csv':
        return 'text/csv';
  
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
  
      case 'png':
        return 'image/png';
  
      case 'webp':
        return 'image/webp';
  
      case 'gif':
        return 'image/gif';
  
      case 'mp4':
        return 'video/mp4';
  
      case 'webm':
        return 'video/webm';
  
      case 'mov':
        return 'video/quicktime';
  
      case 'mp3':
        return 'audio/mpeg';
  
      case 'wav':
        return 'audio/wav';
  
      default:
        return 'application/octet-stream';
    }
  }

  private async showOpenFileOptions(
    filePath: string,
    fileName: string,
    mimeType: string
  ): Promise<void> {
  
    const alert =
      await this.alertController.create({
  
        header: 'File Downloaded',
  
        message:
          `${fileName} has been saved to ` +
          `Download/Super Assist/.`,
  
        buttons: [
  
          {
            text: 'Share',
  
            handler: async () => {
  
              try {
  
                await this.socialSharing.share(
                  '',
                  fileName,
                  filePath
                );
  
              } catch (error) {
  
                console.error(
                  'Share failed:',
                  error
                );
  
              }
  
            }
  
          },
  
          {
            text: 'OK',
            role: 'cancel'
          }
  
        ]
  
      });
  
    await alert.present();
  }

  private setMedia(): void {
    this.mediaItems = (this.data.media || [])
      .filter((item: any) =>
        ['image', 'video', 'audio'].includes(item.type)
      )
      .map((item: any) => ({
        type: item.type,
        url: item.url,
        created_at: item.created_at,
        date: item.created_at
      }));
  }

  private setLinks(): void {
    this.links = (this.data.links || []).map((link: any) => ({
      text: link.text,
      created_at: link.created_at,
      selected: false
    }));
  }

  // =========================================================
  // TABS
  // =========================================================

  switchTab(tab: 'documents' | 'media' | 'links'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.searchOpen = false;
  }

  goBack(): void {
    this.router.navigate(['/contact-detail']);
  }

  // =========================================================
  // SEARCH
  // =========================================================

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;

    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  get filteredDocuments(): DocumentItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    if (!q) return this.documents;

    return this.documents.filter(doc =>
      doc.name.toLowerCase().includes(q) ||
      doc.type.toLowerCase().includes(q)
    );
  }

  get filteredMedia(): { item: MediaItem; index: number }[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.mediaItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        !q ||
        item.type.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q)
      );
  }

  get filteredLinks(): LinkItem[] {
    const q = this.searchQuery.trim().toLowerCase();

    if (!q) return this.links;

    return this.links.filter(link =>
      link.text.toLowerCase().includes(q)
    );
  }

  // =========================================================
  // SELECTION
  // =========================================================

  toggleDocSelection(doc: DocumentItem): void {
    const selected = doc.selected;

    this.documents.forEach(item => item.selected = false);

    doc.selected = !selected;
  }

  toggleLinkSelection(link: LinkItem): void {
    const selected = link.selected;

    this.links.forEach(item => item.selected = false);

    link.selected = !selected;
  }

  // =========================================================
  // DOCUMENT OPTIONS POPUP
  // =========================================================

  async openDocumentActions(
    doc: DocumentItem,
    event?: Event
  ): Promise<void> {

    event?.preventDefault();
    event?.stopPropagation();

    const buttons: any[] = [];

    // PDF gets OPEN option
    if (this.isPdf(doc)) {

      // buttons.push({
      //   text: 'Open',
      //   icon: 'document-outline',

      //   handler: () => {
      //     void this.openDocument(doc);
      //   }
      // });

    }

    // DOWNLOAD
    buttons.push({
      text: 'Download',
      icon: 'download-outline',

      handler: () => {
        void this.downloadDocument(doc);
      }
    });

    // SHARE
    // buttons.push({
    //   text: 'Share',
    //   icon: 'share-social-outline',

    //   handler: () => {
    //     void this.shareDocument(doc);
    //   }
    // });

    // CANCEL
    buttons.push({
      text: 'Cancel',
      role: 'cancel'
    });

    const sheet =
      await this.actionSheetController.create({
        header: doc.name,
        buttons
      });

    await sheet.present();
  }

  // =========================================================
  // MEDIA OPTIONS POPUP
  // =========================================================

  async openMediaActions(
    media: MediaItem,
    event?: Event
  ): Promise<void> {

    event?.preventDefault();
    event?.stopPropagation();

    const sheet =
      await this.actionSheetController.create({
        header: this.getMediaLabel(media),

        buttons: [

          {
            text: 'Download',
            icon: 'download-outline',

            handler: () => {
              void this.downloadMedia(media);
            }
          },

          // {
          //   text: 'Share',
          //   icon: 'share-social-outline',

          //   handler: () => {
          //     void this.shareMedia(media);
          //   }
          // },

          {
            text: 'Cancel',
            role: 'cancel'
          }

        ]
      });

    await sheet.present();
  }


  // =========================================================
  // MEDIA LABEL
  // =========================================================

  private getMediaLabel(
    media: MediaItem
  ): string {

    const fileName =
      this.getFileNameFromUrl(
        media.url
      );

    return (
      fileName ||
      media.type
        .charAt(0)
        .toUpperCase() +
      media.type.slice(1)
    );
  }

  // =========================================================
  // FILE NAME FROM URL
  // =========================================================

  private getFileNameFromUrl(
    url: string
  ): string {

    try {

      const cleanUrl =
        url
          .split('?')[0]
          .split('#')[0];

      const lastPart =
        cleanUrl.substring(
          cleanUrl.lastIndexOf('/') + 1
        );

      return decodeURIComponent(
        lastPart || ''
      );

    } catch {

      return '';
    }
  }

  private ensureExtension(
    fileName: string,
    extension: string
  ): string {
  
    const lower =
      fileName.toLowerCase();
  
    const required =
      `.${extension.toLowerCase()}`;
  
    if (lower.endsWith(required)) {
      return fileName;
    }
  
    return `${fileName}${required}`;
  }

  // =========================================================
  // PDF CHECK
  // =========================================================

  private isPdf(
    doc: DocumentItem
  ): boolean {

    return (
      doc.type?.toLowerCase() === 'pdf' ||
      doc.mimeType?.toLowerCase() ===
        'application/pdf'
    );
  }

  // =========================================================
  // LINKS
  // =========================================================

  onLinkClick(event: Event): void {
    event.stopPropagation();
  }

  // =========================================================
  // LIGHTBOX / MEDIA VIEWER
  // =========================================================

  openLightbox(index: number): void {

    this.currentMediaIndex = index;

    this.zoomLevel = 1;

    this.lightboxOpen = true;

    this.touchStartX = 0;

    this.touchStartY = 0;

    this.suppressNextImageClick = false;

    document.body.style.overflow =
      'hidden';

    setTimeout(() => {

      this.playCurrentMedia();

    }, 100);
  }

  closeLightbox(): void {

    this.stopCurrentMedia();

    this.lightboxOpen = false;

    this.zoomLevel = 1;

    document.body.style.overflow = '';
  }

  nextMedia(): void {

    this.stopCurrentMedia();

    this.zoomLevel = 1;

    this.currentMediaIndex =
      (
        this.currentMediaIndex + 1
      ) %
      this.mediaItems.length;

    setTimeout(
      () => this.playCurrentMedia(),
      100
    );
  }

  prevMedia(): void {

    this.stopCurrentMedia();

    this.zoomLevel = 1;

    this.currentMediaIndex =
      (
        this.currentMediaIndex -
        1 +
        this.mediaItems.length
      ) %
      this.mediaItems.length;

    setTimeout(
      () => this.playCurrentMedia(),
      100
    );
  }

  // =========================================================
  // VIDEO / AUDIO PLAYBACK
  // =========================================================

  playCurrentMedia(): void {

    const media =
      this.mediaItems[
        this.currentMediaIndex
      ];

    if (!media) {
      return;
    }

    const element =
      document.getElementById(
        'mediaPlayer'
      ) as
        | HTMLVideoElement
        | HTMLAudioElement
        | null;

    if (!element) {
      return;
    }

    element.play()
      .catch(error => {

        console.log(
          'Autoplay prevented:',
          error
        );

      });
  }

  pauseCurrentMedia(): void {

    const element =
      document.getElementById(
        'mediaPlayer'
      ) as
        | HTMLVideoElement
        | HTMLAudioElement
        | null;

    if (element) {
      element.pause();
    }
  }

  stopCurrentMedia(): void {

    const element =
      document.getElementById(
        'mediaPlayer'
      ) as
        | HTMLVideoElement
        | HTMLAudioElement
        | null;

    if (!element) {
      return;
    }

    element.pause();

    element.currentTime = 0;
  }

  // =========================================================
  // IMAGE ZOOM
  // =========================================================

  toggleZoom(): void {

    if (this.suppressNextImageClick) {

      this.suppressNextImageClick = false;

      return;
    }

    this.zoomLevel =
      this.zoomLevel === 1
        ? 2
        : 1;
  }

  // =========================================================
  // MOBILE SWIPE
  // =========================================================

  onLightboxTouchStart(
    event: TouchEvent
  ): void {

    if (
      !event.changedTouches?.length
    ) {
      return;
    }

    const touch =
      event.changedTouches[0];

    this.touchStartX =
      touch.clientX;

    this.touchStartY =
      touch.clientY;
  }

  onLightboxTouchEnd(
    event: TouchEvent
  ): void {

    if (
      !event.changedTouches?.length
    ) {
      return;
    }

    const touch =
      event.changedTouches[0];

    const deltaX =
      touch.clientX -
      this.touchStartX;

    const deltaY =
      touch.clientY -
      this.touchStartY;

    const horizontal =
      Math.abs(deltaX);

    const vertical =
      Math.abs(deltaY);

    if (
      horizontal < 50 ||
      horizontal <= vertical
    ) {
      return;
    }

    this.suppressNextImageClick = true;

    if (deltaX < 0) {

      this.nextMedia();

    } else {

      this.prevMedia();

    }

    setTimeout(() => {

      this.suppressNextImageClick =
        false;

    }, 0);
  }

  // =========================================================
  // KEYBOARD
  // =========================================================

  @HostListener(
    'window:keydown',
    ['$event']
  )
  handleKeyboardEvent(
    event: KeyboardEvent
  ): void {

    if (!this.lightboxOpen) {
      return;
    }

    if (event.key === 'ArrowRight') {

      event.preventDefault();

      this.nextMedia();
    }

    if (event.key === 'ArrowLeft') {

      event.preventDefault();

      this.prevMedia();
    }

    if (event.key === 'Escape') {

      event.preventDefault();

      this.closeLightbox();
    }
  }

  // =========================================================
  // UTILITY
  // =========================================================

  getDomain(
    text: string
  ): string {

    try {

      const url =
        text.startsWith('http')
          ? text
          : `https://${text}`;

      return new URL(url).hostname;

    } catch {

      return 'Link';
    }
  }

  navigateTo(
    destination: string
  ): void {

    this.router.navigate([
      `/${destination}`
    ]);
  }
}
// import { Component, HostListener, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';

// interface DocumentItem {
//   name: string;
//   type: string;
//   selected: boolean;
//   fileUrl?: string;
//   mimeType?: string;
// }

// interface MediaItem {
//   type: 'image' | 'video' | 'audio';
//   url: string;
//   created_at: string;
//   date: string;
//   duration?: string;
// }

// interface LinkItem {
//   text: string;
//   created_at: string;
//   selected: boolean;
// }

// @Component({
//   selector: 'app-media-details',
//   templateUrl: './media-details.page.html',
//   styleUrls: ['./media-details.page.scss'],
//   standalone: false
// })
// export class MediaDetailsPage implements OnInit {

//   activeTab: 'documents' | 'media' | 'links' = 'media';

//   searchOpen = false;
//   searchQuery = '';

//   data: any = null;

//   documents: DocumentItem[] = [];
//   mediaItems: MediaItem[] = [];
//   links: LinkItem[] = [];

//   lightboxOpen = false;
//   currentMediaIndex = 0;
//   zoomLevel = 1;

//   private touchStartX = 0;
//   private touchStartY = 0;
//   private suppressNextImageClick = false;

//   constructor(
//     private router: Router,
//     private activatedRoute: ActivatedRoute
//   ) {}

//   ngOnInit(): void {
//     this.activatedRoute.queryParams.subscribe(params => {
//       if (!params['data']) return;

//       try {
//         this.data = JSON.parse(params['data']);

//         this.setDocuments();
//         this.setMedia();
//         this.setLinks();

//         console.log('Media Details:', this.data);
//       } catch (error) {
//         console.error('Error parsing data:', error);
//       }
//     });
//   }

//   setVideoDuration(
//   item: MediaItem,
//   event: Event
// ): void {

//   const video = event.target as HTMLVideoElement;

//   if (!video.duration || !isFinite(video.duration)) {
//     return;
//   }

//   const totalSeconds = Math.floor(video.duration);

//   const minutes = Math.floor(totalSeconds / 60);
//   const seconds = totalSeconds % 60;

//   item.duration =
//     `${minutes}:${seconds.toString().padStart(2, '0')}`;
// }

//   // =========================================================
//   // DATA
//   // =========================================================

//   private setDocuments(): void {
//     this.documents = (this.data.documents || []).map((doc: any) => ({
//       name: this.getDocumentName(doc.url, doc.mime_type),
//       type: this.getDocumentType(doc.url, doc.mime_type),
//       selected: false,
//       fileUrl: doc.url,
//       mimeType: doc.mime_type
//     }));
//   }

//   private setMedia(): void {
//     this.mediaItems = (this.data.media || [])
//       .filter((item: any) =>
//         ['image', 'video', 'audio'].includes(item.type)
//       )
//       .map((item: any) => ({
//         type: item.type,
//         url: item.url,
//         created_at: item.created_at,
//         date: item.created_at
//       }));
//   }

//   private setLinks(): void {
//     this.links = (this.data.links || []).map((link: any) => ({
//       text: link.text,
//       created_at: link.created_at,
//       selected: false
//     }));
//   }

//   // =========================================================
//   // TABS
//   // =========================================================

//   switchTab(tab: 'documents' | 'media' | 'links'): void {
//     this.activeTab = tab;
//     this.searchQuery = '';
//     this.searchOpen = false;
//   }

//   goBack(): void {
//     this.router.navigate(['/contact-detail']);
//   }

//   // =========================================================
//   // SEARCH
//   // =========================================================

//   toggleSearch(): void {
//     this.searchOpen = !this.searchOpen;

//     if (!this.searchOpen) {
//       this.searchQuery = '';
//     }
//   }

//   onSearchInput(value: string): void {
//     this.searchQuery = value;
//   }

//   clearSearch(): void {
//     this.searchQuery = '';
//   }

//   get filteredDocuments(): DocumentItem[] {
//     const q = this.searchQuery.trim().toLowerCase();

//     if (!q) return this.documents;

//     return this.documents.filter(doc =>
//       doc.name.toLowerCase().includes(q) ||
//       doc.type.toLowerCase().includes(q)
//     );
//   }

//   get filteredMedia(): { item: MediaItem; index: number }[] {
//     const q = this.searchQuery.trim().toLowerCase();

//     return this.mediaItems
//       .map((item, index) => ({ item, index }))
//       .filter(({ item }) =>
//         !q ||
//         item.type.toLowerCase().includes(q) ||
//         item.url.toLowerCase().includes(q) ||
//         item.date.toLowerCase().includes(q)
//       );
//   }

//   get filteredLinks(): LinkItem[] {
//     const q = this.searchQuery.trim().toLowerCase();

//     if (!q) return this.links;

//     return this.links.filter(link =>
//       link.text.toLowerCase().includes(q)
//     );
//   }

//   // =========================================================
//   // SELECTION
//   // =========================================================

//   toggleDocSelection(doc: DocumentItem): void {
//     const selected = doc.selected;

//     this.documents.forEach(item => item.selected = false);

//     doc.selected = !selected;
//   }

//   toggleLinkSelection(link: LinkItem): void {
//     const selected = link.selected;

//     this.links.forEach(item => item.selected = false);

//     link.selected = !selected;
//   }

//   // =========================================================
//   // DOCUMENT
//   // =========================================================

//   async downloadDocument(
//     doc: DocumentItem,
//     event: Event
//   ): Promise<void> {

//     event.preventDefault();
//     event.stopPropagation();

//     try {
//       const mime = doc.mimeType || this.getMimeType(doc.type);
//       let blob: Blob;

//       if (doc.fileUrl) {
//         const response = await fetch(doc.fileUrl);

//         if (!response.ok) {
//           throw new Error(`Download failed: ${response.status}`);
//         }

//         blob = await response.blob();
//       } else {
//         blob = new Blob(
//           [`Download file: ${doc.name}`],
//           { type: mime }
//         );
//       }

//       const file = new File(
//         [blob],
//         doc.name,
//         {
//           type: mime,
//           lastModified: Date.now()
//         }
//       );

//       const nav = navigator as Navigator & {
//         canShare?: (data?: ShareData) => boolean;
//         share?: (data: ShareData) => Promise<void>;
//       };

//       if (
//         nav.share &&
//         nav.canShare &&
//         nav.canShare({ files: [file] })
//       ) {
//         await nav.share({
//           files: [file],
//           title: doc.name
//         });

//         return;
//       }

//       this.saveBlob(blob, doc.name);

//     } catch (error) {

//       if ((error as Error)?.name === 'AbortError') {
//         return;
//       }

//       console.error('Document download failed:', error);
//       this.saveBlob(
//         new Blob([`Download file: ${doc.name}`]),
//         doc.name
//       );
//     }
//   }

//   private saveBlob(blob: Blob, fileName: string): void {
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');

//     a.href = url;
//     a.download = fileName;
//     a.style.display = 'none';

//     document.body.appendChild(a);
//     a.click();
//     a.remove();

//     setTimeout(() => URL.revokeObjectURL(url), 1000);
//   }

//   private getMimeType(type: string): string {
//     const types: Record<string, string> = {
//       docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       doc: 'application/msword',
//       pdf: 'application/pdf',
//       xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       xls: 'application/vnd.ms-excel',
//       pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//       txt: 'text/plain',
//       csv: 'text/csv',
//       png: 'image/png',
//       jpg: 'image/jpeg',
//       jpeg: 'image/jpeg'
//     };

//     return types[type.toLowerCase()] || 'application/octet-stream';
//   }

//   private getDocumentName(url: string, mimeType: string): string {
//     if (!url) return 'Document';

//     let name = url
//       .split('?')[0]
//       .substring(url.lastIndexOf('/') + 1);

//     if (
//       mimeType === 'application/vnd.ms-excel' &&
//       name.toLowerCase().endsWith('.vnd.ms-excel')
//     ) {
//       name = name.replace(
//         /\.vnd\.ms-excel$/i,
//         '.xls'
//       );
//     }

//     return name || 'Document';
//   }

//   private getDocumentType(url: string, mimeType: string): string {
//     const name = this.getDocumentName(url, mimeType);
//     const extension = name.split('.').pop()?.toLowerCase();

//     if (extension) return extension;

//     switch (mimeType) {
//       case 'application/pdf':
//         return 'pdf';
//       case 'application/vnd.ms-excel':
//         return 'xls';
//       case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
//         return 'xlsx';
//       case 'application/msword':
//         return 'doc';
//       case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
//         return 'docx';
//       default:
//         return mimeType || 'file';
//     }
//   }

//   // =========================================================
//   // LINKS
//   // =========================================================

//   onLinkClick(event: Event): void {
//     event.stopPropagation();
//   }

//   // =========================================================
//   // LIGHTBOX / MEDIA VIEWER
//   // =========================================================

//   openLightbox(index: number): void {
//     this.currentMediaIndex = index;
//     this.zoomLevel = 1;
//     this.lightboxOpen = true;

//     this.touchStartX = 0;
//     this.touchStartY = 0;
//     this.suppressNextImageClick = false;

//     document.body.style.overflow = 'hidden';

//     setTimeout(() => {
//       this.playCurrentMedia();
//     }, 100);
//   }

//   closeLightbox(): void {
//     this.stopCurrentMedia();

//     this.lightboxOpen = false;
//     this.zoomLevel = 1;

//     document.body.style.overflow = '';
//   }

//   nextMedia(): void {
//     this.stopCurrentMedia();

//     this.zoomLevel = 1;

//     this.currentMediaIndex =
//       (this.currentMediaIndex + 1) %
//       this.mediaItems.length;

//     setTimeout(() => this.playCurrentMedia(), 100);
//   }

//   prevMedia(): void {
//     this.stopCurrentMedia();

//     this.zoomLevel = 1;

//     this.currentMediaIndex =
//       (this.currentMediaIndex - 1 + this.mediaItems.length) %
//       this.mediaItems.length;

//     setTimeout(() => this.playCurrentMedia(), 100);
//   }

//   // =========================================================
//   // VIDEO / AUDIO PLAYBACK
//   // =========================================================

//   playCurrentMedia(): void {
//     const media = this.mediaItems[this.currentMediaIndex];

//     if (!media) return;

//     const element = document.getElementById(
//       'mediaPlayer'
//     ) as HTMLVideoElement | HTMLAudioElement | null;

//     if (!element) return;

//     element.play().catch(error => {
//       console.log('Autoplay prevented:', error);
//     });
//   }

//   pauseCurrentMedia(): void {
//     const element = document.getElementById(
//       'mediaPlayer'
//     ) as HTMLVideoElement | HTMLAudioElement | null;

//     if (element) {
//       element.pause();
//     }
//   }

//   stopCurrentMedia(): void {
//     const element = document.getElementById(
//       'mediaPlayer'
//     ) as HTMLVideoElement | HTMLAudioElement | null;

//     if (!element) return;

//     element.pause();
//     element.currentTime = 0;
//   }

//   // =========================================================
//   // IMAGE ZOOM
//   // =========================================================

//   toggleZoom(): void {
//     if (this.suppressNextImageClick) {
//       this.suppressNextImageClick = false;
//       return;
//     }

//     this.zoomLevel = this.zoomLevel === 1 ? 2 : 1;
//   }

//   // =========================================================
//   // MOBILE SWIPE
//   // =========================================================

//   onLightboxTouchStart(event: TouchEvent): void {
//     if (!event.changedTouches?.length) return;

//     const touch = event.changedTouches[0];

//     this.touchStartX = touch.clientX;
//     this.touchStartY = touch.clientY;
//   }

//   onLightboxTouchEnd(event: TouchEvent): void {
//     if (!event.changedTouches?.length) return;

//     const touch = event.changedTouches[0];

//     const deltaX = touch.clientX - this.touchStartX;
//     const deltaY = touch.clientY - this.touchStartY;

//     const horizontal = Math.abs(deltaX);
//     const vertical = Math.abs(deltaY);

//     if (
//       horizontal < 50 ||
//       horizontal <= vertical
//     ) {
//       return;
//     }

//     this.suppressNextImageClick = true;

//     if (deltaX < 0) {
//       this.nextMedia();
//     } else {
//       this.prevMedia();
//     }

//     setTimeout(() => {
//       this.suppressNextImageClick = false;
//     }, 0);
//   }

//   // =========================================================
//   // KEYBOARD
//   // =========================================================

//   @HostListener('window:keydown', ['$event'])
//   handleKeyboardEvent(event: KeyboardEvent): void {
//     if (!this.lightboxOpen) return;

//     if (event.key === 'ArrowRight') {
//       event.preventDefault();
//       this.nextMedia();
//     }

//     if (event.key === 'ArrowLeft') {
//       event.preventDefault();
//       this.prevMedia();
//     }

//     if (event.key === 'Escape') {
//       event.preventDefault();
//       this.closeLightbox();
//     }
//   }

//   // =========================================================
//   // UTILITY
//   // =========================================================

//   getDomain(text: string): string {
//     try {
//       const url = text.startsWith('http')
//         ? text
//         : `https://${text}`;

//       return new URL(url).hostname;
//     } catch {
//       return 'Link';
//     }
//   }

//   navigateTo(destination: string): void {
//     this.router.navigate([`/${destination}`]);
//   }
// }