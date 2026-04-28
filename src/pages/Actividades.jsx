import Header from "../components/Header";
import Footer from "../components/Footer";
import QueHacer from "../components/QueHacer";

export default function ActividadesPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: "clamp(68px, 7vw, 80px)" }}>
        <QueHacer mode="page" />
      </main>
      <Footer />
    </>
  );
}
