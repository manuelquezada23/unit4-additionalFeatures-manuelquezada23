import Head from "next/head";
import { useRecoilValue } from "recoil";
import { MainView } from "~/components";
import { selectedNodeState } from "~/global/Atoms";

export default function Home() {
  const selectedNode = useRecoilValue(selectedNodeState);
  const title = `${selectedNode?.title ?? "Home"} | MyHypermedia`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container">
        <MainView />
      </div>
    </>
  );
}
