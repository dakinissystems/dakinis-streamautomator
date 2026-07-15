/**
 * @typedef {(text: string, params?: unknown[]) => Promise<import('pg').QueryResult>} QueryFn
 */

export class BaseRepository {
  /**
   * @param {QueryFn} queryFn
   * @param {string} schema
   * @param {string} table
   */
  constructor(queryFn, schema, table) {
    this.query = queryFn;
    this.schema = schema;
    this.table = table;
    this.qualified = `${schema}.${table}`;
  }

  /**
   * @param {string} idColumn
   * @param {string|number} id
   */
  async findById(idColumn, id) {
    const { rows } = await this.query(
      `SELECT * FROM ${this.qualified} WHERE ${idColumn} = $1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }
}
