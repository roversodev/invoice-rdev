import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import { Database } from '@/types/database'

type Invoice = Database['public']['Tables']['invoices']['Row']
type Company = Database['public']['Tables']['companies']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface InvoiceEmailProps {
  invoice: Invoice
  company: Company
  client: Client
}

export function InvoiceEmailTemplate({ invoice, company, client }: InvoiceEmailProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }
  
  return (
    <Html>
      <Head />
      <Preview>
        Nova fatura de {company.name} - {formatCurrency(invoice.total_amount || 0)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>{company.name}</Heading>
            <Text style={headerText}>Fatura #{invoice.invoice_number || invoice.id}</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>
              Olá <strong>{client.name}</strong>,
            </Text>
            <Text style={text}>
              Você recebeu uma nova fatura de <strong>{company.name}</strong>. 
              Os detalhes estão descritos abaixo e o PDF completo está anexado a este email.
            </Text>
          </Section>

          {/* Invoice Details Card */}
          <Section style={invoiceCard}>
            <Heading style={h2}>Detalhes da Fatura</Heading>
            
            <Row style={invoiceRow}>
              <Column style={labelColumn}>
                <Text style={label}>Título:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{invoice.title}</Text>
              </Column>
            </Row>
            
            <Row style={invoiceRow}>
              <Column style={labelColumn}>
                <Text style={label}>Número:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{invoice.invoice_number || 'N/A'}</Text>
              </Column>
            </Row>
            
            <Row style={invoiceRow}>
              <Column style={labelColumn}>
                <Text style={label}>Data de Emissão:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{formatDate(invoice.issue_date)}</Text>
              </Column>
            </Row>
            
            <Row style={invoiceRow}>
              <Column style={labelColumn}>
                <Text style={label}>Vencimento:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={value}>{formatDate(invoice.due_date)}</Text>
              </Column>
            </Row>
            
            <Hr style={hr} />
            
            <Row style={totalRow}>
              <Column style={labelColumn}>
                <Text style={totalLabel}>Valor Total:</Text>
              </Column>
              <Column style={valueColumn}>
                <Text style={totalValue}>{formatCurrency(invoice.total_amount || 0)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Description */}
          {invoice.description && (
            <Section style={section}>
              <Heading style={h3}>Descrição dos Serviços</Heading>
              <Text style={description}>{invoice.description}</Text>
            </Section>
          )}

          {/* Attachment Notice */}
          <Section style={attachmentNotice}>
            <Text style={attachmentText}>
              📎 <strong>Anexo:</strong> O PDF completo da fatura está anexado a este email.
            </Text>
          </Section>

          {/* Company Contact */}
          <Section style={contactSection}>
            <Heading style={h3}>Informações de Contato</Heading>
            <Text style={contactText}>
              <strong>{company.name}</strong>
            </Text>
            {company.email && (
              <Text style={contactText}>
                Email: <Link href={`mailto:${company.email}`} style={link}>{company.email}</Link>
              </Text>
            )}
            {company.phone && (
              <Text style={contactText}>
                Telefone: {company.phone}
              </Text>
            )}
            {company.address && (
              <Text style={contactText}>
                Endereço: {company.address}
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Atenciosamente,<br/>
              Equipe {company.name}
            </Text>
            <Hr style={hr} />
            <Text style={disclaimer}>
              Este é um email automático. Se você tiver dúvidas sobre esta fatura, 
              entre em contato conosco através dos dados acima.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#1f2937',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  lineHeight: '1.3',
}

const headerText = {
  color: '#e5e7eb',
  fontSize: '16px',
  margin: '0',
}

const section = {
  padding: '24px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const invoiceCard = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '0 24px 24px',
  padding: '24px',
}

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const invoiceRow = {
  marginBottom: '12px',
}

const labelColumn = {
  width: '40%',
  verticalAlign: 'top' as const,
}

const valueColumn = {
  width: '60%',
  verticalAlign: 'top' as const,
}

const label = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const value = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const totalRow = {
  marginTop: '16px',
}

const totalLabel = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const totalValue = {
  color: '#059669',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
}

const description = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
}

const attachmentNotice = {
  backgroundColor: '#dbeafe',
  border: '1px solid #93c5fd',
  borderRadius: '8px',
  margin: '0 24px 24px',
  padding: '16px',
}

const attachmentText = {
  color: '#1e40af',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
}

const contactSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  margin: '0 24px 24px',
  padding: '20px',
}

const contactText = {
  color: '#374151',
  fontSize: '14px',
  margin: '0 0 8px',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const disclaimer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
}