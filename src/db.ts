import sqlite3 from 'sqlite3'

type DataBase = 'CONTAINERS' | 'STATS'

export default class DB {
  /**
   * Configuración de db
   */
  readonly dbLocate =
    '/home/jhon/Desktop/monitoreo/docker.stats.api/src/assets/sqlite.db'
  readonly db = new sqlite3.Database(this.dbLocate)
  /**
   * Configuración de modelo de db
   */
  readonly tableContainers =
    'CREATE TABLE IF NOT EXISTS CONTAINERS (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL)'
  readonly tableStats =
    'CREATE TABLE IF NOT EXISTS STATS (id INTEGER PRIMARY KEY AUTOINCREMENT, cpu_percentaje TEXT NOT NULL, mem_usage_limit TEXT NOT NULL, mem_percentaje TEXT NOT NULL ,netio TEXT NOT NULL, blockio TEXT NOT NULL, container_id INTEGER, FOREIGN KEY (container_id) REFERENCES CONTAINERS(id))'

  constructor() {
    this.initDB()
  }

  initDB() {
    const db = this.db
    const statsTable = this.tableStats
    const containersTable = this.tableContainers
    db.serialize(function () {
      db.run(containersTable)
      db.run(statsTable)
    })
  }

  getKeysValues<T extends { [s: string]: any }>(row: T) {
    const entries = Object.entries<Record<string, number>>(row).reduce<{
      keys: string[]
      values: Record<string, any>[]
    }>(
      (acc, val) => {
        acc.keys.push(val[0])
        acc.values.push(val[1])
        return acc
      },
      { keys: [], values: [] },
    )
    return entries
  }

  /**
   * @param table CONTAINERS, STATS
   */
  async getAll(table: DataBase) {
    await this.initDB()
    return await new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${table}`, function (error, rows) {
        if (error) {
          return reject(error)
        }
        resolve({ data: rows })
      })
    })
  }

  /**
   * @param table CONTAINERS, STATS
   * @param id del registro a obtener
   */
  async getOne<T extends { [s: string]: any }>(
    table: DataBase,
    args: { key: string; value: string },
  ): Promise<{ data: T }> {
    this.initDB()
    return await new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM ${table} WHERE ${args.key} = ?`,
        [args.value],
        function (error, row) {
          if (error) {
            return reject(error)
          }
          resolve({ data: row })
        },
      )
    })
  }

  async insertOne<T extends { [s: string]: any }>(
    table: DataBase,
    row: T,
  ): Promise<{ data: { id: string } }> {
    this.initDB()
    const entries = this.getKeysValues<T>(row)
    return await new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO ${table}(${entries.keys}) VALUES (${entries.values
          .map((_) => '?')
          .join()})`,
        entries.values,
        function (error) {
          if (error) {
            return reject(error)
          }
          resolve({ data: { id: this.lastID.toString() } })
        },
      )
    })
  }

  async updateOne<T extends { [s: string]: any }>(
    table: DataBase,
    id: string | number,
    row: T,
  ) {
    this.initDB()
    const entries = this.getKeysValues<T>(row)
    return await new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE ${table} SET ${entries.keys
          .map((item) => `${item} = ?`)
          .join(', ')} WHERE id = ?`,
        [...entries.values, id],
        function (error) {
          if (error) {
            return reject(error)
          }
          resolve({ data: { id } })
        },
      )
    })
  }

  async deleteOne(table: DataBase, id: string | number) {
    this.initDB()
    return await new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function (error) {
        if (error) {
          return reject(error)
        }
        resolve({ data: { id } })
      })
    })
  }

  async deleteTable(table: DataBase) {
    return await new Promise((resolve, reject) => {
      this.db.run(`DROP TABLE IF EXISTS ${table}`, (error) => {
        if (error) {
          return reject(error)
        }
        resolve({ message: `Tabla ${table} eliminada correctamente` })
      })
    })
  }
}
