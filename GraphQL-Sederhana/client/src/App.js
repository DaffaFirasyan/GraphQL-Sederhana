// import logo from './logo.svg'; // Removed as it's not used
// import './App.css'; // Removed duplicate import, it's imported once below

import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import './App.css';

// GraphQL Query untuk mengambil pesan // Removed GET_MESSAGES
// const GET_MESSAGES = gql`
//   query GetMessages {
//     getMessages
//   }
// `;

// GraphQL Mutation untuk menambah pesan // Removed ADD_MESSAGE
// const ADD_MESSAGE = gql`
//   mutation AddMessage($text: String!) {
//     addMessage(text: $text)
//   }
// `;

// New GraphQL Operations for Authors and Books
const GET_AUTHORS_WITH_BOOKS = gql`
  query GetAuthorsWithBooks {
    getAuthors {
      id
      name
      books {
        id
        title
        publishedYear
      }
    }
  }
`;

const ADD_AUTHOR = gql`
  mutation AddAuthor($name: String!) {
    addAuthor(name: $name) {
      id
      name # Requesting fields to update cache if needed, and for immediate feedback
    }
  }
`;

const ADD_BOOK = gql`
  mutation AddBook($title: String!, $publishedYear: Int, $authorId: ID!) {
    addBook(title: $title, publishedYear: $publishedYear, authorId: $authorId) {
      id
      title
      publishedYear
      author { # Requesting author to potentially update UI or cache
        id
        name
      }
    }
  }
`;

const DELETE_AUTHOR = gql`
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id) {
      id # We need to request at least one field. ID is good for cache updates.
    }
  }
`;

const DELETE_BOOK = gql`
  mutation DeleteBook($id: ID!) {
    deleteBook(id: $id) {
      id # We need to request at least one field.
    }
  }
`;

