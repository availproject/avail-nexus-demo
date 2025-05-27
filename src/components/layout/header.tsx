import React from "react";
import ConnectWallet from "../blocks/connect-wallet";
import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between p-2">
        <Link href="/">
          <Image
            src="https://www.availproject.org/_next/static/media/avail_logo.9c818c5a.png"
            alt="Nexus"
            width={48}
            height={48}
            className=" w-12"
          />
        </Link>
        <ConnectWallet />
      </div>
    </header>
  );
};

export default Header;
