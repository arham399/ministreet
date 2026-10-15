import { pgTable, uniqueIndex, text, timestamp, index, numeric, integer, boolean, jsonb, foreignKey, varchar, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const discountType = pgEnum("DiscountType", ['PERCENTAGE', 'FIXED_AMOUNT'])
export const orderStatus = pgEnum("OrderStatus", ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'])
export const paymentMethod = pgEnum("PaymentMethod", ['COD', 'CARD', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER'])
export const paymentStatus = pgEnum("PaymentStatus", ['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
export const reviewStatus = pgEnum("ReviewStatus", ['PENDING', 'APPROVED', 'REJECTED'])
export const role = pgEnum("Role", ['OWNER', 'ADMIN', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'SUPPORT', 'CUSTOMER'])


export const verificationToken = pgTable("VerificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("VerificationToken_identifier_token_key").using("btree", table.identifier.asc().nullsLast().op("text_ops"), table.token.asc().nullsLast().op("text_ops")),
	uniqueIndex("VerificationToken_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
]);

export const coupon = pgTable("Coupon", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	code: text().notNull(),
	campaignId: text().default('legacy').notNull(),
	type: discountType().notNull(),
	value: numeric({ precision: 14, scale: 2 }).notNull(),
	minOrderAmount: numeric({ precision: 14, scale: 2 }),
	maxDiscount: numeric({ precision: 14, scale: 2 }),
	usageLimit: integer(),
	usageCount: integer().default(0).notNull(),
	perCustomerLimit: integer(),
	startsAt: timestamp({ precision: 3, mode: 'date' }),
	endsAt: timestamp({ precision: 3, mode: 'date' }),
	isActive: boolean().default(true).notNull(),
	eligibleProductIds: jsonb().default([]).notNull(),
	eligibleCategoryIds: jsonb().default([]).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Coupon_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	uniqueIndex("Coupon_code_key").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("Coupon_isActive_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
]);

export const offer = pgTable("Offer", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	title: text().notNull(),
	description: text(),
	imageUrl: text(),
	linkUrl: text(),
	startsAt: timestamp({ precision: 3, mode: 'date' }),
	endsAt: timestamp({ precision: 3, mode: 'date' }),
	isActive: boolean().default(true).notNull(),
	displayOrder: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const emailLog = pgTable("EmailLog", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	to: text().notNull(),
	subject: text().notNull(),
	template: text().notNull(),
	status: text().notNull(),
	error: text(),
	orderId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("EmailLog_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("EmailLog_orderId_idx").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
]);

export const newsletterSubscriber = pgTable("NewsletterSubscriber", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	email: text().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("NewsletterSubscriber_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("NewsletterSubscriber_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const siteSetting = pgTable("SiteSetting", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	key: text().notNull(),
	value: text().notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("SiteSetting_key_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
]);

export const contactMessage = pgTable("ContactMessage", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	name: text().notNull(),
	email: text().notNull(),
	orderNumber: text(),
	subject: text().notNull(),
	message: text().notNull(),
	isRead: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ContactMessage_isRead_createdAt_idx").using("btree", table.isRead.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
]);

export const faq = pgTable("Faq", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	category: text().notNull(),
	question: text().notNull(),
	answer: text().notNull(),
	displayOrder: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Faq_category_isActive_idx").using("btree", table.category.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
]);

export const user = pgTable("User", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	email: text().notNull(),
	emailVerified: timestamp({ precision: 3, mode: 'date' }),
	passwordHash: text(),
	name: text(),
	phone: text(),
	image: text(),
	role: role().default('CUSTOMER').notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("User_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("User_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
]);

export const account = pgTable("Account", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	uniqueIndex("Account_provider_providerAccountId_key").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.providerAccountId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Account_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const session = pgTable("Session", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	sessionToken: text().notNull(),
	userId: text().notNull(),
	expires: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("Session_sessionToken_key").using("btree", table.sessionToken.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Session_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const category = pgTable("Category", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	imageUrl: text(),
	seoTitle: text(),
	seoDescription: text(),
	displayOrder: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Category_isActive_displayOrder_idx").using("btree", table.isActive.asc().nullsLast().op("int4_ops"), table.displayOrder.asc().nullsLast().op("bool_ops")),
	index("Category_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	uniqueIndex("Category_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const product = pgTable("Product", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	name: text().notNull(),
	slug: text().notNull(),
	sku: text().notNull(),
	description: text(),
	price: numeric({ precision: 14, scale: 2 }).notNull(),
	salePrice: numeric({ precision: 14, scale: 2 }),
	costPrice: numeric({ precision: 14, scale: 2 }),
	stockQuantity: integer().default(0).notNull(),
	reservedStock: integer().default(0).notNull(),
	lowStockThreshold: integer().default(5).notNull(),
	trackInventory: boolean().default(true).notNull(),
	allowBackorder: boolean().default(false).notNull(),
	isActive: boolean().default(true).notNull(),
	isNewArrival: boolean().default(false).notNull(),
	isFeatured: boolean().default(false).notNull(),
	badge: text(),
	colorGroupId: text(),
	colorName: text(),
	colorHex: text(),
	seoTitle: text(),
	seoDescription: text(),
	ogImageUrl: text(),
	categoryId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
	archivedAt: timestamp({ precision: 3, mode: 'date' }),
}, (table) => [
	index("Product_archivedAt_idx").using("btree", table.archivedAt.asc().nullsLast().op("timestamp_ops")),
	index("Product_colorGroupId_idx").using("btree", table.colorGroupId.asc().nullsLast().op("text_ops")),
	index("Product_categoryId_idx").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("Product_isActive_isFeatured_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops"), table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("Product_isActive_isNewArrival_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops"), table.isNewArrival.asc().nullsLast().op("bool_ops")),
	index("Product_sku_idx").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	uniqueIndex("Product_sku_key").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("Product_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	uniqueIndex("Product_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "Product_categoryId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const productImage = pgTable("ProductImage", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	productId: text().notNull(),
	url: text().notNull(),
	alt: text(),
	sortOrder: integer().default(0).notNull(),
	isPrimary: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("ProductImage_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "ProductImage_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const inventoryMovement = pgTable("InventoryMovement", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	productId: text().notNull(),
	quantity: integer().notNull(),
	type: text().notNull(),
	reason: text(),
	orderId: text(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("InventoryMovement_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("InventoryMovement_orderId_idx").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("InventoryMovement_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "InventoryMovement_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const address = pgTable("Address", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	userId: text(),
	fullName: text().notNull(),
	phone: text(),
	line1: text().notNull(),
	line2: text(),
	city: text().notNull(),
	province: text().notNull(),
	postalCode: text(),
	country: text().default('Pakistan').notNull(),
	isDefault: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Address_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Address_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const customerNote = pgTable("CustomerNote", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	userId: text().notNull(),
	note: text().notNull(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "CustomerNote_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const order = pgTable("Order", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	orderNumber: text().notNull(),
	trackingId: text().notNull(),
	userId: text(),
	customerName: text().notNull(),
	customerEmail: text().notNull(),
	customerPhone: text().notNull(),
	shippingLine1: text().notNull(),
	shippingLine2: text(),
	shippingCity: text().notNull(),
	shippingProvince: text().notNull(),
	shippingPostalCode: text(),
	shippingCountry: text().default('Pakistan').notNull(),
	deliveryNotes: text(),
	subtotal: numeric({ precision: 14, scale: 2 }).notNull(),
	discountAmount: numeric({ precision: 14, scale: 2 }).default('0').notNull(),
	shippingAmount: numeric({ precision: 14, scale: 2 }).default('0').notNull(),
	total: numeric({ precision: 14, scale: 2 }).notNull(),
	paymentMethod: paymentMethod().default('COD').notNull(),
	paymentStatus: paymentStatus().default('PENDING').notNull(),
	paymentProofPath: text(),
	status: orderStatus().default('PLACED').notNull(),
	couponCode: text(),
	couponCampaignId: text(),
	couponDiscount: numeric({ precision: 14, scale: 2 }),
	courierName: text(),
	courierTracking: text(),
	estimatedDelivery: timestamp({ precision: 3, mode: 'date' }),
	internalNotes: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Order_couponCode_couponCampaignId_idx").using("btree", table.couponCode.asc().nullsLast().op("text_ops"), table.couponCampaignId.asc().nullsLast().op("text_ops")),
	index("Order_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("Order_customerEmail_idx").using("btree", table.customerEmail.asc().nullsLast().op("text_ops")),
	index("Order_customerPhone_idx").using("btree", table.customerPhone.asc().nullsLast().op("text_ops")),
	index("Order_orderNumber_idx").using("btree", table.orderNumber.asc().nullsLast().op("text_ops")),
	uniqueIndex("Order_orderNumber_key").using("btree", table.orderNumber.asc().nullsLast().op("text_ops")),
	index("Order_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("Order_trackingId_idx").using("btree", table.trackingId.asc().nullsLast().op("text_ops")),
	uniqueIndex("Order_trackingId_key").using("btree", table.trackingId.asc().nullsLast().op("text_ops")),
	index("Order_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Order_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const orderItem = pgTable("OrderItem", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	orderId: text().notNull(),
	productId: text(),
	productNameSnapshot: text().notNull(),
	skuSnapshot: text().notNull(),
	unitPrice: numeric({ precision: 14, scale: 2 }).notNull(),
	discountAmount: numeric({ precision: 14, scale: 2 }).default('0').notNull(),
	quantity: integer().notNull(),
	finalPrice: numeric({ precision: 14, scale: 2 }).notNull(),
	imageUrlSnapshot: text(),
}, (table) => [
	index("OrderItem_orderId_idx").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	index("OrderItem_productId_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderItem_orderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "OrderItem_productId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const orderStatusHistory = pgTable("OrderStatusHistory", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	orderId: text().notNull(),
	status: orderStatus().notNull(),
	note: text(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("OrderStatusHistory_orderId_idx").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderStatusHistory_orderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const trackingEvent = pgTable("TrackingEvent", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	orderId: text().notNull(),
	status: text().notNull(),
	title: text().notNull(),
	description: text(),
	eventAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("TrackingEvent_eventAt_idx").using("btree", table.eventAt.asc().nullsLast().op("timestamp_ops")),
	index("TrackingEvent_orderId_idx").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "TrackingEvent_orderId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const discount = pgTable("Discount", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	name: text().notNull(),
	type: discountType().notNull(),
	value: numeric({ precision: 14, scale: 2 }).notNull(),
	scope: text().notNull(),
	minOrderAmount: numeric({ precision: 14, scale: 2 }),
	maxDiscount: numeric({ precision: 14, scale: 2 }),
	startsAt: timestamp({ precision: 3, mode: 'date' }),
	endsAt: timestamp({ precision: 3, mode: 'date' }),
	isActive: boolean().default(true).notNull(),
	usageLimit: integer(),
	usageCount: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Discount_isActive_startsAt_endsAt_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops"), table.startsAt.asc().nullsLast().op("timestamp_ops"), table.endsAt.asc().nullsLast().op("bool_ops")),
]);

export const review = pgTable("Review", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	productId: text().notNull(),
	userId: text(),
	authorName: text().notNull(),
	authorEmail: text(),
	rating: integer().notNull(),
	title: text(),
	body: text(),
	status: reviewStatus().default('PENDING').notNull(),
	isFeatured: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	index("Review_productId_status_idx").using("btree", table.productId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("Review_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "Review_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Review_userId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const wishlist = pgTable("Wishlist", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	userId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("Wishlist_userId_key").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Wishlist_userId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const wishlistItem = pgTable("WishlistItem", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	wishlistId: text().notNull(),
	productId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("WishlistItem_wishlistId_productId_key").using("btree", table.wishlistId.asc().nullsLast().op("text_ops"), table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "WishlistItem_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.wishlistId],
			foreignColumns: [wishlist.id],
			name: "WishlistItem_wishlistId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const invoice = pgTable("Invoice", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	invoiceNumber: text().notNull(),
	orderId: text().notNull(),
	pdfUrl: text(),
	issuedAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("Invoice_invoiceNumber_idx").using("btree", table.invoiceNumber.asc().nullsLast().op("text_ops")),
	uniqueIndex("Invoice_invoiceNumber_key").using("btree", table.invoiceNumber.asc().nullsLast().op("text_ops")),
	uniqueIndex("Invoice_orderId_key").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "Invoice_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const auditLog = pgTable("AuditLog", {
	id: text().primaryKey().notNull().$defaultFn(() => globalThis.crypto.randomUUID()),
	actorId: text(),
	action: text().notNull(),
	entityType: text().notNull(),
	entityId: text(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("AuditLog_actorId_idx").using("btree", table.actorId.asc().nullsLast().op("text_ops")),
	index("AuditLog_createdAt_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("AuditLog_entityType_entityId_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [user.id],
			name: "AuditLog_actorId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const productTag = pgTable("ProductTag", {
	productId: text().notNull(),
	name: text().notNull(),
}, (table) => [
	index("ProductTag_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "ProductTag_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.productId, table.name], name: "ProductTag_pkey"}),
]);

export const discountProduct = pgTable("DiscountProduct", {
	discountId: text().notNull(),
	productId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discount.id],
			name: "DiscountProduct_discountId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "DiscountProduct_productId_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.discountId, table.productId], name: "DiscountProduct_pkey"}),
]);

export const categoryToDiscount = pgTable("_CategoryToDiscount", {
	a: text("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [category.id],
			name: "_CategoryToDiscount_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [discount.id],
			name: "_CategoryToDiscount_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.a, table.b], name: "_CategoryToDiscount_AB_pkey"}),
]);
