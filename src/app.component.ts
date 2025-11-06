import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, AnalysisResult } from './services/gemini.service';
import { MermaidComponent } from './components/mermaid/mermaid.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var marked: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, MermaidComponent],
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  // Default Python code example
  private readonly defaultCode = `def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

def main():
    num = 5
    result = factorial(num)
    print(f"The factorial of {num} is {result}")

main()`;

  code = signal<string>(this.defaultCode);
  analysisResult = signal<AnalysisResult | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  explanationHtml = computed<SafeHtml | null>(() => {
    const result = this.analysisResult();
    if (!result?.explanation) {
      return null;
    }

    if (typeof marked?.parse === 'function') {
      const unsafeHtml = marked.parse(result.explanation, { gfm: true, breaks: true });
      return this.sanitizer.bypassSecurityTrustHtml(unsafeHtml);
    }
    
    // Fallback to pre-formatted plain text if marked is not available
    const pre = document.createElement('pre');
    pre.className = 'whitespace-pre-wrap font-sans'; // Match prose styling
    pre.textContent = result.explanation;
    return this.sanitizer.bypassSecurityTrustHtml(pre.outerHTML);
  });

  async analyzeCode(): Promise<void> {
    if (!this.code().trim() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    try {
      const result = await this.geminiService.analyzeCode(this.code());
      this.analysisResult.set(result);
    } catch (e) {
      console.error('Analysis failed:', e);
      this.error.set('Failed to analyze the code. The AI model might be unavailable or the response was invalid.');
    } finally {
      this.isLoading.set(false);
    }
  }

  handleTab(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;

      target.value = value.substring(0, start) + '  ' + value.substring(end);
      target.selectionStart = target.selectionEnd = start + 2;
      this.code.set(target.value);
    }
  }
}
