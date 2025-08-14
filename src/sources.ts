import { AutoRouter } from 'itty-router';
import { withDatabase } from './db';

export type Source = {
    sourceId: number;
    name: string;
    type: 'bank' | 'digital_wallet' | 'credit_card' | 'cash' | 'other';
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const basePath = '/sources';
export const router = AutoRouter({ base: basePath });

// Function to ensure sources collection exists
async function ensureSourcesCollection(db: any) {
    try {
        // Check if collection exists by trying to get collection info
        const collections = await db.listCollections({ name: 'sources' }).toArray();
        if (collections.length === 0) {
            // Collection doesn't exist, create it
            await db.createCollection('sources');
            console.log('Created empty sources collection');
        }
    } catch (error) {
        console.error('Error ensuring sources collection:', error);
        // Continue execution even if collection creation fails
    }
}

// GET / - Get all sources (mounted at /sources)
router.get('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const sources = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            return await accounting_db.collection('sources').find({}).toArray();
        });
        return new Response(JSON.stringify(sources), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// POST / - Add new source (mounted at /sources)
router.post('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const sourceData = await request.json() as Partial<Source>;
        if (!sourceData.name) {
            return new Response('Missing name parameter', { status: 400 });
        }
        if (!sourceData.type) {
            return new Response('Missing type parameter', { status: 400 });
        }
        
        // Validate type
        const validTypes = ['bank', 'digital_wallet', 'credit_card', 'cash', 'other'];
        if (!validTypes.includes(sourceData.type)) {
            return new Response('Invalid type parameter. Must be one of: ' + validTypes.join(', '), { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            
            // Get the next sourceId
            const lastSource = await accounting_db.collection('sources')
                .findOne({}, { sort: { sourceId: -1 } });
            const nextSourceId = lastSource ? (lastSource.sourceId + 1) : 1;
            
            // Create the source object
            const newSource: Source = {
                sourceId: nextSourceId,
                name: sourceData.name!, // We already validated this exists
                type: sourceData.type!, // We already validated this exists
                description: sourceData.description || '',
                isActive: sourceData.isActive !== false, // Default to true
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            return await accounting_db.collection('sources').insertOne(newSource);
        });
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// DELETE / - Delete source by ID (mounted at /sources)
router.delete('/', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const { sourceId } = await request.json() as { sourceId: number };
        if (sourceId === undefined) {
            return new Response('Missing sourceId parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            return await accounting_db.collection('sources').deleteOne({ sourceId: sourceId });
        });
        
        if (result.deletedCount === 0) {
            return new Response('Source not found', { status: 404 });
        }
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// GET /by-type - Get sources by type (mounted at /sources/by-type)
router.get('/by-type', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db parameter', { status: 400 });
    }
    const type = request.query.type as string;
    if (!type) {
        return new Response('Missing type parameter', { status: 400 });
    }
    
    // Validate type parameter
    const validTypes = ['bank', 'digital_wallet', 'credit_card', 'cash', 'other'];
    if (!validTypes.includes(type)) {
        return new Response('Invalid type parameter. Must be one of: ' + validTypes.join(', '), { status: 400 });
    }
    
    try {
        const sources = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            return await accounting_db.collection('sources').find({ type: type }).toArray();
        });
        return new Response(JSON.stringify(sources), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// GET /active - Get active sources only (mounted at /sources/active)
router.get('/active', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const sources = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            return await accounting_db.collection('sources').find({ isActive: true }).toArray();
        });
        return new Response(JSON.stringify(sources), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// PUT /update - Update source (mounted at /sources/update)
router.put('/update', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const updateData = await request.json() as Partial<Source> & { sourceId: number };
        if (!updateData.sourceId) {
            return new Response('Missing sourceId parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            
            const updateFields: any = { updatedAt: new Date() };
            
            if (updateData.name !== undefined) updateFields.name = updateData.name;
            if (updateData.type !== undefined) {
                const validTypes = ['bank', 'digital_wallet', 'credit_card', 'cash', 'other'];
                if (!validTypes.includes(updateData.type)) {
                    throw new Error('Invalid type parameter. Must be one of: ' + validTypes.join(', '));
                }
                updateFields.type = updateData.type;
            }
            if (updateData.description !== undefined) updateFields.description = updateData.description;
            if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;
            
            return await accounting_db.collection('sources').updateOne(
                { sourceId: updateData.sourceId },
                { $set: updateFields }
            );
        });
        
        if (result.matchedCount === 0) {
            return new Response('Source not found', { status: 404 });
        }
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        if (err.message.includes('Invalid type parameter')) {
            return new Response(err.message, { status: 400 });
        }
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// PATCH /toggle-status - Deactivate/activate source (mounted at /sources/toggle-status)
router.patch('/toggle-status', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    try {
        const { sourceId, isActive } = await request.json() as { sourceId: number; isActive: boolean };
        if (sourceId === undefined) {
            return new Response('Missing sourceId parameter', { status: 400 });
        }
        if (isActive === undefined) {
            return new Response('Missing isActive parameter', { status: 400 });
        }
        
        const result = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            
            return await accounting_db.collection('sources').updateOne(
                { sourceId: sourceId },
                { $set: { isActive: isActive, updatedAt: new Date() } }
            );
        });
        
        if (result.matchedCount === 0) {
            return new Response('Source not found', { status: 404 });
        }
        
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});

// GET /:sourceId - Get source by ID (mounted at /sources/:sourceId)
router.get('/:sourceId', async (request) => {
    const db = request.query.db as string;
    if (!db) {
        return new Response('Missing db_name parameter', { status: 400 });
    }
    const sourceId = parseInt(request.params.sourceId);
    if (isNaN(sourceId)) {
        return new Response('Invalid sourceId parameter', { status: 400 });
    }
    
    try {
        const source = await withDatabase(db, async (accounting_db) => {
            await ensureSourcesCollection(accounting_db);
            
            return await accounting_db.collection('sources').findOne({ sourceId: sourceId });
        });
        
        if (!source) {
            return new Response('Source not found', { status: 404 });
        }
        
        return new Response(JSON.stringify(source), { status: 200 });
    } catch (err: any) {
        console.error(err);
        return new Response('Internal Server Error:' + err.message, { status: 500 });
    }
});
