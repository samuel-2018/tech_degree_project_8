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

const pageOutOfRange = (count, page) => {
  const totalPages = count >= booksPerPage ? Math.ceil(count / booksPerPage) : 1;
  // Is the requested page number larger than the total page count?
  if (page > totalPages) {
    return true;
  }
  return false;
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
  // Is page not a number?
  if (Number.isNaN(Number(req.params.page))) {
    // 500
    const error = new Error('Server Error.');
    error.status = 500;
    return next(error);
  }
  Book.findAndCountAll({
    // Sort results
    order: [['title', 'ASC']],
    // SQL pagination
    offset: booksPerPage * (req.params.page - 1),
    limit: booksPerPage,
  }).then((result) => {
    // See 'Routing - Helpers'
    if (pageOutOfRange(result.count, req.params.page)) {
      // 500
      const error = new Error('Server Error.');
      error.status = 500;
      return next(error);
    }
    // For page links
    const paginationURL = '/books/catalog/';
    // See 'Routing - Helpers'
    renderBooks(paginationURL, result, res, req);
  });
});

// GET - Redirect
router.get('/search', (req, res, next) => {
  // Retrieves query.
  // (Defaults to empty string to avoid a 404.)
  const query = req.query.search ? req.query.search : ' ';
  // Redirects with query and page 1
  res.redirect(`/books/search/${query}/1`);
});

// GET - List of search results
router.get('/search/:query/:page', (req, res, next) => {
  // Is page not a number?
  if (Number.isNaN(Number(req.params.page))) {
    // 500
    const error = new Error('Server Error.');
    error.status = 500;
    return next(error);
  }

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
  }).then((result) => {
    // See 'Routing - Helpers'
    if (pageOutOfRange(result.count, req.params.page)) {
      // 500
      const error = new Error('Server Error.');
      error.status = 500;
      return next(error);
    }
    // For page links
    const paginationURL = `/books/search/${req.params.query}/`;
    // See 'Routing - Helpers'
    renderBooks(paginationURL, result, res, req);
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
        }
        // All other errors will be handled in app.js
      });
  });

// Update book
router
  .route('/:id')
  // GET - Update book form
  .get((req, res, next) => {
    Book.findByPk(req.params.id).then((book) => {
      // Does book exist?
      if (book) {
        return res.render('books/update-book', { book, title: 'Update Book' });
      }
      // 500
      const error = new Error('Server Error.');
      error.status = 500;
      return next(error);
    });
  })

  // POST - Updated book to database
  .post((req, res, next) => {
    Book.findByPk(req.params.id)
      .then((book) => {
        // Does book exist?
        if (book) {
          return book.update(req.body);
        }
        // 500
        const error = new Error('Server Error.');
        error.status = 500;
        return next(error);
      })
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
        }
        // All other errors will be handled in app.js
      });
  });

// POST - Delete book from database
router.post('/:id/delete', (req, res, next) => {
  // In the html, there is a onsubmit event that will show a confirmation pop-up.
  Book.findByPk(req.params.id)
    .then((book) => {
      // Does book exist?
      if (book) {
        return book.destroy();
      }
      // 500
      const error = new Error('Server Error.');
      error.status = 500;
      return next(error);
    })
    .then(() => {
      // Back to main page.
      res.redirect('/books');
    });
});

module.exports = router;
