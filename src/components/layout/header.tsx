import React from "react";
import ConnectWallet from "../blocks/connect-wallet";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="w-full px-6 flex items-center justify-between py-4">
        <Link href="/">
          <img src="/avail-logo.svg" alt="Nexus" />
        </Link>
        <ConnectWallet />
      </div>
    </header>
  );
};

export default Header;
