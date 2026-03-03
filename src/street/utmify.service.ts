import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UtmifyService {
  private readonly apiUrl = 'https://api.utmify.com.br/api-credentials/orders';
  private readonly token = process.env.UTMIFY_TOKEN; // x-api-token da doc

  async sendOrder(donation: any, status: 'waiting_payment' | 'paid') {
    try {
      // Formatação de data conforme a doc: YYYY-MM-DD HH:MM:SS
      const formatDate = (date: Date) => date.toISOString().replace('T', ' ').split('.')[0];

      const payload = {
        orderId: donation.id,
        platform: "MinhaCampanhaSolidaria", // Nome da sua plataforma
        paymentMethod: "pix",
        status: status,
        createdAt: formatDate(new Date(donation.createdAt)),
        approvedDate: status === 'paid' ? formatDate(new Date()) : null,
        refundedAt: null,
        customer: {
          name: donation.name || "Comprador Anonimo",
          email: donation.email || "contato@exemplo.com",
          phone: donation.phone || "5511999999999",
          document: donation.cpf || "00000000000",
          country: "BR"
        },
        products: [
          {
            id: "ebook-001",
            name: "Ebook dez chás relaxantes",
            planId: null,
            planName: null,
            quantity: 1,
            priceInCents: Math.round(donation.amount * 100) // Converte R$ 10.00 para 1000
          }
        ],
        // IMPORTANTE: Se o front não enviar isso, a Utmify não rastreia Ads
        trackingParameters: donation.trackingParameters || {
          src: null,
          sck: null,
          utm_source: null,
          utm_campaign: null,
          utm_medium: null,
          utm_content: null,
          utm_term: null
        },
        commission: {
          totalPriceInCents: Math.round(donation.amount * 100),
          gatewayFeeInCents: 0, // Taxa da plataforma se quiser informar
          userCommissionInCents: Math.round(donation.amount * 100) // Valor que sobra pra você
        },
        isTest: false
      };

      await axios.post(this.apiUrl, payload, {
        headers: {
          'x-api-token': this.token,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[Utmify] Pedido ${donation.id} enviado como ${status}`);
    } catch (error) {
      console.error('[Utmify] Erro ao enviar:', error.response?.data || error.message);
    }
  }
}