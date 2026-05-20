import { CommonModule } from '@angular/common';
import { Component, OnChanges, SimpleChanges, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface EntityFormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required?: boolean;
  min?: number;
  readonly?: boolean;
  options?: EntityFormOption[];
}

export interface EntityFormOption {
  label: string;
  value: string | number | boolean;
}

@Component({
  selector: 'app-entity-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './entity-form.html',
  styleUrl: './entity-form.css',
})
export class EntityForm implements OnChanges {
  readonly title = input('');
  readonly fields = input<EntityFormField[]>([]);
  readonly initialValues = input<Record<string, unknown>>({});
  readonly saving = input(false);
  readonly cancel = output<void>();
  readonly save = output<Record<string, unknown>>();

  readonly values = signal<Record<string, unknown>>({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValues'] || changes['fields']) {
      this.values.set(this.normalizeValues());
    }
  }

  setValue(key: string, value: unknown): void {
    this.values.update((current) => ({ ...current, [key]: value }));
  }

  submit(): void {
    this.save.emit(this.values());
  }

  private normalizeValues(): Record<string, unknown> {
    const source = this.initialValues();
    const normalized: Record<string, unknown> = { ...source };

    for (const field of this.fields()) {
      if (field.key in normalized) {
        continue;
      }

      const matchedKey = Object.keys(source).find(
        (key) => key.toLowerCase() === field.key.toLowerCase(),
      );

      if (matchedKey) {
        normalized[field.key] = source[matchedKey];
      }
    }

    return normalized;
  }
}
