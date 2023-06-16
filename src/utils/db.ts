import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import sqlite3 from 'sqlite3'
import { validarRegistroNumerico } from '.'

type DataBase = 'CONTAINERS' | 'STATS'

export interface Container {
  id?: number // PK
  name: string
}

export interface Stat {
  id?: string // PK
  container_id: number // FK
  date: string
  mem_percentaje: number
  cpu_percentaje: number
  mem_usage_limit: string
  mem_usage_limit_total: string
  netio: string
  netio_total: string
  blockio: string
  blockio_total: string
}

export default class DB {
  /**
   * Configuración de db
   */
  readonly dbLocate = path.join(__dirname, '../../src/static/db.db')
  readonly db = new sqlite3.Database(this.dbLocate)

  constructor() {
    this.initDB()
  }

  initDB() {
    const sql = fs
      .readFileSync(path.join(__dirname, '../../src/utils/sql/tables.sql'))
      .toString()
    this.db.exec(sql, (err) => {
      if (err) {
        console.error(err)
      }
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
   * @param table - CONTAINERS, STATS
   */
  async getAll<T extends { [s: string]: any }>(
    table: DataBase,
  ): Promise<{ data: T[] }> {
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
   * @param table - CONTAINERS, STATS
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

  /**
   * @param table - CONTAINERS, STATS
   * @param row - objecto genérico para validar campos requeridos en base a tipo
   * de dato asignado
   */
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

  /**
   * @param table - CONTAINERS, STATS
   * @param id - identificador único `pk`
   * @param row - objecto genérico para validar campos requeridos en base a tipo
   * de dato asignado
   */
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
  /**
   * @param table - CONTAINERS, STATS
   * @param id - identificador único `pk`
   */
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

  async joinTable(
    table1: DataBase,
    table2: DataBase,
    id: string | number,
    args?: {
      startDate?: string
      endDate?: string
    },
  ): Promise<unknown> {
    const dateInit = (date?: string) => dayjs(date).startOf('d').toISOString()
    const startDate = dateInit(args?.startDate)

    const condition =
      args?.startDate && args?.endDate
        ? `date BETWEEN '${startDate}' AND '${dateInit(args.endDate)}'`
        : `date > '${startDate}'`

    return await new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM ${table1} INNER JOIN ${table2} ON ${table1}.id = \
${table2}.container_id WHERE ${table1}.id = ${id} AND ${condition}`,
        (error, rows) => {
          if (error) {
            return reject(error)
          }
          validarRegistroNumerico(rows)
          resolve({
            id,
            name: rows.find((item) => item.container_id === id)?.name || '',
            stats: rows,
          })
        },
      )
    })
  }
}
