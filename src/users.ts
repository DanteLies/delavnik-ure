import type { User } from './types';

// To je začetni seznam uporabnikov. 
// Če želiš dodati prijatelje, ki bodo uporabljali aplikacijo preko GitHub Pages,
// jih dodaj v ta seznam.
export const initialUsers: User[] = [
  {
    username: 'Aleks',
    password: 'Jubel2004',
    isAdmin: true
  },
  {
    username: 'Mojca',
    password: 'mojca123',
    isAdmin: false
  },
  {
    username: 'Keli',
    password: 'kelimuca',
    isAdmin: false
  },
];
