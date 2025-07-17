"use client";
import React from "react";
import InputCustom from "../ui/input_custom";
import Button_custom from "../ui/Button_custom";
import useLoginForm from "@/hook/useLoginForm";
import ScrollReveal from "../ui/ScrollReveal";
import Link from "next/link";
import Loader from "../ui/Loader";

function Login_component() {
  const { errors, handelSubmit, formData, loading, handelChange } =
    useLoginForm();

  if (loading) return <Loader />;
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-[80%] grid grid-cols-1 lg:grid-cols-2 gap-2 h-1/2 lg:w-[60%]">
        <div className="flex flex-col justify-center md:mb-20">
          <ScrollReveal direction="down">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary">
              Chào mừng trở lại👋
            </h1>
            <p className="text-sx lg:text-xl text-primary/60">
              Đăng nhập để bắt đầu quản lý các dự án của bạn.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="left">
            <InputCustom
              handelChange={handelChange}
              label="Email"
              type="email"
              value={formData.email}
              name="email"
              id="Email"
              placeholder="Example@gmail.com"
              errors={errors.email}
            />
          </ScrollReveal>

          <ScrollReveal direction="right">
            <InputCustom
              handelChange={handelChange}
              label="Mật khẩu"
              id="Password"
              name="password"
              value={formData.password}
              type={"password"}
              errors={errors.password}
              placeholder={"Nhập mật khẩu"}
            />
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="mt-2 flex justify-end">
              <Link href={"/ForgotPassword"}>
                <p className="text-blue-500 cursor-pointer">Quên mật khẩu?</p>
              </Link>
            </div>
          </ScrollReveal>

          <div className="w-full flex justify-center mt-5">
            <ScrollReveal>
              <Button_custom
                onclick={handelSubmit}
                bg="bg-primary"
                text="Đăng nhập"
              />
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal direction="left">
          <div className="hidden lg:block">
            <img src="images/login_image.png" alt="" />
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default Login_component;
