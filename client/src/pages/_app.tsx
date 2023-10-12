import "~/styles/globals.css";
import { RecoilRoot } from "recoil";
import { AppProps } from "next/app";
import { Suspense } from "react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Suspense>
      <RecoilRoot>
        <Component {...pageProps} />
      </RecoilRoot>
    </Suspense>
  );
}
