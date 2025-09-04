import { faker } from '@faker-js/faker';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  website: string;
  address: {
    street: string;
    city: string;
    zipcode: string;
    country: string;
  };
  company: string;
  bio: string;
  createdAt: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  image: string;
  rating: number;
  stock: number;
  discount: number;
  createdAt: string;
}

export interface Order {
  id: number;
  userId: number;
  products: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    zipcode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  logo: string;
  employees: number;
  founded: string;
  address: {
    street: string;
    city: string;
    zipcode: string;
    country: string;
  };
}

export const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    phone: faker.phone.number(),
    website: faker.internet.url(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipcode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    company: faker.company.name(),
    bio: faker.person.bio(),
    createdAt: faker.date.past().toISOString(),
  }));
};

export const generatePosts = (count: number, userCount: number): Post[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    userId: faker.number.int({ min: 1, max: userCount }),
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    body: faker.lorem.paragraphs({ min: 2, max: 5 }),
    tags: faker.helpers.arrayElements([
      'technology', 'lifestyle', 'travel', 'food', 'fitness', 
      'business', 'education', 'entertainment', 'health', 'science'
    ], { min: 1, max: 4 }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    likes: faker.number.int({ min: 0, max: 1000 }),
    comments: faker.number.int({ min: 0, max: 50 }),
  }));
};

export const generateProducts = (count: number): Product[] => {
  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    category: faker.helpers.arrayElement(categories),
    brand: faker.company.name(),
    image: faker.image.url({ width: 400, height: 400 }),
    rating: parseFloat(faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }).toFixed(1)),
    stock: faker.number.int({ min: 0, max: 100 }),
    discount: faker.number.int({ min: 0, max: 50 }),
    createdAt: faker.date.past().toISOString(),
  }));
};

export const generateOrders = (count: number, userCount: number, productCount: number): Order[] => {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
  
  return Array.from({ length: count }, (_, i) => {
    const productItems = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => {
      const price = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
      const quantity = faker.number.int({ min: 1, max: 3 });
      return {
        productId: faker.number.int({ min: 1, max: productCount }),
        quantity,
        price,
      };
    });
    
    const total = productItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return {
      id: i + 1,
      userId: faker.number.int({ min: 1, max: userCount }),
      products: productItems,
      total: parseFloat(total.toFixed(2)),
      status: faker.helpers.arrayElement(statuses),
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zipcode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    };
  });
};

export const generateCompanies = (count: number): Company[] => {
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Consulting'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.company.name(),
    description: faker.company.catchPhrase() + '. ' + faker.lorem.sentence(),
    industry: faker.helpers.arrayElement(industries),
    website: faker.internet.url(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    logo: faker.image.url({ width: 200, height: 200 }),
    employees: faker.number.int({ min: 10, max: 10000 }),
    founded: faker.date.past({ years: 50 }).getFullYear().toString(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipcode: faker.location.zipCode(),
      country: faker.location.country(),
    },
  }));
};