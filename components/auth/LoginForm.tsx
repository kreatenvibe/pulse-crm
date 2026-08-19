"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button, FormField, FormInput } from "@/components/ui";
import { api, toErrorMessage } from "@/lib/api";
import { applyServerFieldErrors } from "@/lib/form-errors";
import { LoginSchema } from "@/lib/schemas";
import type { UserDto } from "@/types/user";

type LoginFormValues = z.input<typeof LoginSchema>;
type LoginFormOutput = z.output<typeof LoginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues, unknown, LoginFormOutput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit: SubmitHandler<LoginFormOutput> = async (values) => {
    setSubmitError(null);
    try {
      await api.post<UserDto>("/api/auth/login", values);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      applyServerFieldErrors(error, setError);
      setSubmitError(
        toErrorMessage(error, "Could not log in. Please try again."),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" required error={errors.email?.message}>
        <FormInput
          type="email"
          autoComplete="email"
          {...register("email")}
          placeholder="you@company.com"
        />
      </FormField>

      <FormField label="Password" required error={errors.password?.message}>
        <FormInput
          type="password"
          autoComplete="current-password"
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
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
