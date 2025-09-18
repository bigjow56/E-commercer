import { db } from './db';
import { categories, products, storeSettings, adminUsers } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { hashPassword } from './auth';

export async function seedDatabase() {
  try {
    console.log('Verificando se é necessário popular o banco de dados...');

    // Verifica se já existem dados
    const existingCategories = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const categoryCount = Number(existingCategories[0]?.count ?? 0);

    if (categoryCount > 0) {
      console.log('Banco de dados já possui dados. Seed não necessário.');
      return;
    }

    console.log('Populando banco de dados com dados iniciais...');

    // Criar categorias
    const categoriesData = await db.insert(categories).values([
      {
        name: 'Smartphones',
        slug: 'smartphones',
        icon: 'smartphone',
        displayOrder: 1,
      },
      {
        name: 'Computadores',
        slug: 'computadores', 
        icon: 'laptop',
        displayOrder: 2,
      },
      {
        name: 'Acessórios',
        slug: 'acessorios',
        icon: 'headphones',
        displayOrder: 3,
      },
      {
        name: 'Tablets',
        slug: 'tablets',
        icon: 'tablet',
        displayOrder: 4,
      },
      {
        name: 'SmartWatch',
        slug: 'smartwatch',
        icon: 'watch',
        displayOrder: 5,
      }
    ]).returning();

    // Encontrar IDs das categorias
    const smartphoneCategory = categoriesData.find(c => c.slug === 'smartphones');
    const computadorCategory = categoriesData.find(c => c.slug === 'computadores');
    const acessorioCategory = categoriesData.find(c => c.slug === 'acessorios');
    const tabletCategory = categoriesData.find(c => c.slug === 'tablets');
    const smartwatchCategory = categoriesData.find(c => c.slug === 'smartwatch');

    if (!smartphoneCategory || !computadorCategory || !acessorioCategory || !tabletCategory || !smartwatchCategory) {
      throw new Error('Erro ao criar categorias');
    }

    // Criar produtos
    await db.insert(products).values([
      // Smartphones
      {
        name: 'iPhone 15 Pro 128GB',
        description: 'Apple iPhone 15 Pro 128GB, câmera Pro de 48MP, chip A17 Pro, tela Super Retina XDR de 6,1"',
        price: '8999.00',
        categoryId: smartphoneCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
        isFeatured: true,
        isAvailable: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Samsung Galaxy S24 Ultra 256GB, câmera de 200MP, S Pen integrada, tela Dynamic AMOLED 6,8"',
        price: '7199.00',
        categoryId: smartphoneCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        isFeatured: true,
        isAvailable: true,
      },
      {
        name: 'Xiaomi 14 Pro 512GB',
        description: 'Xiaomi 14 Pro 512GB, Snapdragon 8 Gen 3, câmera Leica de 50MP, carregamento ultra-rápido',
        price: '4299.00',
        categoryId: smartphoneCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1674491872122-f0b7edc5a17d?w=400',
        isAvailable: true,
      },
      {
        name: 'Google Pixel 8 Pro',
        description: 'Google Pixel 8 Pro 128GB, chip Google Tensor G3, IA avançada, câmera com IA fotografia',
        price: '5499.00',
        categoryId: smartphoneCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1603921326210-6edd2d60ca68?w=400',
        isAvailable: true,
      },

      // Computadores
      {
        name: 'MacBook Air M3 13"',
        description: 'Apple MacBook Air 13" com chip M3, 8GB RAM, SSD 256GB, tela Liquid Retina',
        price: '9999.00',
        categoryId: computadorCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        isAvailable: true,
      },
      {
        name: 'Dell XPS 13 Plus',
        description: 'Dell XPS 13 Plus, Intel Core i7, 16GB RAM, SSD 512GB, tela 4K OLED touch',
        price: '8499.00',
        categoryId: computadorCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
        isAvailable: true,
      },
      {
        name: 'Lenovo ThinkPad X1 Carbon',
        description: 'Lenovo ThinkPad X1 Carbon Gen 11, Intel Core i5, 8GB RAM, SSD 256GB, ultraportátil',
        price: '6799.00',
        categoryId: computadorCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400',
        isAvailable: true,
      },

      // Acessórios
      {
        name: 'AirPods Pro 2ª Geração',
        description: 'Apple AirPods Pro 2ª Geração com cancelamento ativo de ruído, áudio espacial',
        price: '2299.00',
        categoryId: acessorioCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
        isAvailable: true,
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Fone de ouvido Sony WH-1000XM5 com cancelamento de ruído líder do setor',
        price: '1899.00',
        categoryId: acessorioCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
        isAvailable: true,
      },
      {
        name: 'Carregador Wireless 15W',
        description: 'Carregador sem fio universal 15W, compatível com iPhone e Android',
        price: '149.90',
        categoryId: acessorioCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1609372332255-611485350f25?w=400',
        isAvailable: true,
      },

      // Tablets
      {
        name: 'iPad Air 5ª Geração',
        description: 'Apple iPad Air 5ª Geração 64GB, chip M1, tela Liquid Retina de 10,9"',
        price: '4499.00',
        categoryId: tabletCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        isAvailable: true,
      },
      {
        name: 'Samsung Galaxy Tab S9',
        description: 'Samsung Galaxy Tab S9 128GB, Snapdragon 8 Gen 2, S Pen incluída',
        price: '3299.00',
        categoryId: tabletCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400',
        isAvailable: true,
      },

      // SmartWatch
      {
        name: 'Apple Watch Series 9',
        description: 'Apple Watch Series 9 45mm, GPS + Cellular, chip S9, tela Always-On Retina',
        price: '3799.00',
        categoryId: smartwatchCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400',
        isAvailable: true,
      },
      {
        name: 'Samsung Galaxy Watch 6',
        description: 'Samsung Galaxy Watch 6 44mm, monitoramento avançado de saúde, GPS',
        price: '2199.00',
        categoryId: smartwatchCategory.id,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        isAvailable: true,
      }
    ]);

    // Verificar se já existem configurações da loja
    const existingSettings = await db.select().from(storeSettings).limit(1);
    
    if (existingSettings.length === 0) {
      // Criar configurações básicas da loja
      await db.insert(storeSettings).values({
        isOpen: true,
        closingTime: '19:00',
        minimumOrderAmount: '299.00',
        defaultDeliveryFee: '29.90',
        
        // Banner principal
        bannerTitle: 'Tecnologia de Ponta',
        bannerDescription: 'Inovação, qualidade e os melhores preços. Compre já!',
        bannerPrice: '899.90',
        
        // Informações da loja
        siteName: 'TechStore',
        storeTitle: 'Nossa Loja',
        storeAddress: 'Rua da Tecnologia, 123',
        storeNeighborhood: 'Centro, São Paulo - SP',
        storeHours: 'Segunda a Sexta: 9h - 19h\nSábado: 9h - 17h\nDomingo: 10h - 16h',
        deliveryTime: 'Tempo médio: 1-3 dias úteis',
        deliveryFeeRange: 'Taxa: R$ 29,90 - R$ 49,90',
        paymentMethods: 'Cartão, PIX, Boleto\nParcelamos em até 12x',
      });
    }

    // Verificar se já existe usuário admin
    const existingAdmin = await db.select().from(adminUsers).limit(1);
    
    if (existingAdmin.length === 0) {
      // Criar usuário administrador padrão
      const hashedPassword = await hashPassword('admin123');
      await db.insert(adminUsers).values({
        username: 'admin',
        email: 'admin@techstore.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      console.log('👤 Usuário administrador criado (username: admin, senha: admin123)');
    }

    console.log('✅ Banco de dados populado com sucesso!');
    console.log('📦 Criadas 5 categorias de tecnologia');
    console.log('📱 Criados 12 produtos tecnológicos');
    console.log('⚙️ Configurações da loja inicializadas');
    console.log('👤 Usuário admin verificado/criado');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
}