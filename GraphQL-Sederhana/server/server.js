const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

// Data sementara (in-memory)
let messages = ["Hello World", "GraphQL is fun!"];

// Data baru untuk penulis dan buku
let authors = [
  {
    id: '1',
    name: 'J.K. Rowling',
    bookIds: ['101', '102'] // ID buku yang ditulis oleh penulis ini
  },
  {
    id: '2',
    name: 'George R.R. Martin',
    bookIds: ['201']
  },
  {
    id: '3',
    name: 'J.R.R. Tolkien',
    bookIds: ['301', '302']
  }
];

let books = [
  { id: '101', title: 'Harry Potter and the Sorcerer\'s Stone', publishedYear: 1997, authorId: '1' }, // Added authorId for existing books
  { id: '102', title: 'Harry Potter and the Chamber of Secrets', publishedYear: 1998, authorId: '1' }, // Added authorId
  { id: '201', title: 'A Game of Thrones', publishedYear: 1996, authorId: '2' }, // Added authorId
  { id: '301', title: 'The Hobbit', publishedYear: 1937, authorId: '3' }, // Added authorId
  { id: '302', title: 'The Lord of the Rings', publishedYear: 1954, authorId: '3' }  // Added authorId
];


// Skema GraphQL
const schema = buildSchema(`
  type Book {
    id: ID!
    title: String!
    publishedYear: Int
    author: Author # Add author field to Book type
  }

  type Author {
    id: ID!
    name: String!
    books: [Book!]! # Seorang penulis bisa memiliki banyak buku
  }

  type Query {
    getMessages: [String!]!
    getAuthors: [Author!]!        # Query untuk mendapatkan semua penulis
    getAuthor(id: ID!): Author  # Query untuk mendapatkan penulis berdasarkan ID
    getBooks: [Book!]!          # Query untuk mendapatkan semua buku
    getBook(id: ID!): Book      # Query untuk mendapatkan buku berdasarkan ID
  }

  type Mutation {
    addMessage(text: String!): String!
    addAuthor(name: String!): Author!
    addBook(title: String!, publishedYear: Int, authorId: ID!): Book!
    deleteAuthor(id: ID!): Author # Returns the deleted author, or null if not found
    deleteBook(id: ID!): Book   # Returns the deleted book, or null if not found
  }
`);

// Helper function to get the author for a book
const getAuthorForBook = (book) => {
  return authors.find(author => author.id === book.authorId);
};

// Resolver untuk query dan mutasi
const root = {
  getMessages: () => {
    return messages;
  },
  addMessage: ({ text }) => {
    messages.push(text);
    return text;
  },

  // Resolver untuk query penulis
  getAuthors: () => {
    return authors.map(author => ({
      id: author.id,
      name: author.name,
      books: () => books.filter(book => author.bookIds.includes(book.id)).map(book => ({
        ...book,
        author: () => getAuthorForBook(book) // Resolve author for each book
      }))
    }));
  },
  getAuthor: ({ id }) => {
    const author = authors.find(auth => auth.id === id);
    if (!author) {
      return null;
    }
    return {
      id: author.id,
      name: author.name,
      books: () => books.filter(book => author.bookIds.includes(book.id)).map(book => ({
        ...book,
        author: () => getAuthorForBook(book) // Resolve author for each book
      }))
    };
  },
  // Resolver untuk query buku
  getBooks: () => {
    return books.map(book => ({
      ...book,
      author: () => getAuthorForBook(book) // Resolve author for each book
    }));
  },
  getBook: ({ id }) => {
    const book = books.find(b => b.id === id);
    if (!book) {
      return null;
    }
    return {
      ...book,
      author: () => getAuthorForBook(book) // Resolve author for the book
    };
  },

  // Resolver untuk mutasi
  addAuthor: ({ name }) => {
    const newAuthor = {
      id: String(authors.length + 1), // Simple ID generation
      name: name,
      bookIds: []
    };
    authors.push(newAuthor);
    return { // Return structure matching Author type, including resolver for books
        id: newAuthor.id,
        name: newAuthor.name,
        books: () => [] // New author has no books initially
    };
  },
  addBook: ({ title, publishedYear, authorId }) => {
    const authorExists = authors.find(author => author.id === authorId);
    if (!authorExists) {
      throw new Error(`Author with ID ${authorId} not found.`);
    }

    const newBook = {
      id: String(books.length + 101), // Simple ID generation, ensure uniqueness
      title: title,
      publishedYear: publishedYear,
      authorId: authorId // Store authorId with the book
    };
    books.push(newBook);

    // Add bookId to the author's bookIds list
    authorExists.bookIds.push(newBook.id);

    return { // Return structure matching Book type, including resolver for author
        ...newBook,
        author: () => getAuthorForBook(newBook)
    };
  },

  deleteAuthor: ({ id }) => {
    const authorIndex = authors.findIndex(author => author.id === id);
    if (authorIndex === -1) {
      // throw new Error(`Author with ID ${id} not found.`); // Or return null
      return null;
    }
    const deletedAuthor = authors[authorIndex];

    // Remove the author
    authors.splice(authorIndex, 1);

    // Also remove all books by this author
    // And remove these book IDs from other authors if they were co-authored (not handled in current simple model)
    const booksByThisAuthor = books.filter(book => deletedAuthor.bookIds.includes(book.id));
    books = books.filter(book => !deletedAuthor.bookIds.includes(book.id));

    // For the deleted author object to be returned, resolve its books (which will now be an empty array or based on its state before deletion)
    // It's typical to return the state of the object as it was *before* deletion.
    // The client can then use this information.
    return {
        ...deletedAuthor,
        books: () => booksByThisAuthor.map(book => ({ // Show books that were deleted along with the author
            ...book,
            author: () => deletedAuthor // The author of these books is the one being deleted
        }))
    };
  },

  deleteBook: ({ id }) => {
    const bookIndex = books.findIndex(book => book.id === id);
    if (bookIndex === -1) {
      // throw new Error(`Book with ID ${id} not found.`); // Or return null
      return null;
    }
    const deletedBook = books[bookIndex];

    // Remove the book
    books.splice(bookIndex, 1);

    // Remove the bookId from its author's bookIds array
    const author = authors.find(auth => auth.id === deletedBook.authorId);
    if (author) {
      const bookIdIndex = author.bookIds.indexOf(deletedBook.id);
      if (bookIdIndex > -1) {
        author.bookIds.splice(bookIdIndex, 1);
      }
    }
    // Return the state of the book as it was before deletion
    return {
        ...deletedBook,
        author: () => getAuthorForBook(deletedBook) // Resolve author based on its state before deletion
    };
  }
};

const app = express();

// Middleware untuk mengizinkan CORS (Cross-Origin Resource Sharing)
// Ini penting agar frontend React Anda dapat berkomunikasi dengan server ini
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Izinkan semua origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Aktifkan GraphiQL interface untuk testing di browser
}));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server GraphQL berjalan di http://localhost:${PORT}/graphql`);
});