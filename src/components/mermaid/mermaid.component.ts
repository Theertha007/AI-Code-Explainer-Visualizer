import {
  Component,
  ChangeDetectionStrategy,
  input,
  effect,
  ElementRef,
  AfterViewInit,
  ViewChild
} from '@angular/core';

// This tells TypeScript that a 'mermaid' object exists globally, provided by the script tag in index.html.
declare var mermaid: any;

@Component({
  selector: 'app-mermaid',
  standalone: true,
  template: `<div #container class="w-full h-full mermaid-container"></div>`,
  styles: `
    .mermaid-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    :host ::ng-deep svg {
      max-width: 100%;
      height: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MermaidComponent implements AfterViewInit {
  graph = input.required<string>();
  
  @ViewChild('container') private container!: ElementRef<HTMLDivElement>;
  private isViewReady = false;

  constructor() {
    effect(() => {
      // Re-render whenever the graph input changes, but only after the view is ready.
      if (this.isViewReady) {
        this.renderDiagram(this.graph());
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Initialize Mermaid once the component's view is ready.
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'sans-serif',
      flowchart: {
        useMaxWidth: true,
      }
    });
    this.isViewReady = true;
    // Perform the initial render after the view and mermaid are ready.
    this.renderDiagram(this.graph());
  }

  private async renderDiagram(graphDefinition: string): Promise<void> {
    const containerElement = this.container.nativeElement;

    if (!graphDefinition?.trim()) {
      containerElement.innerHTML = '<p class="text-gray-500">No flowchart to display.</p>';
      return;
    }

    try {
      // Use a unique ID to prevent mermaid from complaining about duplicate IDs on re-render.
      const uniqueId = `mermaid-graph-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, graphDefinition);
      containerElement.innerHTML = svg;
    } catch (e) {
      console.error('Error rendering Mermaid diagram:', e);
      // Provide a more user-friendly error message in the UI.
      containerElement.innerHTML = `
        <div class="text-center text-red-400 p-4">
          <p class="font-bold">Could not render flowchart.</p>
          <p class="text-sm text-red-500 mt-1">The AI may have generated invalid diagram syntax.</p>
        </div>
      `;
    }
  }
}
