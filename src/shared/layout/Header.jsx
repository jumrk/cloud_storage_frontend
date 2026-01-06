"use client";
import Link from "next/link";
import Image from "next/image";
import Button from "../ui/button";
import useHeader from "../hooks/useHeader";
import getAvatarUrl from "@/shared/utils/getAvatarUrl";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
export default function Header() {
  const { router, t, user, isLoading } = useHeader();
  return (
    <header className="w-full shadow-xl fixed top-0 left-0 z-50 bg-white">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="w-30 md:w-36">
          <Image
            src="/images/Logo_2.png"
            alt="logo"
            width={120}
            height={40}
            className="object-cover"
          />
        </Link>
        <div className="flex gap-2 md:gap-4 xl:gap-6 items-center">
          {/* Loading skeleton while checking auth */}
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 md:px-3 py-2">
              <Skeleton circle width={32} height={32} />
              <Skeleton width={80} height={16} className="hidden sm:block" />
            </div>
          ) : user ? (
            <Link
              href={user.slast ? `/${user.slast}/home` : "/"}
              className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--color-border)] bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-lg">
                {user.avatar ? (
                  <Image
                    src={getAvatarUrl(user.avatar)}
                    alt="avatar"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.email ? user.email[0].toUpperCase() : "U"}</span>
                )}
              </div>
              <span className="hidden sm:block font-medium text-gray-700 truncate max-w-[120px]">
                {user.email}
              </span>
            </Link>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              children={t("header.login")}
              bg="bg-primary"
            />
          )}
        </div>
      </div>
    </header>
  );
}
