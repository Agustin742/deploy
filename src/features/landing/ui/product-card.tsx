import { offerPrice, type Product } from "@/features/offer/domain/offer";

interface ProductCardProps {
  product: Product;
  country: string;
}

export function ProductCard({ product, country }: ProductCardProps) {
  return (
    <div className="rounded-xl border border-line bg-surface p-[18px]">
      <span className="inline-block whitespace-nowrap rounded-full border border-line px-[7px] py-px font-mono text-[10px] font-medium uppercase tracking-[.06em] text-muted">
        {product.tipo}
      </span>
      <h3 className="mb-1 mt-2 text-base font-bold">{product.n}</h3>
      <p className="mb-2.5 text-muted">{product.d}</p>
      <div className="mb-2.5 rounded-xl border border-line bg-surface px-4 py-3.5">
        <div className="font-display text-2xl font-extrabold leading-[1.1] tabular-nums">
          {offerPrice(product, country)}
        </div>
        <div className="text-xs text-muted">{country}</div>
      </div>
      <ul className="m-0 list-disc pl-[18px]">
        {product.inc.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
