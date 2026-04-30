import { Link } from "react-router-dom";
import { FaPenNib } from "react-icons/fa";
import { useContent } from "../context/useContent";
import { useLanguage } from "../context/useLanguage";

function formatFecha(fecha, locale) {
  return new Date(fecha + "T12:00:00").toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Blog() {
  const { blog } = useContent();
  const { locale, t } = useLanguage();
  const recientes = blog.slice(0, 3);
  const getLocalizedValue = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  return (
    <section className="section-gray">
      <div className="container">
        <div className="section-header reveal">
          <h2 className="section-title">
            {t("blogSection.titleStart")}{" "}
            <span className="accent">{t("blogSection.titleAccent")}</span>
          </h2>
          <p className="section-subtitle">{t("blogSection.subtitle")}</p>
        </div>
        <div className="blog-grid">
          {recientes.map((art) =>
            (() => {
              const translatedTitle = getLocalizedValue(
                `content.blog.${art.id}.title`,
                art.titulo,
              );
              const translatedSummary = getLocalizedValue(
                `content.blog.${art.id}.summary`,
                art.resumen,
              );
              const translatedCategory = getLocalizedValue(
                `content.blog.${art.id}.category`,
                art.categoria,
              );
              const translatedAuthor = getLocalizedValue(
                `content.blog.${art.id}.author`,
                art.autor,
              );

              return (
                <div key={art.id} className="blog-card reveal">
                  <img
                    src={art.imagen}
                    alt={translatedTitle}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="blog-body">
                    <div className="blog-meta">
                      <span className="badge badge-ocean">
                        {translatedCategory}
                      </span>
                      <span className="meta-xs">
                        {formatFecha(art.fecha, locale)}
                      </span>
                    </div>
                    <h3>{translatedTitle}</h3>
                    <p>{translatedSummary}</p>
                  </div>
                  <div className="blog-footer">
                    <span className="meta-sm">
                      <FaPenNib className="inline-icon" aria-hidden="true" />
                      {translatedAuthor}
                    </span>
                    <Link to="/blog" className="read-more">
                      {t("blogSection.readMore")} →
                    </Link>
                  </div>
                </div>
              );
            })(),
          )}
        </div>
        <div className="cta-center">
          <Link to="/blog" className="btn btn-outline">
            {t("blogSection.viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