function AuthorsList() {
  const { loading, error, data, refetch } = useQuery(GET_AUTHORS_WITH_BOOKS);
  const [deleteAuthorMutation] = useMutation(DELETE_AUTHOR, {
    refetchQueries: [
      { query: GET_AUTHORS_WITH_BOOKS },
      'GetAuthorsWithBooks' // String name of the query
    ],
    onError: (err) => {
      console.error("Error deleting author:", err);
      alert(`Failed to delete author: ${err.message}`);
    }
  });

  const [deleteBookMutation] = useMutation(DELETE_BOOK, {
    refetchQueries: [
      { query: GET_AUTHORS_WITH_BOOKS },
      'GetAuthorsWithBooks'
    ],
    onError: (err) => {
      console.error("Error deleting book:", err);
      alert(`Failed to delete book: ${err.message}`);
    }
  });

  const handleDeleteAuthor = async (authorId, authorName) => {
    if (window.confirm(`Are you sure you want to delete author "${authorName}" and all their books?`)) {
      try {
        await deleteAuthorMutation({ variables: { id: authorId } });
      } catch (e) {
        // Error handling is now primarily in useMutation's onError
      }
    }
  };

  const handleDeleteBook = async (bookId, bookTitle) => {
    if (window.confirm(`Are you sure you want to delete book "${bookTitle}"?`)) {
      try {
        await deleteBookMutation({ variables: { id: bookId } });
      } catch (e) {
        // Error handling is now primarily in useMutation's onError
      }
    }
  };

  if (loading) return <p>Loading authors...</p>;
  if (error) return <p>Error loading authors: {error.message}</p>;

  return (
    <div className="authors-section">
      <h2>Authors & Books</h2>
      {data && data.getAuthors && data.getAuthors.length > 0 ? (
        data.getAuthors.map(author => (
          <div key={author.id} className="author-card">
            <div className="author-header">
              <h3>{author.name} (ID: {author.id})</h3>
              <button 
                onClick={() => handleDeleteAuthor(author.id, author.name)} 
                className="delete-button"
                title={`Delete author ${author.name}`}
              >
                Delete Author
              </button>
            </div>
            {author.books && author.books.length > 0 ? (
              <ul>
                {author.books.map(book => (
                  <li key={book.id}>
                    <span>{book.title} ({book.publishedYear || 'N/A'}) - Book ID: {book.id}</span>
                    <button 
                      onClick={() => handleDeleteBook(book.id, book.title)} 
                      className="delete-button-small"
                      title={`Delete book ${book.title}`}
                    >
                      Delete Book
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No books by this author yet.</p>
            )}
          </div>
        ))
      ) : (
        <p>No authors found. Add one below!</p>
      )}
      <button onClick={() => refetch()} className="refresh-button">Refresh Authors</button>
    </div>
  );
}

// New Component to Add an Author
function AddAuthorForm() {
  const [name, setName] = useState('');
  const [addAuthor, { data: authorData, loading, error }] = useMutation(ADD_AUTHOR, {
    refetchQueries: [
      { query: GET_AUTHORS_WITH_BOOKS }, // Refetch authors list after adding a new one
      'GetAuthorsWithBooks'
    ],
    onCompleted: () => {
      setName(''); // Clear input on successful submission
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addAuthor({ variables: { name } });
    } catch (err) {
      console.error("Error adding author:", err);
    }
  };

  return (
    <div className="form-card">
      <h3>Add New Author</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Author's name"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding Author...' : 'Add Author'}
        </button>
      </form>
      {error && <p className="error-message">Error adding author: {error.message}</p>}
      {authorData && <p className="success-message">Author "{authorData.addAuthor.name}" added!</p>}
    </div>
  );
}

// New Component to Add a Book
function AddBookForm() {
  const [title, setTitle] = useState('');
  const [publishedYear, setPublishedYear] = useState('');
  const [authorId, setAuthorId] = useState('');

  // Fetch authors for the dropdown
  const { data: authorsData, loading: authorsLoading, error: authorsError } = useQuery(GET_AUTHORS_WITH_BOOKS);

  const [addBook, { data: bookData, loading, error }] = useMutation(ADD_BOOK, {
    refetchQueries: [
      { query: GET_AUTHORS_WITH_BOOKS }, // Refetch authors and their books
      'GetAuthorsWithBooks'
    ],
    onCompleted: () => {
      setTitle('');
      setPublishedYear('');
      setAuthorId('');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !authorId) return;
    try {
      await addBook({ variables: { title, publishedYear: publishedYear ? parseInt(publishedYear) : null, authorId } });
    } catch (err) {
      console.error("Error adding book:", err);
    }
  };

  if (authorsLoading) return <p>Loading authors for form...</p>;
  if (authorsError) return <p>Error loading authors: {authorsError.message}</p>;

  return (
    <div className="form-card">
      <h3>Add New Book</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book title"
          required
        />
        <input
          type="number"
          value={publishedYear}
          onChange={(e) => setPublishedYear(e.target.value)}
          placeholder="Published year (optional)"
        />
        <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} required>
          <option value="" disabled>Select an author</option>
          {authorsData && authorsData.getAuthors && authorsData.getAuthors.map(author => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding Book...' : 'Add Book'}
        </button>
      </form>
      {error && <p className="error-message">Error adding book: {error.message}</p>}
      {bookData && <p className="success-message">Book "{bookData.addBook.title}" added!</p>}
    </div>
  );
}


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GraphQL Client-Server App</h1>
      </header>
      <main>
        {/* Removed messages section */}
        {/* <div className="messages-section">
          <MessagesList />
          <hr />
          <AddMessageForm />
        </div>
        <hr className="section-divider" /> */}
        <div className="authors-books-management">
          <AuthorsList />
          <div className="forms-container">
            <AddAuthorForm />
            <AddBookForm />
          </div>
        </div>
      </main>
      <footer className="App-footer">
        <p>Enhanced GraphQL Application</p>
      </footer>
    </div>
  );
}

export default App;
