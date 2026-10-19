"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import { useTracking } from "../lib/useAnalytics";
import { getCatalogPricing } from "../lib/pricing";
import { themeManager } from "./themeManager";



const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Barlow:wght@400;500;600;700&display=swap');

  @keyframes pc-fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── wrapper ── */
  .pc-link {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
  }

  /* ── card ── */
  .pc-card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--cardBg);
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--border);
    transition: border-color 0.25s, box-shadow 0.25s;
  }

  /* Override for light theme - highest specificity */
  html.light .pc-card {
    background: #ffffff !important;
    border-color: #e2e8f0 !important;
  }

  .pc-card:hover {
    border-color: #7B9BC0;
    box-shadow: 0 8px 40px rgba(212,175,55,0.18);
  }

  /* ── nombre ── */
  .pc-name {
    color: var(--text);
    transition: color 0.25s ease;
    font-size: 12px;
    font-weight: 700;
  }

  html.light .pc-name {
    color: #0f172a !important;
  }

  @media (min-width: 640px) {
    .pc-name {
    font-size: 22px;
    }
  }

  /* descripción */
  .pc-description {
    font-family: 'Barlow', sans-serif;
    font-weight: 400;
    font-size: 11px;
    color: var(--textSecondary);
    margin-top: 4px;
    transition: color 0.25s ease;
    line-height: 1.4;
  }

  html.light .pc-description {
    color: #64748b !important;
  }

  @media (min-width: 640px) {
    .pc-description {
      font-size: 13px;
    }
  }

  /* ── imagen ── */
  /* Wide/landscape: más ancho que alto, para que no sobre espacio
     vertical alrededor de la imagen del producto. */
  .pc-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 4;
    background: #0a0a0a;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  html.light .pc-img-wrap {
    background: #f1f5f9 !important;
  }

  /* Altura siempre llena el contenedor; el ancho se ajusta de forma
     proporcional (sin recorte ni estiramiento). max-width evita que
     una imagen muy ancha se salga del contenedor. */
  .pc-img-wrap img {
    height: 100% !important;
    width: auto !important;
    max-width: 100% !important;
    object-fit: contain !important;
    padding: 0 !important;
    transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94) !important;
  }

  .pc-card:hover .pc-img-wrap img {
    transform: scale(1.06) !important;
  }

  /* ── badge tipo de contenido ── */
  .pc-badge-type {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    background: #E0A11A;
    color: #000000;
    font-family: 'Barlow', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 3px 8px;
    border-radius: 2px;
  }

  /* ── fav btn ── */
  .pc-fav {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 20;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(0,0,0,0.6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.85);
    transition: opacity 0.2s, transform 0.2s, background 0.2s;
    backdrop-filter: blur(4px);
  }

  .pc-fav.is-fav {
    opacity: 1;
    transform: scale(1);
    background: #7B9BC0;
    color: #000000;
  }

  .pc-card:hover .pc-fav {
    opacity: 1;
    transform: scale(1);
  }

  /* ── info ── */
  /* min-height fijo: así todas las cards miden lo mismo aunque
     el producto "visual only" no muestre precio */
  .pc-info {
    padding: 10px 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-height: 40px;
  }

  @media (min-width: 640px) {
    .pc-info {
      padding: 14px 16px 16px;
      min-height: 52px;
    }
  }

  /* nombre */
  .pc-name {
    color: var(--text);
    transition: color 0.25s ease;
    font-size: 12px;
    font-weight: 700;
  }

  @media (min-width: 640px) {
    .pc-name {
    font-size: 22px;
    }
  }

  /* ── hover: todo el texto a dorado ── */
  .pc-card:hover .pc-name,
  .pc-card:hover .pc-description {
    color: #E0A11A;
  }
