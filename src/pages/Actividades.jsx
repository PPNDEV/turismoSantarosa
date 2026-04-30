import Header from "../components/Header";
import Footer from "../components/Footer";
import QueHacer from "../components/QueHacer";

export default function ActividadesPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <QueHacer mode="page" />
      </main>
      <Footer />
    </>
  );
}
