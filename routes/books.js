const express = require('express');

const router = express.Router();

// TO DO Does this create an extra copy?
const Sequelize = require('sequelize');

// Sequelize operators
const { Op } = Sequelize;

// Database access
const { Book } = require('../models');

// Determines pagination
const booksPerPage = 10;

// =================================
// ROUTING - Helpers
// =================================

const renderBooks = (paginationURL, result, res, req) => {
  // Total books
  const { count } = result;
  // Book data
  const books = result.rows;
  // Number of pages
  const pages = count >= booksPerPage ? Math.ceil(count / booksPerPage) : 1;

  res.render('books', {
    books,
    title: 'Books',
    pages,
    // Page number; Anchor will be given 'active' class.
    activePage: parseInt(req.params.page, 10),
    paginationURL,
  });
};

// =================================
// ROUTING - Retrieve from Database
// =================================

// GET - Redirect
router.get('/', (req, res, next) => {
  res.redirect('/books/catalog/1');
});

// GET - Full list of books
router.get('/catalog/:page', (req, res, next) => {
  Book.findAndCountAll({
    // Sort results
    order: [['title', 'ASC']],
    // SQL pagination
    offset: booksPerPage * (req.params.page - 1),
    limit: booksPerPage,
  })
    .then((result) => {
      // For page links
      const paginationURL = '/books/catalog/';
      // See 'Routing - Helpers'
      renderBooks(paginationURL, result, res, req);
    })
    .catch((error) => {
      res.send(500, error);
    });
});

// GET - Redirect
router.get('/search', (req, res, next) => {
  // Retrieves query.
  const query = req.query.search;
  // Redirects with query and page 1
  res.redirect(`/books/search/${query}/1`);
});

// GET - List of search results
router.get('/search/:query/:page', (req, res, next) => {
  Book.findAndCountAll({
    // Search
    where: {
      [Op.or]: [
        { title: { [Op.substring]: req.params.query } },
        { author: { [Op.substring]: req.params.query } },
        { genre: { [Op.substring]: req.params.query } },
        { year: { [Op.substring]: req.params.query } },
      ],
    },
    // Sort results
    order: [['title', 'ASC']],
    // SQL pagination
    offset: booksPerPage * (req.params.page - 1),
    limit: booksPerPage,
  })
    .then((result) => {
      // For page links
      const paginationURL = `/books/search/${req.params.query}/`;
      // See 'Routing - Helpers'
      renderBooks(paginationURL, result, res, req);
    })
    .catch((error) => {
      res.send(500, error);
    });
});

// =================================
// ROUTING - Change Database
// =================================

// New book
router
  .route('/new')
  // GET - New book form
  .get((req, res, next) => {
    res.render('books/new-book', { book: Book.build(), title: 'New Book' });
  })
  // POST - New book to database
  .post((req, res, next) => {
    Book.create(req.body)
      .then(() => {
        // Back to main page
        res.redirect('/books');
      })
      .catch((error) => {
        // Catches validation error sent from Sequelize
        if (error.name === 'SequelizeValidationError') {
          // Renders page with error message(s)
          res.render('books/new-book', {
            book: Book.build(req.body),
            errors: error.errors,
            title: 'New Book',
          });
        } else {
          throw error;
        }
      })
      .catch((error) => {
        res.send(500, error);
      });
  });

// Update book
router
  .route('/:id')
  // GET - Update book form
  .get((req, res, next) => {
    Book.findByPk(req.params.id)
      .then((book) => {
        res.render('books/update-book', { book, title: 'Update Book' });
      })
      .catch((error) => {
        res.send(500, error);
      });
  })
  // POST - Updated book to database
  .post((req, res, next) => {
    Book.update(req.body, { where: { id: req.params.id } })
      .then(() => {
        // Back to main page
        res.redirect('/books');
      })
      .catch((error) => {
        // Catches validation error sent from Sequelize
        if (error.name === 'SequelizeValidationError') {
          // Renders page with error message(s)
          res.render('books/update-book', {
            // Creates book instance,
            // passing in prev values and id from URL
            book: Book.build({ ...req.body, id: req.params.id }),
            errors: error.errors,
            title: 'Update Book',
          });
        } else {
          throw error;
        }
      })
      .catch((error) => {
        res.send(500, error);
      });
  });

// POST - Delete book from database
router.post('/:id/delete', (req, res, next) => {
  // In the html, there is a onsubmit event that will show a confirmation pop-up.
  Book.findByPk(req.params.id)
    .then((book) => {
      book.destroy();
    })
    .then(() => {
      // Back to main page.
      res.redirect('/books');
    })
    .catch((error) => {
      res.send(500, error);
    });
});

// TO DO: Add error handling for 404s.
// This may require using "Books.findByPk" to check that it exists before taking an action such as update or delete.

module.exports = router;
