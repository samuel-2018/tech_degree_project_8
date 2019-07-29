const express = require('express');

const router = express.Router();

// TO DO Does this create an extra copy? Is there a better way?
const Sequelize = require('sequelize');

const { Op } = Sequelize;

// provides access to database via Book
const { Book } = require('../models');

/* GET redirects to results page. */
router.get('/', (req, res, next) => {
  res.redirect('/books/catalog/1');
});

// I want '/' and 'results' to go to the below:

/* GET full list of books. */
router.get('/catalog/:page', (req, res, next) => {
  Book.findAndCountAll({ order: [['title', 'ASC']], offset: 10 * (req.params.page - 1), limit: 10 })
    .then((result) => {
      const { count } = result;
      const books = result.rows;

      // Determines number of pages
      // Will return whole number
      const pages = count >= 10 ? Math.ceil(count / 10) : 1;

      res.render('books', {
        books,
        title: 'Books',
        pages,
        activePage: parseInt(req.params.page, 10),
        query: false,
      });
    })
    .catch((error) => {
      res.send(500, error);
    });
});

/* GET redirects to search results. */
router.get('/search', (req, res, next) => {
  // Retrieves query.
  const query = req.query.search;
  // Redirects with query and page 1
  res.redirect(`/books/search/${query}/1`);
});

/* GET search list of books. */
router.get('/search/:query/:page', (req, res, next) => {
  Book.findAndCountAll({
    where: {
      [Op.or]: [
        { title: { [Op.substring]: req.params.query } },
        { author: { [Op.substring]: req.params.query } },
        { genre: { [Op.substring]: req.params.query } },
        { year: { [Op.substring]: req.params.query } },
      ],
    },
    order: [['title', 'ASC']],
    offset: 10 * (req.params.page - 1),
    limit: 10,
  })
    .then((result) => {
      const { count } = result;
      const books = result.rows;

      // Determines number of pages
      // Will return whole number
      const pages = count >= 10 ? Math.ceil(count / 10) : 1;

      res.render('books', {
        books,
        title: 'Books',
        pages,
        activePage: parseInt(req.params.page, 10),
        query: req.params.query,
      });
    })
    .catch((error) => {
      res.send(500, error);
    });
});

router
  .route('/new')

  /* GET create new book form. */
  .get((req, res, next) => {
    res.render('books/new-book', { book: Book.build(), title: 'New Book' });
  })

  /* POST new book to database. */
  .post((req, res, next) => {
    Book.create(req.body)
      .then(() => {
        // Goes back to main page.
        res.redirect('/books');
      })
      .catch((error) => {
        if (error.name === 'SequelizeValidationError') {
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

router
  .route('/:id')

  /* GET book detail form (update book). */
  .get((req, res, next) => {
    Book.findByPk(req.params.id)
      .then((book) => {
        res.render('books/update-book', { book, title: 'Update Book' });
      })
      .catch((error) => {
        res.send(500, error);
      });
  })

  /* POST updated book info to database. */
  .post((req, res, next) => {
    Book.update(req.body, { where: { id: req.params.id } })
      .catch((error) => {
        if (error.name === 'SequelizeValidationError') {
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
