"use client";

import React, { useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { joinClub } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type FormData = z.infer<typeof formSchema>;

const JoinForm: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append('email', data.email);
    
    const result = await joinClub(null, formData);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    } else {
      toast({
        title: 'Success!',
        description: result.message,
      });
      form.reset();
    }
    
    setIsPending(false);
  };

  return (
    <Card className="bg-background/80 backdrop-blur-sm border-primary/50 transition-all duration-500 hover:border-primary">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Join the Exploration</CardTitle>
        <CardDescription>Get updates on events, discoveries, and more.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@starfleet.com" 
                      {...field} 
                      className="bg-secondary/50 focus:bg-secondary/80"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Sending...' : 'Join Now'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default JoinForm;
