import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { generateUsers, generatePosts, generateProducts, generateOrders, generateCompanies } from '../src/utils/data-generator';

const dbPath = join(process.cwd(), 'public', 'db');

if (!existsSync(dbPath)) {
  mkdirSync(dbPath, { recursive: true });
}

console.log('🚀 Generating realistic mock data...');

const users = generateUsers(50);
const posts = generatePosts(200, users.length);
const products = generateProducts(100);
const orders = generateOrders(150, users.length, products.length);
const companies = generateCompanies(30);

writeFileSync(join(dbPath, 'users.json'), JSON.stringify(users, null, 2));
writeFileSync(join(dbPath, 'posts.json'), JSON.stringify(posts, null, 2));
writeFileSync(join(dbPath, 'products.json'), JSON.stringify(products, null, 2));
writeFileSync(join(dbPath, 'orders.json'), JSON.stringify(orders, null, 2));
writeFileSync(join(dbPath, 'companies.json'), JSON.stringify(companies, null, 2));

console.log('✅ Data generation complete!');
console.log(`📊 Generated: ${users.length} users, ${posts.length} posts, ${products.length} products, ${orders.length} orders, ${companies.length} companies`);