`;

function ProductoCard({
  producto,
  onClick,
  showFav = false,
  isCompact = true,
  index = 0,
}: {
  producto?: any;
  onClick?: any;
  showFav?: boolean;
  index?: number;
  isCompact?: boolean;
} = {}): JSX.Element | null {
  if (!producto || !producto.id) return null;

  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isLight, setIsLight] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      const currentTheme = themeManager.getTheme();
      const light = currentTheme === 'light';
      setIsLight(light);
      
      if (cardRef.current) {
        const card = cardRef.current;
        if (light) {
          card.style.background = '#ffffff';
          card.style.borderColor = '#e2e8f0';
        } else {
          card.style.background = '';
          card.style.borderColor = '';
        }
        
        // Update text elements
        const nameEl = card.querySelector('.pc-name') as HTMLElement;
        const priceFinalEl = card.querySelector('.pc-price-final') as HTMLElement;
        const priceOldEl = card.querySelector('.pc-price-old') as HTMLElement;
        
        if (nameEl) {
          nameEl.style.color = light ? '#0f172a' : '';
        }
        if (priceFinalEl) {
          priceFinalEl.style.color = light ? '#0f172a' : '';
        }
        if (priceOldEl) {
          priceOldEl.style.color = light ? '#64748b' : '';
        }
      }
    };
    
    checkTheme();
    const handler = () => checkTheme();
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  const { isLogged, isAdmin, favoritos, addFavorito, removeFavorito } = useUser();
  const router = useRouter();
  const { trackProductClick } = useTracking();
  const primeraImagenTieneWatermark = Boolean(producto.imagenesWatermark?.[0]);
  const isFav = favoritos?.some((p) => p.id === producto.id);

  const contentType = producto.tipoContenido || producto.tipo || 'general';

  const getDetailUrl = () => {
    const tipo = producto.tipoContenido || producto.tipo || 'general';
    let detailUrl: string;

    if (tipo === 'interlocutores') {
      detailUrl = `/interlocutores/${producto.id}`;
    } else if (tipo === 'programas') {
      detailUrl = `/programas/${producto.id}`;
    } else {
      detailUrl = `/product-detail?id=${producto.id}`;
    }

    try {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
        if (tipo === 'interlocutores') {
          detailUrl = `/admin/interlocutores/${producto.id}`;
        } else if (tipo === 'programas') {
          detailUrl = `/admin/programas/${producto.id}`;
        } else {
          detailUrl = `/admin/product-detail?id=${producto.id}`;
        }
      } else {
        if (isAdmin) {
          if (tipo === 'interlocutores') {
            detailUrl = `/admin/interlocutores/${producto.id}`;
          } else if (tipo === 'programas') {
            detailUrl = `/admin/programas/${producto.id}`;
          } else {
            detailUrl = `/admin/product-detail?id=${producto.id}`;
          }
        }
      }
    } catch {
      if (isAdmin) {
        if (tipo === 'interlocutores') {
          detailUrl = `/admin/interlocutores/${producto.id}`;
        } else if (tipo === 'programas') {
          detailUrl = `/admin/programas/${producto.id}`;
        } else {
          detailUrl = `/admin/product-detail?id=${producto.id}`;
        }
      }
    }
    return detailUrl;
  };

  const detailUrl = getDetailUrl();

  const goToDetail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    trackProductClick().catch(console.error);
    router.push(detailUrl);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isFav ? removeFavorito(producto.id) : addFavorito(producto);
  };

  return (
    <>
      <style>{cardStyles}</style>
      <Link
        href={detailUrl}
        className="pc-link"
        style={{
          opacity: 0,
          animation: "pc-fadeIn 0.4s ease forwards",
          animationDelay: `${index * 80}ms`,
        }}
      >
        <div 
          ref={cardRef}
          className="pc-card" 
          onClick={onClick || goToDetail}
        >
          {/* ── IMAGEN ── */}
          <div className="pc-img-wrap">
            {/* Imagen del producto */}
            {producto.imagenes && producto.imagenes.length > 0 && (
              <img
                src={producto.imagenes[0]}
                alt={producto.nombre}
                loading="lazy"
              />
            )}

            {/* Badge tipo de contenido */}
            {contentType && (
              <div className="pc-badge-type">{contentType}</div>
            )}

            {/* Favorito */}
            {isLogged && showFav && (
              <button
                onClick={handleFav}
                className={`pc-fav${isFav ? " is-fav" : ""}`}
                title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                <span className="material-icons-round" style={{ fontSize: 15 }}>
                  {isFav ? "favorite" : "favorite_border"}
                </span>
              </button>
            )}
          </div>

          {/* ── INFO ── */}
          <div className="pc-info">
            <span className="pc-name">{producto.nombre}</span>
            {producto.descripcion && (
              <span className="pc-description">{producto.descripcion}</span>
            )}
          </div>
        </div>
      </Link>
    </>
  );
}

export default ProductoCard;