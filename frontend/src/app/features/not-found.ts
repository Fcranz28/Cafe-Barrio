import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [RouterLink],
  template: `<section class="container-page py-20 text-center">
    <p class="eyebrow">404</p>
    <h1 class="section-title mt-4">Esta página se tomó un descanso.</h1>
    <a routerLink="/catalogo" class="btn mt-8">Volver al catálogo</a>
  </section>`,
})
export class NotFound {}
