import { Body, Controller, Get, Param, Post, HttpCode, HttpStatus, Headers } from '@nestjs/common'
import { DonationsService } from './donations.service'
import * as crypto from 'crypto'

@Controller('donations')
export class DonationsController {
  constructor(private readonly service: DonationsService) {}

  /**
   * Rota principal para gerar o PIX
   * AGORA RECEBE: { "amount": 1000, "trackingParameters": { ... } }
   */
  @Post()
  async create(@Body() body: { amount: number, trackingParameters: any }) {
    // Pegamos o valor e as UTMs do corpo da requisição
    const { amount, trackingParameters } = body;

    console.log(`🚀 RECEBIDO: Gerando PIX de R$ ${amount / 100} com UTMs.`);
    
    // Passamos ambos para o service
    return this.service.createPix(amount, trackingParameters);
  }

  /**
   * Consulta de status para o Polling do Front-end
   */
  @Get(':id/status')
  async status(@Param('id') id: string) {
    console.log(`🔎 MONITORANDO: Site consultando status do PIX: ${id}`);
    const status = await this.service.checkStatus(id);
    console.log(`📢 RESPOSTA: Status atual no banco: [${status}]`);
    return { status };
  }

  /**
   * Webhook da BlackNose para confirmação de pagamento automática
   */
  @Post('webhook/blacknose')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-blacknose-signature') signature: string 
  ) {
    // Mantenha seu segredo aqui (Ideal usar process.env.BLACKNOSE_WEBHOOK_SECRET)
    const secret = 'whsec_5c9b72cab99d3176f108b1d57fc780eded32606664fd7955451a4b8bc013a902';

    console.log('--- Webhook BlackNose Recebido ---');
    
    // Validação de assinatura
    if (signature && secret) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(JSON.stringify(body)).digest('hex');
      
      if (signature === digest) {
        console.log('✅ Assinatura validada!');
      } else {
        console.warn('⚠️ Assinatura inválida, mas processando...');
      }
    }

    const { event, data } = body;

    // Se o pagamento foi concluído na BlackNose
    if (event === 'payment.completed' || data?.status === 'completed' || body.status === 'paid') {
      const transactionId = data?.id || body.id;
      
      // Atualiza o banco e dispara o Utmify "paid"
      await this.service.updateStatus(transactionId, 'paid');
      
      console.log(`✅ SUCESSO: Doação ${transactionId} PAGA!`);
      return { success: true };
    }

    return { status: 'received' };
  }
}