import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
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
  // DOCUMENT
  // =========================================================

  async downloadDocument(
    doc: DocumentItem,
    event: Event
  ): Promise<void> {

    event.preventDefault();
    event.stopPropagation();

    try {
      const mime = doc.mimeType || this.getMimeType(doc.type);
      let blob: Blob;

      if (doc.fileUrl) {
        const response = await fetch(doc.fileUrl);

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }

        blob = await response.blob();
      } else {
        blob = new Blob(
          [`Download file: ${doc.name}`],
          { type: mime }
        );
      }

      const file = new File(
        [blob],
        doc.name,
        {
          type: mime,
          lastModified: Date.now()
        }
      );

      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };

      if (
        nav.share &&
        nav.canShare &&
        nav.canShare({ files: [file] })
      ) {
        await nav.share({
          files: [file],
          title: doc.name
        });

        return;
      }

      this.saveBlob(blob, doc.name);

    } catch (error) {

      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      console.error('Document download failed:', error);
      this.saveBlob(
        new Blob([`Download file: ${doc.name}`]),
        doc.name
      );
    }
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = fileName;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private getMimeType(type: string): string {
    const types: Record<string, string> = {
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      pdf: 'application/pdf',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg'
    };

    return types[type.toLowerCase()] || 'application/octet-stream';
  }

  private getDocumentName(url: string, mimeType: string): string {
    if (!url) return 'Document';

    let name = url
      .split('?')[0]
      .substring(url.lastIndexOf('/') + 1);

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

  private getDocumentType(url: string, mimeType: string): string {
    const name = this.getDocumentName(url, mimeType);
    const extension = name.split('.').pop()?.toLowerCase();

    if (extension) return extension;

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
      default:
        return mimeType || 'file';
    }
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

    document.body.style.overflow = 'hidden';

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
      (this.currentMediaIndex + 1) %
      this.mediaItems.length;

    setTimeout(() => this.playCurrentMedia(), 100);
  }

  prevMedia(): void {
    this.stopCurrentMedia();

    this.zoomLevel = 1;

    this.currentMediaIndex =
      (this.currentMediaIndex - 1 + this.mediaItems.length) %
      this.mediaItems.length;

    setTimeout(() => this.playCurrentMedia(), 100);
  }

  // =========================================================
  // VIDEO / AUDIO PLAYBACK
  // =========================================================

  playCurrentMedia(): void {
    const media = this.mediaItems[this.currentMediaIndex];

    if (!media) return;

    const element = document.getElementById(
      'mediaPlayer'
    ) as HTMLVideoElement | HTMLAudioElement | null;

    if (!element) return;

    element.play().catch(error => {
      console.log('Autoplay prevented:', error);
    });
  }

  pauseCurrentMedia(): void {
    const element = document.getElementById(
      'mediaPlayer'
    ) as HTMLVideoElement | HTMLAudioElement | null;

    if (element) {
      element.pause();
    }
  }

  stopCurrentMedia(): void {
    const element = document.getElementById(
      'mediaPlayer'
    ) as HTMLVideoElement | HTMLAudioElement | null;

    if (!element) return;

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

    this.zoomLevel = this.zoomLevel === 1 ? 2 : 1;
  }

  // =========================================================
  // MOBILE SWIPE
  // =========================================================

  onLightboxTouchStart(event: TouchEvent): void {
    if (!event.changedTouches?.length) return;

    const touch = event.changedTouches[0];

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onLightboxTouchEnd(event: TouchEvent): void {
    if (!event.changedTouches?.length) return;

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    const horizontal = Math.abs(deltaX);
    const vertical = Math.abs(deltaY);

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
      this.suppressNextImageClick = false;
    }, 0);
  }

  // =========================================================
  // KEYBOARD
  // =========================================================

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;

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

  getDomain(text: string): string {
    try {
      const url = text.startsWith('http')
        ? text
        : `https://${text}`;

      return new URL(url).hostname;
    } catch {
      return 'Link';
    }
  }

  navigateTo(destination: string): void {
    this.router.navigate([`/${destination}`]);
  }
}