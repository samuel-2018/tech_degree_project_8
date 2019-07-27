const express = require('express');

const router = express.Router();

// provides access to database via Book
const { Book } = require('../models');

/* GET full list of books. */
router.get('/', (req, res, next) => {
  Book.findAll({ order: [['title', 'ASC']] })
    .then((books) => {
      res.render('books', { books, title: 'Books' });
      // console.log(books);
    })
    .catch((error) => {
      res.send(500, error);
    });
});

/* GET create new book form. */
router.get('/new', (req, res, next) => {
  res.render('books/new-book', { book: Book.build(), title: 'New Book' });
});

/* POST new book to database. */
router.post('/new', (req, res, next) => {
  Book.create(req.body)
    .then(() => {
      // Goes back to main page.
      res.redirect('/books');
    })
    .catch((error) => {
      res.send(500, error);
    });
});

/* GET book detail form (update book). */
router.get('/:id', (req, res, next) => {
  Book.findByPk(req.params.id)
    .then((book) => {
      res.render('books/update-book', { book, title: 'Update Book' });
    })
    .catch((error) => {
      res.send(500, error);
    });
});

/* POST updated book info to database. */
router.post('/:id', (req, res, next) => {
  Book.update(req.body, { where: { id: req.params.id } })
    .then(() => {
      // Goes back to main page.
      res.redirect('/books');
    })
    .catch((error) => {
      res.send(500, error);
    });
});

/* POST book to delete from database. */
router.post('/:id/delete', (req, res, next) => {
  // In the html, there is a onsubmit event that will show a confirmation pop-up.
  Book.findByPk(req.params.id)
    .then((book) => {
      book.destroy();
    })
    .then(() => {
      // Goes back to main page.
      res.redirect('/books');
    })
    .catch((error) => {
      res.send(500, error);
    });
});

// TO DO: Add error handling for 404s.
// This may require using "Books.findByPk" to check that it exists before taking an action such as update or delete.

module.exports = router;
