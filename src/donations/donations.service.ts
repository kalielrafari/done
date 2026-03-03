import { Injectable } from '@nestjs/common'
import { StreetService } from '../street/street.service'
import { UtmifyService } from '../street/utmify.service' 

@Injectable()
export class DonationsService {
  // Banco de dados em memória (Map)
  private donationsDb = new Map<string, any>();

  constructor(
    private readonly street: StreetService,
    private readonly utmify: UtmifyService 
  ) {}

  /**
   * 1. CRIAÇÃO DO PIX COM RASTREIO
   * Agora recebe amount (em centavos) e os parâmetros de UTM
   */
  async createPix(amount: number, trackingParameters: any) {
    console.log(`[DonationsService] Gerando PIX: R$ ${amount / 100} | UTMs recebidas:`, trackingParameters);

    // Gera o PIX na BlackNose enviando o valor em centavos
    const pixData = await this.street.createPix(amount, 'Doação Maria Clara');
    
    if (pixData && pixData.id) {
      const amountInReais = Number(amount) / 100;

      // Montamos o registro completo para a Utmify
      const donationRecord = {
        id: pixData.id,
        status: 'waiting_payment',
        amount: amountInReais, 
        name: "Comprador Anonimo", 
        email: "eboodezchas@google.com", 
        cpf: "00000000000",
        phone: "5511999999999",
        trackingParameters: trackingParameters, // 🔥 AQUI ESTÁ O SEGREDO DO RASTREIO
        createdAt: new Date()
      };
      
      // Salva no banco local para consulta posterior
      this.donationsDb.set(pixData.id, donationRecord);

      // Notifica a Utmify que o PIX foi gerado (Status: waiting_payment)
      this.utmify.sendOrder(donationRecord, 'waiting_payment').catch(err => 
        console.error('[Utmify] Erro ao notificar geração:', err.message)
      );
    }

    return pixData;
  }

  /**
   * 2. ATUALIZAÇÃO DE STATUS (WEBHOOK)
   */
  async updateStatus(id: string, status: string) {
    const donation = this.donationsDb.get(id);
    
    if (donation && donation.status !== 'paid') {
      donation.status = status;
      this.donationsDb.set(id, donation);
      
      if (status === 'paid') {
        // Notifica a Utmify que o dinheiro caiu! (Status: paid)
        // Como o 'donation' já tem as UTMs, a Utmify vai saber quem pagou
        this.utmify.sendOrder(donation, 'paid').catch(err => 
          console.error('[Utmify] Erro ao confirmar pagamento:', err.message)
        );
      }
    }
  }

  /**
   * 3. CHECK DE STATUS (POLLING DO FRONT)
   */
  async checkStatus(id: string) {
    const localDonation = this.donationsDb.get(id);
    if (localDonation?.status === 'paid') return 'paid';

    // Consulta status real na BlackNose caso o webhook demore
    const externalStatus = await this.street.checkTransactionStatus(id);
    if (externalStatus === 'paid') {
      await this.updateStatus(id, 'paid');
      return 'paid';
    }
    return 'waiting_payment';
  }
}