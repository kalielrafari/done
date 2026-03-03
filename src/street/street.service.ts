import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class StreetService {
  private readonly baseUrl = 'https://bqckqgmorberurjolzmq.supabase.co/functions/v1'
  
  private get apiKey(): string {
    return (process.env.BLACKNOSE_API_KEY || '').trim()
  }

  async createPix(amount: number, description = 'Ebook dez chás relaxantes') {
    const url = `${this.baseUrl}/api-generate-pix-qr`
    try {
      // LOG DE SEGURANÇA: Veja no terminal qual número o StreetService recebeu
      console.log(`[StreetService] Recebido: ${amount}`);

      // Se o seu front já enviou multiplicado (ex: 2000), aqui vira 20.00
      const amountInDecimal = Number(amount) / 100;

      // Validação antes de enviar para a API para não estourar o erro 400
      if (isNaN(amountInDecimal) || amountInDecimal < 1) {
        throw new Error(`Valor inválido para a BlackNose: R$ ${amountInDecimal.toFixed(2)}. O mínimo é R$ 1,00.`);
      }

      const payload = {
        amount: amountInDecimal,
        description: description,
        expiration_minutes: 30
      }

      console.log('--- Chamando API BlackNosePay ---')
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      })

      const data = response.data
      if (!data.success) throw new Error(data.error || 'Erro desconhecido na API')

      console.log('✅ PIX Gerado:', data.transaction_id);
      return {
        id: data.transaction_id,
        qrCode: data.pix.copy_paste,
        copyPaste: data.pix.copy_paste,
        pix: { qrcode: data.pix.copy_paste, code: data.pix.copy_paste }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message
      console.error('❌ Erro na Geração PIX:', errorMsg);
      throw new HttpException(`Falha no Gateway: ${errorMsg}`, HttpStatus.BAD_REQUEST)
    }
  }

  async checkTransactionStatus(transactionId: string) {
    if (!transactionId || transactionId === 'undefined') return 'waiting_payment'
    const url = `${this.baseUrl}/api-check-pix-status?transaction_id=${transactionId}`

    try {
      const response = await axios.get(url, {
        headers: { 'X-API-Key': this.apiKey }
      })

      const apiStatus = response.data.status?.toUpperCase();
      const isPaidFlag = response.data.paid === true;

      const paidStatuses = ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'SETTLED'];
      const isPaid = paidStatuses.includes(apiStatus) || isPaidFlag;

      if (isPaid) {
        console.log(`[StreetService] Confirmado via API: ${transactionId} (${apiStatus})`);
        return 'paid';
      }

      return 'waiting_payment';
    } catch (error) {
      return 'waiting_payment';
    }
  }
}