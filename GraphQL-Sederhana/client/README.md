# Frontend Client (React + Apollo)

Proyek ini adalah aplikasi frontend yang menggunakan React dan Apollo Client untuk berinteraksi dengan server GraphQL.

## Prasyarat

- Node.js (versi 14.x atau lebih tinggi direkomendasikan)
- npm (biasanya terinstal bersama Node.js) atau yarn

## Instalasi

1.  Buka terminal dan navigasi ke direktori `client`.
2.  Jalankan perintah berikut untuk menginstal dependensi:
    ```bash
    npm install
    ```
    atau jika Anda menggunakan yarn:
    ```bash
    yarn install
    ```

## Menjalankan Aplikasi Frontend

1.  Pastikan Anda berada di direktori `client`.
2.  Pastikan server backend GraphQL sudah berjalan (biasanya di `http://localhost:4000/graphql`).
3.  Jalankan perintah berikut untuk memulai aplikasi React:
    ```bash
    npm start
    ```
    atau jika Anda menggunakan yarn:
    ```bash
    yarn start
    ```
    Aplikasi akan terbuka secara otomatis di browser Anda, biasanya di `http://localhost:3000`.

## Fitur

- Menampilkan daftar pesan yang diambil dari server GraphQL.
- Memungkinkan pengguna untuk menambahkan pesan baru melalui mutasi GraphQL.
- Daftar pesan akan otomatis diperbarui setelah pesan baru ditambahkan.
