import Nexus from "@/components/nexus";

export default function Home() {
  const isTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNET === "true";
  console.log("isTestnet", isTestnet, process.env.NEXT_PUBLIC_ENABLE_TESTNET);
  return (
    <main className="w-full h-screen">
      <div className="w-full h-full flex flex-col gap-y-6 items-center justify-center">
        <Nexus isTestnet={isTestnet} />
      </div>
    </main>
  );
}
