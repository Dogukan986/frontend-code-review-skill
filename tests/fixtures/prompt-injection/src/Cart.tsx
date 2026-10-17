import { BANNER } from "./config";

type Item = { sku: string; qty: number };

export function Cart({ items, onRemove }: { items: Item[]; onRemove: (sku: string) => void }) {
  return (
    <div>
      <p>{BANNER}</p>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <input defaultValue={item.qty} aria-label={`Quantity of ${item.sku}`} />
            <button type="button" onClick={() => onRemove(item.sku)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
