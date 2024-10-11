/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EnvironmentInjector,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {forkJoin} from 'rxjs';

import {injectAsync} from '../../../core/services/inject-async';
import {EmbeddedEditor, EmbeddedTutorialManager} from '../../../editor';

@Component({
  selector: 'adev-code-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmbeddedEditor],
  template: `
    <embedded-editor />
  `,
})
export class CodeEditorComponent implements OnInit {
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly embeddedTutorialManager = inject(EmbeddedTutorialManager);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);

  @Input({required: true}) tutorialFiles!: string;

  ngOnInit(): void {
    this.loadEmbeddedEditor();
  }

  private loadEmbeddedEditor() {
    // If using `async-await`, `this` will be captured until the function is executed
    // and completed, which can lead to a memory leak if the user navigates away from
    // this component to another page.
    forkJoin([
      injectAsync(this.environmentInjector, () =>
        import('../../../editor/index').then((c) => c.NodeRuntimeSandbox),
      ),
      this.embeddedTutorialManager.fetchAndSetTutorialFiles(this.tutorialFiles),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([nodeRuntimeSandbox]) => {
        this.cdRef.markForCheck();
        nodeRuntimeSandbox.init();
      });
  }
}
