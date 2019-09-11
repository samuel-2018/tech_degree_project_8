const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
// Favicon
const favicon = require("serve-favicon");

const app = express();

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

const indexRouter = require("./routes/index");
const booksRouter = require("./routes/books");

// view engine setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/books", booksRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  // res.status(err.status || 500);
  if (err.status === 404) {
    res.status(404);
    console.log("404: Page not found");
    res.render("books/page-not-found");
  } else {
    res.status(500);
    res.render("error");
    console.log("500: Something went wrong.");
  }
});

module.exports = app;
