"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button, FormField, FormInput } from "@/components/ui";
import { api, toErrorMessage } from "@/lib/api";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { SignupSchema } from "@/lib/schemas";
import type { UserDto } from "@/types/user";

type SignupFormValues = z.input<typeof SignupSchema>;
type SignupFormOutput = z.output<typeof SignupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues, unknown, SignupFormOutput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { name: "", email: "", password: "", organizationName: "" },
  });

  const onSubmit: SubmitHandler<SignupFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      await api.post<UserDto>("/api/auth/signup", values);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      applyServerFieldErrors(error, setError);
      setSubmitError(
        toErrorMessage(error, "Could not sign up. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Organization name"
        required
        error={errors.organizationName?.message}
      >
        <FormInput
          {...register("organizationName")}
          placeholder="Acme Field Services"
        />
      </FormField>

      <FormField label="Your name" required error={errors.name?.message}>
        <FormInput {...register("name")} placeholder="John Doe" />
      </FormField>

      <FormField label="Email" required error={errors.email?.message}>
        <FormInput
          type="email"
          autoComplete="email"
          {...register("email")}
          placeholder="you@company.com"
        />
      </FormField>

      <FormField
        label="Password"
        required
        description="At least 8 characters"
        error={errors.password?.message}
      >
        <FormInput
          type="password"
          autoComplete="new-password"
          {...register("password")}
          placeholder="••••••••"
        />
      </FormField>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
