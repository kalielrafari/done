import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Configuração de CORS ajustada para testes locais e produção
  app.enableCors({
    origin: [
      'https://salvemariaclara.org',
      'https://www.salvemariaclara.org',
      'http://localhost:3000', // Adicione a porta do seu front local
      'http://localhost:3001', // Adicione a porta do seu front local
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Adicionei x-api-key por segurança
    credentials: true,
  })

  const port = process.env.PORT || 3000
  // Removi o '0.0.0.0' para testes locais, mas pode manter se for subir para servidor
  await app.listen(port)
  
  console.log(`🚀 Servidor rodando em: http://localhost:${port}`)
}

bootstrap()