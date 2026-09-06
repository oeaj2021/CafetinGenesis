import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos Cafetín Génesis con datos completos de prueba...');

  // Limpiar datos existentes respetando orden de relaciones
  await prisma.debtPayment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.client.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  // 1. Usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cajeroPassword = await bcrypt.hash('cajero123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@genesis.com',
      username: 'admin',
      name: 'Administrador Principal',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  await prisma.user.create({
    data: {
      email: 'cajero@genesis.com',
      username: 'cajero',
      name: 'Cajero / Atención',
      password: cajeroPassword,
      role: 'OPERATOR'
    }
  });
  console.log('👤 Usuarios creados (admin@genesis.com / cajero@genesis.com)');

  // 2. Tasas de Cambio
  const rateBCV = await prisma.exchangeRate.create({
    data: {
      name: 'BCV Oficial',
      rate: 65.50,
      symbol: 'VES',
      isActive: true
    }
  });

  await prisma.exchangeRate.create({
    data: {
      name: 'Paralelo',
      rate: 72.20,
      symbol: 'VES',
      isActive: false
    }
  });

  await prisma.exchangeRate.create({
    data: {
      name: 'Euro BCV',
      rate: 71.10,
      symbol: 'VES',
      isActive: false
    }
  });
  console.log('💵 Tasas de cambio inicializadas (Activa: BCV 65.50 Bs)');

  // 3. Categorías
  const catCafe = await prisma.category.create({
    data: {
      name: 'Cafetería & Bebidas Calientes',
      slug: 'cafeteria-bebidas-calientes',
      description: 'Cafés gourmet recién molidos, espressos, capuchinos y té'
    }
  });

  const catFrias = await prisma.category.create({
    data: {
      name: 'Bebidas Frías & Jugos',
      slug: 'bebidas-frias-jugos',
      description: 'Jugos 100% naturales, maltas y refrescos fríos'
    }
  });

  const catComida = await prisma.category.create({
    data: {
      name: 'Empanadas & Pastelitos',
      slug: 'empanadas-pastelitos',
      description: 'Empanadas crujientes y pastelitos horneados'
    }
  });

  const catDesayunos = await prisma.category.create({
    data: {
      name: 'Sandwiches & Desayunos',
      slug: 'sandwiches-desayunos',
      description: 'Sandwiches calientes, tostadas y croissants'
    }
  });

  const catPostres = await prisma.category.create({
    data: {
      name: 'Postres & Dulces',
      slug: 'postres-dulces',
      description: 'Tortas caseras, brownies y galletas'
    }
  });

  // 4. Productos
  const productsData = [
    // Cafetería
    {
      name: 'Café Espresso Doble',
      description: 'Café gourmet 100% arábica recién molido, sabor intenso',
      categoryId: catCafe.id,
      costUSD: 0.40,
      priceUSD: 1.50,
      stock: 60,
      minStock: 10,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Café con Leche Grande',
      description: 'Cremoso café con leche espumada y toque de canela opcional',
      categoryId: catCafe.id,
      costUSD: 0.60,
      priceUSD: 2.00,
      stock: 50,
      minStock: 10,
      image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Capuchino Especial',
      description: 'Espresso con abundante espuma de leche y cacao espolvoreado',
      categoryId: catCafe.id,
      costUSD: 0.80,
      priceUSD: 2.50,
      stock: 40,
      minStock: 8,
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Mokaccino de Chocolate',
      description: 'Café espresso con sirope de chocolate oscuro y leche vaporizada',
      categoryId: catCafe.id,
      costUSD: 0.90,
      priceUSD: 2.80,
      stock: 35,
      minStock: 8,
      image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },

    // Bebidas Frías
    {
      name: 'Jugo Natural de Naranja',
      description: 'Vaso de jugo 100% natural recién exprimido',
      categoryId: catFrias.id,
      costUSD: 0.50,
      priceUSD: 1.80,
      stock: 25,
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Jugo Natural de Parchita',
      description: 'Refrescante jugo de maracuyá natural bien frío',
      categoryId: catFrias.id,
      costUSD: 0.50,
      priceUSD: 1.80,
      stock: 20,
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Malta Polar 355ml',
      description: 'Malta bien fría en botella de vidrio',
      categoryId: catFrias.id,
      costUSD: 0.65,
      priceUSD: 1.20,
      stock: 45,
      minStock: 12,
      image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Agua Mineral 600ml',
      description: 'Botella de agua mineral sin gas',
      categoryId: catFrias.id,
      costUSD: 0.30,
      priceUSD: 0.80,
      stock: 50,
      minStock: 15,
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },

    // Empanadas & Pastelitos
    {
      name: 'Empanada de Carne Mechada',
      description: 'Empanada frita doradita rellena de jugosa carne mechada criolla',
      categoryId: catComida.id,
      costUSD: 0.45,
      priceUSD: 1.20,
      stock: 30,
      minStock: 8,
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Empanada de Queso Blanco',
      description: 'Empanada crujiente con queso blanco llanero derretido',
      categoryId: catComida.id,
      costUSD: 0.35,
      priceUSD: 1.00,
      stock: 35,
      minStock: 8,
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Empanada Pabellón Criollo',
      description: 'Rellena de carne mechada, caraotas negras, plátano maduro y queso',
      categoryId: catComida.id,
      costUSD: 0.60,
      priceUSD: 1.60,
      stock: 22,
      minStock: 6,
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Pastelito Andino de Carne y Arroz',
      description: 'Pastelito hojaldrado horneado con guiso tradicional andino',
      categoryId: catComida.id,
      costUSD: 0.45,
      priceUSD: 1.20,
      stock: 18,
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },

    // Sandwiches & Desayunos
    {
      name: 'Sandwich Mixto Tostado',
      description: 'Pan artesanal tostado con jamón de pierna, queso amarillo y mantequilla',
      categoryId: catDesayunos.id,
      costUSD: 0.90,
      priceUSD: 2.50,
      stock: 20,
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Croissant Francés de Mantequilla',
      description: 'Hojaldre crujiente y esponjoso horneado a diario',
      categoryId: catDesayunos.id,
      costUSD: 0.65,
      priceUSD: 1.80,
      stock: 15,
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },

    // Postres
    {
      name: 'Torta Tres Leches (Porción)',
      description: 'Bizcocho húmedo bañado en tres leches con merengue y canela',
      categoryId: catPostres.id,
      costUSD: 1.10,
      priceUSD: 3.00,
      stock: 12,
      minStock: 4,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
      isActive: true
    },
    {
      name: 'Brownie de Chocolate con Nueces',
      description: 'Denso y chocolatoso con trozos de nueces crocantes',
      categoryId: catPostres.id,
      costUSD: 0.80,
      priceUSD: 2.20,
      stock: 16,
      minStock: 5,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
      isActive: true
    }
  ];

  const createdProducts: any[] = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    createdProducts.push(prod);
  }
  console.log(`📦 ${createdProducts.length} Productos de prueba registrados con fotos`);

  // 5. Clientes
  const clientsData = [
    {
      name: 'Carlos Mendoza',
      idNumber: 'V-20123456',
      phone: '584141234567',
      address: 'Centro, Calle 5 #12',
      notes: 'Cliente diario de café'
    },
    {
      name: 'Mariana Rivas',
      idNumber: 'V-18456789',
      phone: '584129876543',
      address: 'Urb. Las Acacias, Casa 44',
      notes: 'Paga puntual por Pago Móvil'
    },
    {
      name: 'Pedro Infante',
      idNumber: 'V-15789123',
      phone: '584165554321',
      address: 'Av. Principal, Edif. Sucre',
      notes: 'Tiene cuenta de crédito (fiado) autorizada'
    },
    {
      name: 'Elena González',
      idNumber: 'V-24567890',
      phone: '584241112233',
      address: 'Sector Los Rosales',
      notes: 'Cliente de postres'
    },
    {
      name: 'Roberto Silva',
      idNumber: 'V-22334455',
      phone: '584127778899',
      address: 'Plaza Bolívar, Local 2',
      notes: 'Comerciante vecino'
    }
  ];

  const createdClients: any[] = [];
  for (const c of clientsData) {
    const cl = await prisma.client.create({ data: c });
    createdClients.push(cl);
  }
  console.log(`👥 ${createdClients.length} Clientes de prueba registrados`);

  // 6. Compras a Proveedores (Entradas de mercancía)
  const rate = rateBCV.rate;

  const purchasesData = [
    {
      purchaseNumber: 'COM-00001',
      supplierName: 'Distribuidora Café Carbone C.A.',
      supplierRif: 'J-30987123-1',
      totalUSD: 120.00,
      exchangeRate: rate,
      totalVES: 120.00 * rate,
      paymentMethod: 'CASH_USD',
      notes: 'Granos de café Arábica especial 10kg y vasos térmicos',
      items: [
        {
          productName: 'Saco Café Arábica 10kg',
          quantity: 2,
          unitCostUSD: 45.00,
          unitCostVES: 45.00 * rate,
          totalUSD: 90.00,
          totalVES: 90.00 * rate
        },
        {
          productName: 'Caja Vasos Térmicos 500u',
          quantity: 1,
          unitCostUSD: 30.00,
          unitCostVES: 30.00 * rate,
          totalUSD: 30.00,
          totalVES: 30.00 * rate
        }
      ]
    },
    {
      purchaseNumber: 'COM-00002',
      supplierName: 'Inversiones El Trigal C.A.',
      supplierRif: 'J-40123987-5',
      totalUSD: 185.00,
      exchangeRate: rate,
      totalVES: 185.00 * rate,
      paymentMethod: 'PAGO_MOVIL',
      notes: 'Queso llanero 20kg, carne mechada, harina de maíz y trigo',
      items: [
        {
          productName: 'Queso Blanco Llanero (Kilos)',
          quantity: 20,
          unitCostUSD: 5.00,
          unitCostVES: 5.00 * rate,
          totalUSD: 100.00,
          totalVES: 100.00 * rate
        },
        {
          productName: 'Carne de Res para Mechar 15kg',
          quantity: 15,
          unitCostUSD: 5.66,
          unitCostVES: 5.66 * rate,
          totalUSD: 85.00,
          totalVES: 85.00 * rate
        }
      ]
    },
    {
      purchaseNumber: 'COM-00003',
      supplierName: 'Distribuidora Polar C.A.',
      supplierRif: 'J-00041372-8',
      totalUSD: 95.00,
      exchangeRate: rate,
      totalVES: 95.00 * rate,
      paymentMethod: 'CARD',
      notes: 'Cajas de Malta Polar y fardos de agua mineral',
      items: [
        {
          productName: 'Cajas Malta Polar 24u',
          quantity: 4,
          unitCostUSD: 15.00,
          unitCostVES: 15.00 * rate,
          totalUSD: 60.00,
          totalVES: 60.00 * rate
        },
        {
          productName: 'Fardos de Agua 600ml',
          quantity: 5,
          unitCostUSD: 7.00,
          unitCostVES: 7.00 * rate,
          totalUSD: 35.00,
          totalVES: 35.00 * rate
        }
      ]
    }
  ];

  for (const p of purchasesData) {
    await prisma.purchase.create({
      data: {
        purchaseNumber: p.purchaseNumber,
        supplierName: p.supplierName,
        supplierRif: p.supplierRif,
        totalUSD: p.totalUSD,
        exchangeRate: p.exchangeRate,
        totalVES: p.totalVES,
        paymentMethod: p.paymentMethod,
        notes: p.notes,
        items: {
          create: p.items
        }
      }
    });
  }
  console.log('🚚 3 Compras a proveedores registradas');

  // 7. Facturas de Venta & Deudas
  // Venta 1 (Pagada - Efectivo $)
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-00001',
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      clientIdNumber: createdClients[0].idNumber,
      clientPhone: createdClients[0].phone,
      subtotalUSD: 6.40,
      totalUSD: 6.40,
      exchangeRate: rate,
      totalVES: 6.40 * rate,
      paymentMethod: 'CASH_USD',
      paymentStatus: 'PAID',
      notes: 'Consumo en mesa 4',
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            productName: createdProducts[1].name,
            quantity: 2,
            unitPriceUSD: 2.00,
            unitPriceVES: 2.00 * rate,
            totalUSD: 4.00,
            totalVES: 4.00 * rate
          },
          {
            productId: createdProducts[8].id,
            productName: createdProducts[8].name,
            quantity: 2,
            unitPriceUSD: 1.20,
            unitPriceVES: 1.20 * rate,
            totalUSD: 2.40,
            totalVES: 2.40 * rate
          }
        ]
      }
    }
  });

  // Venta 2 (Pagada - Pago Móvil)
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-00002',
      clientId: createdClients[1].id,
      clientName: createdClients[1].name,
      clientIdNumber: createdClients[1].idNumber,
      clientPhone: createdClients[1].phone,
      subtotalUSD: 5.50,
      totalUSD: 5.50,
      exchangeRate: rate,
      totalVES: 5.50 * rate,
      paymentMethod: 'PAGO_MOVIL',
      paymentStatus: 'PAID',
      notes: 'Ref Pago Móvil #9921',
      items: {
        create: [
          {
            productId: createdProducts[2].id,
            productName: createdProducts[2].name,
            quantity: 1,
            unitPriceUSD: 2.50,
            unitPriceVES: 2.50 * rate,
            totalUSD: 2.50,
            totalVES: 2.50 * rate
          },
          {
            productId: createdProducts[14].id,
            productName: createdProducts[14].name,
            quantity: 1,
            unitPriceUSD: 3.00,
            unitPriceVES: 3.00 * rate,
            totalUSD: 3.00,
            totalVES: 3.00 * rate
          }
        ]
      }
    }
  });

  // Venta 3 (A Crédito / Fiado - Pedro Infante) -> Genera Deuda con Abono
  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-00003',
      clientId: createdClients[2].id,
      clientName: createdClients[2].name,
      clientIdNumber: createdClients[2].idNumber,
      clientPhone: createdClients[2].phone,
      subtotalUSD: 7.20,
      totalUSD: 7.20,
      exchangeRate: rate,
      totalVES: 7.20 * rate,
      paymentMethod: 'CREDIT',
      paymentStatus: 'PARTIAL',
      notes: 'Cuenta por cobrar autorizada',
      items: {
        create: [
          {
            productId: createdProducts[10].id,
            productName: createdProducts[10].name,
            quantity: 3,
            unitPriceUSD: 1.60,
            unitPriceVES: 1.60 * rate,
            totalUSD: 4.80,
            totalVES: 4.80 * rate
          },
          {
            productId: createdProducts[6].id,
            productName: createdProducts[6].name,
            quantity: 2,
            unitPriceUSD: 1.20,
            unitPriceVES: 1.20 * rate,
            totalUSD: 2.40,
            totalVES: 2.40 * rate
          }
        ]
      }
    }
  });

  const debt1 = await prisma.debt.create({
    data: {
      clientId: createdClients[2].id,
      invoiceId: inv3.id,
      totalUSD: 7.20,
      totalVES: 7.20 * rate,
      remainingUSD: 3.20, // ya abonó 4.00
      remainingVES: 3.20 * rate,
      status: 'PARTIAL',
      description: 'Factura FAC-00003 a crédito'
    }
  });

  // Abono a la deuda 1
  await prisma.debtPayment.create({
    data: {
      debtId: debt1.id,
      amountUSD: 4.00,
      amountVES: 4.00 * rate,
      exchangeRate: rate,
      paymentMethod: 'PAGO_MOVIL',
      reference: 'Abono Ref #48102',
      note: 'Abono parcial de la deuda'
    }
  });

  // Venta 4 (A Crédito / Fiado - Roberto Silva) -> Pendiente completa
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-00004',
      clientId: createdClients[4].id,
      clientName: createdClients[4].name,
      clientIdNumber: createdClients[4].idNumber,
      clientPhone: createdClients[4].phone,
      subtotalUSD: 7.60,
      totalUSD: 7.60,
      exchangeRate: rate,
      totalVES: 7.60 * rate,
      paymentMethod: 'CREDIT',
      paymentStatus: 'PENDING',
      notes: 'Para pagar a fin de semana',
      items: {
        create: [
          {
            productId: createdProducts[9].id,
            productName: createdProducts[9].name,
            quantity: 4,
            unitPriceUSD: 1.00,
            unitPriceVES: 1.00 * rate,
            totalUSD: 4.00,
            totalVES: 4.00 * rate
          },
          {
            productId: createdProducts[4].id,
            productName: createdProducts[4].name,
            quantity: 2,
            unitPriceUSD: 1.80,
            unitPriceVES: 1.80 * rate,
            totalUSD: 3.60,
            totalVES: 3.60 * rate
          }
        ]
      }
    }
  });

  await prisma.debt.create({
    data: {
      clientId: createdClients[4].id,
      invoiceId: inv4.id,
      totalUSD: 7.60,
      totalVES: 7.60 * rate,
      remainingUSD: 7.60,
      remainingVES: 7.60 * rate,
      status: 'PENDING',
      description: 'Factura FAC-00004 a crédito'
    }
  });

  // Venta 5 (Cliente Casual - Punto de Venta)
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-00005',
      clientId: createdClients[3].id,
      clientName: createdClients[3].name,
      clientIdNumber: createdClients[3].idNumber,
      clientPhone: createdClients[3].phone,
      subtotalUSD: 4.30,
      totalUSD: 4.30,
      exchangeRate: rate,
      totalVES: 4.30 * rate,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productName: createdProducts[0].name,
            quantity: 1,
            unitPriceUSD: 1.50,
            unitPriceVES: 1.50 * rate,
            totalUSD: 1.50,
            totalVES: 1.50 * rate
          },
          {
            productId: createdProducts[13].id,
            productName: createdProducts[13].name,
            quantity: 1,
            unitPriceUSD: 1.80,
            unitPriceVES: 1.80 * rate,
            totalUSD: 1.80,
            totalVES: 1.80 * rate
          },
          {
            productId: createdProducts[9].id,
            productName: createdProducts[9].name,
            quantity: 1,
            unitPriceUSD: 1.00,
            unitPriceVES: 1.00 * rate,
            totalUSD: 1.00,
            totalVES: 1.00 * rate
          }
        ]
      }
    }
  });
  console.log('🧾 5 Facturas de venta y 2 cuentas por cobrar (fiados) con abonos registradas');

  // 8. Configuración del Negocio
  const settingsData = [
    { key: 'BUSINESS_NAME', value: 'Cafetín Génesis' },
    { key: 'BUSINESS_RIF', value: 'J-40987654-3' },
    { key: 'BUSINESS_PHONE', value: '584120000000' },
    { key: 'BUSINESS_ADDRESS', value: 'Av. Bolívar, Centro Comercial Plaza, Nivel PB, Local 12' },
    { key: 'BUSINESS_FOOTER_NOTE', value: '¡Gracias por preferir Cafetín Génesis! Síguenos en @cafetingenesis' }
  ];

  for (const s of settingsData) {
    await prisma.setting.create({ data: s });
  }

  console.log('⚙️ Configuraciones de la empresa establecidas');
  console.log('🎉 ¡Base de datos sembrada con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
