import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.x1kgpq6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let client: MongoClient | null = null;

export async function getClient(): Promise<MongoClient> {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    return client;
}

export async function closeClient(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
    }
}

export async function getDatabase(dbName: string) {
    const client = await getClient();
    return client.db(dbName);
}

export async function withDatabase<T>(dbName: string, operation: (db: any) => Promise<T>): Promise<T> {
    const db = await getDatabase(dbName);
    try {
        const result = await operation(db);
        await closeClient();
        return result;
    } finally {
        // Don't close the client here as it might be reused
        // The client will be closed when the application shuts down
    }
}
