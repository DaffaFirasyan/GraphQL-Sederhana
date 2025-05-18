# Backend Server (GraphQL)

Proyek ini adalah server backend yang menggunakan Node.js, Express, dan GraphQL.

## Prasyarat

- Node.js (versi 14.x atau lebih tinggi direkomendasikan)
- npm (biasanya terinstal bersama Node.js)

## Instalasi

1.  Buka terminal dan navigasi ke direktori `server`.
2.  Jalankan perintah berikut untuk menginstal dependensi:
    ```bash
    npm install
    ```

## Menjalankan Server

1.  Pastikan Anda berada di direktori `server`.
2.  Jalankan perintah berikut untuk memulai server:
    ```bash
    npm start
    ```
    Jika Anda belum menambahkan skrip `start` ke `package.json`, Anda bisa menjalankan:
    ```bash
    node server.js
    ```
    Server akan berjalan di `http://localhost:4000/graphql`. Anda dapat membuka URL ini di browser untuk mengakses antarmuka GraphiQL.

## Skrip `package.json`

Untuk memudahkan, tambahkan skrip `start` ke `server/package.json`:

```json:c%3A%5CDaffa%5CKuliah%5CSMT%206%5CIAE%5CTUGAS%5CTUGAS%203%5Cserver%5Cpackage.json
{
  // ... existing package.json content ...
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node server.js"
  },
  // ... existing package.json content ...
}