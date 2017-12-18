import {
  isString,
  isFunction,
  head,
  isEmpty,
  mapKeys,
  noop,
  isPlainObject
} from 'lodash'

export default class Model {
  knex: Function
  connection: Function
  tableName: string
  columns?: Array<string>
  joins?: Array<any>
  idAttribute?: string
  customFilters: Array<Function>

  // Hooks
  beforeInsert?: Function
  afterInsert?: Function
  afterUpdate?: Function
  beforeUpdate?: Function

  constructor(private opts) {
    if (!opts) {
      throw new Error('Options object cannot be null.')
    }
    if (!opts.connection) {
      throw new Error('Property "connection" cannot be null.')
    }
    if (!opts.tableName) {
      throw new Error('Property "tableName" cannot be null.')
    }

    this.knex = opts.connection
    this.tableName = opts.tableName
    this.columns = opts.columns || []
    this.joins = opts.joins || []
    this.idAttribute = opts.idAttribute || 'id'
    this.customFilters = opts.customFilters || {}

    this.beforeInsert = opts.beforeInsert || noop
    this.afterInsert = opts.afterInsert || noop
    this.afterUpdate = opts.afterUpdate || noop
    this.beforeUpdate = opts.beforeUpdate || noop
  }

  async count(column: String = '*'): Promise<Number> {
    const countValue = await this.knex(this.tableName).count(`${column} as c`)

    return countValue[0].c
  }

  async find(filter: any): Promise<Array<object>> {
    const query = this.knex(this.tableName)
    const columns = []

    if (isEmpty(this.columns)) {
      columns.push(`${this.tableName}.*`)
    } else {
      this.columns.forEach(col => columns.push(`${col}`))
    }

    query.select(columns)

    this.joins.forEach(j => {
      if (isString(j)) {
        query.joinRaw(j)
      } else if (isPlainObject(j) && j.table && j.first && j.second) {
        query.join(j.table, j.first, j.second)
      } else {
        throw Error('Unrecognized join format.')
      }
    })

    const filterPromises: Array<Promise<any>> = []

    mapKeys(filter, (value, key: string) => {
      if (isFunction(this.customFilters[key])) {
        filterPromises.push(Promise.resolve(this.customFilters[key](value, query)))
      } else {
        query.where(`${this.tableName}.${key}`, value)
      }
    })

    await Promise.all(filterPromises)

    return query
  }

  async insert(obj: any): Promise<object> {
    await this.beforeInsert(obj)

    const [id] = await this.knex(this.tableName).insert(obj)
    const savedObj = await this.findById(id)

    await this.afterInsert(savedObj)

    return savedObj
  }

  async update(obj: any): Promise<object> {
    if (!obj[this.idAttribute]) {
      throw new Error('Error updating object: Missing ID field')
    }

    const id = obj[this.idAttribute]

    await this.beforeUpdate(obj)

    await this.knex(this.tableName)
      .update(obj)
      .where(this.idAttribute, id)

    const updatedObj = await this.findById(id)

    await this.afterUpdate(updatedObj)

    return updatedObj
  }

  findById(id: number | string): Promise<object> {
    const where = {}

    where[this.idAttribute] = id

    return this.find(where).then(head)
  }

  async remove(id): Promise<boolean> {
    if (!id) {
      // prettier-ignore
      throw new Error(`Error removing object: Missing "${this.idAttribute}" field`)
    }

    return this.knex(this.tableName)
      .where(this.idAttribute, id)
      .del()
      .then(() => true)
  }

  upsert(obj: object): Promise<object> {
    if (obj[this.idAttribute]) {
      return this.update(obj)
    } else {
      return this.insert(obj)
    }
  }
}
