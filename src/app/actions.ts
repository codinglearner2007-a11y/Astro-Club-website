'use server';

import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function joinClub(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Please enter a valid email address.',
      error: true,
    };
  }

  // In a real application, you would save the email to a database
  // or add it to a mailing list service.
  console.log('New club member email captured:', validatedFields.data.email);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: "Welcome to the club! We'll be in touch with cosmic updates.",
    error: false,
  };
}
