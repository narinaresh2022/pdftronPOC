import { Component, ViewChild, OnInit, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import WebViewer, { Core, WebViewerInstance } from '@pdftron/webviewer';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { Inject }  from '@angular/core';
import { DOCUMENT } from '@angular/common'; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer') viewer: ElementRef;
  wvInstance: WebViewerInstance;
  @Output() coreControlsEvent:EventEmitter<string> = new EventEmitter(); 

  private documentLoaded$: Subject<void>;

  constructor(@Inject(DOCUMENT) document: Document) {
    this.documentLoaded$ = new Subject<void>();
  }

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
     // initialDoc: 'https://localhost:44313/api/file'
     //// initialDoc: 'https://s3.amazonaws.com/pdftron/downloads/pl/2gb-sample-file.pdf'
      initialDoc: '../files/V3S Aggrement.pdf'
      //initialDoc: '../files/1001_Original.pdf',
      ,enableRedaction: true
      ,fullAPI:true
      
    }, this.viewer.nativeElement).then(instance => {
      this.wvInstance = instance;

      this.coreControlsEvent.emit(instance.UI.LayoutMode.Single);

      const { documentViewer, annotationManager, Annotations  } = instance.Core;

      instance.UI.setHeaderItems(header => {
        header.push({
          type: 'actionButton',
          img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
          onClick: () => {
            debugger;
            // save the annotations
            annotationManager.exportAnnotations({ links: false, widgets: false }).then(xfdfString => {
              // fetch('path/to/annotation/server', {
              //   method: 'POST',
              //   body: xfdfString // written into an XFDF file in server
              // });
              // Full samples are available at the end of this section.
              console.log('xfdfString',xfdfString);
            })
          }
        });
      })


      instance.UI.openElements(['notesPanel']);

      documentViewer.addEventListener('documentLoaded', () => {

     
      var math = instance.Core.Math;
      const redactAnnot1 = new Annotations.RedactionAnnotation({
          PageNumber: 1,
          Rect: new math.Rect(100, 100, 300, 200),// Rect are in the form x1,y1,x2,y2,
          FillColor: new Annotations.Color(197, 68, 206),
          OverlayText: "Test",
          TextColor: new Annotations.Color(228, 66, 52),
          TextAlign : "Center"
         
      });

      redactAnnot1.Color = new Annotations.Color(197, 68, 206);
      redactAnnot1.StrokeColor = new Annotations.Color(197, 68, 206);
      redactAnnot1.Font = "44pt";
  

      // const redactAnnot2 = new Annotations.RedactionAnnotation({
      //     PageNumber: 1,
      //     StrokeColor: new Annotations.Color(0, 255, 0),
      //     FillColor: new Annotations.Color(0, 0, 255),
      //     Quads: [
      //         // Quads are in the form x1,y1,x2,y2,x3,y3,x4,y4
      //         new math.Quad(100, 290, 300, 210, 300, 210, 100, 290),
      //         new math.Quad(100, 390, 300, 310, 300, 310, 100, 390)
      //     ]
      // });

      // can still create redactions without options and set them afterward
      // const redactAnnot3 = new Annotations.RedactionAnnotation();
      // redactAnnot3.PageNumber = 1;
      // // using 'setRect' instead of setting 'X','Y','Width', or 'Height' directly
      // redactAnnot3.setRect(new math.Rect(100, 100, 300, 200));
      // // set border color
      // redactAnnot3.StrokeColor = new Annotations.Color(0, 255, 0);
      // // set redacted color
      // redactAnnot3.FillColor = new Annotations.Color(0, 0, 255);

      const redactAnnotations = [redactAnnot1];// redactAnnot2, redactAnnot3];

       annotationManager.addAnnotation(redactAnnotations);

       annotationManager.drawAnnotationsFromList(redactAnnotations);

         documentViewer.getAnnotationManager().applyRedactions();
       
     

      this.documentLoaded$.next();        
      });

      // Bind Annotations fron DB
      documentViewer.setDocumentXFDFRetriever(async () => {
        // load the annotation data
        const response = await fetch('https://localhost:44313/api/Annotation');
        const xfdfString = await response.text();
        return xfdfString;
      });

      // Save Annotations to DB
      // annotationManager.exportAnnotations({ links: false, widgets: false }).then(xfdfString => {
      //   // fetch('path/to/annotation/server', {
      //   //   method: 'POST',
      //   //   body: xfdfString // written into an XFDF file in server
      //   // });
      //   // Full samples are available at the end of this section.
      //   console.log('xfdfString',xfdfString);
      // })
       
      //Save redaction to DB
      annotationManager.addEventListener('annotationChanged', (annotations, action) => {
        if (annotations.length > 0 && action === 'delete') {
          annotations.forEach((annot) => {
            debugger;
            let annotForSave = {
              height: annot.Height,
              width: annot.Width,
              x : annot.X,
              y: annot.Y,
              pageNumber : annot.PageNumber,
              overlayText : annot.OverlayText,
              fontSize: annot.FontSize,
              textColor : annot.TextColor,
              fillColor:{'R':annot.Ij.R,'G':annot.Ij.G,'B':annot.Ij.B,'A':annot.Ij.A}
            }
            console.log('annotJson', annot);
            console.log('annotForSave', annotForSave);
          });
        }
      })

      // annotationManager.addEventListener('annotationChanged', (annotations, action) => {
      //   if (action === 'add') {
      //     console.log('this is a change that added annotations');
      //   } else if (action === 'modify') {
      //     console.log('this change modified annotations');
      //   } else if (action === 'delete') {
      //     console.log('there were annotations deleted');
      //   }
  
      //   annotations.forEach((annot) => {
      //     console.log('annotation page number', annot.PageNumber);
      //     console.log('annotation Height', annot.Height);
      //   });
      // });

      
         
     })

    
     
  }

  

  ngOnInit() {
  }

  getDocumentLoadedObservable() {
    return this.documentLoaded$.asObservable();
  }
}
