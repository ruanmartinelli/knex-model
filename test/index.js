import Model from '../dist'
import conn from './database'

import test from 'ava'
import { isNumber, isArray, isNil, isString } from 'lodash'

/**
 * Setup
 */
class UserModel extends Model {
  constructor(options) {
    super(options)
  }
}

/**
 * Tests
 */
test('should validate required fields', t => {
  const opts = {
    tableName: null,
    connection: null
  }

  t.throws(() => new UserModel(opts), Error)
})

test('should instantiate a model', t => {
  const opts = {
    tableName: 'user',
    connection: conn
  }

  t.true(new UserModel(opts) instanceof Model)
})

test(`count() works`, async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn
  })

  const count = await User.count('name')

  t.true(isNumber(count))
})

test(`find() works`, async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn
  })

  const users = await User.find({ id: 1 })

  t.true(isArray(users))
  t.true(users[0].id === 1)
})

test('only fetch declared columns', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn,
    columns: ['name']
  })

  const users = await User.find({ id: 1 })

  t.deepEqual(Object.keys(users[0]), ['name'])
})

test('should work with raw joins', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn,
    columns: ['user.name as name', 'post.title as post_title'],
    joins: ['JOIN post ON post.id = user.post_id']
  })

  const users = await User.find({ id: 1 })

  t.deepEqual(Object.keys(users[0]), ['name', 'post_title'])
})

test('should work with object joins', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn,
    columns: ['user.name', 'post.title as post_title'],
    joins: [{ table: 'post', first: 'post.id', second: 'user.post_id' }]
  })

  const users = await User.find({ id: 1 })

  t.deepEqual(Object.keys(users[0]), ['name', 'post_title'])
})

test('should work with filter functions', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn,
    columns: [`user.*`, `post.id as post_id`],
    joins: [{ table: 'post', first: 'post.id', second: 'user.post_id' }],
    customFilters: {
      postId: (value, query) => query.where('post.id', value)
    }
  })

  const users = await User.find({
    postId: 1
  })

  t.is(users.length, users.filter(u => u.post_id === 1).length)
  t.deepEqual(users[0].post_id, 1)
})

test('insert() works', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn
  })

  const user = await User.insert({ name: 'James', post_id: 1 })
  const saved = await User.findById(user.id)

  t.deepEqual(user, saved)
})

test('update() works', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn
  })

  const saved = await User.find({ name: 'James' })
  saved[0].name = 'Josh'
  const updated = await User.update(saved[0])

  t.deepEqual(updated, saved[0])
})

test('remove() works', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn
  })

  const { id } = await User.insert({ name: 'Jack', post_id: 1 })
  await User.remove(id)
  const user = await User.findById(id)

  t.true(isNil(user))
})

test('beforeInsert and afterInsert hooks should work', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn,
    beforeInsert: user => {
      user.name = 'Changed!!'
    },
    afterInsert: user => {
      user.someRandomProp = '🤗'
    }
  })

  const user = await User.insert({ name: 'Jack', post_id: 1 })

  t.deepEqual(user.name, 'Changed!!')
  t.deepEqual(user.someRandomProp, '🤗')
})

test('beforeUpdate and afterUpdate hooks should work', async t => {
  const User = new UserModel({
    tableName: 'user',
    connection: conn,
    beforeUpdate: user => {
      user.name = 'changed'
    },
    afterUpdate: user => {
      user.someRandomProp = '🐺'
    }
  })

  const user = await User.insert({ name: 'Jack', post_id: 1 })
  user.name = 'David'
  const updated = await User.update(user)

  t.deepEqual(updated.name, 'changed')
  t.deepEqual(updated.someRandomProp, '🐺')
})

test('should be able to create custom functions', async t => {
  class PostModel extends Model {
    constructor(options) {
      super(options)
    }

    findByTitle(title) {
      return this.find({ title })
    }

    async customCount() {
      const [count] = await this.knex('post').count(`id as num`)
      return `Total: ${count.num}`
    }
  }

  const Post = new PostModel({
    tableName: 'post',
    connection: conn
  })

  const posts = await Post.findByTitle('Some cool title')
  const countMessage = await Post.customCount()

  t.true(isString(countMessage))
  t.true(isArray(posts))
  t.deepEqual(posts[0].title, 'Some cool title')
})
