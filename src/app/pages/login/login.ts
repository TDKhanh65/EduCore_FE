import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { API_ENDPOINT } from '@constants/api-endpoint.constants';
import { ApiFormValues } from '@models/index';
import { ApiConsoleService } from '@services/api-console.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(ApiConsoleService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly loginForm = {
    username: '',
    password: '',
  };

  login(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .send(
        {
          id: 'auth-login',
          group: 'Auth',
          name: 'Dang nhap',
          description: '',
          method: 'POST',
          path: API_ENDPOINT.AUTH.LOGIN,
          tone: 'create',
          fields: [
            { key: 'username', label: 'Username', type: 'text', location: 'body' },
            { key: 'password', label: 'Mat khau', type: 'password', location: 'body' },
          ],
        },
        this.loginForm as unknown as ApiFormValues,
        '',
        performance.now(),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ ok, token, result }) => {
        const body = result.body as { isSuccess?: boolean; data?: unknown; message?: string } | null;

        if (!ok || body?.isSuccess === false) {
          this.errorMessage.set(body?.message || 'Dang nhap that bai. Vui long kiem tra tai khoan hoac API.');
          return;
        }

        if (!body?.data) {
          this.errorMessage.set('Dang nhap that bai. Vui long kiem tra tai khoan hoac API.');
          return;
        }

        if (token) {
          this.authService.saveToken(token);
        }

        this.authService.saveUser(body.data);
        this.router.navigateByUrl('/dashboard');
      });
  }
}
