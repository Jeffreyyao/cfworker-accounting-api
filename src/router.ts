import { AutoRouter } from 'itty-router';
import * as Spendings from './spendings';
import * as Categories from './categories';
import * as Sources from './sources';
import * as Managing from './managing';

const router = AutoRouter();

router.get('/', () => {
    return new Response('Hello AA!');
});

// Mount the sub-routers
router.all(Spendings.basePath + '/*', Spendings.router.fetch);
router.all(Categories.basePath + '/*', Categories.router.fetch);
router.all(Sources.basePath + '/*', Sources.router.fetch);
router.all(Managing.basePath + '/*', Managing.router.fetch);

export default router;