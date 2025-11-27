"use client";
import ScrollReveal from "@/shared/ui/ScrollReveal";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/button";
import Link from "next/link";
import Image from "next/image";
import useRegisterForm from "../hooks/useRegisterForm";

export default function Register() {
  const {
    t,
    formLoading,
    canSubmit,
    errors,
    values,
    handleRegister,
    onChange,
  } = useRegisterForm();
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-[80%] grid grid-cols-1 lg:grid-cols-2 gap-2 h-1/2 lg:w-[60%]">
        <div className="flex flex-col justify-center md:mb-20">
          <ScrollReveal direction="down">
            <h1 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-strong)]">
              {t("auth.register.title")}
            </h1>
            <p className="text-sx lg:text-xl text-[color:var(--color-text-muted)]">
              {t("auth.register.subtitle")}
            </p>
          </ScrollReveal>

          <div className="mt-2 space-y-4">
            <ScrollReveal direction="left">
              <Input
                label={t("auth.register.email")}
                type="email"
                name="email"
                id="email"
                value={values.email}
                placeholder={t("auth.register.email_placeholder")}
                errors={errors.email || errors.general}
                handelChange={onChange}
                variant="filled"
                size="lg"
                autoComplete="email"
                required
              />
            </ScrollReveal>

            <ScrollReveal direction="right">
              <Input
                label={t("auth.register.phone")}
                type="tel"
                name="phone"
                id="phone"
                value={values.phone}
                placeholder={t("auth.register.phone_placeholder")}
                errors={errors.phone}
                handelChange={onChange}
                variant="filled"
                size="lg"
                autoComplete="tel"
                required
              />
            </ScrollReveal>

            <ScrollReveal direction="left">
              <Input
                label={t("auth.register.password")}
                type="password"
                name="password"
                id="password"
                value={values.password}
                placeholder={t("auth.register.password_placeholder")}
                errors={errors.password}
                handelChange={onChange}
                variant="filled"
                size="lg"
                autoComplete="new-password"
                required
              />
            </ScrollReveal>

            <ScrollReveal direction="right">
              <Input
                label={t("auth.register.confirm_password")}
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={values.confirmPassword}
                placeholder={t("auth.register.confirm_password_placeholder")}
                errors={errors.confirmPassword}
                handelChange={onChange}
                variant="filled"
                size="lg"
                autoComplete="new-password"
                required
              />
            </ScrollReveal>

            <div className="w-full flex flex-col sm:flex-row gap-2 pt-2">
              <ScrollReveal>
                <Button
                  onClick={handleRegister}
                  loading={formLoading}
                  disabled={!canSubmit}
                  fullWidth
                >
                  {t("auth.register.submit")}
                </Button>
              </ScrollReveal>

              <ScrollReveal>
                <Link href="/login" className="w-full">
                  <Button variant="outline" color="brand" fullWidth>
                    {t("auth.register.to_login")}
                  </Button>
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>

        <ScrollReveal direction="left">
          <div className="hidden lg:block">
            <Image
              src="/images/login_image.png"
              alt="Register illustration"
              width={600}
              height={450}
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
