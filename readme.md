# :package: knex-model

[![NPM downloads](https://img.shields.io/npm/dm/knex-model.svg?style=flat)](https://npmjs.com/package/knex-model)
[![Dependencies](https://david-dm.org/ruanmartinelli/knex-model.svg)](https://david-dm.org/ruanmartinelli/knex-model)

> A wrapper around the Knex library using ES6 classes.

## Description

This package hands over [BREAD](https://github.com/nooku/guides.nooku.org/blob/master/essentials/BREAD.md)-like methods by wrapping the [Knex](http://knexjs.org) library.
It does so by providing a base class (ES6, yay!) that you can extend and use on your own models.

## Install

```bash
# npm
npm i --save @ruanmartinelli/knex-model

# yarn
yarn add @ruanmartinelli/knex-model
```

## Roadmap

- [ ] Default `$limit` and `$offset` attributes in filter of `.find()` method
- [ ] _camelCase_ & _snake_case_ support

## Usage

Assuming you already have Knex configured, it's fairly simple to set everything up:

```js
import conn from './database' // Your knex connection
import Model from '@ruanmartinelli/knex-model'

// Configure your options based on your model:
const opts = {
  tableName: 'book',
  connection: conn
}

// Declare your model:
class BookModel extends Model {
  constructor(options) {
    super(options)
  }
}
// *don't forget to extend the Model class

// Create a new instance of BookModel by passing the options:
const Book = new BookModel(opts)
```

After that, the `Book` instance will inherit the following methods:

```js
// ...

// Find books based on a filter
Book.find(filter)

// Find a single book based on an ID
Book.findById(42)

// Returns the total number of books
Book.count()

// Create a new book and return it
Book.insert(book)

// Update an existing book and return it
Book.update(book)

// Create or update a new book
Book.upsert(book)

// Deletes a book
Book.remove(42)
```

_For a explanation or each method check the "Methods" section._

## API

### Options

You can customize your models by tweaking the `options` object.

#### options.tableName (required)

Type: `string`

Name of the table associated with the model.

#### options.connection (required)

A Knex [connection object](http://knexjs.org/#Installation-client).

#### options.columns

Type: `Array<string>`

Array of column names. If none is supplied, it will use `<tableName>.*`.

#### options.joins

Type: `Array<string> | Array<object>`

Array of join statements.

Strings will be called using the [`.joinRaw()`](http://knexjs.org/#Builder-joinRaw) method.

Objects must have a `"table"`, `"first"` and `"second"` attributes and only support `INNER JOIN` operations. See more on the full example below.

#### options.idAttribute

Type: `string`

Name of the primary key in table. The default will be `'id'` if none is supplied.

#### options.customFilters

Type: `object`

An object with custom filter functions that can be used in the `.find()` method. See more on the full example below.

### Hooks

The following hooks are supported:

#### options.beforeInsert

#### options.afterInsert

#### options.afterUpdate

#### options.beforeUpdate

Type: `Function`

Function that will be called with the argument received by the `.update()` or `.insert()` methods.

### Full Example

```js
{
  // Required ⚠️
  // Name of the table related to the model.
  tableName: 'book',

  // Required ⚠️
  // A knex connection object.
  connection: knex(config),

  // Declare the columns that will be fetch from the table.
  columns: [
    'book.*',
    'author.name as author_name',
    'author.id as author_id'
  ],

  // Inner joins can be performed by passing an object.
  // If you need sophisticated joins just write them as a string.
  joins: [
    // Inner Join using an object:
    { table:'author' first: 'author.id', second: 'book.id_author' },

    // Or use a string for other types of join:
    'LEFT OUTER JOIN editor on editor.id = booking.id_editor'
  ],

  // Whatever name you use on your table to reference the Primary key.
  // By default the value is 'id'.
  idAttribute: 'id',

  customFilters: {
    // The "query" param is the interface provided by Knex to build queries.
    // See here: http://knexjs.org/#Builder-knex
    // The "value" param has the value for what was passed to the filter on the .find() method.
    // Eg.:
    // If we call:
    //
    //     Book.find({ mainCharacterName: 'Kvothe' })
    //
    // Then the "value" param on the function above will hold the value 'Kvothe'.
    mainCharacterName: (query, value) => {
      if(!typeof value === 'string') throw ValidationError('Character name must be a string!!')

      query.join('main_character', 'main_character.book_id', 'book.id')
      query.where('main_character.name', value)
    }
  },

  // Hooks are called with the values passed to the .insert() and .update() methods.
  // You can use them to validate your objects, for example:
  beforeInsert: (book) => validateBook(book),
  beforeUpdate: (book) => validateBook(book)
}
```

### Methods

After instantiating a new model you will be able to call any of the methods bellow.

_Note: all methods return a `Promise` object._

#### .find([filter])

Returns an `Array` of objects based on the filter.

The `.find()` method expects a filter object. The keys in this object should either a **name of a column** or a **custom filter**.

Example:

```js
// Suppose that the "book" table has the following columns:
//   id, title, isbn, publish_date, id_author, id_editor

// Query by the column names:
Book.find({ isbn: '...' })

Book.find({ title: '', publish_date: '...' })

// Query with custom filters:
Book.find({ mainCharacterName: 'Kvothe' })

// This fails:
Book.find({ not_a_column_nor_a_custom_filter: '...' })
```

#### .findById(id)

Returns an `object` from the table based on the id.

This method is an alias for calling `.find()` with an `{ id }` filter and returning the first result.

#### .insert(model)

Inserts an `object` on table and returns it.

#### .update(model)

Updates an `object` on the table and returns it.

This method expects the object to have an `id` field present (or the key defined on `options.idAttribute`).

#### .upsert(model)

Updates or inserts an `object` on the table and returns it.

If the object has an `id`, it will be updated. If it doesn't, a new object will be created.

#### .remove(id)

Returns `true`.

Remove an object from table based on its `id`.

#### .count()

Returns the number of rows on the table.

## Custom Methods

This library doesn't try to abstract away the Knex interface or prevent you from writing SQL queries.

If you need to create your own custom method or overwrite any of the provided (actually this is not advised), just write it inside of your model declaration:

```js
class Book extends Model {
  constructor(options) {
    super(options)
  }

  someVeryCustomQuery() {
    // You can use the "knex" instance inherited from the Model class
    return this.knex('book')
      .select('*')
      .where('title', 'like', '%Bananas%')
  }
}
```

## License

MIT © [Ruan Martinelli](http://ruanmartinelli.com)
