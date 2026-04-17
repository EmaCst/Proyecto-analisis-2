// services/scoring.service.js

export const aplicarScoringVenta = (productos) => {
  return productos.map(prod => {
    let score = 0;

    // REGLA 1: Variedad de Tallas
    // Si un producto tiene muchas entradas en inventario, es más fácil de vender
    score += (prod.Inventarios?.length || 0) * 5;

    // REGLA 2: Stock Crítico
    // Si la cantidad total en todas las sucursales es baja (ej. < 3), subimos score para urgencia
    const totalStock = prod.Inventarios?.reduce((acc, inv) => acc + inv.cantidad, 0) || 0;
    if (totalStock > 0 && totalStock < 3) score += 40; 

    // REGLA 3: Marca Estrella (Ejemplo: Nike o lo que más vendas)
    if (prod.marca === 'Nike') score += 20;

    return { ...prod.toJSON(), priorityScore: score };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
};