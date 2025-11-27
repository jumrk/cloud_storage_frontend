"use client";

import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/button";
import useAdminLoginForm from "@/features/auth/hooks/useAdminLoginForm";

export default function AdminLogin() {
  const { formData, errors, loading, handleSubmit, handleChange } =
    useAdminLoginForm();

  return (
    <div className="min-h-screen flex justify-center items-center bg-[var(--color-surface-50)]">
      <div className="w-[90%] grid grid-cols-1 lg:grid-cols-2 gap-6 lg:w-[70%] bg-white rounded-3xl shadow-2xl overflow-hidden">
        <form className="p-8 flex flex-col justify-center" onSubmit={handleSubmit}>
          <ScrollReveal direction="down">
            <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
              Admin Access
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">
              Đăng nhập quản trị
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Sử dụng tài khoản admin để quản lý người dùng, gói dịch vụ và hệ
              thống.
            </p>
          </ScrollReveal>

          <div className="mt-6 space-y-4">
            <ScrollReveal direction="left">
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                placeholder="admin@company.com"
                handelChange={handleChange}
                errors={errors.email}
              />
            </ScrollReveal>

            <ScrollReveal direction="right">
              <Input
                label="Mật khẩu"
                type="password"
                name="password"
                value={formData.password}
                placeholder="••••••••"
                handelChange={handleChange}
                errors={errors.password}
              />
            </ScrollReveal>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="submit"
              color="brand"
              size="lg"
              loading={loading}
              disabled={!formData.email.trim() || !formData.password.trim()}
              fullWidth
              handleClick={handleSubmit}
            >
              Đăng nhập admin
            </Button>
            <Link href="/login" className="text-center text-sm text-gray-500 hover:text-primary transition">
              Quay lại đăng nhập người dùng
            </Link>
          </div>
        </form>

        <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-primary to-[#1cadd9]">
          <ScrollReveal direction="left">
            <Image
              src="/images/login_image.png"
              width={500}
              height={500}
              alt="Admin login illustration"
              priority
              className="object-contain drop-shadow-2xl"
            />
          </ScrollReveal>
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
        </div>
      </div>
    </div>
  );
}


