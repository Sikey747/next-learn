"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from '@/auth';

/* ------------------------------------ Создание общей схемы для проверки входных данных перед отпрвкой и преобразования их ----------------------------------- */
const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(["pending", "paid"],{invalid_type_error: 'Please select an invoice status.'}),
  date: z.string(),
});
/* ------------------------------------ создание новой схемы на основе приведущей но без айди и времени просто для конкретного случия ----------------------------------- */
const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceSchema.omit({ id: true, date: true });
const DeleteInvoice = InvoiceSchema.omit({ date: true, id: true });

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

export async function createInvoice(prevState: State, formData: FormData) {
  /* ------------------------------------ тут мы создаем обект с 3 параметрами и присваеваем им функцию валидации которая на выходе даст обект
    с нужными типами данных которе беруться из пропсов формы ----------------------------------- */

  const validatedFields  = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  /* ---------- Дальше мы добавляем не достающие данные для отправки ---------- */
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  /* ------------------ добавление новых данных в базу данных ----------------- */
  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;

  } catch (error) {
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
      /* ------------------------------------   Очистка кеша страницы так как некс все кеширует что бы быстрее работать ----------------------------------- */
      revalidatePath("/dashboard/invoices");
      /* ------------------------------------ перенаправление на общуюю страницу ----------------------------------- */
      redirect("/dashboard/invoices");
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }
}

export async function deleteInvoice(id: string) {
    throw new Error('Failed to Delete Invoice');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    return { message: "Database Error: Failed to Delete Invoice." };
  }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', Object.fromEntries(formData));
    } catch (error) {
      if ((error as Error).message.includes('CredentialsSignin')) {
        return 'CredentialSignin';
      }
      throw error;
    }
  }