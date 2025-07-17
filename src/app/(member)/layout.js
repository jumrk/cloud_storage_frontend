import MemberHeader from "@/components/member/MemberHeader";

export default function MemberLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full sticky top-0 z-40">
        <MemberHeader />
      </div>
      <main className="max-w-5xl  mx-auto p-6">{children}</main>
    </div>
  );
}
