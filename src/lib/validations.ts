import { z } from "zod"

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres")
})

// Schema para cadastro
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z
    .string()
    .min(1, "Sobrenome é obrigatório")
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"),
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória")
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
})

// Schema para perfil do usuário (onboarding step 1)
export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z
    .string()
    .min(1, "Sobrenome é obrigatório")
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Formato de telefone inválido")
})

// Schema para empresa (onboarding step 2)
export const companySchema = z.object({
  name: z
    .string()
    .min(1, "Nome da empresa é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpj: z
    .string()
    .min(1, "CNPJ é obrigatório")
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "Formato de CNPJ inválido (XX.XXX.XXX/XXXX-XX)"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Formato de telefone inválido"),
  address: z
    .string()
    .min(1, "Endereço é obrigatório"),
  city: z
    .string()
    .min(1, "Cidade é obrigatória"),
  state: z
    .string()
    .min(1, "Estado é obrigatório")
    .length(2, "Estado deve ter 2 caracteres"),
  zipCode: z
    .string()
    .min(1, "CEP é obrigatório")
    .regex(/^\d{5}-?\d{3}$/, "Formato de CEP inválido (XXXXX-XXX)"),
  country: z
    .string()
    .min(1, "País é obrigatório")
    .default("Brasil"),
  website: z
    .string()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "URL inválida"
    })
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type CompanyFormData = z.infer<typeof companySchema>


// Invoice schemas
export const invoiceItemSchema = z.object({
  service_id: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  quantity: z.number().min(0.01, "Quantidade deve ser maior que 0"),
  unit_price: z.number().min(0, "Preço unitário deve ser maior ou igual a 0"),
  sort_order: z.number().optional(),
})

export const invoiceSchema = z.object({
  client_id: z.string().min(1, "Cliente é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  issue_date: z.string().min(1, "Data de emissão é obrigatória"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
  items: z.array(invoiceItemSchema).min(1, "Pelo menos um item é obrigatório"),
  discount_percentage: z.number().min(0).max(100).optional(),
  tax_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  terms_conditions: z.string().optional(),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>

// Service schemas
export const serviceSchema = z.object({
  category_id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  unit_price: z.number().min(0, "Preço deve ser maior ou igual a 0"),
  unit: z.string().optional(),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

// Service category schemas
export const serviceCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  color: z.string().optional(),
})

export type ServiceCategoryFormData = z.infer<typeof serviceCategorySchema>

// Client schemas
export const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>