import { env } from 'cloudflare:workers';
import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from './generated/client/client';
import type { PrismaClient as ApplicationClient } from '@prisma/client';
import models from './models.json';

export const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) }) as unknown as ApplicationClient;

type Row = Record<string, any>;
type Field = { name: string; type: string; required: boolean; id: boolean; updated: boolean; default?: any };
type Model = { table: string; fields: Field[] };
const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
function encode(field: Field, value: any) {
  if (value === null) return null;
  if (field.type === 'Json') return JSON.stringify(value);
  if (field.type === 'DateTime') return new Date(value).getTime();
  if (field.type === 'Boolean') return value ? 1 : 0;
  return value;
}
function createRow(model: Model, data: Row): Row {
  const row: Row = {};
  for (const f of model.fields) {
    if (data[f.name] !== undefined) row[f.name] = data[f.name];
    else if (f.updated) row[f.name] = new Date();
    else if (f.default !== undefined) {
      const d = f.default;
      row[f.name] = d?.name === 'cuid' ? crypto.randomUUID() : d?.name === 'now' ? new Date() : f.type === 'Json' ? JSON.parse(d) : d;
    } else if (!f.required) row[f.name] = null;
    else throw new Error(`Missing ${model.table}.${f.name}`);
  }
  for (const key of Object.keys(data)) if (!model.fields.some(f => f.name === key)) throw new Error(`Unknown ${model.table}.${key}`);
  return row;
}

export async function saveRows(modelName: string, rows: Row[], key = 'id', replace = false) {
  const model = (models as Record<string, Model>)[modelName];
  if (!model || !model.fields.some(f => f.name === key)) throw new Error('Unknown bulk model/key');
  const statements: D1PreparedStatement[] = [];
  if (replace) statements.push(env.DB.prepare(`DELETE FROM ${quote(model.table)}`));
  const groups = new Map<string, { conflict: string; rows: Row[] }>();
  for (const data of rows) {
    const row = createRow(model, data);
    const fields = model.fields;
    const updatedFields = fields.filter(f => f.name !== key && !f.id && (data[f.name] !== undefined || f.updated));
    const conflict = replace ? '' : updatedFields.length ? ` ON CONFLICT(${quote(key)}) DO UPDATE SET ${updatedFields.map(f => `${quote(f.name)} = excluded.${quote(f.name)}`).join(',')}` : ` ON CONFLICT(${quote(key)}) DO NOTHING`;
    const group = groups.get(conflict) || { conflict, rows: [] };
    group.rows.push(row);
    groups.set(conflict, group);
  }
  // D1 permits 100 bound values per statement. Multi-row inserts also keep
  // website saves and bulk imports below the Free plan's query-per-request cap.
  for (const group of groups.values()) {
    const fields = model.fields;
    const chunkSize = Math.max(1, Math.floor(100 / fields.length));
    for (let i = 0; i < group.rows.length; i += chunkSize) {
      const chunk = group.rows.slice(i, i + chunkSize);
      statements.push(env.DB.prepare(`INSERT INTO ${quote(model.table)} (${fields.map(f => quote(f.name)).join(',')}) VALUES ${chunk.map(() => `(${fields.map(() => '?').join(',')})`).join(',')}${group.conflict}`).bind(...chunk.flatMap(row => fields.map(f => encode(f, row[f.name])))));
    }
  }
  if (statements.length) await env.DB.batch(statements);
}

/**
 * Existing callbacks prepare writes and return their projected records. No write
 * happens until D1 batch() commits them together; failures roll the batch back.
 * This deliberately supports only the flat operations used by our routes.
 */
export const atomic: ApplicationClient['$transaction'] = (async (callback: (tx: ApplicationClient) => Promise<any>) => {
  const statements: D1PreparedStatement[] = [];
  const staged = new Map<string, Row | null>();
  const client = new Proxy({}, {
    get(_target, modelName: string) {
      const model = (models as Record<string, Model>)[modelName];
      if (!model) throw new Error(`Unsupported atomic model ${modelName}`);
      const delegate = (prisma as any)[modelName];
      return new Proxy({}, {
        get(_model, method: string) {
          if (['findMany', 'findFirst', 'count'].includes(method)) return delegate[method].bind(delegate);
          const find = async (args: any) => {
            const id = args.where?.id;
            const key = `${modelName}:${id}`;
            if (id && staged.has(key)) return staged.get(key);
            return delegate.findUnique(args);
          };
          if (method === 'findUnique') return find;
          return async (args: any) => {
            if (!['create', 'update', 'delete'].includes(method)) throw new Error(`Unsupported atomic operation ${method}`);
            let row: Row;
            if (method === 'create') {
              row = createRow(model, args.data);
              const fields = model.fields.filter(f => row[f.name] !== undefined);
              statements.push(env.DB.prepare(`INSERT INTO ${quote(model.table)} (${fields.map(f => quote(f.name)).join(',')}) VALUES (${fields.map(() => '?').join(',')})`).bind(...fields.map(f => encode(f, row[f.name]))));
            } else {
              const current = await find({ where: args.where });
              if (!current) throw new Error(`${model.table} record not found`);
              row = { ...current };
              if (method === 'delete') {
                statements.push(env.DB.prepare(`DELETE FROM ${quote(model.table)} WHERE "id" = ?`).bind(row.id));
              } else {
                const data = { ...args.data };
                for (const f of model.fields) if (f.updated) data[f.name] = new Date();
                const fields = Object.keys(data).filter(k => data[k] !== undefined).map(k => {
                  const f = model.fields.find(f => f.name === k);
                  if (!f) throw new Error(`Unknown ${model.table}.${k}`);
                  return f;
                });
                const values: any[] = [];
                const assignments = fields.map(f => {
                  const value = data[f.name];
                  if (value && typeof value === 'object' && ['Float','Int'].includes(f.type)) {
                    if (typeof value.increment === 'number') {
                      row[f.name] = current[f.name] + value.increment;
                      values.push(value.increment);
                      return `${quote(f.name)} = ${quote(f.name)} + ?`;
                    }
                    if (typeof value.decrement === 'number') {
                      row[f.name] = Math.max(0, current[f.name] - value.decrement);
                      values.push(value.decrement);
                      return `${quote(f.name)} = MAX(0, ${quote(f.name)} - ?)`;
                    }
                    throw new Error('Unsupported numeric mutation');
                  }
                  row[f.name] = value;
                  values.push(encode(f, value));
                  return `${quote(f.name)} = ?`;
                });
                if (fields.length) statements.push(env.DB.prepare(`UPDATE ${quote(model.table)} SET ${assignments.join(',')} WHERE "id" = ?`).bind(...values, row.id));
              }
            }
            staged.set(`${modelName}:${row.id}`, method === 'delete' ? null : row);
            return row;
          };
        },
      });
    },
  }) as ApplicationClient;
  const result = await callback(client);
  if (statements.length) {
    try { await env.DB.batch(statements); }
    catch (err) {
      if (String(err).includes('UNIQUE constraint failed')) throw Object.assign(new Error('Duplicate record'), { code: 'P2002' });
      throw err;
    }
  }
  return result;
}) as unknown as ApplicationClient['$transaction'];
