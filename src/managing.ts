import { AutoRouter } from 'itty-router';
import { withDatabase } from './db';

export const basePath = '/managing';
export const router = AutoRouter({ base: basePath });

// GET /dbs - List all databases (mounted at /managing/dbs)
router.get('/dbs', async () => {
    try {
        const db = (await import('./db'));
        const client = await db.getClient();
        const dbs = await client.db().admin().listDatabases();
        await db.closeClient();
        return new Response(JSON.stringify(dbs), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// GET /name - Get property name (mounted at /managing/name)
router.get('/name', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const db_name = await withDatabase(db, async (accounting_db) => {
            const property = await accounting_db.collection('properties').findOne({});
            return property?.name;
        });
        
        if (!db_name) {
            return new Response('Property not found', { status: 404 });
        }
        return new Response(JSON.stringify(db_name), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// PUT /name - Update property name (mounted at /managing/name)
router.put('/name', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const { name } = await request.json() as { name: string };
        if (!name) {
            return new Response('Missing name parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            const property = await accounting_db.collection('properties').findOne({});
            if (!property) {
                throw new Error('Property not found');
            }
            return await accounting_db.collection('properties').updateOne(
                { _id: property._id }, 
                { $set: { name: name } }
            );
        });
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        if (err.message === 'Property not found') {
            return new Response('Property not found', { status: 404 });
        }
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});
