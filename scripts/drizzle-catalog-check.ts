async function main() {
  const [
    { getBestSellers, getProductBySlug, getProductPriceCeiling, getProducts },
  ] = await Promise.all([
    import("@/lib/db/queries/products"),
  ]);

  const [catalog, bestSellers, priceCeiling] = await Promise.all([
    getProducts({ limit: 5 }),
    getBestSellers(5),
    getProductPriceCeiling(),
  ]);
  if (
    !Number.isFinite(catalog.total) ||
    !Number.isFinite(priceCeiling) ||
    bestSellers.products.length > 5
  ) {
    throw new Error("Drizzle catalog read returned an invalid result shape.");
  }

  let detailChecked = false;
  const firstProduct = catalog.products[0];
  if (firstProduct) {
    const detail = await getProductBySlug(firstProduct.slug);
    if (!detail || !Array.isArray(detail.images) || !Array.isArray(detail.reviews)) {
      throw new Error("Drizzle product detail read returned an invalid result shape.");
    }
    detailChecked = true;
  }

  console.info(
    `Drizzle catalog reads passed: ${catalog.total} products, ${bestSellers.products.length} best sellers, price ceiling ${priceCeiling}; product detail ${detailChecked ? "checked" : "skipped (catalog empty)"}.`,
  );
}

main().catch((error: unknown) => {
  console.error("[drizzle-catalog-check]", error);
  process.exitCode = 1;
});
