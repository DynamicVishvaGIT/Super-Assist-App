import {
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { File } from '@awesome-cordova-plugins/file/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'assets/pdf.worker.min.mjs';


@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.page.html',
  styleUrls: ['./pdf-viewer.page.scss'],
  standalone: false
})
export class PdfViewerPage implements OnInit {


  backButtonSub!: Subscription;
  @ViewChild('pdfContainer', { static: false })
  pdfContainer!: ElementRef<HTMLDivElement>;

  loading = true;

  errorMessage = '';

  pdfUrl = '';
  fileName = 'PDF';
  private resizeTimeout: any;

  constructor(
    private route: ActivatedRoute,private platform: Platform,
    private file: File,private location: Location,
    private fileTransfer: FileTransfer
  ) {}


  ngOnInit(): void {

    this.pdfUrl =
      this.route.snapshot.queryParamMap.get('url') || '';

      this.fileName = this.getFileName(this.pdfUrl);

    console.log(
      'PDF URL:',
      this.pdfUrl
    );

    if (!this.pdfUrl) {

      this.loading = false;

      this.errorMessage =
        'PDF URL is missing';

      return;
    }

    setTimeout(() => {

      void this.loadPdf();

    }, 300);
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.goBack();
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  private getFileName(
    url: string
  ): string {
  
    try {
  
      const cleanUrl =
        url.split('?')[0];
  
      const name =
        decodeURIComponent(
          cleanUrl.substring(
            cleanUrl.lastIndexOf('/') + 1
          )
        );
  
      return name || 'PDF';
  
    } catch {
  
      return 'PDF';
  
    }
  }

  ngOnDestroy(): void {

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  
  }


  async loadPdf(): Promise<void> {

    try {
  
      this.loading = true;
      this.errorMessage = '';
  
      console.log('=================================');
      console.log('PDF URL:', this.pdfUrl);
      console.log('Starting native PDF download...');
      console.log('=================================');
  
  
      const fileName =
        'document_' +
        Date.now() +
        '.pdf';
  
  
      const targetPath =
        this.file.cacheDirectory + fileName;
  
  
      console.log(
        'Target path:',
        targetPath
      );
  
  
      const transfer =
        this.fileTransfer.create();
  
  
      // Native Android download
      const entry =
        await transfer.download(
          this.pdfUrl,
          targetPath,
          true
        );
  
  
      // alert(
      //   'PDF downloaded successfully'
      // );
  
      console.log(
        'Local file:',
        entry.toURL()
      );
  
  
      // ----------------------------------
      // Read PDF from local filesystem
      // ----------------------------------
  
      const pdfData =
        await this.file.readAsArrayBuffer(
          this.file.cacheDirectory,
          fileName
        );
  
  
      console.log(
        'PDF byte size:',
        pdfData.byteLength
      );
  
  
      if (
        !pdfData ||
        pdfData.byteLength === 0
      ) {
  
        throw new Error(
          'Downloaded PDF is empty'
        );
      }
  
  
      // ----------------------------------
      // Render PDF
      // ----------------------------------
  
      await this.renderPdf(
        pdfData
      );
  
  
      this.loading = false;
  
  
    } catch (error: any) {
  
      console.error(
        '================================='
      );
  
      console.error(
        'PDF ERROR:',
        error
      );
  
      console.error(
        'Error message:',
        error?.message
      );
  
      console.error(
        'Error code:',
        error?.code
      );
  
      console.error(
        'HTTP status:',
        error?.http_status
      );
  
      console.error(
        '================================='
      );
  
  
      this.loading = false;
  
  
      this.errorMessage =
        'Unable to open PDF. ' +
        'Please try again.';
    }
  }


  private getPdfErrorMessage(
    error: any
  ): string {

    console.error(
      'Detailed PDF error:',
      JSON.stringify(
        error,
        Object.getOwnPropertyNames(error)
      )
    );


    if (
      error?.status === 0
    ) {

      return (
        'Unable to download PDF. ' +
        'Please check the internet connection ' +
        'or server access.'
      );
    }


    if (
      error?.status
    ) {

      return (
        'PDF download failed. ' +
        'HTTP status: ' +
        error.status
      );
    }


    if (
      error?.message
    ) {

      return error.message;
    }


    return 'Unable to open PDF';
  }


  async renderPdf(
    arrayBuffer: ArrayBuffer
  ): Promise<void> {
  
    console.log('Starting PDF.js rendering...');
  
    const loadingTask =
      pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer)
      });
  
    const pdf =
      await loadingTask.promise;
  
    console.log(
      'PDF pages:',
      pdf.numPages
    );
  
    const container =
      this.pdfContainer.nativeElement;
  
    container.innerHTML = '';
  
  
    // ----------------------------------------
    // Get available screen width
    // ----------------------------------------
  
    const containerWidth =
      container.clientWidth;
  
    const horizontalPadding = 20;
  
    const availableWidth =
      containerWidth - horizontalPadding;
  
  
    console.log(
      'Container width:',
      containerWidth
    );
  
    console.log(
      'Available PDF width:',
      availableWidth
    );
  
  
    // ----------------------------------------
    // Render each page
    // ----------------------------------------
  
    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
  
      console.log(
        `Rendering page ${pageNumber}`
      );
  
  
      const page =
        await pdf.getPage(
          pageNumber
        );
  
  
      // Get original page size
      const originalViewport =
        page.getViewport({
          scale: 1
        });
  
  
      // ----------------------------------------
      // Calculate scale dynamically
      // ----------------------------------------
  
      const scale =
        availableWidth /
        originalViewport.width;
  
  
      console.log(
        'Calculated scale:',
        scale
      );
  
  
      // Create final viewport
      const viewport =
        page.getViewport({
          scale: scale
        });
  
  
      // ----------------------------------------
      // Wrapper
      // ----------------------------------------
  
      const pageWrapper =
        document.createElement(
          'div'
        );
  
      pageWrapper.className =
        'pdf-page-wrapper';
  
  
      // ----------------------------------------
      // Canvas
      // ----------------------------------------
  
      const canvas =
        document.createElement(
          'canvas'
        );
  
  
      canvas.className =
        'pdf-page';
  
  
      canvas.width =
        Math.floor(
          viewport.width
        );
  
  
      canvas.height =
        Math.floor(
          viewport.height
        );
  
  
      pageWrapper.appendChild(
        canvas
      );
  
  
      container.appendChild(
        pageWrapper
      );
  
  
      // ----------------------------------------
      // Render
      // ----------------------------------------
  
      await page.render({
  
        canvas: canvas,
  
        viewport: viewport
  
      }).promise;
  
  
      console.log(
        `Page ${pageNumber} rendered`
      );
    }
  
  
    console.log(
      'PDF rendering completed'
    );
  }

  goBack(): void {
    this.location.back();
  }
}